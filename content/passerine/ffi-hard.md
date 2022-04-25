+++
title = "FFIs [Were] Hard"
date = 2020-12-12

[extra]
artbit = "3_bidirectional.png"
+++

> ## Note
> This post was written early on in Passerine's development, before we had an FFI to interact with Rust. The FFI is still not fully finalized; most notably, as of writing this header, we need to still implement serde-style macros to easily interface with Rust datatypes, implement a module system to allow for external modules, and (eventually) allow for FFI interaction w/ Wasm modules for cross-platform FFI support.
>
> It's possible to add two numbers in Passerine now, don't worry ;D

## Or, why you can't even add two numbers in Passerine yet.

I figure someone will ask this question eventually, so I'm writing this response now. Foreign Functional Interfaces are hard. Not conceptually speaking — I could probably crank (an admittedly bad one) out in an afternoon — but in terms of designing a solution with an active admonition of traits Passerine strives to embody.

Above all else, Passerine strives to be a *concise* language, in terms of design and implementation. What does this mean? I mean concision on two fronts:

- The language and it's implementation should be simple. You should be able to keep the entire system in your head, and understand how everything fits together.

- The language and it's implementation should be combinatorical. Although the language should be simple, it should feel as friction-less as possible. The answer to "Wait, can A and B work together like this?" should always be "Woah, I wasn't expecting that to work, but it makes so much sense"

These goals are slightly conflicting. To build a system where everything composes together perfectly requires Good Architecture™ to be in place. Essentially, `MxN` problems need to be reduced to `Mx1, 1xN` problems wherever possible.

So right, back to Passerine. Why can't you add you numbers yet?

Adding, like any other operation, is a function. There's nothing too special about adding when compared to subtraction, multiplication, etc. – two operands in, one value out.

What's my point? To simplify Passerine on the two fronts mentioned above, I'm opting to build an extensible FFI system into Passerine, through which I'll implement performance critical parts of the standard library as well as common operations on data. Instead of defining an add operator in the language itself (which dispatches on type to perform the correct operation) Passerine will simply use FFI bindings to do this.

It's critical that this FFI be fast, which is why it'll bind to Rust, and be compiled against the language core. In the future, I hope that something like this is possible:

```rust
// /ffi/thing.rs
use passerine::{self, Data, Runtime};

#[passerine::bind]
fn some_ffi_fn(data: Data) -> Result<Data, Runtime> {
    // ...
}
```

```elm
-- /src/main.pn
use extern thing.some_ffi_fn

print some_ffi_fn ("Hello, World", 27.5)
```

This is great because it allows for two things:

1. New operations can be quickly added to passerine. It'll be literally updating the lexer and parser, then writing a few lines of Rust
2. This FFI will allows users to define their *own* Rust functions that can be called from Passerine allowing for easier integration with existing Rust libraries.

Of course, before this is possible, a few things need to be done:

- I need to flesh out pattern matching and the type system. This is what I'm working on now.
- I need to start working on fibers, and concurrency in Passerine's primary runtime environment, Aspen
- I need to implement a module system, so using scoped FFI functions feels like using yet another Passerine module

Of course, there are a few quality-of-life things I need to organize before I get started with this:

- People have shown interest in trying out, developing, and contributing to Passerine. Up until this point, it's been a one-man team, so I need to figure out how to more actively engage the comminity towards building something rather than just asking for feedback from time to time.
- There is little tooling for Passerine. I've tossed together a bare-bones syntax highlighter I'm too embarassed to publish, but I hope to polish it up and get it out the door soon.
- Although I've had a lot of free time due to COVID-19 (the largest driver of Passerine's development by far, ironically), I still have to attend classes, do homework, and fulfill other commitments I've made.

I appreciate the interest. As always, if you have any questions, comments, or suggestions, you know where to find me!

Have a nice one y'all,  
Isaac Clayton
