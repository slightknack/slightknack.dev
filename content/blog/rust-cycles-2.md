+++
title = "Dealing with Cyclic Data in Rust, Part I"
date = 2021-11-27
draft = true

[extra]
artbit = "bike.png"
+++

> Or, a *GhostCell Deep Dive*. 
> 
> In this two-part series, we build *GhostCell* from first principles. In *Part II* we derive GhostCell from scratch. If you'd like to brush up on the theory behind GhostCell, check out *Part I*.

I think it's about time we finally begin! So, what's GhostCell?

**[GhostCell](https://plv.mpi-sws.org/rustbelt/ghostcell/) is a new technique for separating _access_ to data from _permission_ to modify that data.**

> **Note:** GhostCell was developed by the awesome folks of the [RustBelt Project](https://plv.mpi-sws.org/rustbelt/), an effort to specify the formal semantics of a large subset of the Rust, which can be used to prove certain properties of Rust code. The authors of GhostCell actually discussed how they extended RustBelt to prove the correctness of GhostCell in their paper. I won't touch the proof side of things here, but if you're interested in theorem proving, I highly recommend you check out the [paper](https://plv.mpi-sws.org/rustbelt/ghostcell/paper.pdf)!

At its core, GhostCell introduces two types: `GhostCell<'id>`, which is an owned pointer to some data, and `GhostToken<'id>`, a linearly unique _token_ that allows one writer to modify a `GhostCell` at a time.

Unlike `Rc`/`RefCell`, GhostCell imposes no runtime overhead. It does this by leveraging Rust's rich type system to erase all types at compile time. In this sense, GhostCell is a safe zero-cost cell that allows for shared mutable aliasing through compile time borrow checking.

## A Quick Usage Example

Before we dig into the dirty details of how `GhostCell` works, I think we should

```
let value = GhostToken::new(|mut token| {
    let cell = GhostCell::new(42);
    let vec: Vec<_> = (0..n).map(|_| &cell).collect();
    *vec[n / 2].borrow_mut(&mut token) = 33;
    *cell.borrow(&token)
});
```

You may have noticed the little lifetime parameter `'id` attached

## Brands, `GhostToken`, and Lifetime Variance

Invariant Lifetime

> GhostToken<'id> only has one method: a constructor GhostToken<'id>::new, using the same
> pattern as we already saw with branded vectors. That is, new requires a client closure f that must
> be able to work with a GhostToken with an arbitrary brand 'new_id. Thus new picks a fresh brand
> 'new_id, creates the GhostToken<'new_id>, and then passes it on to f.

Paper

> The closure must be variant over the lifetimes, this does not always play well with closures already containing references.
> None of the branded items can be returned by the closure.

Github

> TODO: consistent styling of GhostCell and Token

## Implementing a Doubly-Linked List

## Going over the implementation of `GhostCell`

### Discussing the API

### Implementing the API

## Adding `static_rc` to the Mix!

# Fin