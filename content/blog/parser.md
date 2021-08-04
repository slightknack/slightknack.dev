+++
title = "A Tiny Introduction to Parsers"
date = 2020-07-08
+++

 # A Question
 The other day, someone asked how parsers worked on The Programmer's Hangout Discord server. Here's an an abridged version of my explanation.
<!-- more -->
 # My Response
 A parser simply takes a stream of data and from it produces a datastructure. This stream is usually a stream of tokens, which are groups of tagged delimiters and data used to construct the datastructure.

 Let's assume you're building a parser for a programming language; the parser converts a file to an abstract syntax tree. We start with a file; in this case, it's **AverageScript**:
 ```javascript
 for i in [1, 2, 3] {
     print(i)
 }
 ```
 And lex it into a series of tokens by walking over the file linearly. So, for instance:
 ```plain
 for: keyword
 i:   identifier
 in:  keyword
 [:   delimiter
 1:   number
 ,:   separator
 2:   number
      ... snip ...
 }:   delimiter
 ```
 This is the stream of tokens that will be fed into the parser to form the **ast**. So, how exactly does a parser work?

 There are quite a few different kinds of parsers, but they all essentially reduce to the same set of steps:
 - Look at the next few tokens to determine what is being parsed
 - For each sub-section of what is being parsed, repeat this process.
 - Using this information, build the datastructure.

 Most parsers are recursive for this reason; for example, in most languages, a function call can contain another function call:
 ```python
 foo(bar(1, 3))
 ```
 Instead of manually writing out cases for nesting, after we determine we're looking at a function, we simply parse the contents of `foo(...)` according to some pre-defined rule.

 So returning to our original case: how might a parser parse the `for i in ...`?

 Assuming some form of a recursive descent parser:

 1. The parser sees `for` and determines a for loop is being parsed; In this made-up language, a for loop has three components, an identifier, an iterator, and a body.
 2. It takes the next token, `i` and checks that it's an identifier.
 3. It takes the next token, `in` and makes sure it's the in keyword.
 4. It recursively evaluates the next series of tokens as an expression
     1. It sees `[` so it starts parsing as a list
     2. It sees `2` and adds it to said list
     3. And so on until the entire list is parsed
 5. It checks for `{` delimiting a for body
 6. It recursively parses the next few tokens as a block of code
     1.  and so on until the entire code block is parsed
 7. It checks for `}`, ending the for loop
 8. It constructs a for node and returns it.

 The end of this process might result in an **ast** that looks like so:
 ```rust
 For {
     identifier: i,
     expression: List {
         items: [1, 2, 3]
     },
     body: Code {
         statements: [
             Function {
                 identifier: print,
                 arguments: [i],
             },
         ],
     },
 }
 ```

 This **ast** can then be walked, interpreted, compiled, etc. There exist common formats to describe parsers; one such format is Extended Backus-Naur Form. Many parsing techniques exist; what I described models a **ll(1)** parser. Many parsing models exist; to learn more about them, I recommend you check the Parsing Wikipedia page.

 So, to summarize:

 - A parser takes a stream of data and builds a data-structure
 - Parsers generally work in a recursive manner by defining a set of rules that can be efficiently transversed.
 - Parsers can be formally described.
 - Many different parsing methods exist.

 I hope this helped clear some things up 🙂.
