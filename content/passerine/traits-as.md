+++
title = "Traits as implicit conversion"
date = 2022-02-28

[extra]
artbit = "3_wire.png"
+++

The joy of writing a [new programming language](https://passerine.io) is coming up with novel ideas and seeing if they stick. 

The challenge I'm attempting to solve stems from dealing with different types of objects that share common structure or behavior. For this reason I've been thinking a lot about how to rectify open/closed enumerations, traits, and type constructors.

Traditional object-oriented languages deal with this through the use of inheritance. For example since both a `Wizard` and a `Person` have a `name`, they may both inherit from a single `Named` class. In Java, we may write this as:

```java
class Named {
    String name;
}

class Person extends Named {
    int age;
}

class Wizard extends Named {
    String title;
    int skill;
}
```

This is all well and dandy, but problems quickly arise. Java only supports single inheritance, so if we want a new class to extend both `Named` and, say `Aged`, we'd either have to create a new class (like `NamedAndAged`, gross), or use a language with *multiple inheritance*.

Multiple inheritance sucks for other reasons, though, mostly due to the [diamond dependency problem](https://en.wikipedia.org/wiki/Multiple_inheritance#The_diamond_problem). If we even create a class that inherits from two superclasses with the same field, which field gets used? Does the object have two fields?

This is a problem as old as the hills, and it's why we've developed sayings—like 'always choose composition over inheritance'—that have been passed down from developer to developer, generation after generation.

We don't have to be stuck with the pains inheritance, though! Inheritance is really just ensuring that different objects share certain structure and/or behavior. Ultimately this is what composition over inheritance means: Instead of having a `Person` that is `Named`, just make a `Person` have a `Name`, and pass that `Name` around when required:

```java
class Name {
    String name;
}

class Person {
    int age;
    Name name;
}
```

While nice, this required that person carry around a `name` field; if the name can be derived from existing class data, this may be redundant. We could use a method, of course:

```java
class Person {
    // ...
    Name name() { 
        // ... 
    }
}
```

But the problem here is that there's no real *consistency* between the various ways of representing that a `Person` has a name. Do we access a field, call a method, etc?

But you know the solution to this! Just use typeclasses/traits/interfaces, you shout! Instead of adding methods and fields ad-hoc, we declare a shared `trait` (to use the Rust parlance) with common behavior:

```Rust
pub trait Named {
    fn name(&self) -> String;
}
```

Then, if we have a person, we can implement `Named` for `Person` to show that a person indeed has a name:

```Rust
struct Person {
    name: String,
    age:  usize,
}

impl Named for Person {
    name(&self) -> String {
        self.name.to_string()
    }
}
```

We can access this field using regular method call syntax, like `person.name()`. If we implement another trait that *also* has a name method, then we must use Rust's Uniform Function Call Syntax (UFCS) to disambiguate: `Named::name(&person)`.

Whatever you call it, the core idea behind traits/typeclasses/interfaces/etc. is simple: define a single interface with a number of behaviors through which the underlying object is accessed.

My largest issue with these systems is that *another layer* on top of the language itself. This description may not be entirely clear, so let's jump into some examples in Passerine:

# A modest proposal
Say we have a struct; it's for a `Person`:

```
type Person = {
    name: String,
    age:  Nat,
}
```

If we wanted to make a new `Person`, we'd just construct it:

```
Person {
    name: "Gerald",
    age:  69,
}
```

We can write functions that update `Person`, too:

```
birthday = Person { name, age          } 
        -> Person { name, age: age + 1 }
```

So far, this is all pretty standard. When you think about it, constructing a `Person` is just wrapping a bare struct in the `Person` newtype. In fact, this is completely valid:

```
inner = { name: "Bob", age: 27 }
bob = Person inner
```

In essence, `Person` is a constructor: a function that takes some data and produces some data of that type:

```
Person : { name: String, age: Nat } -> Person
       = { name,         age      } -> Person { name, age }
```

In fact, for any type we define, we essentially get the following constructor for free:

```
Type : Inner -> Type
```

By default, `Inner` is a single type: it's literally the inner contents of `Type`. 

# Dynamic dispatch

This brings me to traits. A trait is essentially a set of different objects that share the same behavior. In Rust, for example:

```rust
trait Animal {
    fn feed()  -> String;
    fn speak() -> String;
}
```

Anything that you can `feed` or `say` can be defined to be an `Animal`:

```rust
struct Cat

// A cat is an Animal
impl Animal for Cat {
    fn feed()  { "not hungry".to_string() }
    fn speak() {      "meow!".to_string() }
}
```

Traits are useful for modeling systems that expect different objects with defined shared behavior. For example, we can define a trait that represents `Iterator` over an arbitrary stream:

```rust
// Abridged from Rust's standard library
trait Iterator {
    type Item;
    fn next(&mut self) -> Option<Self::Item>;
}
```

Anything has a notion of being advanced via `next`, whether that be moving a cursor through an array or traversing nodes in a tree, can be used as an `Iterator`. For example, here's how we might iterate through a `Vec`:

```rust
type VecIter<T> {
    index: usize,
    vec:   Vec<T>
}


// Ignoring some lifetime stuff for the sake of simplicity
impl<T> Iterator for VecIter<T> {
    type Item = T;
    
    fn next(&mut self) -> Option<T> {
        self.index += 1;
        self.vec.get(self.index - 1)
    }
}

fn vec_to_iter<T>(vec: Vec<T>) -> VecIter {
    VecIter { index: 0, vec }
}
```

That's simple enough. calling `vec_to_iter(vec![1, 2, 3])` will produce a `VecIter` which can be used as an `impl Iterator<Item=usize>`, an iterator over the numbers 1, 2, and 3.

But if you were to represent an iterator as an *actual type*, how would you go about doing that?

Well, we know that an iterator produces `Item`s of a certain type, and has a single function that advances state:

```rust
struct Iterator<Item> {
    next: Box<dyn FnMut() -> Option<Item>>,
}
```

And then why don't we just have `vec_to_iter` return, well, an `Iterator`?

```rust
// Again, completely ignoring the borrow checker lol
fn vec_to_iter<T>(vec: Vec<T>) -> Iterator {
    let mut index = 0;
    let mut vec = vec;
    
    Iterator {
        next: Box::new(|| {
            index += 1;
            vec.get(self.index - 1)
        })
    }
}
```

As you can see, an iterator is just a concrete type containing a higher-order function. In this non-trait version, implementing `Iterator` is as simple as *constructing* Iterator.

```rust
let iter = vec_to_iter(vec![1, 2, 3])

(vec.next)(); // Some(1)
(vec.next)(); // Some(2)
(vec.next)(); // Some(3)
(vec.next)(); // None
```

Rust makes this a bit harder because none of the code we just wrote would actually compile, but this should illustrate the point.

But the point is: traits can be represented as plain old types. 

> **Aside:** Agda and inference
> 
> TODO: Write about how Agda builds off this, it's really cool!

Anyway, let's hop back to Passerine.

# Wizards are people too.

Starting with our definition for `Person` from earlier, let's also define a `Wizard`:

```
type Person = {
    name: String,
    age:  Nat,
}

type Wizard = {
    title: String,
    name: String,
    skill:  Nat,
}
```

Now wizards are people too. All wizards are actually as physically fit as a 25 year old (how else do you think they are so darn fast?), but their outward age-defined appearance is a pure function of `skill`.

So let's say we have a function that takes a `Person`:

```
call_for_dinner = Person { name, .. } -> {
    println "Hey {name}, it's time for dinner! Come and eat!"
}
```

Now wizards are people too: wouldn't it be nice if we could call our wizard friends over for dinner as well?

We could write a conversion function that temporarily converts a `Wizard` into a `Person`:

```
wizard_to_person = Wizard { title, name, skill } 
    -> Person {
        name: "{name} the {title}",
        age:  25 + skill / 10,
    }
```

So if we have a `Wizard`, say `merlin`:

```
merlin = Wizard {
    title: "Wise",
    name:  "Merlin",
    skill: 930,
}
```

We can call `merlin` over to dinner:

```
call_to_dinner (wizard_to_person merlin)
```

Hey Merlin the Wise, it's time for dinner! Come and eat!

The only thing missing for this to be a trait system would be some way to convert `merlin` to a `Person` automatically...

# from A to B
So, back to constructors. 

Remember that when we're constructing a `Person`, `Person` essentially serves as a function with the following type:

```
Person : { name: String, age: Nat } -> Person
```

In other words, we take a record (i.e. struct) representing a person, and produce a semi-opaque object of type `Person`. Reasonable enough.

But what if we could make `Person` construct over additional types?

The most obvious extension would be some sort of row polymorphism (as Passerine aims to eventually be row-polymorphic, in the tradition of ML-style languages). If we provide a record with additional fields to `Person`, person should ignore those fields:

```
Person { 
    name: "Joe", 
    age: "5", 
    birthday: "2022-05-23" 
}
```

In this case, the `birthday` field would be ignored. If we were to write this as a type, we could say that:

```
Person : { name: Nat, age: String } 
       | { name: Nat, age: String, .. } -> Person
```

Remember that `|` is a sum type (i.e. enum). This is a bit redundant, as the former type is a subtype of the latter.

Taking some more creative liberties, let's say that we want a person constructed with no `age` to take on a default value of `0`:

```
jack = Person { name: "Baby Jack" }
jack.age
-------- this is 0
```

Whether this is a good idea or not is debatable, but it wouldn't be too hard to write as a function:

```
baby_person = { name } -> Person { name, age: 0 }
```

If `Person` accepted this as well, we'd write the type of the `Person` constructor function as:

```
Person : { name: String, age: Nat }
       | { name: String, age: Nat, .. }
       | { name: String }
      -> Person
```

Let's get a little crazy. Remember our `Wizards` from earlier? what if it was possible to construct a `Person` from a `Wizard`, you know, using our `wizard_to_person` routine:

```
merlin = Wizard {
    title: "Wise",
    name:  "Merlin",
    skill: 930,
}

Person merlin
```

This would mean that the `Person` constructor could really take anything of the following type:

```
Person : { name: String, age: Nat }
       | { name: String, age: Nat, .. }
       | { name: String }
       | Wizard
       | ...
      -> Person
```

In all these cases — wizards, row polymorphism, default parameters, or otherwise, what we're trying to do is simple — treat a some type that isn't a `Person` as a `Person` by extending the constructor. By extending the constructor, we're essentially treating `Person` in the similitude of a trait: a common target for shared behavior, namely having a `name` and an `age`.

In essence, we want *open membership* over `Person`'s constructor. What if we could define our own `Person T`, creating people from arbitrary people-likes of type `T`?

Something I've been considering is a `impl ... from` syntax, specifically for this purpose:

```
-- So that `Person Wizard` works
impl Person from Wizard = 
    Wizard { title, name, skill } 
-> Person {
    name: "{name} the {title}",
    age:  25 + skill / 10,
}
```

This, essentially, would add a case to `Person`'s constructor so that constructing a `Person` from a wizard now makes sense. This essentially acts as a form of dynamic dispatch!

In fact, we're not limited to the second type being a named type. We could implement baby-by-default (the case where the default age is zero) in the following manner:

```
impl Person from { name: String } =
    { name } -> Person { name, age: 0 }
```

Which is pretty cool! There are lots of things you can do, like defining a `Default` type that wraps unit, `()`:

```
type Default = ()
```

Now we can add a default implementation to person!

```
impl Person from Default 
    = Default -> Person {
        name: "",
        age:  0,
    }
```

So now it's possible to write:

```
Person Default
```

Or use row splicing to fill in a `Person` from the `Default`:

```
ug = Person {
    name: "ug",
    .. Person Default,
}
```

Where `.. Person Default` essentially means fill the rest of this struct from `Person Default`.

But I guess you could argue that `Person` isn't really a trait. Don't we have this backwards? Wouldn't we want to `impl Default from Person`, whatever that means?

Well yes and no. Let's look at some iterators.

# Iterators in Passerine

So Passerine has a little problem, and it's twofold:

1. It only supports inductive datatypes (i.e. anything you could trivially serialize to JSON, no cycles).
2. Closures can only capture immutable values.

In Rust we defined our type representing an iterator using, well, a mutable closure:

```rust
struct Iterator<Item> {
    next: Box<dyn FnMut() -> Option<Item>>,
}
```

So to model `Iterator` in Passerine, we'd essentially have to make the internal state explicit:

```
type Iterator = all State Item -> {
    state: State,
    _next: State -> Option (State, Item)
}
```

Which isn't too bad, because we can define a function `next` that operates on iterators, instead of calling `iterator._next`:

```
next : all S I 
    -> (Iterator S I) 
    -> Option (Iterator S I, T)
= Iterator { state, _next } -> match (_next state) {
    Some (new_state, item) -> Some (
        Iterator { state: new_state, _next }, 
        item,
    ),
    None -> None,
}
```

> **Aside:** In the future, it might be possible to model hidden state using Passerine's effect system.

Yeah, it kinda looks like a mess, and I invented some syntax, but bear with me.

Let's define an iterator, `Fib`, that we can use to calculate the fibonacci sequence:

```
type Fib = ()

impl Iter (Nat, Nat) Nat for Fib = Fib -> Iter {
    state: (0, 1),
    _next: (a, b) -> Some ((a + b, a), a),
}
```

So our internal `State` is a pair of numbers `(Nat, Nat)`, and at each iteration we produce an `Item`, which is a number `Nat`.

Let's say we define a function that takes an `Iter`, and prints out all its elements:

```
println_all_iter = (iter: Iter) -> match (next iter) {
    None -> None,
    Some (new_iter, item) -> {
        println item
        print_all_iter new_iter
    },
}
```

Printing out all the fibonacci numbers (warning!) is as easy as:

```
println_all_iter (Iter (Fib ()))
```

Which we can write using `|>` notation as follows:

```
Fib () |> Iter |> println_all_iter
```

# Some sugar!

Converting a `Wizard` to a `Person` is all well and good, but what if we just want a `Wizard`'s age? Currently, you'd have to do something like:

```
(Person merlin).age
```

Which isn't that bad. But what if we made `Type.field` sugar for `object -> (Type object).field`? Then the above would be:

```
Person.age merlin
```

which is reminiscent of a uniform function call syntax (UFCS), used to disambiguate when multiple traits are present.

Speaking of multiple traits...

# Disambiguating Multiple Traits

Currently, our functions can really only operate on one trait at a time. If our function accepts an `Iterator`, we can't also specify that that type also implements the trait `Length`. Let's take a second to flesh out this line of reasoning.

So we have two traits:

```
type Iterator = ... -- see previous definition
type Length   = Nat -- the length of a collection
```

We can implement both `Iterator` and `Length` from a list `[T]`:

```
all T -> impl Iterator Nat T from [T] 
= list -> Iterator {
    state: 0
    _next: index -> if (list.length == index) {
        None
    } else {
        Some (index + 1)
    }
}

all T -> impl Length from [T] = list -> list.length
```

Let's say we're writing a function that takes an `Iterator` it needs to know the `Length` of. We *could* require the function to take both separately:

```
println_half = iter length -> {
    for _ in (length / 2) {
        (iter, item) = next iter |> unwrap
        println item
    }
}
```

But this is bad because there's no *requirement* that `length` is actually the length of `iter`. If we pass in an incorrect length, we could cause `println_half` to `unwrap` a `None` value! Aaaaaah!

Ideally, we'd want to be able to specify that `iter` implements both `Iterator` and `Length`. Let's start by writing out the type of `println_half` as-is:

```
println_half : all S I 
    -> Iterator S I 
    -> Nat 
    -> ()
```

One step we could take is just passing `iter` to `println_half` *twice*, and then constructing `Length` and `Iterator` once inside the function:

```
println_half = list -> {
    iter   = Iter list
    length = Length list

    for _ in (length / 2) {
        (iter, item) = next iter |> unwrap
        println item
    }
}
```

If we were to write this as a type, we'd need some way to say that `iter` implements *both* `Iterator` and `Length`. What would this type `???` be?

```
println_half : all S I
    -> ???
    -> ()
```

Rust already has a solution for this; it's to use `+` to constrain a generic type to a trait:

```rust
fn println_half<T, U: Iterator<Item=T> + Length>(list: U) -> { ... }
```

Here `U` represents a type that is both an `Iterator` and has a `Length`. I feel like we could adopt something like this for Passerine wholesale, but as Passerine's generic story isn't that strong yet (heck, I haven't even decided on a syntax!), I wouldn't want to overstretch the language in this manner.

One thing I have been working on, though, are type sets, in relation to Passerine's effect system.

I'm not going to go into too much depth here, but for those familiar, under an effect system, functions may produce a set of side effects:

```
print_random_number: () -> {Console, Random} () {
    random_number ()
    |> to_string
    |> println
}
```

So `{Console, Random}` represents what side effects `print_random_number` causes. Because this is an effect *set*, `{A, B}`, is equivalent to `{B, A}`, and so on.

A *type set* could be a generalization of this to types. It's the set of possible types another type implements as a trait. The type set of something that is iterable and has a length is:

```
{Iterator, Length}
-- leaving out the generics
```

Which means we can treat anything of that type as both an `Iterator` and a `Length`, using a UFCS-like syntax (sugar) to disambiguate when necessary, as shown above.

So we could write the type of this updated `println_half` as follows:

```
println_half : all S I
    -> {Iterator S I, Length}
    -> ()
```

Which I think is fairly clean.

# Something deeper?

I think that this relationship between traits and algebraic effects is interesting. It's something I've discussed with others in the past, and it's something I'd like to continue to explore in the future.

When you think about it, effects are really just dynamically scoped traits; traits whose implementations change depending on dynamic, as opposed to lexically-resolved nominal, scope. 

If Rust implemented algebraic effects, would they use `+` (as discussed earlier) and look like, well, traits? Makes me wonder...

I feel like there's something deeper here. In essence, our trait system has boiled down to dynamic dispatch over conversion between types.

If I wanted a real trait system, I'd probably adopt HKTs and typeclasses. But part of designing a programming language is choosing a limiting set of axioms, and I think that having a separate language for type-level programming goes against Passerine's design, which boils down to a functional scripting language. I'm already worried that typechecking will make Passerine take too long to compile; my goal is to have startup times as fast as something like Python.

I know that what I've been getting at — representing typeclasses as explicit datastructures — is nothing new, and has been common in both languages without higher-kinded types (such as F#, to get around limitations in the language), and languages with higher-kinded types (such as Agda, where types are just objects, so why couldn't they be represented as 'plain datastructures'?).

I feel like all languages in this area are slowly tending towards Agda. Then again, a while back it seemed like everything tended towards Scheme, so maybe it's just a matter of perspective.

Anyway, I digress. I hope you found this little post interesting, thanks for reading!

# One last note

I've noticed something interesting. When dealing with closed enumerations, we allow users of that closed enumeration to see any of the members that constitute that enumeration:

```rust
enum TrafficLight {
    Red,
    Yellow,
    Green,
}
```

When we match of traffic light, we can be sure to handle every pattern:

```Rust
use TrafficLight::*;

fn name(&self) -> String {
    match self {
        Red => "red",
        Yellow => "yellow",
        Green => "green",
    }.to_string()
}
```

I want you to stop for a second an just realize that each match branch is a bit like a function. For example, the first branch takes an object of type `TrafficLight::Red` and returns a static string (`&'static str`). We could write this type out as:

```
TrafficLight::Red -> &'static str
```

So each match branch is really like a function, a closure. "Take the type that matches this pattern, produce this result". Note that all match arms produce a result of the same type, so a `match` expression is a bit like a fan-out that compresses each possible branch into a single value.

So why do I bring this up now? Well, when you're using an open enumeration, like a trait, *you can't possibly know all the types that a value could be*. Behind the scenes, though, there's still a massive match expression.

```
// `Named` trait
match type {
    Person => ...
    Wizard => ...
}
```

So when we implement a trait for yet another type, we're really just adding another branch to the behind-the-scenes match expression. For example:

```Rust
impl Named for TrafficLight {
    fn name(&self) -> String {
        // ...
    }
}
```

The method `name` is just a function of type `TrafficLight -> String`. Note the parallels here!

Under closed enumeration, we declare all the potential types (i.e. variants) up-front, and then match on these variants to extract common structure/behavior:

```rust
// infinite number of behaviors
behavior = match Closed {
    // finite number of variants
    Variant -> Dispatch,
    Variant -> Dispatch,
}
```

But under an open enumeration, there are possibly an infinite number of variants! So we declare all possible behaviors up front:

```rust
// infinite number of variants
trait Open {
    // finite number of behaviors
    fn behavior() -> Dispatch;
}
```

Whenever we want to add a `Variant` to `Open`, we have to provide a match arm for each 'behind-the-scenes' `behavior` match expression:

```Rust
impl Open for Variant {
    // This is just a match arm!
    fn behavior() -> Dispatch { 
        // ...
    }
}
```

So for each `behavior` in the `Open` enumeration, we provide a match arm: `Variant -> Dispatch`.

The compiler stitches all these disparate match arms together to form these behind the scene match expressions:

```rust
// finite number of behaviors
behavior = match Open {
    // infinite number of variants
    impl Open for Variant,
    impl Open for Variant,
    // ...
}
```

Each implementation is like an opaque match arm.

To summarize:

1. Under closed enumerations, we have a finite number of variant branches; we must handle each branch while being able to implement arbitrarily many behaviors.

2. Under open enumerations, we have an infinite number of possible variant branches; to add a new variant, we must provide the 'match-arms' for a finite number of behaviors.

Now because open enumerations are defined around a finite set of behaviors, it makes sense that each variant *must* provide a function.

It is simply not possible to have both an infinite number of behaviors and an infinite number of variants. You can pick one or the other, and the structure of the resulting code will be affected by that decision.

I just love this parallel, and think that it drastically simplified my mental model of traits vs enums. 

Traits as implicit conversion is essentially makes types open enumerations over the behavior of their constructor function. This model is really elegant because it reifies types and traits (we're not 'adding an extra layer' to the language), but on the other hand it does complicate things somewhat.

I think this is honestly the pain of being a language designer. You get a *feeling* that there are these fundamental underlying constructs that underpin the way the world works. You spend a lot of time refining these feelings—writing them down, building prototypes—only to realize that everything old is new again, or that there are new cases you haven't thought about that don't neatly fit your model.

I wish there was just *a* language, a silver bullet, where these sorts of tradeoffs didn't exist. A language where there was one single *obvious* way to implement something. A language where all semantic symmetries were wrapped up in symmetrical syntax, all constructs discovered through intuitive exploration and composition.

I know that this youthful idealism is unwarranted. The rubber has to hit the road somewhere, tradeoffs will always exist, and software is never developed alone. We need a Go of functional programming, whatever what that ends up looking like: a smaller Rust, a minimal Agda, a typed Scheme. 

I can't claim that Passerine will be that language. I've worked hard to engineer a minimal set of orthogonal features that *compose*. Once I've figured out how to unify effects and fibers (it's mostly a matter of notation at this point), and have more cleanly delineated the line between the macro system and the type system, I think I may have an unstoppable seed of a language on my hands.

 We'll see where it goes from here \:)