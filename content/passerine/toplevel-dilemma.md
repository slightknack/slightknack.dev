+++
title = "The Top-Level Dilemma"
date = 2021-10-11
draft = true
+++

# What is a top level definiton

# What is the top level?

Executable code can only be contained within certain structures

- First in C
    - Functions in functions is frowned upon
- Entry point is usually function named `main`
- Carried on in other languages, Java (OO), Rust, etc.

- The base scope is already executable
- Predates top-level
- Lisp, Haskell, Python (OO), JS, etc.

Why top level is usually different:

- Hoisting and mutually recursive definitions
- Only definitions allowed, no code is executed to build definitions
- Better for static analysis at compile time, usually coincides with strongly-typed languages

- Dynamic scope is more uniform, more elegant
- A bit harder because now the base case has to be handled
- Solution to hoisting is usually late-bound global variables
- Code can have side effects, mixed with definitions
- Harder to statically analyze

# The base case is hard

## Hoisting
- late bound globals are bad, may error at runtime
- how to have globals bound at compile time, while still allowing for hoisting and mutually recursive definitions?

## Modules
- Top-level is usually a module, to be imported to other modules
- How to expose definitions? Code has to be run to extract definitions

## Effects
- Unlike code with a definition-based top-level, it's like putting everything in the main function
- Running a module may have side effects; how to handle these when it's not the main module?
- Python has name = main, seems a bit hacky
- Algebraic effects so suppress side effects when modules are loaded?
    - Difference between a script and a library
    - 'Everything is a library' under C, etc.

# The Dilemma
How to make the base case the same as the local case, while still preserving base case conveniences?

- Hoisting for mutually-recursive definitions
- Making modules and structs a part of the language
- Maintaining good conventions when writing code
