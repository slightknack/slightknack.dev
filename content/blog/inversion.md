+++
title = "Inversions of Control"
date = 2025-08-29
draft = false

[extra]
artbit = "1_pretzel.png"
+++

What's the difference between a library and a framework? It depends on your definitions. Here are mine:

- When using a library, **you are in control**: a library provides a collection of behaviors you can choose to call.

- When using a framework, **the framework is in control**: a framework chooses to call a collection of behaviors you provide.

As a programmer, I prefer using libraries. It is nice to be in control, when the code you're writing reads straightforwardly. On the other hand, as a library author, figuring out *how* to package a dependency as a library instead of as a framework can be challenging.

In this post, I want to show (1) how the relationship between frameworks and libraries has to do with **inversions of control** and (2) how languages can make inversions of control _easy_, so that authors can write frameworks, which developers can use as libraries.

# A classic problem

I'm working on a programming language called Affetto. It's goal is to be "a smaller Rust". The yet-unreleased compiler has Wasm-Component and C99-header-file backends. Affetto is a language for writing core libraries that can be embedded in other languages. Superficially, Affetto looks a little like Gleam. That shouldn't really matter for the following examples, because I tried to stick to a simple syntax. I'm also not going to say anything about borrowing. I'll write more about Affetto some other now, for the time being, consider this a small taste.

Let's say you're writing a library that can do run-length encoding and decoding over streams of data. If you're in control, writing a run-length encoder is fairly easy. Let's say we are provided two callbacks, `recv` and `send`, that receive a byte and send a byte, respectively. Here's how we could write an encoder:

```scala
fun encode(
  recv: () -> N8,
  send: N8 -> (),
) {
  mut last = recv()
  mut count = 1
  loop {
    next = recv()
    if next != last or count == 0xFF {
      send(last)
      send(count)
      set last = next
      set count = 1
    } else {
      count += 1
    }
  }
}
```

Some affetto-specific notes: `N8` is an 8-bit natural, or a byte. `()` is the unit type, as in Rust. (like `void` in C, or an empty tuple in Python).

This is fairly straightforward: we read bytes one at a time, we keep track of runs, we send two bytes for each run. (The byte and how many times it's repeated).

The decoder, if anything, is even simpler:

```scala
fun decode(
  recv: () -> N8,
  send: N8 -> (),
) {
  loop {
    byte = recv()
    repeat = recv()
    for _ in 0..repeat {
      send(byte)
    }
  }
}
```

The above is our framework for run-length encoding.

Now, the natural question becomes, let's say I have some fountain-like source of bytes I'd like to encode, then decode, using the above framework. How would I go about doing it?

```scala
fun main() {
  source = // ...
  sink = fun(byte) -> debug(byte)

  // then, um, huh?
  encode(source, todo)
  decode(todo, sink)
}
```

Obviously we'd need some sort of channel connecting `encode` and `decode`? And maybe threads, so the functions could run concurrently? Does affetto have coroutines, or async await? (Getting warmer.) What is to be done?

# Invert for a solution

Well, first, let's try writing `decode` as a callback. It will have to close over some state, I suppose. Let's call this function `decode_inverse`. `decode_inverse` will be called whenever `encode` calls `send`. This way the functions run in lock-step.

To create `decode_inverse`, First, we split `decode` at the matching calls to `recv`:

```scala
// --- snip! state = 0
byte = recv()
// --- snip! state = 1
repeat = recv()
for _ in 0..repeat {
  send(byte)
}
// --- snip!
```

We can lift this into a little state machine of sorts:

```scala
// state machine
b = recv()
match state {
  0 -> {
    set byte = b
    set state = 1
  }
  1 -> {
    set repeat = b
    for _ in 0 .. repeat {
      send(byte)
    }
    set state = 0
  }
}
```

And then wrap this up as a closure:

```scala
fun decode_inverse(
  send: N8 -> (),
) {
  mut state = 0
  mut byte = 0 // initial undefined value
  mut repeat = 0 // ''

  // implement send
  return fun(b) {
    // state machine
    match state {
      0 -> {
        set byte = b
        set state = 1
      }
      1 -> {
        set repeat = b
        for _ in 0..repeat {
          send(byte)
        }
        set state = 0
      }
    }
  }
}
```

I call this transformation **an inversion of control**. I find inversions of control to be a fundamental aspect of library design. They show up all the time, in all sorts of systems. Not always as closures: a natural next step is to convert `decode_inverse` into an object of some sort (struct + function). Sometimes libraries do this from the start. Closures are a poor man's object, we'll stick to closures for the time being.

This is a lot more complicated than the original code! And it closes over non-trivial state! This function, though, becomes something of a library. We can actually use it with `encode`, because it puts us in control. Here's what that looks like:

```scala
fun main() {
  // same setup
  source = // ...
  sink = fun(byte) -> debug(byte)

  encode(
    source,
    decode_inverse(sink),
  )
}
```

Not super pretty, as `decode_inverse` is a closure passed as a callback, but it works. `encode` is in control, and drives `decode_inverse`. What about the other way around?

We could imagine applying a similar process to `encode` to create `encode_inverse`. We do this by splitting the function into a state machine at `send`. The resulting closure, `encode_inverse`, can be driven by `decode`:

```scala
decode(
  encode_inverse(source),
  sink,
)
```

Which can also be written without nesting:

```scala
encoded = encode_inverse(source),
decode(encoded, sink)
```

And this code is still streaming the bytes as it encodes and decodes! `encode` is a callback we can stream. We are not loading all the bytes into memory, which is great.

This "convert to state machine" transform seems pretty straightforward. Can we do it automatically? Before I answer that question, let's explore one more aspect.

# Higher-order inversion

Let's say we have `encode_inverse` and `decode_inverse`. We want to wire them up to one another, as above. But in this case, it's not exactly clear *who* is driving *who*.

```scala
fun main() {
  source = // ...
  sink = fun(byte) -> debug(byte)

  encoder = encode_inverse(source)
  decoder = decode_inverse(sink)
  // then, um, huh?
}
```

Well, what are the types of `encoder` and `decoder`?

- `encoder` behaves as `recv`, so it's `() -> N8`.
- `decoder` behaves as `send`, so it's `N8 -> ()`.

It seems like these types are compatible. We can drive this system with a loop:


```scala
// ...
loop {
  decoder(encoder())
}
```

If we wanted, we could lift this out as a higher-order function:

```scala
fun pipe(
  recv: () -> N8,
  send: N8 -> (),
) {
  loop {
    send(recv())
  }
}
```

And we could replace our loop in main with:

```scala
pipe(encoder, decoder)
```

# Multiple inversions

We've been cheating a little. We've been assuming that we only care inverting a function along the axis of `send` or `recv`. What if we want a function that's inverted for *both* send and receive? Let's start once again with `decode`. We'll write a function called `decode_actor`. It's been a while, so here's the code:

```scala
fun decode(
  recv: () -> N8,
  send: N8 -> (),
) {
  loop {
    byte = recv()
    repeat = recv()
    for _ in 0..repeat {
      send(byte)
    }
  }
}
```

As before, we need to slice this into a state machine, but at both `recv` points and `send` points:

```scala
// --- snip! state = 0
byte = recv()
// --- snip! state = 1
repeat = recv()
for _ in 0..repeat {
  // --- snip! state = 2
  send(byte)
}
// --- snip! state = 0
```

We have a for loop here, which for reasons that will become clear later, we will also need to handle. Let's "desugar" the for loop:

```scala
// --- snip! state = 0
byte = recv()
// --- snip! state = 1
repeat = recv()
mut i = 0
// --- snip! state = 2
send(byte)
set i += 1
if i < repeat {
  // state = 2
}
// --- snip! state = 0
```

We can now lift this into a state machine:

```scala
// --- snip! state = 0
0 -> {
  set byte = recv()
  set state = 1
}
1 -> {
  set repeat = recv()
  set i = 0
  set state = 2
}
2 -> {
  send(byte)
  set i += 1
  if i < repeat {
    set state = 2
  } else {
    set state = 0
  }
}
```

Now, here's a conundrum: Our state machine calls `recv` (`R`) and `send` (`S`) in a specific order. The order of calls looks like this:

```
R R S... R R S... R R S...
```

This ordering requires that our code call the state machine with `R` and `S` in the right order! Unlike the case where there was only one callback we were lifting, we're now faced with a choice to make. How do we represent an object, with some state, with different ways to call it depending on the state it's in?

If we push this deeper, we stumble upon some beautiful symmetries: actors are a generalization of closures, the purpose of protocols ([as in clojure](https://clojure.org/reference/protocols)), [type-state programming](https://cliffle.com/blog/rust-typestate/), the sequencing of algebraic effects, and so on.

I hate to end on a cliff-hanger, but I would like to get this piece published, as it's been sitting on my disk for about a month. In the next post, we will relate inversions of control to Algebraic Effects in Affetto. Stay tuned!
