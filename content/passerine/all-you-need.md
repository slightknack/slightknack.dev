+++
title = "All You Need are Coroutines and Pattern Matching"
date = 2020-07-10

[extra]
artbit = "4_sunglasses.png"
+++

> ## Note
> This is an old post I wrote a while back. My opinions on the subject have changed slightly but this post has historical merit. The date is not entirely accurate, this article coincides with around the time I started seriously implementing Passerine.

## Abstract
The average programmer just wants to write code [citation needed]. Language designers, on the other hand, want to *write* code, that is, programming languages. Ever since the first lisp interpreter sputtered through it's first s-exp, there's been a quest to build a 'perfect' programming language. The field of language design remains open, at least in the sense that a better language can always be built. **No matter how hard you try, there is no language that won't make you clarify your ideas.**
<!-- more -->
In this work we present a language that can be bootstrapped from coroutines and mono-variadic lambdas, with types defined by structure rather than by name. Additionally, we show how a simple safe-yet-rich macro system can be built to leverage code clarity and convenience.

> This document predates [Passerine](https://github.com/vrtbl/passerine), which is an attempt to build a language based on the concepts discussed in this document.

## What is a Coroutine?
Many may already be familiar with coroutines. In essence, a coroutine is a function call executed in a separate light-weight self-contained process that can pass data back-and-forth with the process that called it.

Although there is much more to be said on this topic, this basic definition is all that's needed to understand the work laid out in this document.

## Pattern Matching
*Pattern Matching* is the action of *matching* a data-structure against a *pattern* to extract specific data. Most of the time, a pattern can be thought of as a mirror version of the data-structure that data is being extracted from. For example, the pattern:

```
(x, y)
```

would successfully match against the data-structure:

```
(1, (2, 3))
```

and produce the bindings:

```
x = 1
y = (2, 3)
```

Additionally, patterns can have *guards* which check that the data extracted from the data is valid. Guards should be read as *where* in most cases; for example, the pattern:

```
x | x > 0
```

Will match any value `x` where `x` is greater than `0`. If a pattern match fails, due to poorly structured data or a failed guard check, an error will be returned.

## A Few More Things
Pattern matching is useless unless the extracted data can be used. A *lambda* matches a pattern and maps the bindings to a new *environment*. This environment is used to run the lambda's *expression* in a new coroutine. A lambda is defined in the following manner:

```
<pattern> -> <expression>
```

and is called with the form:

```
<lambda> <expression>
```

Each lambda takes only one argument, and can yield or return at most one item. Luckily, through the use of algebraic datatypes (*tuples*, etc.) and pattern matching, this is not much of a problem.

Here's an example definition and call:

```
(num -> num + num) 7
```

This function doubles the passed value - the above expression would evaluate to `14`.

By design, lambdas are *anonymous*. To attach a name to a value (as lambdas are values), *assignment* is used. Assignment is similar to a lambda expression, in the sense that it matches a pattern and binds variables. However, rather than creating the bindings in a new environment, the bound values become available in the current scope. Here's an assignment:

```
<pattern> = <expression>
```

Let's create a named lambda, that `decrement`s a number by 1:

```
decrement = x -> x - 1
```

And calling it on `13`:

```
decrement 13
```

Would give us `12`.

If a lambda needs to evaluate some list of operations in sequence, a *block* is used. A block is a list of expressions delimited between curly braces separated by semicolons or newlines. A block may also contain a `return` expression, which stops the current coroutine and immediately returns a value. Otherwise, the value of the last evaluated expression in the block is returned.

Here is a function that models a linear correlation:

```
linear = (m, x, b) -> {    
    proportional = m * x    
    return proportional + b    
    -- alternatively, omit `return`    
    -- as this is the last statement in the block
}
```

In practice, this could be a one-liner; this is a merely a trivial example used to demonstrate the semantics of the construct.

## Conditionals
An if-expression is a feature common in many languages - our language doesn't even have those yet. To get started with conditionals, we'll build simplified version of an if-expression: if a condition is truthy, an expression is evaluated; otherwise, do nothing. Here's a short example:

```
if true {    
    1 + 1
}
```

In this case, `if` would evaluate to `2`. We're going to implement `if` first as a lambda, and then as a *macro*. There is some syntactic sugar at play in the above example, which will become clear shortly. Anyway, the lambda version of `if` will take a tuple of two arguments:

- An expression which might be truthy.
- A lambda that takes no arguments.

We'll call the unsugared lambda definition of `if` '`iffer`'. Here's how iffer would be used. This example has the same semantics as the previous `if` expression.

```
iffer (true, () -> {1 + 1})
```

Before we write the definition of `iffer`, we need to deepen out understanding of how coroutines work in our language.

Let's start by discussing *yielding*. The `yield` expression, when called inside a coroutine, suspends the current coroutine and returns some value. When the suspended coroutine is again, the `yield` function evaluates to those values, and continues running. For example, consider:

```
foo = () -> {    
    print "Start"    
    x = yield "Yielding"    
    print x    
    print "End"
}

x = foo ()
-- prints "Start"
print (x "Resume")
-- prints "Resume"
-- prints "End"
-- prints "Yielding"
```

`"Yielding"` is printed last because `yield "Yielding"` sets the value of the call `(x "Resume")` to `"Yielding"`, which is only printed after the coroutine finishes.

Let's talk and *trying* and *erring*. `try` will evaluate a coroutine; if the coroutine fails, try will return the error as a value. If the coroutine succeeds its value will be returned as normal. With this in mind, here is a naive implementation of `iffer`:

```
iffer = (condition, then) -> {    
    do_or_fail = c | c is not false -> then ()    
    try (do_or_fail condition)    
    return ()
}
```

Here's the break-down. As mentioned before, `iffer` is a function that takes two arguments. `do_or_fail` will only execute `then` if `c` is not falsy, because trying to evaluate `do_or_fail` where `c` is false will throw an error, which is caught by `try`. Finally, we return an empty tuple (aka *unit*), indicating that the function doesn't produce a value.

Great! Now that we have the definition for `iffer`, let's write the macro `if`. `if` transforms an `if` expression into an `iffer` function call:

```
if = cond do ~> iffer (cond, () -> do)
```

Macros are made using a squiggly-arrow, `~>`. The arguments aren't a pattern, they actually follow a small expressive templating language, which we'll delve into deeper later. Anyway, the only thing we really do in this macro is hide the fact that the body after the if is actually a nullary function.

For now, let's see this `if` in action:

```
coroutines = "cool"

if (coroutines == "cool") {    
    print "Heck yeah!"
}
```

Obviously, `"Heck yeah!"` would be printed in this case.

## Loops and Generators

> To do.

```

```

## Building a Match Statement
In many languages, such thing as a match statement exists.This statement matches a value against a variety of patterns, and returns the value fo the first one it matches.

This might look something like:

```
match x {    
    true  -> 1    
    false -> 0
}
```

We're going to implement match first as a function, and then as a macro. the function will take a tuple of two arguments:

- the value we want to match
- and a list of lambdas that can be matched against

So, the above will be written as:

```
matcher (x, [true -> 1, false -> 0])
```

We're using the name `matcher` for this function to avoid confusion with the match macro we'll implement later on. Here's how we might start a naive definition for matcher:

```
matcher = (value, mappings) -> {    
    for value in mappings {        
        result = try (mappings value)        
        if result is not Error {            
            return result        
        }   
    }    
    error "Nothing was matched!"
}
```

> To-do: Summary and closing thoughts
