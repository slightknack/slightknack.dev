+++
title = "Shifting your Rust Mentality"
date = 2022-07-21

[extra]
artbit = "3_plate.png"
+++

What really helped me begin to *grok* how Rust really worked was working towards building an understanding of how its *compiler* works.

<!-- more -->

## Sensible Restrictions

Rust, at it's core, is a programming language of restrictions, yet these restrictions exist for good reason. I think a lot of people—even those fairly experienced with Rust—encounter a restriction in the language and try to do the easiest thing to work around it, without really understanding the why the restriction is in place in the first place. (I'm no exception to this rule.) It's a bit of a Chesterson's-Fence-style dilemma.

Operating from the perspective of needless restrictions, Rust's restrictions act as things to memorize: don't make that mutable here, box that async future there, and so on and so forth. If you take a step back, however, and look at questions surrounding the core principles of Rust—e.g. *'what would take to implement borrow checking?'* or *'why does Rust's async implementation require boxing so often?'*—you'll soon find that a lot of these restrictions are a natural consequences of the design of the language and its compiler. I'll give two examples of models underlying restrictions: *Aliasable xor Mutable data* (AxM) when borrow-checking, and *boxing Futures* in asynchronous contexts. I won't be able to explain these models fully, but as many other guides to these princples exist elsewhere online, I'll go over them briefly:

## Aliasable xor Mutable

All data in Rust is either Aliasable xor Mutable (AxM), meaning the data has many shared references or one mutable reference. At the end of the day, all data in Rust has exactly one owner, and it's up to Rust's borrow-checker to enforce that this is indeed the case. Since all data has only a single owner, Rust is only really good at modeling inductive datatypes, i.e. objects that own all their children, e.g. trees. This is why things like graphs are so hard to express in Rust: to realize a graph at the object level, you'd have to have nodes with multiple owners. 

Representing an object with cycles violates the underlying principle upon which Rust is able to guarantee memory safety at compile time, which is why, in the case of cyclic datastructures, borrow-checking must be deferred to runtime, either through the use of interior mutability (i.e. dynamically checking AxM rules), arenas (another level of indirection, each object only has a single owner, the arena), unsafe (AxM correctness is deferred to the programmer), etc. Lifetimes and borrow-checking are hard, but as long as you stick to inductive datatypes, the compiler will never get in your way.

## Boxing and Async

Rust's async story is similar. When you `.await` a future, you're essentially taking a snapshot of all temporaries (think local variables) required to finish executing the current task. Rust creates an invisible struct to store these temporary values before yielding to the executor. Because Rust is performance oriented, the exact size of these invisible structs must be known at compile-time. As different futures may have different-sized 'invisible structs', futures don't have a known size at compile-time, and—most of the time—must be boxed when being returned from a function. 

The unknown size of futures is also why you can't use recursion inside an async function without boxing. Because each recursive call grows the size of the stack, and the number of recursive calls is unknown at compile-time, it is not possible to know the size of the future at compile-time. For this reason, it is required that you box the return value when recursing in an async function, such that, from the perspective of the compiler, recursion requires a constant amount of overhead. Async/Await isn't actually that hard if you box everything (just look at JavaScript): Rust really wants to give low-level control to the end-user, providing general APIs that let you write custom executors that allow you to control how every single line of code in your codebase is fetched and executed. This unyielding requirement for a leaky abstraction is why there appear to be so many annoying restrictions around dealing with futures in Rust.

## Takeaway

Of course, these examples are just simplifications of the underlying model. What's important is to develop this underlying model such that when you get an error you're not expecting, you can revise that mental model, rather than special-casing it and tucking it away in some corner of your mind. Developing these models takes time, but Rust isn't going anywhere: AxM is true today, and it'll be true 10 years from now. To design things well in Rust is to embrace the restrictions, instead of fighting them. 

I could wax poetic and pine about the pains of leaky abstraction, but I think Rust does an exceptional job at the abstractions it provides, compared to most other languages out there. Rust's abstractions aim to be zero-cost—Rust pulls no punches trying to hide how things work under the hood—if it didn't, it wouldn't be as fast as it is.

So instead of waxing poetic, I'll share that I've found that Rust shines when performing a series of transformations on inductive data; if you design applications holistically to be cognizant of that fact, you'll be a lot less likely to end up being boxed into some corner you don't know how to get out of.