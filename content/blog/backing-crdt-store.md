+++
title = "Thinking about efficient backing stores for CRDTs"
date = 2021-08-02
+++

A *Conflict-Free Replicated Datatype* is a bit like a smoothie: the same ingredients will produce the same result, regardless of the order in which they are added. In the context of, say, text editing in a distributed context, merging two documents will always succeed in a deterministic manner. In other words, A CRDT is a bit like a git repository that never has merge conflicts.

There are many different ways to approach the construction of CRDTs, each construction having its own strength and weaknesses. Today, we're going to focus on creating out an efficient backing store for a particular family of algorithms known as *Replicated Growth Arrays* (RGA).
<!-- more -->
Before we begin, though, I guess I should establish my motivation for writing this piece. I can't begin to think about CRDTs without also considering distributed network topologies, and peer-to-peer collaboration. My goal, for this article, is to lay out the skeleton of a backing store for CRDTs that is both easy to work with in-memory and easy to replicate over the network. I hope you'll see how the solution I derive addresses both these goals.

Under RGA, we represent documents as trees of strings. If this sounds familiar, that because it's a bit like a [Rope](https://en.wikipedia.org/wiki/Rope_). To ensure that these trees always merge, we provide an algorithm for merging two trees together in a deterministic manner.

The merging algorithm behind RGA is pretty elegant. Each character in the tree points to the one before it. If two characters have the same parent, we order them from back to front, the latest character going first (sorting by user in case of a tie).

![An image of an RGA tree spelling out the word "Cat!"](/content/crdt-rga.svg)

In the above example, Bob typed `C!`. Later, Mia slides in and makes a two character edit by inserting the letters `at` after `C`, so the document now reads `Cat!`. When Bob synchronizes her changes, they're inserted before the `!`, because her edits happened happened later. Now both Bob and Mia have `Cats!` on their screen!

Note that although *conceptually* RGA operates on trees, implementation-wise, it's not a requirement. Trees are an inefficient substrate for RGA for a number of reasons, the largest being wasted space and the fact that they don't play well with the L1 cache. If we flatten the tree out into a list (still inefficient for other reasons), the RGA insertion algorithm discussed above looks something like this:

```rust
// Adapted from https://josephg.com/blog/crdts-go-brrr/
// Insert an edit (the `Entry`) into a CRDT (`self`)
fn automerge_insert(&mut self, entry: Entry<T>) {
    // (1) Insert at least after parent
    let parent_index = self.find_item(entry.parent);

    let mut index = self.contents.len();
    for i in parent_index..self.contents.len() {
        // (2) Compare to later entries
        let old_entry = &self.contents[i];
        if entry.seq > old_entry.seq { index = i; break; }
        let old_parent_index = self.find_item(old_entry.parent);

        // Check if this is the right spot
        if old_parent_index < parent_index
        || (old_parent_index == parent_index
            && (entry.seq == old_entry.seq)
            && entry.id < old_entry.id
        ) { index = i; break; }
    }

    // (3) Insert entry at the right spot
    self.contents.insert(index, entry);
}
```

I'm not going to go into how this works in a lot of detail (If you'd like to, take a look at [this](https://josephg.com/blog/crdts-go-brrr/)!). But there are a few things I think are important to note.

Each of the numbered comments (`(1)`, etc.) annotates a performance-critical or otherwise common operation. Based on these requirements, we can derive a decent picture of what a good backing data structure should look like:

1. When we call `self.find_item(...)`, we're trying to lookup the index of an id. Thus, this algorithm needs a backing data structure where entries can be found quickly by key.

2. Later, in `self.contents[i]` we iterate through the array in a sequential manner by index. For this reason, the data structure must be ordered, indexable, and easy to iterate through.

3. Finally, we need to actually perform the insertion. `self.contents.insert(index, entry)` does the trick, but this is a very slow operation for arrays as all later elements must be reallocated. A good data structure should support efficient insertion of new elements.

In the above example, we're using a Rust `Vec`, which is a dynamically growable array. Vectors are really efficient in cache, but as mentioned, horrifically slow for insertion (which requires reallocation) or indexing by key (an `O(n)` linear search).

In light of this, a few people have come up with better backing data structures that exist the fill the gap. Most of these are build around Ropes or Range Trees. These work great in practice, but still have some overhead when looking up entries by key or storing many small edits.

I've been thinking about this issue for the past few days, and I think I have an interesting possible solution. I'm no expert, but I do have some experience with OT and optimization, so we'll see how it goes. I'm calling this solution a *Backed Tree Log*, and it functions as an append-only log + a backing key-value tree for efficient key lookup. Here's what that looks like:

> Revised up to here

## Backed Tree Log
Each *item* in the CRDT is uniquely uniquely identified by an *ID*. For our purposes, IDs will be represented as three-tuples of a user's ID (or public key), the index of the item's `Entry`, and the specific *sub-item* within that `Entry`.

```rust
// User is also a usize under the hood
// User, entry index, sub-item index
struct Id(User, usize, usize)
```

There's an important distinction to be made between entries and items. An item is something atomic, like a character in a string or an *item* in a list. An entry is a group of items that were created at a similar time or place.

The way I find easiest to conceptualize the distinction between items and entries is as follows: instead of storing individual *letters* in a text CRDT, for instance, we store *runs* of letters as *strings*. Each *entry* operates on the level of runs, rather than at the base level of letters. Although we're grouping items together in entries, each letter is accessible as its own item.

So, an `Entry` is an edit, which may refer to a group of items. In addition to this, it contains enough information about the surrounding nodes to be able to construct a full graph from it (if needed). `seq` is the sequence number, i.e. timestamp for when the entry was inserted, and should be increased by the length of the entry so each item in the Tree Log has it's own index and sequence number. Here's the definition:

```rust
struct Entry {
    start:  usize,
    length: usize,
    parent: Id,
    seq:    usize
}
```

As mentioned earlier, it's important to note that an entry represents a run of items. To ensure we don't waste space by allocating a separate collection for each entry, all items are stored together in a larger in collection. A UTF-8 encoded `String` may be used as a backing store for some text, likewise, a `Vec<T>` may be used as a backing store for an arbitrary list of items `T`. To disambiguate what items a particular entry is referring to, we use `start` and `length` to keep track of the location of the slice within the larger collection.

> Why not `start` and `end`? By using `start` and `length`, we can ensure that `end` is never less than start. I think it's easier to write correct code when invalid states are hard to represent in general.

For each `User` in the CRDT, we keep track of a column, that looks something like this:

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

1. A backing data structure in which entries can be found quickly by key. We do this through an append-only log, identified by index.
2. Must also be ordered, and easy to iterate through. We do this through an auxiliary Range Map.
3. Must support efficient insertion of new elements. The log is append-only, and insertion is fast for Range Maps.

The auxiliary range map can be built entirely from the content of `columns`, through a modified version of `automerge_insert`. I think I'd call this `automerge_sort`, as it's building an ordered tree by performing a merge sort across all columns. I might right a bit more about this algorithm in the future.

It's also good to know that traditional CRDT operations, like insertion, deletion, etc. do not require a full rebuild of either the `tree` or the columns in it - i.e. both can be updated in a reliable manner, whether that be via insertion, or through some other mechanism.

This whole spiel is CPU-friendly, of course. Almost all data is stored in cache-friendly Vecs; Range Maps, although less ideal, will be smaller than usual when compared to the way they're *usually* used as the only backing store for CRDTs.

Also, note that the generic `T` is not an individual entry, but a *collection* that can be indexed into. We do this so we can put everything into a single backing store per-user. To uphold the CRDT invariant that everything must have a unique ID and sequence number, when inserting we increment the sequence number by the length of the entry.

I hope what I've presented makes some sense, I just wanted to get my heads out of my head and onto proverbial paper. If you're interested in what becomes of this project, I've put a [GitHub repo up](https://github.com/slightknack/together/) that contains some preliminary work, and is where I plan to explore the idea further.

Dear reader, you've reached the end!

> TODO: Incorporate lamport timestamp as discussed with 02Keith
