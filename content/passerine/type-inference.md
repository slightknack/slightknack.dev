+++
title = "Mirror: Hindley Milner Type Inference"
date = 2021-05-01

[extra]
artbit = "2_question.png"
+++

> This is a frozen mirror of [notes from Cornell's CS3110](https://www.cs.cornell.edu/courses/cs3110/2016fa/l/17-inference/notes.html). Full disclosure, I did not write this.

## Topics

- Type inference and reconstruction
- Constraint collection
- Constraint solving (unification)

## Intro

Java and OCaml are *statically typed* languages, meaning every binding has
a type that is determined at *compile time*—that is, before any part of
the program is executed. The type-checker is a compile-time procedure
that either accepts or rejects a program. By contrast, JavaScript and
Ruby are dynamically-typed languages; the type of a binding is not
determined ahead of time and computations like binding 42 to `x` and
then treating `x` as a string result in run-time errors.

Unlike Java, OCaml is *implicitly typed*, meaning programmers rarely need
to write down the types of bindings. This is often convenient,
especially with higher-order functions. (Although some people disagree
as to whether it makes code easier or harder to read). But implicit
typing in no way changes the fact that OCaml is statically typed. Rather,
the type-checker has to be more sophisticated because it must infer what
the *type annotations* "would have been" had the programmers written all
of them. In principle, type inference and type checking could be
separate procedures (the inferencer could figure out the types then the
checker could determine whether the program is well-typed), but in
practice they are often merged into a single procedure called
*type reconstruction*.

## OCaml type reconstruction

OCaml was rather cleverly designed so that type reconstruction is a
straightforward algorithm. At a very high level, that algorithm works as
follows:

-   Determine the types of definitions in order, using the types of earlier
    definitions to infer the types of later ones. (Which is one reason you
    may not use a name before it is bound in an OCaml program.)

-   For each `let` definition, analyze the definition to determine
    *constraints* about its type. For example, if the inferencer sees
    `x+1`, it concludes that `x` must have type `int`. It gathers
    similar constraints for function applications, pattern matches, etc.
    Think of these constraints as a system of equations like you might
    have in algebra.

-   Use that system of equations to solve for the type of the name
    begin defined.

The OCaml type reconstruction algorithm attempts to never reject a
program that could type-check, if the programmer had written down types.
It also attempts never to accept a program that cannot possibly type
check. Some more obscure parts of the language can sometimes make type
annotations either necessary or at least helpful (see RWO chapter 22,
"Type inference", for examples).  But for most code you write, type
annotations really are completely optional.

Since it would be verbose to keep writing "the OCaml type reconstruction
algorithm," we'll call the algorithm HM. That name is used throughout
the programming languages literature, because the algorithm was
independently invented by Roger <u>H</u>indley and Robin <u>M</u>ilner.

## Collecting and solving constraints: Examples

To gather the constraints for a definition, HM does the following:

-   Assign a preliminary type to every subexpression in the definition.
    For known operations and constants, such as `+` and `3`, use the
    type that is already known for it. For anything else, use a new type
    variable that hasn't been used anywhere else.

-   Use the "shape" of the expressions to generate constraints. For
    example, if an expression involves applying a function to an
    argument, then generate a constraint requiring the type of the
    argument to be the same as the function's input type.

We'll give some examples of this first, then we'll give the algorithms
for doing it.

#### Example 1.

Here's an example utop interaction:
```
# let g x = 5 + x;;
val g : int -> int = <fun>
```
How did OCaml infer the type of `g` here?  Let's work it out.

First, let's rewrite `g` syntactically to make our work a little easier:
```
let g = fun x -> ((+) 5) x
```
We've made the anonymous function explicit, and we've made the
binary infix operator a prefix function application.

**1. Assign preliminary types.**

For each subexpression of `fun x -> (+) 5 x`, including the entire
expression itself, we assign a preliminary type. We already know the
types of `(+)` and `5`, because those are baked into the language
itself, but for everything else we "play dumb" and just invent a new
type variable for it. For now we will use uppercase letters to represent
those type variables, rather than the OCaml syntax for type variables
(e.g., `'a`).
```
Subexpression         Preliminary type
------------------    --------------------
fun x -> ((+) 5) x    R
    x                 U
         ((+) 5) x    S
         ((+) 5)      T
          (+)         int -> (int -> int)
              5       int
                 x    V
```

**2. Collect constraints.**

Here are some observations we could make about the "shape" of subexpressions
and some relationships among them:

* Since function argument `x` has type `U` and function body `((+) 5) x`
  has type `S`, it must be the case that `R`, the type of the anonymous
  function expression, satisfies the constraint `R = U -> S`.
  That is, *the type of the anonymous function* is *the type of its argument*
  arrow *the type of its body*.

* Since function `((+) 5)` has type `T` and function
  application `((+) 5) x` has type `S`, and since the argument `x` has
  type `V`, it must be the case that `T = V -> S`.  That is,
  *the type of the function being applied* is *the type of the argument it's
  being applied to* arrow *the type of the function application expression*.

* Since function `(+)` has type `int -> (int -> int)` and function
  application `(+) 5` has type `T`, and since the argument `5`
  has type `int`, it must be the case that `int -> (int->int) = int -> T`.
  Once again,
  *the type of the function being applied* is *the type of the argument it's
  being applied to* arrow *the type of the function application expression*.

* Since `x` occurs with both type `U` and `V`, it must be the case that `U = V`.

The set of constraints thus generated is:
```
                  U = V
                  R = U -> S
                  T = V -> S
int -> (int -> int) = int -> T
```

**3. Solve constraints.**

You can solve that system of equations easily. Starting from the last
constraint, we know `T` must be `int -> int`. Substituting that into the
second constraint, we get that `int -> int` must equal `V -> S`, hence
`V = S = int`. Since `U=V`, `U` must also be `int`. Substituting for `S`
and `U` in the first constraint, we get that `R = int -> int`. So the
inferred type of `g` is `int -> int`.

#### Example 2.

```
# let apply f x = f x;;
val apply : ('a -> 'b) -> 'a -> 'b = <fun>
```

Again we rewrite:
```
let apply = fun f -> (fun x -> f x)
```

**1. Assign preliminary types.**

```
Subexpression              Preliminary type
-----------------------    ------------------
fun f -> (fun x -> f x)    R
    f                      S
         (fun x -> f x)    T
              x            U
                   f x     V
                   f       S
                     x     U
```

**2. Collect constraints.**

- `R = S -> T`, because of the anonymous function expression.
- `T = U -> V`, because of the nested anonymous function expression.
- `S = U -> V`, because of the function application.

**3. Solve constraints.**

Using the third constraint, and substituting for `S` in the first
constraint, we have that `R = (U -> V) -> T`.  Using the second
constraint, and substituting for `T` in the first constraint,
we have that `R = (U -> V) -> (U -> V)`.  There are no further
substitutions that can be made, so we're done solving the constraints.
If we now replace the preliminary type variables with actual OCaml
type variables, specifically `U` with `'a` and `V` with `'b`, we get that
the type of `apply` is `('a -> 'b) -> ('a -> 'b)`, which is the same as
`('a -> 'b) -> 'a -> 'b`.

#### Example 3.

```
# apply g 3;;
- : int = 8
```

We rewrite that as `(apply g) 3`.

**1. Assign preliminary types.**

In this running example, the inference for `g` and `apply` has already
been done, so we can fill in their types as known, much like the type
of `+` is already known.

```
Subexpression     Preliminary type
-------------     ------------------------------------------
(apply g) 3       R
(apply g)         S  
 apply            (U -> V) -> (U -> V)
       g          int -> int
          3       int
```

**2. Collect constraints.**

- `S = int -> R`
- `(U -> V) -> (U -> V) = (int -> int) -> S

**3. Solve constraints.**

Breaking down the last constraint, we have that `U = V = int`, and
that `S = U -> V`, hence `S = int -> int`.  Substituting that into
the first constraint, we have that `int -> int = int -> R`.  Therefore
`R = int`, so the type of `apply g 3` is `int`.

#### Example 4.

```
# apply not false;;
- : bool = true
```

By essentially the same reasoning as in example 3, HM can infer that the
type of this expression is `bool`. This illustrates the polymorphism of
`apply`: because the type `(U -> V) -> (U -> V)` of
`apply` contains type variables, the function can be applied to any
arguments, so long as those arguments' types can be consistently
substituted for the type variables.

## Collecting constraints: Algorithm

We now present an algorithm that generates constraints. This algorithm
is a precise description of how constraint gathering works in the
examples we discussed above. The algorithm is not exactly what HM does,
because HM actually performs type checking at the same time as type
inference. However, the resulting types are the same, and separating
inference from checking hopefully will give you a clearer idea of how
inference itself works.

The algorithm takes as input an expression `e`. We'll
assume that every function `fun x -> e'` in that expression has an
argument with a different name. (If not, our algorithm could make a
pre-pass to rename variables. This is feasible because of lexical scope.)
The output of the algorithm is a set of constraints.

The first thing the algorithm does is to assign unique preliminary
type variables, e.g. `R` or `S`,

- one to each *defining* occurrence of a variable, which could be as
  a function argument or a let binding, and
- one to each occurrence of each subexpression of `e`.

Call the type variable assigned to `x` in the former clause
`D(x)`, and call the type variable assigned to occurrence of a
subexpression `e'` in the latter clause `U(e')`.  The names of these
are mnemonics:  `U` stands for the <u>u</u>se of an expression,
and `D` stands for the <u>d</u>efinition of a variable name.

Next, the algorithm generates the following constraints:

- For integer constants `n`:  `U(n) = int`.  This constraints follows
  from the type checking rule for integers, which says that every
  integer constant has type `int`.  Constraints for other types of
  constants are generated in a similar way.
- For variables `x`:  `D(x) = U(x)`.  This constraint follows from the type
  checking rule for variables, which says the type of a variable use (in this case, `U(x)`)
  must be the same as the type at which that variable was defined (here, `D(x)`).
- For function application `e1 e2`: `U(e1) = U(e2) -> U(e1 e2)`,
  as well as any constraints resulting from `e1` and `e2`.  This constraint follows
  from the type checking rule for function application.
- For anonymous functions `fun x -> e`: `U(fun x -> e) = D(x) -> U(e)`,
  as well as any constraints resulting from `e`.  This constraint follows from the
  type checking rule for anonymous functions.
- For let expressions `let x=e1 in e2`: `D(x)=U(e1)`, `U(let x=e1 in e2) = U(e2)`,
  as well as any constraints resulting from `e1` and `e2`.  This constraint follows
  from the type checking rule for let expressions.
- Other expression forms:  similar kinds of constraints likewise derived from the
  type checking rule for the expression form.

The result is a set of constraints, which is the output of the
algorithm. It's not too hard to implement this algorithm as a recursive
function over a tree representing the syntax of `e`.

**Example.**
Given expression `fun x -> (fun y -> x)`, a type variable `R` is
associated with argument `x`, and `S` with argument `y`.  For
subexpressions, `T` is associated with the occurrence of `fun x -> (fun
y -> x)`, and `X` with the occurrence of `(fun y -> x)`, and `Y` with
the occurrence of `x`. (Note that the names we've chosen for the type
variables are completely arbitrary.) The constraints generated are `T =
R -> X`, and `X = S -> Y`, and `Y = R`.

## Solving constraints: Algorithm

What does it mean to solve a set of constraints? To answer this
question, we define *type substitutions*. A type substitution is a map
from a type variable to a type. We'll write `{t/X}` for the
substitution that maps type variable `X` to type `t`. The way a
substitution `S` operates on a type can be defined recursively:

```
S(X)        = if S = {t/X} then t else X
S(t1 -> t2) = S(t1) -> S(t2)
```

A substitution `S` can be applied to a constraint `t = t'`; the result
`S(t = t')` is defined to be `S(t) = S(t')`. And a substitution can be
applied to a set `C` of constraints; the result `S(C)` is the result of
applying `S` to each of the individual constraints in `C`.

Given two substitutions `S` and `S'`, we write `S;S'` for their
composition: `(S;S')(t) = S'(S(t))`.

A substitution *unifies* a constraint `t_1 = t_2` if `S(t_1) = S(t_2)`.
A substitution `S` unifies a set `C` of constraints if `S` unifies every
constraint in `C`. For example, substitution
`S = {int->int/Y};{int/X}` unifies constraint `X -> (X -> int) = int -> Y`.

To solve a set of constraints `C`, we need to find a substitution that
unifies `C`. If there are no substitutions that unify `C`, where `C`
is the constraints generated from expression `e`, then `e` is not
typeable.

To find a substitution that unifies `C`, we use an algorithm
appropriately called the *unification* algorithm. It is defined as
follows:

- if `C` is the empty set, then `unify(C)` is the empty substitution.

- if `C` is the union of a constraint `t = t'` with other constraints `C'`, then
  `unify(C)` is defined as follows, based on that constraint:

    - if `t` and `t'` are both the same type variable, e.g. `X`,
      then return `unify(C')`.

    - if `t = X` for some type variable `X`, and `X` does not occur in `t'`,
      then let `S = {t'/X}`, and return `unify(S(C'));S`.

    - if `t' = X` for some type variable `X`, and `X` does not occur in `t`,
      then let `S = {t/X}`, and return `unify(S(C'));S`.

    - if `t = t0 -> t1` and `t' = t'0 -> t'1`,
      then let `C''` be the union of `C'` with the constraints
      `t0 = t'0` and `t1 = t'1`, and return `unify(C'')`.

    - if `t = t0 * t1` and `t' = t'0 * t'1`,
      then let `C''` be the union of `C'` with the constraints
      `t0 = t'0` and `t1 = t'1`, and return `unify(C'')`.

    - if `t = (t0, ..., tn) tc` and `t' = (t'0, ..., t'n) tc` for some
      type constructor `tc`,
      then let `C''` be the union of `C'` with the constraints
      `ti = t'i`, and return `unify(C'')`.

    - otherwise, fail. There is no possible unifier.

In the second and third subcases, the check that `X` should
not occur in `t` ensures that the algorithm doesn't produce a cyclic
substitution—for example, `{(X -> X) / X}`.

It's possible to prove that the unification algorithm always terminates,
and that it produces a result if and only a unifier actually exists—that
is, if and only if the set of constraints has a solution. Moreover, the
solution the algorithm produces is the *most general unifier*, in the
sense that if `S = unify(C)` and `S'` unifies `C`, then there
must exist some `S''` such that `S' = S;S''`.

If `R` is the type variable assigned to represent the type of the entire
expression `e`, and if `S` is the substitution produced by the
algorithm, then `S(R)` is the type inferred for `e` by HM type
inference. Call that type `t`. It's possible to prove `t` is the
*principal* type for the expression, meaning that if `e` also has type
`t'` for any other `t'`, then there exists a substitution `S` such that
`t' = S(t)`. So HM actually infers the most lenient type that is possible
for any expression.

## Let expressions

Consider the following code:

```
let double f z = f (f z) in
(double (fun x -> x+1) 1, double (fun x -> not x) false)
```

The inferred type for `f` in `double` would be `X -> X`. In the
algorithm we've described so far, the use of `double` in the first
component of the pair would produce the constraint `X = int`, and the
use of `double` in the definition of `b` would produce the constraint `X
= bool`. Those constraints would be contradictory, causing unification
to fail!

There is a very nice solution to this called *let-polymorphism*, which
is what OCaml actually uses. Let-polymorphism enables a polymorphic
function bound by a `let` expression behave as though it has multiple
types. The essential idea is to allow each usage of a polymorphic
function to have its own instantiation of the type variables, so that
contradictions like the one above can't happen.

We won't cover let-polymorphism here, but you can learn more about it
in the reading given below.

## Efficiency of HM

HM is usually a very efficient algorithm—you've probably never had to
wait for the REPL to print the inferred types of your programs. In
practice, it runs in approximately linear time. But in theory, there are
some very strange programs that can cause its running-time to blow up.
(Technically, it's DEXPTIME-complete.) For fun, try typing the following
code in utop:

```
let b = true;;
let f0 = fun x -> x+1;;
let f = fun x -> if b then f0 else fun y -> x y;;
let f = fun x -> if b then f else fun y -> x y;;
(* keep repeating that last line *)
```

You'll see the types get longer and longer, and eventually type inference
will cause a notable delay.

## The history of HM

HM has been rediscovered many times by many people. Curry used it
informally in the 1950's (perhaps even the 1930's). He wrote it up
formally in 1967 (published 1969). Hindley discovered it independently
in 1969; Morris in 1968; and Milner in 1978. In the realm of logic,
similar ideas go back perhaps as far as Tarski in the 1920's. Commenting
on this history, Hindley wrote,

> There must be a moral to this story of continual re-discovery;
> perhaps someone along the line should have learned to read. Or someone
> else learn to write.

## Summary

Hindley–Milner type inference is one of the core algorithms that
makes the OCaml language, and many other functional languages, possible.
It is fundamentally based on traversing the source code to collect
a system of equations, then solving that system to determine the types.

## Terms and concepts

* constraint
* Hindley–Milner (HM) type inference algorithm
* implicit typing
* let polymorphism
* preliminary type variable
* static typing
* substitution
* type annotation
* type inference
* type reconstruction
* unification
* unifier

## Further reading

* [*Types and Programming Languages*][tapl], chapter 22, by Benjamin C. Pierce.

[tapl]: https://newcatalog.library.cornell.edu/catalog/8324012
