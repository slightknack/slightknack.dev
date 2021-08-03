+++
title = "Thinking about CPU-friendly backing stores for a CRDT"
date = 2021-08-02
+++

> This is a first draft, reader beware!

A *Conflict Free Replicated Datatype* is a bit like a smoothie, meaning the same ingredients will produce the same result, regardless of the order of the order in which they are added. If that attempt at analogy was painful, here's another go: A CRDT is like a git repository that never can have a merge conflict.

There are many different ways to approach the construction of CRDTs, but I'll be talking about a fairly simple one, known a *Replicated Growth Array* (RGA). In short, we represent documents as a tree of strings - a bit like a rope - and provide an algorithm for merging new entries into the existing tree. That algorithm looks something like this:

```rust
fn automerge_insert(&mut self, entry: Entry<T>) {
    let parent_index = self.find_item(entry.parent); // (1)

    let mut index = self.contents.len();
    for i in parent_index..self.contents.len() {
        let old_entry = &self.contents[i]; // (2)
        if entry.seq > old_entry.seq { index = i; break; }
        let old_parent_index = self.find_item(old_entry.parent);

        if old_parent_index < parent_index
        || (old_parent_index == parent_index
            && (entry.seq == old_entry.seq)
            && entry.id < old_entry.id
        ) { index = i; break; }
    }

    self.contents.insert(index, entry); // (3)
}
```

You don't need to understand how this works for now (If you do, see [here](https://josephg.com/blog/crdts-go-brrr/)), I just want to draw your attention to the three comments I've marked:

1. `self.find_item(...)` This algorithm needs a backing datastore in which entries can be found quickly by key.
2. `self.contents[i]` This datastore must also be ordered, and easy to iterate through.
3. `self.contents.insert(index, entry)` This datastore must support efficient insertion of new elements.

In the above example, we're using a Rust `Vec`, which is akin to a dynamic growable array. This is really efficient in cache, but horrifically slow for insertion and indexing by key.

In light of this, a few have come up with better backing data structures - the most common ones being slightly modified Ropes, or slightly modified Range Maps. These work great in practice, but still have some overhead for looking up values by key.

I've been thinking about this for the past few days, and I think I have a solution, which is an append-only log + a backing tree for efficient searching. Here's what that looks like.

## Backed Tree Log
An Id uniquely identifies each item in the CRDT. For our purposes, we'll be representing Ids as three-tuples of a User's Id, the entry's log index, and the specific character within that entry:

```rust
// User is also a usize under the hood
struct Id(User, usize, usize)
```

An entry contains some information about the surrounding nodes:

```rust
struct Entry {
    start:  usize,
    length: usize,
    parent: Id,
    seq:    usize
}
```

Note that instead of embedding the item directly in the struct, we're using `start` and `length` to keep track of it? What's that all about? For each `User` in the CRDT, we keep track of a column, that looks something like this:

```rust
struct Column<T> {
    user:    User,
    backing: T,
    entries: Vec<Entry>,
}
```

`backing`, of course, is something that can be indexed and appended to, like a `String` or a `Vec`. Whenever we create a new entry, we append the contents onto `backing` (or look them up if they already exist in `backing` - more on that later) and include the `start` and `length` of those contents with respect to `backing`. It's important to note that both `backing` and `entries` are append-only. This makes it insanely trivial to synchronize over the network - just send what's been added - and can be cryptographically signed and verified using a backing merkle tree, a la DAT.

Remember that the second field of `Id` contains the *index* of an `Entry` in a `Column`. This means that, given an `Id`, we can locate the corresponding `Entry` in `O(1)` time. But how to we preserve order?

We use a set of `Columns` to form a `TreeLog`:

```rust
struct TreeLog<T> {
    // could use a BTreeMap instead
    columns: HashMap<User, Column<T>>,
    tree:    RangeMap<Id>,
}
```

As mentioned earlier, we need a way to *order* every entry, so it's fast to index into the datastructure. To do this, we build a backing `RangeMap`. This `RangeMap` stores the `Id` of each entry, across multiple users, in total order. Thus, both traversing the CRDT by `Id` in order, and being able to quickly index into the tree in a reasonable amount of time (`O(log N)`) become feasible.

## Takeaways
Returning to our three original goals:

1. A backing datastore in which entries can be found quickly by key. We do this through an append-only log, identified by index.
2. Must also be ordered, and easy to iterate through. We do this through an auxiliary Range Map. 
3. Must support efficient insertion of new elements. The log is append-only, and insertion is fast for Range Maps.

The auxiliary range map can be built entirely from the content of `columns`, through a modified version of `automerge_insert`. I think I'd call this `automerge_sort`, as it's building an ordered tree by performing a merge sort across all columns. I might right a bit more about this algorithm in the future.

It's also good to know that traditional CRDT operations, like insertion, deletion, etc. do not require a full rebuild of either the `tree` or the columns in it - i.e. both can be updated in a reliable manner, whether that be via insertion, or through some other mechanism.

This whole spiel is CPU-friendly, of course. Almost all data is stored in cache-friendly Vecs; Range Maps, although less ideal, will be smaller than usual when compared to the way they're *usually* used as the only backing store for CRDTs.

Also, note that the generic `T` is not an individual entry, but a *collection* that can be indexed into. We do this so we can put everything into a single backing store per-user. To uphold the CRDT invariant that everything must have a unique ID and sequence number, when inserting we increment the sequence number by the length of the entry.

I hope what I've presented makes some sense, I just wanted to get my heads out of my head and onto proverbial paper. If you're interested in what becomes of this project, I've put a [GitHub repo up](https://github.com/slightknack/together/) that contains some preliminary work, and is where I plan to explore the idea further.

Dear reader, you've reached the end!
