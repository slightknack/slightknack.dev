+++
title = "An honest attempt at explaining Vaporization"
date = 2022-05-12
draft = true

[extra]
artbit = "3_cd_big.png"
+++

The astute among you will be aware that I'm working on [Passerine](https://www.passerine.io/), a little programming language of sorts. I've written enough about it [pretty](https://github.com/vrtbl/passerine#an-overview) [much](https://codex.passerine.io) [everywhere](https://slightknack.dev/passerine/) [else](https://slightknack.dev/passerine/all-you-need/), so if you need a quick refresher, click the... clickable things.

With context hopefully established, it's important to point out that the *even more* astute among us may be aware of the fact that Passerine is designed to work without a Garbage Collector, Reference Counter, or Borrow Checker, instead managing memory through the use of... slightly more devious means. 

This devious technique is something I call **Vaporization**, which I maintain is most certainly **not** vaporware. (An unfortunate choice of name, I know, but at least for now I can claim meta-ironic immunity.) You may have read what I'd consider to be the (eternally incomplete) prequel to this post, [Vaporization and Modern Memory Management](https://slightknack.dev/passerine/vaporization/). In this prequel I set out to contextualize and explain basically every other form of memory management ever imagined, from `malloc`/`free` to garbage collection, compile-time garbage collection to reference counting, reference counting to reuse analysis, borrow checking, and so on. As you can imagine this post quickly grew out of scope exponentially quickly, so remains less of a comprehensive guide to memory management and more of an outline of `TODO`s...

But today we are focused! In this post I set up to explain Vaporization from first principles, drawing in only the required prerequisite knowledge and linking to the rest. I hope to show you how this hybrid compile-time runtime approach to memory management ensures memory liveness while preventing leaks and use-after-frees.

So, what is Vaporization? Let's write out a full definition:

> Vaporization is an automatic memory management technique for inductive data types that ensures that data is live only when it is reachable from the stack. Furthermore, Vaporization minimizes unnecessary copying and reuses existing data where possible. To do so, Vaporization only requires a single compile-time pass and minimal runtime support.

I hope this definition highlights the structure I hope to follow in this post. First we'll discuss what it means for data to be live, then we'll cover the optimizations and subsequent limitations of Vaporization, and finally I'll describe how Vaporization could be added to an existing compiler.

# When is data live?
As programmers, we use data (doh). Data eventually boils down to platform-dependent zeros and ones, but for now we'll work with a simplified model.

In a program, data largely exists in two places, **the stack and the heap**:

- The **stack** is where temporary data (such as local variables or intermediate steps in computation) pertaining to the current function is stored, and only exists as long as that function is doing work. 
- The **heap**, on the other hand, is where longer-lived data that is not tied to any one set function is stored. In most programming languages, the heap is allowed to hold arbitrary directed graphs of data structures, which can make determining whether one datastructure can be reached by following the references of another quite hard.

Data in the stack is fairly neatly ordered, because we know how long it'll be around: until the function returns (or a little longer that that if it is the value returned). The heap on the other hand is a complete and total mess. It is such a mess that most programming languages regularly scan huge swaths of the heap to figure out what the heck is even going on (that's what a garbage collector does).

The stack is the beating heart of our program, and **data on the stack is always alive**. Data on the heap, however, is **only alive** if it is reachable from the stack, meaning that we can **follow a path of references** from the stack, through various data on the heap, **to the data** in question. Data that is not reachable from the stack will never be accessible again, because there's **no way** for the currently running program to create a reference to the lost data out of thin air.

So this is exactly how garbage collectors work: they start at all data on the stack (the roots), and trace out paths through the heap, marking whatever data they encounter along the way. Any data on the heap that is not marked is no longer reachable from the stack, and thus can be safely deleted.

We'll, what are some other techniques for determining when on the heap data is detached from the beating heart of the program? We may keep track of the number of inbound references to some data on the heap, incrementally adjusting this count as other objects are created and destroyed. When this count drops from one to zero, we can just clean up the now-dead data then and there. This technique is, of course, reference counting. It has some pitfalls (namely can not deal with cyclical references on its own), but is another common example of memory management.

Now it should be apparent that a number of tradeoffs exist: garbage collection, while sensible, seems wasteful (scanning entire portions of the heap); reference counting, while minimal, adds some overhead to every little operation: a death by a thousand cuts, if you will.

We can attempt to impose some order on the constant chaos of the heap, though. Depending on the limitations we choose when modeling data, how much analysis we do at compile time, and what additional information we choose to keep track of at runtime, we can drastically improve the performance of garbage collection, reference counting, or any other algorithm we may choose.

# Limits set you free
Vaporization imposes a few limits on the types of data it can work with, the largest of which is that all data must be **inductive**. You can think of inductive data as anything that can be trivially serialized to JSON: a tree-like structure with absolutely zero cycles. This limitation may seem a bit arbitrary, but is not a big an issue in practice for two reasons:

1. **Most common data access patterns** can be modeled inductively and **do not require cycles**. Algorithms that do require cycles can be modeled through another layer of indirection.
2. Cycles can only be created in a language where references held inside mutable data structures can modified. **We can design languages** in such a manner that **creating cycles** is unidiomatic (e.g. functional programming) and strictly **not a possibility**. 

As we dive into how Vaporization works in a bit more detail, it should become clear why this requirement is necessary. 

<div class="boxed">

**Appeasing Rust's borrow checker:** Surprisingly, the requirement of inductive data is essentially the extent of what Rust's borrow checker is able to automatically infer without explicit lifetime annotations. As any experienced Rustacean will tell you, trying to model cycles in Rust without the appropriate preparation is disaster waiting to happen.

</div>

Passerine does allow mutability in limited contexts (as certain algorithms are easier to express with limited mutability, as Rust has shown). To prevent the possibility of creating cycles in mutable structures, Passerine has the only additional requirement that captures in closures are immutable, as closures are the only data structure in Passerine where mutable cycles could naturally arise.

# Explaining Vaporization
With the groundwork laid, it's now time to explain how Vaporization works. Vaporization is a hybrid compiletime/runtime technique, so can be broken down into two phases:

1. **Phase I** is a single pass late in the compilation pipeline, after all variables have been resolved. During this pass the compiler **annotates the last use** of every variable in each scope.
2. **Phase II** occurs during runtime. It records whether each reference is currently **shared immutable** or **owned mutable**. In practice this is done through single-bit pointer tagging at runtime, based on the **last uses** determined at compile time.

Phase I is the simpler of the two, so we'll discuss it first.

> TODO: Explain Phase I and Phase II.

## Phase I: Last use analysis
During the compile-time phase, we determine the last time a variable is used in every scope. This may seem a bit abstract right now, so let's get concrete with a few examples.

> I'll be using `x'` to denote the last use of `x` in the following examples.

Here's the simplest case, where we only use a variable once:

```
x = "Hello"
x'
```

The `x` on the second line is the last and only use of `x`, simple enough. If we reference x twice, say like this:

```
x = "Hello"
x + x'
```

Only the last `x` is marked as last use. Getting a bit more complicated, look at the following case:

```
x = "Hello"
x = x + x'
x'
```

Wait, why are there two `x'`? Whenever we rebind a variable, the new value is different from the old. Therefore there can be multiple last uses of a variable, but only one last use of any given value.

This pass is pretty simple and can be completed by walking the AST *backwards* and marking the 'first' use of each unique variable encountered, 'forgetting' variables when we redeclare them. Let's look at a more complex example, here's fibonacci:

```
fib = n -> if (n < 2) {
    n'
} else {
    fib (n - 1) + fib (n' - 2)
}
```

In this case we process each branch of the `if` statement independently; similar things have to be done for other control-flow constructs. For example, to ensure that `for` loops don't reuse a last-use value in the next iteration of the loop, you have to repeat the body twice to account for any variables that may be used across iterations:

Consider this example with no annotations:

```
x = 7
w = 0
for i in 0..100 {
    w = x + i + w
}
```

Let's repeat the body of the loop twice and perform last-use analysis:

```
i = ?
w = x + i' + w'

i = ?
w = x' + i' + w'
```

We use the first repetition of this loop body:

```
x = 7
w = 0
for i in 0..100 {
    w = x + i' + w'
}
```

Note that because x is reused in each iteration of the loop, we can not mark it as last-use.

> I guess it might be possible to generate a special case for the last iteration of the loop. I'm working on a version of last-use analysis that supports arbitrary control flow in closures that do not escape the local scope, e.g. any form of local branching control flow, like `if`s and `loop`s. This should allow for koka-style local lexical scope mutability, even when closures are restricted to immutable nonlocal captures. It should be general to catch the special case after desugaring a for loop macro to a tail recursive function.

The last time a variable value is used, we know that that value won't be used again. Because of this, any subsequent operations performed on that value can update the value in place instead of making a copy first.

## Phase II: One-bit pointer tagging

## Intuition as to how Vaporization works

# Conclusion