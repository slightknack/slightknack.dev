+++
title = "Macros, Types, and Next Steps"
date = 2021-06-01

[extra]
artbit = "4_shoe.png"
+++

Passerine is at an interesting point: we've established a few language features, and built this easily extensible functional core on which to base the rest of the language. We currently have two implementations of the language, one written in Rust, the other in D, and it's imperative we set the course of the language before divergence occurs.
<!-- more -->
# Revisiting Macros

Currently, macros take the form:

```
syntax <argpat> { <body> }
```

Form-based macros are very fun, as it's easy to quickly prototype new language features. There are a few rough points though:

1. Macros are strictly form-based, and can't access Passerine's richer syntax.
2. Compile-time expansion of macros is fairly limited.

At this point, macros are mostly templates. But the general idea is pretty simple: argument patterns define a finite state machine that extracts AST from forms, and these ASTs are then spliced (hygienically, I might add) into the body to produce a new AST. Here's what that looks like:

```
syntax 'if cond then 'else otherwise {
    ...
}

if (n < 2) {
    print n
} else {
    print "small"
}
```

This is neat and all, but we can't do things like repeating some code a variable number of times at compile time, or matching in forms to leverage existing syntax. To address the two issues I raised earlier, I think it's time to introduce a generalized mechanism through which we can build macros in the future.

But before we do that, a quick reminder. **Macros must respect lexical scope and hygiene**. A macro defined in a function body is only accessible inside that body. It's not possible to return a macro from a function, but it is from a module. We'll discuss this more later.

## Token Based Macros

Token based macros are powerful enough to represent the syntax-based macros we currently have in the language. The core idea is pretty simple: a macro is a function that is run at compile time: it takes a list of tokens, and produces a new list of tokens, which is then compiled.

So, what does that look like? We need a way to embed Passerine's token stream in the language itself: for that, we'll declare a few union types:

```
type Token {
    Iden String,
    Op   String,
    Data Data,
    Group {
        delim: Delim,
        tokens: [Token],
    }
    Sep,
    -- and so on...
}

type Delim {
    Paren,  -- ()
    Curly,  -- {}
    Square, -- []
}

-- etc...
```

> If you're not familiar with union types, we'll discuss them later on in the ADT section.

So, for example, the variable `hello` would be the token `Iden "hello"`. The most important things to note are as follows:

1. Delimiters, such as parenthesis `()`, curly braces `{}`, or square brackets `[]` are defined via the `Group` variant. This means that these tokens must be balanced.

2. Macro transformations occur *before* the AST is constructed. This reduces the complexity implementation-wise, and allows for more flexible macros.

with `Token` in place, let's look at a sample token macro. These macros are denoted with the `macro` keyword, and take the following form:

```
macro <keyword> = <function>
```

What's important to note is that the `<function>` must be of type `[Token] -> comptime [Token]`. `comptime` is an algebraic effect representing a compile-time transformation. We'll get into the meaning of `comptime` more when we discuss algebraic effects later on.

Here's what a token macro looks like:

```
-- import token variants
use Token::*
use Delim::*

macro while = [
    Iden "while",
    ..cond,
    Group {
        delim: Curly,
        tokens: body,
    },
] -> [
    Iden "loop", Op "=",
    Iden "_", Op "->" Iden "if",
    Group { delim: Paren, tokens: cond },
    Group { delim: Curly, tokens: ... }
    -- and so on...
]
```

In this case, we're using pattern matching to match the incoming token stream, then immediately filling in an output token stream. It's important to remember that a macro is just a function, so just about *any* strategy for writing functions can be used for writing macros.

When you think about it though, the above token macro implementing a while loop is a lot more verbose compared to its syntax equivalent:

```
syntax 'while cond body {
    loop = _ -> if cond {
        body
        loop ()
    } else {
        ()
    }
    loop ()
}
```

To improve the quality-of-life of using token macros, we can write a few utilities — which are also token macros — the first of which is `quote`:

```
x = Data (Int 3)
tokens = quote [1, 2, splice x]
```

`quote` takes some passerine code, and expands it into a token stream, splicing in other variables using `splice`. For instance, the above example expands to:

```
tokens == [
    Group {
        delim: Square,
        tokens: [
            Data (Int 1),
            Data (Int 2),
            Data (Int 3),
        ]
    }
]
```

This makes it easier to write the bodies of token macros - for instance, our incomplete while-loop body now becomes:

```
... -> quote {
    loop = _ -> if (splice cond) {
        splice body
        loop ()
    } else {
        ()
    }
    loop ()
}
```

Which is a lot nicer. The second utility we can introduce is `argpat`, which is used for pattern matching on macros:

```
argpat { 'while cond body } = tokens
```

This expands to something like this:

```
[Iden "while", cond, body] = tokens
```

`argpat` is useful because it allows us to quickly match on token streams to extract useful data. What's important to remember is that both `quote` and `argpat` can be implemented using token macros: we're not introducing any new syntax here.

As Passerine currently has two implementations - the [Rust](https://github.com/vrtbl/passerine) one by me and the [D](https://github.com/ShawSumma/purr/tree/main/ext/passerine) one by Shaw, it's important we try to ensure compatibility between them. Token macros allow us to put language features like `syntax`, etc. in the prelude, resulting in less work for us, and greater compatibility between implementations.

So, if we introduce token macros, will we be getting rid of syntax macros? The answer is no: after token macros are implemented, we can implement syntax macros in terms of them.

With both `quote` and `argpat`, it's easy to see how something like `syntax` can be implemented: it would be a macro that generates a macro, using `argpat` to match on the token stream, and quote to expand the resulting body. Some care has to be taken to ensure that names present in the argument pattern are automatically spliced; needless to say, `syntax` would look something like this, when implemented as a token macro:

```
macro syntax = [
    Iden "syntax"
    ..argument_pattern
    Group {
        delim: Curly,
        tokens: body,
    }
] -> {
    kw = extract_argpat_kw argument_pattern
    -- more omitted...
    quote {
        macro (splice kw) =
            argpat (splice argument_pattern)
        -> quote {
            (splice body)
        }
    }
}
```

The above isn't a concrete implementation, but should show the intended structure of the `syntax` macro. Remember that a token macro is just a function, so we can use any strategy imaginable to expand macros.

Now that I've explained how token macros work, two questions remain: how do we preserve macro hygiene, and how do we know when to apply macros?

Macro hygiene can be a complex issue, especially with respect to macro-generating macros. Even in languages known for their hygiene, like scheme, researchers have shown that there are ways to break hygiene (see, i.e. anaphoric macros). What even is macro hygiene?

Primarily, macro hygiene means that macros, when expanded, must not mess with the local lexical scope. This means that a macro can not reference variables explicitly passed to the macro. In practice, a macro can't define new identifiers, or redefine existing ones not passed to it. For instance, assuming a small lisp-like hygienic macro system:

```lisp
; define a macro that swaps two variables
(macro (swap! a b)
    (define tmp a)
    (set! a b)
    (set! b tmp))

; tmp is used in the macro,
; here, we define our own
(define tmp 1)
(define x   2)
(define y   3)

; expand the macro
(swap! x y)
; becomes:
; | (define _tmp x)
; | (set! x y)
; | (set! y _tmp)

; note that the expanded _tmp is mangled
; our tmp is still 1
```

As you can see from the above example, even though we define `tmp` outside the macro `swap!`, because `tmp` is not passed to `swap!`, expanding the macro will not affect the outside definition. How can we enforce this at the token-stream level?

Before expanding a macro, we build a set of all `Iden` tokens passed to the macro. These are tokens that the macro is allowed to reference. After the macro has produced its expansion, we scan through the resulting list of tokens, and mangle any new `Iden`s introduced.

To ensure that mangled tokens don't get it the way of macro expansion, all tokens are unmangled before being passed into a macro. This ensures that references to other macros within macros work as intended.

The second question we need to address is that of 'when should macros be applied'? Traditionally, `syntax` macros operate on forms. For instance, consider the following expression:

```
a b c + d e f
```

This is two forms:

```
(a b c) + (d e f)
```

To build

> TODO

These are my plans for macros. Next up, we'll talk types.

# So, Algebraic Data Types

Passerine primarily uses a structural type system, meaning types are represented by structure rather than by name. This works a lot of the time, but breaks down when we have two things that are structurally the same but conceptually distinct. As an example, both fractions and complex numbers can be represented as tuples of two numbers:

```
my_fraction = (1, 4) -- 1/4
my_complex  = (4, 3) -- 4+3i
```

Then, if we try to do something like implement a squaring number for fractions, it works on complex numbers too, which is less than ideal:

```
square_fraction = (num, den)
    -> (num * num, den * den)

square my_fraction -- ok, is 1/16
square my_complex  -- Aaaahhh! 16+9i is not correct!
```

To deal with this, Passerine already has the concept of *Labels*. Like atoms in other languages, these currently serve as markers, i.e. loose nominal types. In other words, a *Label* gives us a way to separate types that would otherwise look exactly alike. With the above example in mind, using labels we get:

```
my_fraction = Fraction (1, 4) -- 1/4
my_complex  = Complex  (4, 3) -- 4+3i

square = Fraction (num,       den      )
      -> Fraction (num * num, den * den)

square my_fraction -- ok, is 1/16
square my_complex  -- error is raised
```

This is all well and good, and works well in practice. There are two downsides to labels, though:

1. They can be created willy-nilly. Although compiled down to little more than integers, in the sense of ensuring correctness, they are no better than strings. If you accidentally misspell a label, it's a different type, resulting in spurious runtime errors.

2. They are strictly nominal. If your function expects a `Message (a, b)`, and I have my own label `Message (c, d)`, I could pass by `Message` to your function, whether or not it even means the same thing. In this case, we're back where we started.

To get around this, I've finally introduced a fully-formed notion of nominal types. Types must be declared, so a misspelling is a compile-time error; additionally, types are now *scoped*, so it's possible to have two types with the same label, while still preserving uniqueness.

So how to define types? Types will follow the form of macros, in essence: `type <name> <definition>`. `<name>`, of course, is a label, and must be capitalized. `<definition>` looks similar to a pattern, but in place of bindings, we have types. I'll get to what this looks like in a second.

Here's an example type:

```
type Fraction (Int, Int)
my_fraction = Fraction (1, 4)
```

Nothing too surprising here. We can define named struct-like types by wrapping a bare record with a label:

```
type Person {
    name:  String,
    age:   Nat,
    skill: T,
}
```

Here, you can see we have a skill `T`. This is a generic parameter. All generic parameters must be single letters; for this reason, a non-generic type must be at least two letters long.

> TODO: unions, methods (traits), etc.

# Module System

> TODO

# Native over Magic

Currently, to use FFI functions, we have used a hack that I'm not particularly proud of: the `magic` keyword. For those not familiar with it, while compiling a passerine module we can specify an FFI, which is a map from string names to Rust functions. For instance, if we have the following function in the FFI:

```rust
// bound to string "add_seven" in FFI
fn add_seven(data: Data) -> Result<Data, String> {
    match data {
        Data::Real => Ok(Data::Real(f + 7.0)),
        _ => Err("Expected a Real".into()),
    }
}
```

We can use it from Passerine like so:

```
-- call the rust function:
magic "add_seven" 3.5
-- is 10.5
```

This works well enough. What I'm not a fan of is the way we select the function to run: e.g. the `magic "add"`.

After some discussion with Shaw, I think that the best course of action is to remove `magic` in favor of a new construct, `native`. Like `use syntax`, `use native` is an import modifier that tells Passerine to look in the FFI for an import. Assuming the Rust `add` function we defined earlier is in scope:

```
use native add_seven
add_seven 3.5
-- is 10.5
```

This is nicer on a couple of fronts: native functions now act just like any other function.

> ## Note
> I'm currently considering making native a module; in other words, we'd do:
> ```
> native::add_seven 3.5
> ```
> or:
> ```
> use native::add_seven
> add_seven 3.5
> ```
> Another line of thought is that native items should just be algebraic effects, with handlers implemented natively. We discuss algebraic effects in the next section.

# Algebraic Effects

> TODO
