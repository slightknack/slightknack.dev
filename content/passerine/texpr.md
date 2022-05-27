+++
title = "Capturing the magic of Lisp"
date = 2022-05-27
draft = true

[extra]
artbit = "1_hand.png"
+++

This is a quick post so let's just jump right in:

If you've never read [Homoiconicity isn't the point](http://calculist.org/blog/2012/04/17/homoiconicity-isnt-the-point/), drop everything you're doing, and read it now!

... Welcome back.

The central thesis of the post is front-and-center:

> Maybe there’s a more precise way to define homoiconicity, but frankly I think it misses the point. What makes Lisp’s syntax powerful is not the fact that it can be represented as a data structure, **it’s that it’s possible to *read* it without *parsing***.

For lisp, this means that we can determine the structure of the language without knowing the exact constructs used. For example, in something like JavaScript:

```javascript
if (number == 7) { 
    console.log("Nice");
}
```

parses into a valid abstract syntax tree (AST), whereas:

```javascript
crikey (number == 7) {
//                   ^ SyntaxError: Unexpected token '{'
    console.log("Nice");
}
```

is a syntax error. This is because the way the program parses depends on the specific keywords and syntactical elements used. Lisp gets around this problem by using `s-expression`s, or nested lists between parenthesis. Before we parse the program, we can **read** it into an unambiguous intermediate structure. In other words:

```clojure
(if 
    (= number 7)
    (display "Nice"))

(crikey 
    (= number 7)
    (display "Nice"))
```

will always read the same way. Now `crikey` may not actually mean anything, but the point is that, from the perspective of a macro, both the built-in form `if` and the macro form `crikey` process the same underlying structure. Syntax representation is not dependent on specific syntax.

The power of lisp is that of the *form*, lists of nested lists. Lisp as a language is specifically designed for processing lists. **Because Lisp uses lists to represent the itself, lisp makes a natural substrate for processing itself.**

To represent forms, lisp uses *s-expressions*. These expressions are series of atoms or lists grouped by parenthesis. What's nice about s-expressions is that they're unambiguous: just match parenthesis.

When I set out to design Passerine, I wanted to include a powerful lisp-like macro system *without* the need for highly-parenthesized *s-expressions*. I know that alternative syntaxes for lisp have been proposed, most notably (sweet-expressions)[https://readable.sourceforge.io/] and (i-expressions)[https://srfi.schemers.org/srfi-49/srfi-49.html].

However, most alternative syntaxes work by inferring parenthesis so that they may be transformed to s-expressions.