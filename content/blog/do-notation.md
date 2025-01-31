+++
title = "What's up with Haskell's do notation?"
date = 2025-01-30

[extra]
artbit = "1_raccoon.png"
+++

Managing side effects in [pure][pure] functional programming
languages has [always been][church] something of a challenge.
Functions in *purely* functional languages produce outputs
solely dependent on their inputs, by definition. Purity
makes it easy to reason about functions:
because all context is explicit, functions also become easy to break
apart and refactor.

[pure]: https://wiki.haskell.org/index.php?title=Functional_programming#Purity
[church]: /pdfs/church-lambda.pdf

The issue, however, with *explicit* context is that it quickly
becomes verbose. Unlike imperative languages, I/O is no
longer as simple as a call to print: each function that prints
something requires a *context* to print it in, and must
return this context to the function that called it for later use (lest
the output be lost).

Like a game of hot potato, this I/O context must be handed up and
down the call stack, passing through the hands of every function in between.
A task as simple as adding logging to a deep leaf function becomes an
immense [chore][chore], as every function that calls the
leaf function that now performs I/O must accept and return an I/O context.

[chore]: https://stackoverflow.com/questions/6310961/how-do-i-do-logging-in-haskell#answer-6311338

Practical functional languages—those of the [Lisp][wiki-lisp] and
[ML families][wiki-ml]—tend to take the easy way out by adding an imperative
[escape hatch][escape]. I/O is special-cased: every function
"implicitly" takes a global context in which to print. While practically
viable, this solution is inflexible and can get messy when there are many
types of side effects that useful programs need to perform.

[wiki-lisp]: https://en.wikipedia.org/wiki/Lisp_(programming_language)
[wiki-ml]: https://en.wikipedia.org/wiki/ML_(programming_language)
[escape]: https://ocaml.org/docs/mutability-imperative-control-flow

Personally, I am a fan of the more composable [*Algebraic
Effects*][algeffs] approach to handling side effects.
While probably deserving an essay in their own right,
Algebraic Effects neatly unify [dynamically scoped][cl-dyn] [capabilities][monte-caps]
with the benefits of [type system][wiki-effects] and inference.
While *definitionally* more complex than a language with
implicit side effects, [in *practice*][koka], Algebraic Effects are deceptively
simple. You can write code as if it were imperative.
The compiler keeps track of what effects are used where,
threading context as needed, and lowers your imperative-looking code
to something functional, pure, and easy to reason about.

[algeffs]: https://homepages.inf.ed.ac.uk/gdp/publications/Effect_Handlers.pdf
[cl-dyn]: http://www.n-a-n-o.com/lisp/cmucl-tutorials/LISP-tutorial-12.html
[monte-caps]: https://monte.readthedocs.io/en/latest/intro.html#object-capability-discipline
[wiki-effects]: https://en.wikipedia.org/wiki/Effect_system
[koka]: https://koka-lang.github.io/koka/doc/book.html#sec-effect-types

# I swear this is not a monad tutorial

Another way to manage side effects are through [*Monads*][monads-haskell], as
exemplified by Haskell et ... uh, just Haskell, [really][lean]. Monads describe a [class of
types][typeclass-haskell] with associated properties that generally make them
amenable to modeling side effects.

[monads-haskell]: https://wiki.haskell.org/All_About_Monads
[typeclass-haskell]: http://wiki.haskell.org/Type_class
[lean]: https://lean-lang.org/functional_programming_in_lean/monads.html

This is not a monad tutorial, so with complete lack of tact, I'd
like to restate that a Monad is, in general, [anything that is
thenable][wiki-monad]. Semantically, Monads are quite simple: A Monad is a class
of types where the following three operations are available, and
obey the so-called *Monad Laws* (which I describe later):

[wiki-monad]: https://en.wikipedia.org/wiki/Monad_(functional_programming)#More_examples

1.  *Return*, which wraps a value in the default context.

2.  *Then (`>>`)*, which takes two contexts, and merges them
    together as if one happened after the other.

3.  *Bind (`>>=`)*, which takes a value in a context, applies a
    transformation to that value, and produces a new context.

In Haskell we'd define a Monad as:

```haskell
class Monad m where
  return :: a -> m a
  (>>) :: m a -> m b -> m b
  (>>=) :: m a -> (a -> m b) -> m b
```

Note that, in Haskell, both *then* (`>>`) and *bind*
(`>>=`) are defined as infix operators.

There are many different instances of Monads that exist in the wild. A
relatively simple Monad is `Maybe`, whose context is whether
or not a value exists. The implementation is not too complex:

```haskell
-- The value exists or it does not.
data Maybe a = Just a | Nothing

instance Monad (Maybe a)
  -- By default the value exists.
  return a = Just a
  -- Preserve context and replace value.
  (>>) (Just a) b = b
  (>>) Nothing _ = Nothing
  -- Can only transform existing values.
  (>>=) (Just a) f = f a
  (>>=) Nothing _ = Nothing
```

And here's how you would use return, then (`>>`), and bind
(`>>=`) with the Maybe Monad:

```haskell
return 7 :: Maybe
-- Just 7

Just "Hello" >> Nothing >> Just "Bye"
-- Nothing

Just 7 >>= (+) 2
-- Just 9
```

These allow us to chain together monadic operations.
Note that in the last example, the context wrapping the value `7` is
preserved (e.g. we get `Just 9`). If we were to use
`Nothing` instead, we would get `Nothing`:

```haskell
Nothing >>= (+) 2
-- Nothing
```

Because we can't *add two* to a value we don't know!

Now the infix operator syntax for chaining monads is nice,
especially when writing point-free code, because we can define
these monadic transformations a bit like steps in a pipeline:

```haskell
get :: AddressBook -> String -> Maybe String
parse_email :: String -> Maybe Email
send_email :: String -> Email -> Maybe Thread

get contacts "Euclid"
>>= parse_email
>>= send_email message
```

This example is short and reads well, because `parse_email` and
`send_email message` are functions with the exact type
signatures we expect at each stage in the pipeline.

# Points and legos

Sometimes, however, the lego bricks in our pipeline don't quite lock
together, as we have to adopt a style that uses *points*. In a
point-ful style, we use explicit anonymous functions (i.e.
*lambdas*) to pipe values together. I like to remember that the
arrow in a lambda is *pointy*:

```haskell
add_two :: Nat -> Nat

-- Point-free style
add_two = (+) 2

-- Pointed style
add_two = \n -> 2 + n
```

To demonstrate the increased verbosity of using explicit points with
Monadic operations, here is the previous email snippet rewritten in a
point-ful style, using lambdas:

```haskell
get contacts "Euclid"
>>= (\raw_email ->
  parse_email raw_email
  >>= (\email ->
    send_email message email))
```

Which is, admittedly, quite a lot worse than:

```haskell
get contacts "Euclid"
>>= parse_email
>>= send_email message
```

Although Haskell is generally pretty flexible, and provides plenty
of tools for wrangling pointed expressions into their equivalent
point-free forms, there are times where a pointed style is
simpler to understand than the convoluted currying and type
wrangling that may be required to enforce a strict
point-free style.

# Do notation at last

Enter, Haskell's *do notation*.

Haskell's do notation is a compact notation for writing monadic
pipelines: it is powerful syntactic sugar that helps make
composing Monads easier. Here is the previous email snippet
written as a `do` expression:

```haskell
do
  raw_email <- get contacts "Euclid"
  email <- parse_email raw_email
  send_email message email
```

Which almost reads like imperative code. (This surface-level
similarity to straight-line code can be a pitfall for
beginners, but more on that later.)

So how does do notation work?

Do notation is syntactic sugar for the standard then (`>>`) and bind
(`>>=`) operators. Each line in a `do` block is chained with the next using
A monadic operator.

To clarify, let's look at a simple case with two lines. When we have two
simple expressions, one after another, like:

```haskell
do
  Nothing
  Just "Hello"
```

This `do` expression will desugar to the then (`>>`) operator:

```haskell
Nothing >> Just "Hello"
```

When an line yields a wrapped monadic value, we can use `<-` to
extract the value inside the Monad for use in the rest of the
expression:

```haskell
do
  seven <- Just 7
  seven + 2
```

This `<-` desugars to the bind (`>>=`) operator and a lambda as
follows:

```haskell
Just 7 >>= (\seven -> seven + 2)
```

Note that an implicit lambda was introduced, wrapping the rest
of the `do` expression. This is where the power of the `do`
expression lies: it allows us to express multiple pointed binds as a
straight-line series of expressions, which *eliminates nesting* and
becomes easier to read. The context of the previous expression is
transparently carried forward to the next, meaning we don't have
to write out deeply-nested callbacks. Do notation slices apart
nested monadic transformations at the joints.

Haskell's do notation is deeply related to [*with notation*][with-koka]
in Koka (which does for Algebraic Effects what do
notation does for Monads) and [*use notation*][use-gleam] in
Gleam. How these map to Haskell's do notation (via the [*Free Monad*][siraben-free]) will perhaps be
the topic of another post.

[with-koka]: https://koka-lang.github.io/koka/doc/book.html#sec-with
[use-gleam]: https://gleam.run/news/v0.25-introducing-use-expressions/
[siraben-free]: https://siraben.dev/2020/02/20/free-monads.html

# When do notation doesn't... run sequentially

There are, however, a couple of pitfalls, which trap those new
to Haskell. On the surface, do notation looks similar to
imperative code: people coming from imperative languages
gravitate towards using `do` in simple cases where an idiomatic
point-free style is more appropriate. Using `do` can
needlessly complicate simple code:

```haskell
do
  line <- get_line ()
  return line
```

While ostensibly sensible, this do block becomes:

```haskell
get_line () >> (\line -> return line)
```

Which is equivalent to:

```
get_line ()
```

This is a lot shorter (and point free)!

The second pitfall beginners face is not ever learning about the Monadic
operations that underlie do notation. (Which is a pitfall I hope I have
addressed in this post.)

To elaborate, do notation is usually used as a shorthand in
contexts that require I/O. This tight coupling in
presentation may cause beginners to think that do notation is just
'how one does' imperative-style I/O in Haskell. In reality, do notation
is a much more powerful tool: it can handle *any* Monad, not
just the IO Monad.

Additionally, thinking of do notation as an 'imperative escape hatch' is
also incorrect and has its pitfalls. Consider the following snippet:

```haskell
get_line :: () -> IO String
print_line :: String -> IO ()

friend = do
  name <- get_line ()
  print_line ("Hello, " ++ name)
  return name
  print_line "Unreachable"
  return "Casper the Ghost"
```

Let's say you run this snippet, type `James` and hit enter. What is
printed, and who ends up as your `friend`?

Adopting an imperative lens, one might think:

> First, we store `"James"` in the `name` variable. Next, we print
`Hello, James`. We then encounter `return name` right in the middle
of our `do` block: since `return` short circuits control flow in
most other languages, it must certainly do the same in Haskell, so our
`friend` would be `"James"`, and the only output we should see would
be that of the first print statement…

Right?

Wrong.

We'd actually end up with `friend = "Casper the Ghost"`, and we would
see the following as output:

```haskell
Hello, James
Unreachable
```

Why?

Do notation is just sugar for chaining Monads: it is not
*actually* imperative code. Unlike other languages, `return` does
*not* short-circuit control flow: `return` is a normal
function like any other:

```haskell
return :: a -> m a
```

In the case of `IO`, it just wraps a string in an I/O context,
creating an `IO String`:

```haskell
io_string :: String -> IO String
return = io_string
```

With these definitions in place, we could desugar the above example as
follows:

```haskell
friend = get_line ()
  >>= (\name ->
    print_line ("Hello, " ++ name)
    >> io_string name
    >> print_line "Unreachable"
    >> io_string "Casper the Ghost")
```

As you can see, `return name` in the middle reduces to creating an
`IO String` that is immediately discarded by the following
Monadic then (`>>`). This is very important:

Do notation does *not* imply sequential imperative
evaluation. (This is especially true because Haskell is
*lazy*.)

# The Monad Laws at last!

With that it mind, I can finally motivate an
aesthetic presentation of the three [Monad Laws][ml] using do-notation.
These are rules that then (`>>`), bind (`>>=`), and return must follow
for an instance of the `Monad` typeclass to *actually* be a monad, mathematically.
(If you break the Monad Laws, the *Monad Police* will
show up and throw you in *Monad Jail* where you will labor
on the [*Monad Assembly Line*][labor] until all values lost
have been bound then returned to their former state of *purity*. Ahem.)

[labor]: https://wiki.haskell.org/All_About_Monads#A_physical_analogy_for_monads

## Left identity

<table>
<tr>
<th>This:</th>
<th>becomes:</th>
</tr>

<tr>
<td>

```haskell
do
  y <- return x
  f y
```

</td>
<td>

```haskell
do
  f x

```

</td>
</table>

## Right identity

<table>
<tr>
<th>This:</th>
<th>becomes:</th>
</tr>

<tr>
<td>

```haskell
do
  x <- m
  return x
```

</td>
<td>

```haskell
do
  m

```

</td>
</table>

# Associativity

<table>
<tr>
<th>This:</th>
<th>or:</th>
<th>becomes:</th>

</tr>

<tr>
<td>

```haskell
do
  y <- do
    x <- m
    f x
  g y
```

</td>
<td>

```haskell
do
  x <- m
  do
    y <- f x
    g y
```

</td>
<td>

```haskell
do
  x <- m
  y <- f x
  g y

```

</td>
</table>

[ml]: https://wiki.haskell.org/Monad_laws

# What's to do has been done

So, to recap:

Side effects in pure functional languages
require propagating context, which results in
verbose code that is brittle to change. Haskell
circumvents this issue with Monads, which are a general way to
wrap a value in a context, and chain transformations on
a value within a given context.

However, operations on Monads—when written in a pointed
style—can quickly become verbose and nested. Do
notation is a simple syntax for flattening complex
chains of operations, offering a number of advantages over the
traditional then (`>>`) and bind (`>>=`) syntax.

Those new to Haskell coming from imperative languages
often misinterpret the core calculus of do notation and use it
overzealously. However, by knowing the Monadic operations that
underlie do notation, one can learn when to use it to drastically
simplify code.

## What's up with Haskell's do notation?

So you've read a lot about do notation but
I still haven't explained *what the big deal is*.
Apologies. Talk about burying the lede.

Human languages, like English, are typically read in a linear sequence, from beginning to end.
Like programming languages, human languages map to [parse trees][wiki-parse], according to a
grammar—or set of rules—and we can ascribe semantic *meaning* to those trees.

[wiki-parse]: https://en.wikipedia.org/wiki/Parse_tree#Nomenclature

Most human languages favor parse trees that [branch][wiki-branch] in a particular direction.
English, for example, is primarily a [right-branching][wiki-right] language,
meaning that right-branching sentences are more common, due to the grammar of the language favoring their construction.
A right-branching sentence starts with a *subject* and is followed by a sequence of modifiers
that progressively add more information about the subject. To borrow [an image][wiki-image] from Wikipedia,
after a certain point in a sentence, all subsequent nodes branch right:

<img src="/content/branching.svg" alt="A parse tree for the sentence: 'The child did not try to eat anything'. From 'did' onward, the tree grows down and to the right.">

[wiki-branch]: https://en.wikipedia.org/wiki/Branching_(linguistics)#Full_trees
[wiki-right]: https://en.wikipedia.org/wiki/Right-branching_sentences_in_English
[wiki-image]: https://upload.wikimedia.org/wikipedia/commons/6/66/Branching6.jpg

Speakers of English are pretty good at processing deeply-nested trees that branch to the right.
Reading right-branching sentences doesn't feel like parsing some complicated grammatical structure.
The nesting, while deep, is simple: we always branch to the right.
Because the nesting is simple, we can treat the tree almost as a linear sequence:
we can ignore the nesting, because it is trivial.
I feel like humans are pretty good at communicating ideas by starting with a subject
and progressively adding information,
as opposed to incrementally constructing some sort of
complex tree structure the mind, which is then evaluated.

How is this related to do notation?

Haskell is also a language, and it also maps to parse trees.
Parse trees in Haskell, like in English, can lean to the left or to the right.
And when chaining operations together, like with Monads,
the parse trees can tend to lean pretty far in one direction.
Consider, for example, our pointed email-parsing example from earlier:

```haskell
get contacts "Euclid"
>>= (\raw_email ->
  parse_email raw_email
  >>= (\email ->
    send_email message email))
```

In case it's not visible from the intendation, this is a right-branching parse tree!

When we rewrite this expression using do-notation, the code is flattened:

```haskell
do
  raw_email <- get contacts "Euclid"
  email <- parse_email raw_email
  send_email message email
```

This is a lot easier to read,
because humans are pretty good at communicating ideas by starting with a subject
and progressively adding information.
The nesting, of course, is still there,
but the `do` keyword keys us in that the parse tree will be leaning to the right.
The nesting, while deep, is simple, so we can ignore it.
If Monads are context, then each line is information added to that context.
By eliminating nesting, it becomes easier to communicate hard ideas.

That's what's up with Haskell's do notation.

We see this flattening a lot, in the space of programming languages.
A classic example is method call syntax, going from `foo(bar(baz))` to `baz.bar().foo()`,
which makes it easier to flatten a chain function calls, eliminating nesting along the way.
And in imperative languages, the sequencing of statements with `;`
can be seen as a kind of flattening composition in of itself.
Notational tweaks like these, while seemingly simple,
can make it a lot easier to express hard programs,
and thus solve hard problems.

That's all for today. In a future post, I hope to explore how Koka's
*with* *notation* is a variation of Haskell's do notation
specialized for modeling Algebraic Effects using the Free
Monad. Until next time!

<div class="boxed">

Thank you to my friend [Uzay](https://www.uzpg.me/) for reviewing an earlier draft of this post!
(It has been sitting on my hard drive for way to long.)

</div>
