+++
title = "Algebraic Effects in Passerine"
date = 2022-02-12
draft = true
+++



The popular Multicore fork of OCaml was upstreamed into the main compiler with the release of OCaml 5.0 a few weeks ago.

# Part I: Who owns the stack?

- Nystrom

## An iteration example

Set up conflict

## Multiple stacks, multiple owners

- Fibers, etc.

## Swapping between External and Internal iterators

- More Nystrom

# Part II: Concurrency with Continuations

- How to make new stacks?

## Full

- Copy the stack
- Wasteful

## Delimited

- Copy parts of the stack.
- Coroutines as single-shot delimited continuations

## The trouble with full continuations

- Wasteful, hard to reason about.

# Part III: Modeling side effects

- Let's take a break for now

## As functions?

## As fallible functions?

## As callbacks?

- Wait, don't we just want concurrency?

## Modeling side effects concurrently

## The context of computations

# Part IV: Unifying Concurrency with Algebraic Effects

## Raising Effects

## Handling Effects

## Resuming Effects

## The Type System and Scoping Effects

# Part V: Everything is an effect

## Solving Iterators

- Generating fibonacci numbers
- Prime sieve

## Raising and handling exceptions

- Division by zero

### Resumable exceptions

- Providing default example

## Scheduling cooperative threads

- Port over OCaml Example

## Asynchronous I/O

- Port over Koka example

## Modeling stateful objects

- Erlang

## Distributed recovery from `Fatal`

# Part VI: The problem with names and structure

# Part VII: Moving forward
