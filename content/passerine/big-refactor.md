+++
title = "Don't let refactors turn into rewrites"
date = 2022-03-26
draft = true
+++

Oftentimes when we're writing code, we realize obvious 

About a year ago, I branched off `dev` and 

# Original scope of changes

# Plan of attack

# Going off the rails

# Refactoring types
One of the first things I wanted to fix was the representation of types used. Each Abstract Syntax Tree (AST) within the Passerine is represented as a flat enum, something like:

```rust
pub enum AST {
    Symbol(String),
    Data(Data),
    Block(Vec<Spanned<AST>>),
    Form(Vec<Spanned<AST>>),
    Group(Box<Spanned<AST>>),
    CSTPattern(ASTPattern),
    ArgPattern(ArgPattern),
    Tuple(Vec<Spanned<AST>>),
    Assign {
        pattern:    Box<Spanned<ASTPattern>>,
        expression: Box<Spanned<AST>>,
    },
    Lambda {
        pattern:    Box<Spanned<ASTPattern>>,
        expression: Box<Spanned<AST>>,
    },
    // and so on ...
}
```

Each successive pass takes a syntax tree and produces another syntax-tree-like structure. For example, Passerine's `desugar` pass takes an AST with macros and produces a Concrete Syntax Tree (CST) with macros expanded and special forms desugared.

The current Passerine compiler has 5 passes:

1. `lex`: Takes a raw source file and produces a token stream.
2. `parse`: Takes a token stream and builds a raw parse tree.
3. `desugar`: Takes a raw parse tree and removes syntactic sugar, expanding macros.
4. `hoist`: Takes a desugared parse tree and consistently resolves unique names and scopes of all variables.
5. `gen`: Takes a nominally-resolved parse tree and writes out (unoptimized) bytecode.

As you can see, each pass is essentially 'take an `X` and build a `Y`', where `X` is the output of the last pass and `Y` is the input to the next.

The problem is with `N` passes, we need `N - 1` intermediate types. In the current Passerine compiler, these intermediate types have emerged over time:

1. `lex -> parse` uses `Vec<Token>`.
2. `parse -> desugar` uses an Abstract Syntax Tree `AST`.
3. `desugar -> hoist` uses a Concrete Syntax Tree `CST`.
4. `hoist -> gen` uses a Scoped Syntax Tree `SST`.

Aside from the fact that these names don't really tell you at where in the compiler pipeline you are, as more passes are added, we'll have to add even more types. 

However, each successive intermediate type is very similar to the type before it. For example, the difference between the `CST` and `SST` is as follows:

```diff
  pub enum ST {
-     Symbol(String)
+     Symbol(UniqueSymbol),
      Lambda {
          pattern:    Box<Spanned<STPattern>>,
          expression: Box<Spanned<ST>>,
+         scope:      Scope,
      }  
  }
```

We're really doing two things in this pass: Replacing all variables that represent the same values with a unique index, and determining the set of all unique variables captured by a closure (a `Scope`). Although this pass requires traversing the entire `CST` and building a new `SST`, the rest of the 9 or so variants in the tree remain essentially identical.

So as a part of this refactor, I decided to represent portions of the AST using generic enumerations. For example, in place of the massive `AST` shown earlier, in the new Passerine compiler we represent it as follows:

```rust
pub enum AST {
    Base(Base<Spanned<AST>, SharedSymbol>),
    Sugar(Sugar<Spanned<AST>, SharedSymbol>),
    Lambda(Lambda<Spanned<AST>>),
}
```

As you can guess, the `desugar` pass produces a CST which just removes, well, the `Sugar`:

```rust
pub enum CST {
    Base(Base<Spanned<CST>, SharedSymbol>),
    Lambda(Lambda<Spanned<CST>>),
}
```

And likewise, the `hoist` pass replaces `SharedSymbols` with `UniqueSymbols` and attaches a scope to each closure:

```rust
pub enum SST {
    Base(Base<Spanned<SST>, UniqueSymbol>),
    ScopedLambda(ScopedLambda<Spanned<SST>>),
}
```

As you can see, future passes can reuse componenents declared in previous passes. For example, a future typechecking pass might produce a Typed Syntax Tree (TST) defined as follows:

```rust
pub enum TST {
    Base(Base<Spanned<Typed<TST>>, Typed<UniqueSymbol>>),
    ScopedLambda(ScopedLambda<Spanned<Typed<TST>>>),
}
```

But what are the downsides? 

The most glaring issue is the number of nested generics. Instead of simply listing all possible syntax tree nodes in each syntax tree `enum`, the compiler generates them for us when it monomorphises all the generics. This can also sometimes make it harder to annotate with the types being returned, meaning we have to use type aliases to keep our code clean.

Another minor annoyance is that we now have to do nested pattern matching. Instead of matching on each variant of the `CST` enum, we now must match on each variant of `Base` and `Lambda`. In essence:

```rust
match cst.item {
    CST::Data(data) => /* ... */,
    CST::Symbol(name) => /* ... */,
    CST::Block(block) => /* ... */,
    // snip...
    CST::Lambda { pattern, expression } => /* ... */,
};
```

Becomes:

```rust
match cst.item {
    CST::Base(Base::Data(data)) => /* ... */,
    CST::Base(Base::CST::Symbol(name) => /* ... */,
    CST::Base(Base::CST::Block(block) => /* ... */,
    // snip...
    CST::Lambda(Lambda { pattern, expression }) => /* ... */,
};
```

This redundancy (e.g. `CST::Base(Base::Data(...))` vs `CST::Data(...)`) adds unessary visual noise, and just makes dealing with ASTs a little more annoying.

On top of this, because we've factored out common items into `Base`, we can not add or remove new items to `Base` without touching every pass. This goes for every other 'mixin', like `Sugar` or `Lambda`. This means that if a certain pass doesn't require a variant in say `Base`, we have to remove that item from `Base` and add it to every other syntax tree as a new variant. This changes a two-line diff for a trivial change into a twenty-line diff touching basically every file in the compiler. Yikes.

Now you might ask, "How do compilers with a lot of passes deal with this sort of thing?" There aren't really any right answers, but generally:

1. Make each pass use an explicit type (Passerine's old compiler)
2. Factor out common variants and use generics or interfaces (Passerine's refactored compiler)
3. Use mixins / macros / the visitor pattern to factor out common variants while producing 'flat' generic-less syntax trees. (Most OO languages).
4. Use macros to generate each successive syntax tree from the previous one based on differences. (The nanopass compiler framework).
5. Screw it, take the union of all syntax trees and use the same type for every pass, what could go wrong?

Now I wouldn't be opposed to trying `3` or `4`, or just going back to `1`, as they might result in cleaner code. However, I've already spent a months refactoring everyting to use `2`, and I'm honestly not sure whether the grass is greener on the other side.

A rewrite is just a second-order refactor. A rewrite happens when you're refactoring something, but decide to change some underlying invariant before performing the refactor.

My mistake with Passerine was trying to add new features to the language while also changing the underlying representation used in each pass. It quickly became untenable, as now I don't only have to deal with fixing broken features, but fixing broken features leveraging broken-perhaps-leaky abstractions.

In hindsight, it would've been a lot smarter to break big-refactor into a number of smaller refactors. Instead of changing everything all at once, I could've:

1. Put in a small PR changing the syntax trees from flat variants to generic grouped variants.
    a. This PR could've been reviewed in isolation, which might've shown it was more trouble than it was worth.
2. Put in small PRs refactoring each stage of the compiler pipeline.
    a. Because the underlying types are fixed, each pass just has to worry about maintaining being an `A -> B` overall, instead of an `X -> Y`, where both `X` and `Y` are moving targets.
    b. Because each stage is fixed, multiple PRs could've been worked on in parallel, and outside contributers could've pulled and worked on each one, instead of the massive dumpster-fire that is `big-refactor`.
    c. Because each PR can be merged incrementally, it's easier to catch any regressions that may be caused in later stages.
3. Put in small PRs adding new passes to the compiler pipeline.
    a. Fundamentally, adding a new pass is just turning an `X -> Z` into an `X -> Y -> Z`. 
    b. If `X` and `Z` are both fixed, we really just need to define another type `Y` for that pass, and implement it.
    c. Again, sp

# Throwing out the tests

I think the point at which `big-refactor` became a rewrite is when I commented out a large portion of the tests. After I refactored the way abstract syntax trees were represented, lots of tests didn't type-check. 

I really wanted to make sure that the new representations worked in the existing pipeline, so I commented out the unbuildable tests and fixed bugs as they arised. As the refactor diverged more and more from what the tests originally tested, they became less and less useful, until they reached the point where I decided to delete them.

Deleting the tests was a bad idea, as now there is no longer a harness to ensure that the refactored code matches the behavior of the original code. This firmly put `big-refactor` in rewrite territory.

# Lessons learned 

1. If you're refactoring, limit the scope of the refactor. If you're tempted to extend the scope, or realize that something else has to change first, don't let the sunk-cost fallacy stop you from pushing through. Put the refactor on pause, merge an independent PR fixing the prerequisite issue, and then rebase your refactor against the new main branch.

2. Never ever *ever* do a second-order refactor. Instead of branching off your refactor to refactor your refactor, take a deep breath, finish what you have now, merge that into `master`/`main`/`dev` or whatever, and branch a new feature off of the merged branch.

3. Try to keep features and refactors orthogonal. If you're refactoring something, don't add new features; likewise, if you're adding new features, do the minimal refactoring necessary to implement that feature, or, even better, do the refactoring separately *before* implementing that feature.

4. Tying up the entire project in a big refactor has negative consequences. I've had a number of people come up wanting to work on something, only to get discouraged because `big-refactor` was such a mess or `master` wasn't being actively developed.

# Wrangling back control

So what do you do when you wake up one morning, realizing you're knee-deep in a year-long rewrite with no end in sight? 

1. First, I killed scope creep. I made a list of features that would be included, and features that would not. Everything outside of scope (typechecking, etc.) I decided not to worry about at all.

2. I tackled the refactor one step at a time. Instead of touching everything at once, I focused on the lexer, then the parser, and so on, making sure the entire compilation pipeline build and worked up until that point.

3. I wrote lots of tests using property-based testing at each point. This helped cement the behavior of each previous pass, and caught many edge-case regressions in the rewrite that I would've otherwise missed.

# Conclusion

I think I'm secretly terrified of working in public. I don't want to break the build. When I started Passerine, there weren't any eyes on the project. I was free to push broken code to master, move fast, break things. But the moment people started expressing interest, my approach shifted. I focused on documentation, tooling, building a community. I kept working on the compiler, but I no longer felt comfortable pushing to master so frequently. A CI build fail caused an instant panic as I fought the clock to debug whatever regression I introduced.

I think `big-refactor` provided an escape from that. I could break the build as much as I wanted. as long as I was pushing out changes, I felt as though I was making progress. And yet, with all the 'progress' I've made, why do I feel as though I have nothing to show for it?
