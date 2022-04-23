+++
title = "Dealing with Cyclic Data in Rust, or, a GhostCell Deep Dive"
date = 2021-11-27
draft = true

[extra]
artbit = "bike.png"
+++

Over the past month or so, something I've repeatedly run into is _GhostCell_, a technique that (ab)uses Rust's lifetime system to detach ownership of data from the permission to mutate it. In short, this makes it possible to write datatypes that rely on shared interior mutability (think doubly-linked lists and other cyclical graph-like structures). In this post I wanted to explore Rust's lifetime system to explain GhostCell from first principles, and why it's kinda a big deal.

<!-- more -->

# On memory management

One of the reasons why I find Rust interesting is interesting because it automatically manages memory at compile time, as opposed to using a garbage collector or manual memory management. At the core of this automatic memory management is Rust's _ownership model_, which is a compile-time strategy that ensures _memory safety_.

Memory safety boils down to two things:

1. All allocated data is eventually freed once (a.k.a. deallocated, dropped).
2. All references to some data are gone before the data is dropped.

Garbage Collected languages ensure this property is met by scanning large portions of the heap (at runtime!) to figure out which allocations are no longer alive. Traditional systems programming languages (think C, C++, asm) offload this work to the programmer, and thus do not _ensure_ memory safety. Breaching the contract of memory safety can lead to hard-to-track-down bugs and severe security issues.

Rust's ownership model essentially determines the _liveness_ of data at compile time, built on the concept of _owned_ and _borrowed_ data. This model ensures memory safety with little to no runtime cost—so before we get started with GhostCell, I think we should start by addressing _ownership_.

# Ownership

> **Note:** This is a deep dive, so we do start with the basics. If you'd like, you can [skip to the next section](#subtyping).

Newbies to Rust often find themselves 'fighting the borrow checker.' (We've all been there). In Rust, each bit of data has a single owner which is responsible for _dropping_ (i.e. freeing) that data when it goes out of scope:

```rust
let x = "Hi".to_string(); // x owns "Hi"
println!("{}", x);        // prints "Hi"
// x drops "Hi" at the end of the scope
```

In the above, `x` is the owner of `"Hi"`, and is responsible for dropping the value when it is no longer accessible.

Rust ensures that all data has exactly one owner (there's an asterisk here, but we'll get into that later). The following does not compile:

```rust
let x = "Hi".to_string(); // x owns "Hi"
let y = x;                // ownership of "Hi" moved from x to y
println!("{}", y);        // prints "Hi"
println!("{}", x);        // ERROR: "Hi" has been moved into y!
// y drops "Hi" at the end of the scope
```

`"Hi"` can only have one owner: initially, this is `x`. When we write `let y = x`, we're moving the ownership of `"Hi"` from `x` to `y`. That is to say, `x` no longer owns `"Hi"`. Trying to print `x` later is an error at compile time, because `"Hi"` has been _moved out of_ `x`.

If we want both `x` and `y` to hold the string `"Hi"`, we could make a copy:

```rust
let x = "Hi".to_string; // x owns "Hi"
let y = x.clone();      // y owns a new copy of "Hi"
// x drops its "Hi" at the end of the scope
// y drops its "Hi" at the end of the scope
```

As its name suggests, `.clone()` makes a copy of some data. In the above snippet, we end up with not one heap-allocated string, but two! Although this satisfies the ownership model (each `"Hi"` has exactly one owner), it's not exactly the most efficient use of space.

## Aliasable XOR Mutable

So far, we've been dealing with completely owned data, so let's talk about borrowing. Rust ensures that all data is _Aliasable XOR Mutable_ (AXM). This essentially means that:

1. All data has exactly one owner.
2. Data may have many _immutable_ borrows.
3. Data may have only one _mutable_ borrow at any given point in time.
4. Data must not be borrowed mutably and immutably at the same time.

Let's make this abstract notion a bit more concrete:

```rust
let x = "Hi".to_string();    // x owns "Hi"
let y = &x;                  // '&x' immutable borrow of x held by y
let z = &x;                  // another immutable borrow of x held by z
println!("{}{}{}", x, y, z); // prints "HiHiHi"
// y drops borrow to x, "Hi" is not dropped
// z drops borrow to x, "Hi" is not dropped
// x drops "Hi" at the end of the scope
```

In the above example, `x` is still the owner of `"Hi"`. We immutably _borrow_ `x` twice, in `y` and `z`. No copies of `"Hi"` are made, and `x` is responsible for cleaning up `"Hi"` at the end of the scope.

What happens if we try to mutate an immutable borrow?

```rust
let x = "Hi".to_string(); // x owns "Hi"
let y = &x;               // y immutably borrows x
*y = "Bye".to_string();   // ERROR: can't mutate immutable borrow!
// y drops borrow of x, "Hi" is not dropped
// x drops "Hi" at the end of the scope
```

The compiler yells at us, of course!

```
error[E0594]: cannot assign to `*y`, which is behind a `&` reference
 --> src/main.rs:3:1
  |
2 | let y = &x;
  |         -- help: consider changing this to be a mutable reference: `&mut x`
3 | *y = "Bye".to_string();
  | ^^ `y` is a `&` reference, so the data it refers to cannot be written
```

Obviously, one can't mutate an immutable reference! Heeding the wisdom of the Rust compiler, let's try converting `y` to a mutable reference, `&mut`:

```rust
let x = "Hi".to_string(); // x owns "Hi"
let y = &mut x;           // y mutably borrows x
*y = "Bye".to_string();   // mutate "Hi" to "Bye"
println!("{}", x);        // prints "Bye"
// y drops borrow of x, "Bye" is not dropped
// x drops "Bye" at the end of the scope
```

And compiling...

```
error[E0596]: cannot borrow `x` as mutable, as it is not declared as mutable
 --> src/main.rs:2:9
  |
1 | let x = "Hi".to_string();
  |     - help: consider changing this to be mutable: `mut x`
2 | let y = &mut x;
  |         ^^^^^^ cannot borrow as mutable
```

Of course, `x` must be mutable to borrow it as mutable!

```rust
let mut x = "Hi".to_string(); // x mutably owns "Hi"
let y = &mut x;               // y mutably borrows x
*y = "Bye".to_string();       // mutate "Hi" to "Bye"
println!("{}", x);            // prints "Bye"
// y drops borrow of x, "Bye" is not dropped
// x drops "Bye" at the end of the scope
```

This works! Just note a couple of things:

1. `y` does not need to be declared using `let mut y = ...` because `y` itself is not mutable; the reference it holds is.
2. Additionally, `*` _defererences_ `y` in `*y`. Dereferencing is kinda like an anti-borrow, and lets us work with the value the reference contains.

> **Aside:** As a general rule of thumb, you can't dereference a borrow unless you're mutating it (like we do above), or the value is small enough to `Copy`.

What happens when we try to hold a mutable and immutable reference at the same time?

```rust
let mut x = "Hi".to_string(); // x mutably owns "Hi"
let w = &x;                   // w immutably borrows x
let y = &mut x;               // y mutably borrows x
*y = "Bye".to_string();       // mutate "Hi" to "Bye"
```

You see, because—

Wait...

Huh? This compiles? Why?

> No, seriously, [try it yourself](https://play.rust-lang.org/?version=stable&mode=debug&edition=2021&gist=8a5a6d68c3d2240398cd8e5d88b427dd)!

Well, Rust tries to end borrows as early as possible. Let's write out the above again, but with the correct borrow lifetimes:

```rust
let mut x = "Hi".to_string(); // x mutably owns "Hi"
let w = &x;                   // w immutably borrows x
// w drops borrow of x, "Bye" is not dropped
// there are no more borrows to x

let y = &mut x;         // y mutably borrows x
*y = "Bye".to_string(); // mutate "Hi" to "Bye"
// y drops borrow of x, "Bye" is not dropped

// x drops "Bye" at the end of the scope
```

As you can see, the immutable borrow is dropped _before_ the mutable borrow is made, so we're actually _not_ holding a mutable and immutable reference at the same time.

To write out the scopes and _lifetimes_ more explicitly:

```rust
let mut x: String = "Hi".to_string(); // x mutably owns "Hi"
'a: {
    let w: &'a String = &'a x; // w immutably borrows x
    // w drops borrow of x, "Bye" is not dropped
}
'b: {
    let y: &'b mut String = &'b mut x; // y mutably borrows x
    *y = "Bye".to_string();            // mutate "Hi" to "Bye"
    // y drops borrow of x, "Bye" is not dropped
}
// x drops "Bye" at the end of the scope
```

> **Note:** `'a: {` and `&'b x` is [not valid syntax](https://doc.rust-lang.org/nomicon/lifetimes.html), but it's commonly used to show the scopes of lifetimes in Rust.

These scopes do not overlap, so the lifetimes are _disjoint_.

"Disjoint? ... Lifetimes?" I hear you thinking. "What does this have to do with anything?"

When data is borrowed, it is borrowed for a given _lifetime_. This is how long the borrow 'lives', so to speak.

> Lifetimes are usually denoted with a single apostrophe, like so: `'a`. This notation was loosely _borrowed_ (no pun) from OCaml, which uses `'t` to denote generic types.

So in the above example, the first borrow to `x`, `&'a`, lasts for the lifetime `'a`. Likewise, the second borrow, `&'b mut`, lasts for the lifetime `'b'`. Because `'a` and `'b` do not overlap, they are [disjoint](https://doc.rust-lang.org/rust-by-example/scope/lifetime.html). Order restored!

Borrowing is baked into Rust's type system. If you mutably borrow a `String`, you do not _just_ have a mutably borrowed `String`. You have an `&mut String`! The types `&mut String`, `&String`, and `String` are all similar, but not the same.

> **Aside:** this is further complicated by the fact that a borrowed string is actually an `&str`, not an `&String`. This is because `str` is a type internal to the compiler, like `usize`, and `String` is a heap-allocated container for a `str` that when borrowed produces an `&str`.
>
> These distinctions are a bit too fine-grained for what we're _currently_ dealing with, but it's important to be aware that these distinctions exist.

## Subtyping

As a matter of fact, `&'a String` and `&'b String` may actually be different types entirely, because they have different associated lifetimes!

I say 'may' here because it's possible that `'a` and `'b` overlap:

```rust
let x = "Hi".to_string();
'a: {
    let y = &'a x;
    'b: {
        let z = &'b y;
    }
}
```

As you can see, the lifetime `'a` completely envelops `'b`. In other words, `'a: 'b`, meaning `'a` outlives `'b`. For this reason, `'a` is a _subtype_ of `'b`.

> The bigger region is a subtype of the smaller region.

Take a second to internalize this.

> This is a large source of confusion, because it seems backwards to many: the bigger region is a subtype of the smaller region.
>
> — [The 'Nomicon](https://doc.rust-lang.org/nomicon/subtyping.html)

`'a` is a subtype of `'b` because `'a` is the same region of code, _and more_.

> No, seriously, take a second to internalize this.

If you want to learn more, I recommend you read the [_Subtyping and Variance_](https://doc.rust-lang.org/nomicon/subtyping.html) section of the Rustonomicon. If not, we'll revisit this topic [later](subtyping-and-variance).

> An easy way to remember this relationship is that `'static`, as in `&'static str`, is the subtype of _all_ lifetimes, because `'static` outlives all other lifetimes.

## An XOR Conflict!

There's a lot to be said about subtyping and variance, and we'll discuss it in more depth over the coming sections. Anyway, back to our previous example:

```rust
let mut x = "Hi".to_string(); // x mutably owns "Hi"
let w = &x;                   // w immutably borrows x
let y = &mut x;               // y mutably borrows x
*y = "Bye".to_string();       // mutate "Hi" to "Bye"
```

That compiles. This, however, does not:

```rust
let mut x = "Hi".to_string(); // x mutably owns "Hi"
let w = &x;                   // w immutably borrows x
let y = &mut x;               // y mutably borrows x
*y = "Bye".to_string();       // mutate "Hi" to "Bye"
println!("{}", w);            // ERROR: "Hi" is also borrowed as immutable!
```

Originally, the lifetimes of the borrows for `w` and `y` were disjoint:

```rust
let x = ...;
{
    let w = &x;
}
{
    let y = &mut x;
}
```

But with the addition of `println!("{}", w)`, the scope of `w` is _stretched_, like a rubber tube, to envelop `y`'s scope:

```rust
let x = ...;
{
    let w = &x;
    {
        let y = &mut x;
        // ERROR: w is &x, but y is &mut x!
    }
    println!("{}", w);
}
```

This does not uphold Rust's _Aliasable XOR Mutable_ requirement, because we're holding an immutable borrow (in `w`) and a mutable borrow (in `y`) at the same time!

# Inductive Datatypes

With the basics of borrow checking out of the way, let's talk data. Rust requires that all data have exactly one owner. When working with inductive datatypes (loosely anything tree-like; e.g. can easily serialize to JSON), this requirement is not much of an issue:

```rust
struct User {
    name:    String,
    email:   Email,
    pw_hash: Hash,
}
```

All of these fields are owned by the struct `User`. This makes sense: if fields were externally owned, we'd have to include the borrow in the type:

```rust
struct User<'a> {
    // ...
    documents: &'a [Document],
}
```

As discussed earlier, when we borrow, we borrow for a lifetime. So, `&'a [Document]` has to live for at least as long as `'a`. When a type is parameterized by a lifetime (e.g. `User<'a>`), it means that the data `User` contains depends on the lifetime.

In fact, you can think of `&` as a bit of a type constructor itself, like `Vec` or `Box`. `&` takes two arguments: a lifetime, like `'a`, and a type `T` to borrow over, like a slice of documents `[Document]`.

If we were to write this out using standard Rust type-constructor notation, `&'a T'` would probably look like `Borrow<'a, T>`. A mutable borrow, like `&'a mut T`, would be something like `BorrowMut<'a, T>`. Regardless of the notation used, what's important to remember is that **borrows can be codified as types**.

Tree-like structures are easy to represent because each field in the tree has exactly one owner: the type they are a field of.

Creating arbitrary graph-like cycles is a bit harder, because each node in the graph may have multiple references, yet Rust requires (somehow), that we have only one owner per node, and that borrowing/variance semantics are upheld.

So let's throw caution to the wind and write some cycles in Rust:

# Cyclic Data

It's can be hard to express cycles in Rust. To illustrate this point, let's consider this naïve definition of a linked list:

```rust
struct Link<T> {
    item: T,
    prev: Option<LinkRef<T>>,
    next: Option<LinkRef<T>>,
}

type LinkRef<T> = Box<Link<T>>;
```

A `Box<T>` is an owned pointer to an item of type `T`. This definition compiles, but if we try to use it in practice, we quickly run into some errors:

```rust
// trying to make a two-item linked list
// initialize the first link
let mut link_1 = Link {
    item: 1,
    prev: None,
    next: None,
};

// initialize the second link with an owned reference to the first
let link_2 = Link {
    item: 2,
    prev: Some(Box::new(link_1)),
    next: None,
};

// have the first link point to the second
// ERROR: link_1 has already been moved into link_2!
link_1.next = Some(Box::new(link_2))
```

The issue here is that the first link wants to own the second link, but the second link wants to own the first.

> **Note:** With some careful finagling and a pinch of `std::mem` for good measure, you might be able to set this up without the compiler complaining (as the first node owns the second and the second owns the first, both have one owner). This is no longer the case when we move to larger lists:

Needless to say, when you get to lists with at least three items, the middle link wants to be owned by two links: the link before it and the link after it. As this requires a single item to have two owners, this won't fly with Rust's borrow checker.

Perhaps there's some way we could change the definition of `Link`/`LinkRef` to appease the borrow checker?

## Workarounds

Cycles are important components for a large number of datastructures, so it's no surprise that many techniques for creating cycles in Rust have been developed over the years.

When writing datatypes with circular references, we generally have three choices to appease the borrow checker:

1. Use `unsafe` and verify correctness ourselves.
2. Use another level of indirection (e.g. arena, `Vec` & handle).
3. Use interior mutability (`Rc`, `Weak`, `RefCell`).
4. GhostCell!

Each of these above methods has its pros and cons; let's go through each one.

### Unsafe

While fast, `unsafe` is, well, unsafe. It's easy to mess up the implementation of cyclic data structures. Using `unsafe`, there's nothing to ensure that your implementation is correct.

I won't go into `unsafe` now, as there will be plenty of `unsafe` later, but if you want a guide to writing safe linked lists and other similar datastructures in unsafe Rust, check out [_Too Many Lists_](https://rust-unofficial.github.io/too-many-lists/).

### Another level of indirection

Using another level of indirection, like a typed arena, is probably the most common battle-tested technique nowadays. The traditional method of a `Vec<T>` with a typed index handle is pretty self-explanatory:

```rust
// a typed region of memory that we manage
struct LinkArena<'a, T: 'a> {
    links: Vec<Link<T>>,
}

// an index into that arena
struct LinkHandle {
    index: usize,
}

// the link from earlier
struct Link<T> {
    item: T,
    prev: Option<LinkRef<T>>,
    next: Option<LinkRef<T>>,
}

// use a link handle instead of a `Box<LinkRef<T>>`
type LinkRef<T> = LinkHandle;
```

The `LinkArena` maintains single-ownership over all data in the arena. To mutate some data in the arena, you need both a `LinkHandle` (which is an index into the arena), and a mutable reference to the arena itself. Because `LinkHandle`s are just indices, we can easily include them in our `Link`.

Although simple, with this technique we loose a number of guarantees:

1. **We have to pass the arena around whenever we want to follow a handle.** In addition, the `prev`ious and `next` items are no longer just convenient fields on the struct. This could be fixed through the use of reference-counting the arena in the handle, or an `'arena` lifetime. We'll build things on top of these ideas later.

2. **The arena holds items for longer than they may need to be held.** If we remove an item, it won't be dropped until the arena is dropped. We either have to live with this or implement garbage collection ourselves, which kinda defeats the point of a language whose whole deal is that it doesn't need to be garbage collected.

3. **The amortized cost is higher, because we're using a `Vec` as a backing store.** This requires reallocation as it grows in size, whereas just using the native heap will probably be faster. Better arenas use better backing stores (`typed-arena`, for instance, essentially uses a `(Vec<T>, Vec<Vec<T>>)` which it carefully manages).

All of these issues can be used by using better arenas than the above implementation. A number of crates, like [`bumpalo`](https://docs.rs/bumpalo/3.8.0/bumpalo/), [`petgraph`](https://docs.rs/petgraph/0.6.0/petgraph/), [`slotmap`](https://docs.rs/slotmap/1.0.6/slotmap/), [`typed-arena`](https://docs.rs/typed-arena/2.0.1/typed_arena/),

The most glaring issue is probably summed up by the following quote:

> "All problems in computer science can be solved by another level of indirection, except for the problem of too many levels of indirection".
>
> — David Wheeler

Adding an arena is another level of indirection for memory management. Think about it this way: If we allocated _everything_ in an untyped arena, our program would `unsafe` by any other name.

### Shared References and Interior Mutability

In the previous two examples, we've been struggling with the constraint of single ownership enforced by the Rust compiler at compile time. If data could just have multiple mutable owners, wouldn't the whole shebang of constructing cyclical datastructures be a non-issue?

Well yes, but actually no. I'll explain:

You see, in a single-threaded context, multiple mutable owners are perfectly acceptable, as only one write to the shared data can occur at a time. In contexts with _multiple_ writers, however, this is no longer the case. In multithreaded contexts we run into the issue of [race conditions](https://en.wikipedia.org/wiki/Race_condition#See_also) and [TOC/TOU](https://en.wikipedia.org/wiki/Time-of-check_to_time-of-use): both arise when different threads try write/read data in an uncoordinated manner. This leads to corrupted application state (at best) and segmentation faults (at worst). These types of unpredictable blow-ups are _exactly_ the class of bugs Safe Rust is trying to prevent!

Luckily for us, Rust provides a built-in escape hatch for multiple _ownership_ of shared data: the reference counter pointer `Rc`, and its multithreaded brother, the atomic reference counter `Arc`. In short, `Rc` and `Arc` keep track of the number of owners some data has. When the reference count reaches zero and there are no owners left, the data is dropped. Because of this, both of these reference types incur a small runtime cost in comparison to raw references.

> **Aside:** Reference counting usually incurs **less** of a cost in Rust than in other languages. Why? Because Rust's borrow checker is so darn smart, in many situations one can usually get away with passing around a _reference_ to a `Rc`'d pointer—i.e. `&Rc<T>`—rather than increasing the reference count with each call.

`Arc` and `Rc` are only half of the story: these two managed pointers are _immutable_. When data types are immutable, it's impossible to build anything that isn't [inductive](#inductive-datatypes): no cyclical references allowed. We need some way to inject mutability into our multiple-owner shared immutable references.

> TODO: RefCell and RwLock

## Subtyping and Variance

> **Note 1:** This section is quite involved, and only tangentially relates to `GhostCell`. The key takeaway is that an **invariant lifetime can not change to another lifetime** through subtyping.

> **Note 2:** This section is based on the similarly-titled section of the [Rustonomicon](https://doc.rust-lang.org/nomicon/intro.html). Check it out!

Something important to think about is the relationship between type constructors (e.g. `Vec`) and the lifetimes of the type arguments passed to them (e.g. the `T` in `Vec<T>`).

The property of this relationship is called _Variance_, for better or worse, and it's important we at least understand _invariant_ lifetimes before we continue.

This table, from the every-handy ['Nomicon](https://doc.rust-lang.org/nomicon/subtyping.html), shows the variance of lifetime types in Rust:

| Type Constructor |   `'a`    |      `T`      |    `U`    |
| ---------------- | :-------: | :-----------: | :-------: |
| `&'a T `         | covariant |   covariant   |           |
| `&'a mut T`      | covariant |   invariant   |           |
| `Box<T>`         |           |   covariant   |           |
| `Cell<T>`        |           |   invariant   |           |
| `fn(T) -> U`     |           | contravariant | covariant |
| `*const T`       |           |   covariant   |           |
| `*mut T`         |           |   invariant   |           |

There are three types of variance in Rust. Given a type constructor `F`, subtype `Sub`, and a supertype `Super` (so `Sub: Super`), variance tells us how the subtyping relationship passes through the type constructor. The variance of `F` is:

1. **Covariant** if subtyping passes through the type constructor. In other words, `Sub: Super` and `F<Sub>: F<Super>`.
2. **Contravariant** if subtyping is reversed: if `Sub: Super`, then `F<Super>: F<Sub>`. Notice the reversal!
3. **Invariant** if subtyping is not preserved. If `Sub: Super`, then `F<Sub>` is disjoint from `F<Super>`. No relationship exists.

`GhostCell`/`Token` uses an _invariant_ lifetime to ensure that the lifetime remains unique. To see how lifetimes can be used in the place of others, let's talk about _covariance_:

### Covariance

Let's say we have a function that prints a borrowed `String`:

```rust
fn print_string<'b>(string: &'b String) {
    println!("{}", string);
}
```

> **Note:** Again, using `&String` rather than `&str` for consistency.

In this function, the argument we borrow from must live at least as long as `'b`:

```rust
let x: String = "Hello".to_string();
'a: {
    let y: &'a String = &'a x;
    'b: {
        print_string::<'b>(y);
    }
}
```

Here we pass `y` to `print_string`, which lives for `'a`. Because `'a` contains `'b`, it is perfectly valid to pass a `&'a String` to `print_string<'b>(...)`.

We know that `'a` is a subtype of `'b`, because, as discussed in the previous section, `'a` contains the lifetime `'b` and more. Additionally, we know that `&'a String` is a subtype of `&'b String`, because we can use `&'a String` where we expect `&'b String`. In this sense, subtyping _passes through_ immutable borrows. Returning to the definition of covariance:

> `F` is covariant if subtyping _passes through_ the type constructor. In other words, `Sub: Super` and `F<Sub>: F<Super>`.

Looking at the example with lifetimes, `'a: 'b` and `&'a T: &'b T`. Therefore, we can say that immutably borrowing a value is _covariant_.

This is the most common type of variance by far:

| Covariant Type | Over?                                                               |
| -------------- | ------------------------------------------------------------------- |
| `&'a T `       | Covariant over both `'a` and `T`.                                   |
| `Box<T>`       | Any collection type (e.g. `Vec<T>`), is usually covariant over `T`. |
| `*const T`     | Constant pointer is covariant over `T`.                             |

So if subtyping is preserved for covariant lifetimes, what does it mean when subtyping is _not_ preserved?

### Invariance

I hope I haven't lost you. Sometimes I get sucked into abstraction spirals; whenever I do, it's good to relax and get concrete for a second.

Still with me? Alright.

Let's talk invariance! Say we have a function that mutates a `&mut T`:

```rust
fn mutate<'a, T>(data: &'a mut T, val: T) {
    *data = val;
}
```

Now consider the following:

```rust
'static: {
    let mut x: &'static String = "Hi"; // Lives for the 'static lifeitme
    'a: {
        let y = "Bye".to_string();
        let y_borrow: &'a String = &'a y; // Lives only for 'a
        mutate(&mut x, y_borrow);         // Replaces "Hi" with "Bye" in x
        // y drops "Bye" at the end of the scope
    }
    println!("{}", x); // ERROR: "Bye" has been dropped!
}
```

At first glance, we replace `x`, which is `"Hi"` with a value borrowed from `y`, which is `"Bye"`. Then, when `y` exits the scope, `"Bye"` is dropped. When we later try to print `x`, aren't we using memory after we dropped it?

Note that the above is still Aliasable XOR Mutable (AXM): we only have one mutable borrow of `x`, and one immutable borrow of `y`. Conceptually, it makes sense that this shouldn't compile. But if AXM doesn't explain this, what does?

Let's write out the types passed to `mutate(data: &mut T, val: T)`:

| Arg        | Param  | Generic  | Arg Type       |
| ---------- | ------ | -------- | -------------- |
| `&mut x`   | `data` | `&mut T` | `&mut &String` |
| `y_borrow` | `val`  | `T`      | `&String`      |

So, from the above table, `T` must be an `&String`. So this typechecks, right? Wrong!

<details>
<summary> Expand the big ol' error message.</summary>

```
error[E0597]: `y` does not live long enough
  --> src/main.rs:5:31
   |
2  | let mut x: &'static String = "Hi";
   |            --------------- type annotation requires that `y` is borrowed for `'static`
...
5  |     let y_borrow: &'a String = &'a y;
   |                                ^^^^^ borrowed value does not live long enough
6  |     mutate(&mut x, y_borrow);
...
8  | }
   | - `y` dropped here while still borrowed
```

</details>

You see, `x` and `y_borrow` are not the same `&String`. Remember, that the lifetime is a part of the type:

-   So `x` is a `&'static String`, borrowed for `&'static`.
-   And `y_borrow` is a `&'a String`, borrowed for `&'a`.

But remember, `'static` contains `'a`, so `'static` must be a subtype of `'a`. If `'static` is a subtype of `'a`, shouldn't `&mut &'static` be a subtype of `&mut &'a`?

Here's the clincher:

> Mutable borrows (`&mut T`) are invariant.

Returning to the definition of invariance:

> `F` is invariant if subtyping is not preserved.

Even though `'static` is a subtype of `'a`, `&mut &'static` is _not_ a subtype of `&mut &'a`. Subtyping _does not_ pass through mutable borrows. For this reason, we can say that immutably borrowing a value is _invariant_ over the lifetime involved.

So mutable and immutable borrows are two ends on opposite sides of the spectrum: immutable borrows can be covariant because even if lifetimes do not match exactly, the underlying lifetime of the value cannot be shortened because the value is immutable. This is not the case for mutable types, so mutable types must be invariant.

Any type that exhibits a pattern of this sort of _interior mutability_ must be invariant, for the reason outlined above. Here are the core invariant types, pay special attention to the last one:

| Invariant Type | Over?                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------- |
| `&'a mut T`    | Is invariant over `'a` and covariant over `T`.                                                      |
| `Cell<T>`      | Interior mutability types (e.g. `RefCell`, `UnsafeCell`, atomics, etc.) are all invariant over `T`. |
| `*mut T`       | Mutable pointers are invariant over `T`.                                                            |

Invariant types essentially ensure that a given lifetime can not be changed into other lifetimes. This is really important when mutating data, because we want the mutated data to live exactly as long as the data it is replacing.

# GhostCell

Holy moly, how's that for an exposition? I think it's about time we finally begin. So, what's GhostCell?

**[GhostCell](https://plv.mpi-sws.org/rustbelt/ghostcell/) is a new technique for separating _access_ to data from _permission_ to modify that data.**

> **Note:** GhostCell was developed by the awesome folks of the [RustBelt Project](https://plv.mpi-sws.org/rustbelt/), an effort to specify the formal semantics of a large subset of the Rust, which can be used to prove certain properties of Rust code. The authors of GhostCell actually discussed how they extended RustBelt to prove the correctness of GhostCell in their paper. I won't touch the proof side of things here, but if you're interested in theorem proving, I highly recommend you check out the [paper](https://plv.mpi-sws.org/rustbelt/ghostcell/paper.pdf)!

At its core, GhostCell introduces two types: `GhostCell<'id>`, which is an owned pointer to some data, and `GhostToken<'id>`, a linearly unique _token_ that allows one writer to modify a `GhostCell` at a time.

Unlike `Rc`/`RefCell`, GhostCell imposes no runtime overhead. It does this by leveraging Rust's rich type system to erase all types at compile time. In this sense, GhostCell is a safe zero-cost cell that allows for shared mutable aliasing through compile time borrow checking.

## A Quick Usage Example

Before we dig into the dirty details of how `GhostCell` works, I think we should

```
let value = GhostToken::new(|mut token| {
    let cell = GhostCell::new(42);
    let vec: Vec<_> = (0..n).map(|_| &cell).collect();
    *vec[n / 2].borrow_mut(&mut token) = 33;
    *cell.borrow(&token)
});
```

You may have noticed the little lifetime parameter `'id` attached

## Brands, `GhostToken`, and Lifetime Variance

Invariant Lifetime

> GhostToken<'id> only has one method: a constructor GhostToken<'id>::new, using the same
> pattern as we already saw with branded vectors. That is, new requires a client closure f that must
> be able to work with a GhostToken with an arbitrary brand 'new_id. Thus new picks a fresh brand
> 'new_id, creates the GhostToken<'new_id>, and then passes it on to f.

Paper

> The closure must be variant over the lifetimes, this does not always play well with closures already containing references.
> None of the branded items can be returned by the closure.

Github

> TODO: consistent styling of GhostCell and Token

## Implementing a Doubly-Linked List

## Going over the implementation of `GhostCell`

### Discussing the API

### Implementing the API

## Adding `static_rc` to the Mix!

# Fin

<div class="boxed">
This was a longer post than usual, thanks for sticking it out to the end!

Huge thanks to my two incredible [Patrons](https://www.patreon.com/slightknack)—[Keith](https://github.com/Kethku) and [Feifan](https://twitter.com/FeifanZ)—for sponsoring the work that I do. I'm also deeply grateful to [Mikail](https://github.com/mkhan45) and [Yasser](https://github.com/realnegate) for reviewing (and correcting!) earlier versions of this post.

</div>
