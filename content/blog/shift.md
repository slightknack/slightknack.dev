+++
title = "Building a Rust Mentality"
date = 2022-07-21

[extra]
artbit = "3_plate.png"
+++

What really helped me begin to *grok* how Rust really worked was working towards building an understanding of how its *compiler* works.

<!-- more -->

# Sensible Restrictions

Rust, at it's core, is a programming language of *restrictions*. These restrictions exist for good reason. Upon encountering a restriction, however, it's common to attempt to find the easiest work-around, rather than understanding the *why* the restriction exists in the first place.

Operating from the perspective of needless restrictions, Rust's limitations become as annoyances to memorize: don't make that mutable here, box that async future there, make sure that trait is sized, *etc.*. If you take a step back, however, and look at questions surrounding the core principles of Rust—e.g. *'what would take to implement borrow checking?'* or *'why does Rust's async implementation require boxing so often?'*—you'll soon find that a lot of these restrictions are a natural consequences of the design of the language and its compiler. I'll give two examples of models underlying restrictions: *Aliasable xor Mutable data* (AxM) when borrow-checking, and *boxing Futures* in asynchronous contexts. I won't be able to explain these models fully—many other guides to these princples exist elsewhere online—so here's a brief summary:

# Aliasable xor Mutable

All data in Rust is has a single *owner*. Temporary references to that data may be *borrowed* from this owner; these references must be either Aliasable xor Mutable (AxM), meaning that, at any one point in the program, there exist either many *shared* references to some data or one *mutable* reference. At the end of the day, it's up to Rust's borrow-checker to enforce that this is indeed the case. Since all data has only a single owner, *Rust is really good at modeling inductive datatypes*, i.e. objects that own all their children, e.g. trees. This is why cyclic objects—like graphs—are so hard to express in Rust: to realize a graph at the object level, you'd have to have nodes with multiple owners.

An object with multiple owners *violates the underlying principle* upon which Rust is able to *guarantee memory safety* at compile time. This is why, in the case of cyclic datastructures, *borrow-checking must be deferred to runtime*, either through the use of Interior Mutability (i.e. dynamically checking AxM rules), Arenas (another level of indirection, each object only has a single owner, the arena), `unsafe` (AxM correctness is deferred to the programmer), etc. *Lifetimes and borrow-checking are hard, but by building a mental model of how the compiler works, it'll be easier to write code that sticks to the compiler's strengths, saving you a world of work trying to track down spurious lifetime errors.*

# Boxing and Async

Rust's *async* story is similar. When you `.await` a *future*, you're essentially *taking a snapshot of all temporaries* (think local variables) required to finish executing the current task. Rust creates an invisible struct to store these temporary values before yielding to the executor. Because Rust is performance oriented, the exact size of these invisible structs must be known at compile-time. As different futures may have different-sized 'invisible structs,' in the general case, *futures don't have a known size at compile-time*, and must be boxed when being returned from a function. 

The unknown size of futures is also why you *can't use recursion inside an async function without boxing*. Because each recursive call grows the size of the stack, and the number of recursive calls is unknown at compile-time, it is not possible to know the size of the future at compile-time. For this reason, it is required that you box the return value when recursing in an async function, such that, from the perspective of the compiler, recursive functions *return values of the same size*. Async/Await isn't actually that hard if you box everything (just look at JavaScript): Rust really wants to give low-level control to the end-user, providing general APIs that let you write custom executors that allow you to control how every single line of code in your codebase is fetched and executed. *This unyielding requirement for a leaky-but-necessary abstraction is why there appear to be so many annoying restrictions around dealing with futures in Rust.*

# Takeaway

Of course, these examples are just simplifications of the underlying model. What's most important is *expanding your underlying model when encountering novel errors*. Ehen you get an error you're not expecting, revise your mental model, rather than special-casing the error and tucking it away in some corner of your mind. *Developing these models takes time*, but Rust isn't going anywhere: AxM is true today, and it'll be true 10 years from now. To design things well in Rust is to embrace the restrictions, instead of fighting them. 

So what does it mean to design with Rust's strengths in mind? Like most languages in the ML family, *Rust shines when performing a series of transformations on inductively-defined datatypes*. For this reason, if you cognizantly design applications *holistically* using a functional-procedural approach, the design patterns of the language will lend themselves more naturally to the task at hand. Designing applications patterned after Rust's strengths is probably a topic worthy of a book, or at least another blog post.

At this point I could wax poetic and pine about the pain of the inevatability leaky abstraction. On the contrary, I think Rust does an exceptional job with respect to the quality of the abstractions it provides. Although not airtight, Rust's abstractions aim to be zero-cost. Rust pulls no punches trying to hide how things work under the hood. *If it did, it wouldn't be Rust*.