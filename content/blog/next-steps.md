+++
title = "Types, Algebraic Effects, and Next Steps"
date = 2021-06-01
+++

Passerine is at an interesting point: we've established a few language features, and build this easily extinsible functional core on which to base the rest of the language. We currently have two implementations of the language, one written in Rust, the other in D, and it's imperative we set the course of the language before divergence occurs.

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

This is neat and all, but we can't do things like compile-time loop unrolling, or matching in forms to leverage existing syntax. To address the two issues I raised earlier, I'm going to expand syntactic macros on two fronts.

But before we do that, a quick reminder. **Macros must respect lexical scope**. A macro defined in a function body is only accessible inside that body. It's not possible to return a macro from a function, but it is from a module. We'll discuss this more later.

## Generalized `syntax`

To do something like compile-time loop unrolling, we need methods to do computation at compile-time. To do this, I'm going to introduce general syntax forms that allow for more general macro expansion.

Inside the body of a macro, `syntax <comptime> ...` may be used to invoke a compile-time check. Here are the first few I think we should start out with:

- `syntax match`, for matching multiple argument patterns
- `syntax if`, for checking conditions at compile time
- `syntax eval`, for evaluating expressions at compile time.

It's important to remember that these constructs are only availiable *inside* macro bodies. Let's expand on all of these: let's first talk about `syntax match`. Earlier, we introduced a macro to match a match statement:

```
syntax 'if cond then 'else otherwise {
    ...
}
```

This only matches macros with an else clause. Say we want to introduce an `if` statement without that clause. We *could* implement two separate macros; but with `syntax match`, we can now do:

```
syntax 'if cond then ..remaining {
    syntax match remaining {
       'else 'if cond2 ..remaining { <a> }
       'else otherwise { <b> }
       { <c> }
    }
}
```

`syntax match` has a number of match arms, each one taking the form `<argpat> { <body> }`. Unlike base match statements, the argpats in match arms don't have to have a unique pseudokeyword. the first arm that matches is expanded.

In the above `if` example, if we chain `if`s, `<a>` is expanded. If we include a single `else` clause, body `<b>` is expanded; by default, we expand body `<c>`.

If statements are similar to `match`. We can use them to implement something like compile-time loop unrolling:

```
-- repeats a block of code value times
-- binding var from 0 to value, exclusive
syntax 'unroll var 'until value body {    
    syntax if value != 0 {
        unroll var until {
            syntax eval (value - 1)
        } body
    }
    var = value; body
}

unroll x until 3 {
    print x
}

-- becomes:
x = 0; print x
x = 1; print x
x = 2; print x
```

The above example introduces the next two `syntax` forms: first, let's address `syntax eval`. This expands the body, and immediately evaluates it, inserting the result of the evaluation. We'll get into this later, but the effect type of the expansion expression must be `total`. In this case, we decrement value until it reaches zero; this allows us to build up a list of statements, and most importantly, terminate.

Why does `syntax eval` seem so verbose? In my opinion, the more idiomatic something is, the easier it should be to write out. Compile-time evaluation is cool and all, but its use should be limited. Although it can't produce arbitrary side effects (by definition), it's unidiomatic *in spirit*, which is why it's slightly verbose.

Onto `syntax if`. This expression is just like an if statement, but evaluated at compile time. All conditions are evaluated at compile-time (think of it as wrapped in a `syntax eval`), and only the first branch with a `true` condition is expanded. **What's important to note about compile-time evaluation is that it must be `total`.**

These three `syntax` bodies, `match`, `if`, and `eval`, should fill about 75% of use cases for macros; the next feature (just about) fills the remaining 25%.

## Read-style Matching

Currently, matching on forms is *very* powerful, but we've neglected all other syntax! let's say we want to declare a `display` macro that prints the expression assigned to it. In other words:

```
display x = 3 + 4
-- prints 7
```

The best we can do with traditional form-based macros is the following:

```
syntax 'display 'set var expr {
    val = expr -- to only evaluate once
    print val  -- display the value
    var = val  -- assign the value
}

display set x (3 + 4)
-- prints 7
```

This next change remedies that. With *read-based matching*, it's possible to match any AST element:

```
syntax 'display var = expr { ... }
```

The new argument pattern is `'display var = expr`. There are two things that are important to note about this:

First, this does not remove the need for a unique pseudokeyword. You can't redefine addition everywhere by implementing a bare macro for `a + b` (use methods instead! (we'll get to methods later)).

Second, the operators inside of the macro must not be quoted, as they are not uniquely identifying pseudokeywords.

In addition to `=`, it's now possible to match inside functions, blocks, typedefs, macrodefs, etc. Just remember to use `..` to collect mutliple arguments, say in the case of functions (`..a -> b`) or blocks (`{ ..a }`).

The only thing you can *not* match inside of are forms. to match inside a form, you must lay it out:

```
-- note, instead of two macros
-- we could use a `syntax match`

syntax 'eval fun ..args { fun * eval ..args }
syntax 'eval var = form {
    -- lay out form to match inside it
    var = eval ..form
}

x = 7
eval y = 3 x
-- y is 21
```

> ### A quick note on the `..` notation
> Currently, we use `..` to match extra arguments in tuples/records, or to splat lists. Using the same syntax in macros might be ambiguious, so I'm thinking of alternatives. If you have any suggestions, let me know.

With these two features, it should be easier to embed domain-specific-languages, make alternative evaluation schemes, or just write more expressive macros overall.

I'm trying to figure out how to unify operator representation, so it'll become easier to match inside of all macros. One such option are token classes inside argument patterns, but I'd prefer we don't get too far ahead of ourselves.

These are my plans for macros. Next up, we'll talk types.

# So, Algebraic Datatypes

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

To deal with this, Passerine already has the concept of *Labels*. Like atoms in other languages, these currently serve as markers, i.e. loose nominal types. In other words, a *Label* gives us a way to seperate types that would otherwise look exactly the alike. With the above example in mind, using labels we get:

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

To get around this, I'm finally introduced a fully-formed notion of nominal types. Types must be declared, so a misspelling is a compile-time error; additionally, types are now *scoped*, so it's possible to have two types with the same label, while still preserving uniqueness.

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

Currently, to use FFI functions, we have use a hack that I'm not particularly proud of: the `magic` keyword. For those not familiar with it, while compiling a passerine module we can specify an FFI, which is a map from string names to Rust functions. For instance, if we have the following function in the FFI:

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
