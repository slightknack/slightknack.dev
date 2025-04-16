+++
title = "Replication > REST"
date = 2025-04-16

[extra]
artbit = "1_cabinet.png"
+++

> I'm publishing a backlog of writing I've done. Read [the first post](/blog/writing) for more context. On today's menu: I have been thinking about CRDTs and synchronization for a few years (e.g. this [old post](/blog/backing-crdt-store) about CRDTs). I'm a fan also of functional-relational programming (but think in its purest form it can look *so much cooler* than React). In the post that follows, I try to pull some of these disparate threads together. Enjoy!

# Stop Building Databases

<p class="tag">
2023-12-02 · Isaac Clayton · In response to <a rel="noopener nofollow" target="_blank" href="https://sqlsync.dev/posts/stop-building-databases/">Stop Building Databases</a>

It pains me to admit how long it took for me to understand the *raison
d'être* of databases. For the longest time I thought of databases as
bloated storage engines for "webscale" projects. This dangerous line of
thought may be due to my exposure to database ORMs in Python
[while using Flask as a child](https://github.com/Tloru/NovelWrite).

(I really didn't understand what I was doing at the time and just
copy-pasted ORM code and SQLite migrations, praying that it would work.
When the migration inevitably failed, I'd just delete the database and
start over… which defeats the *entire* purpose of having a database, and
is probably why I never learned to trust them.)

Today, I am happy to report that my understanding of databases is a
little more mature. A while back I read *Designing Data Intensive Applications* (what a great read!). I now understand that
databases are engines for managing and querying state (no way!); I understand why relational modeling encodes real-world data so readily
and the benefits of normalization; the purpose of consistency guarantees and distributed
consensus; the need for a relational query language. (Objects are not
relations, and ORMs fundamentally *cannot* capture this distinction.)

It pains me that SQL is such an… *unergonomic* language. I can't bring
myself around to invest the time it would take to truly master it. I
have lingering hopes that a newcomer like PRQL will become popular
before I take the plunge and learn all of SQL's little warts. In the
meantime, however, I'll remain partial to relational logic languages
like prolog or datomic datalog. Until PRQL usurps the old guard, you can
find me messing around with miniKanren from the comfort of my own home.

Which reminds me: datomic datalog's tight integration with Clojure is, I
believe to be, a step in the right direction. The functional-relational
ideal has always been the inclusion of relations in the language
*itself*. There's this beautiful mapping between functional *relational*
programming and functional *reactive* programming. What is reactive
programming but code that incrementally updates when underlying data
relations change?

On the web, if you're doing reactive programming, you're probably using
React. It is an oft-quoted mantra that UI should be a function of
application state. Managing application state is hard (...this is why we
have databases). React's development has driven this huge
Redux-industrial complex of libraries seeking to be the one true manager of application state. As we
approach the limit, Greenspun silently pines an echo lost to time, "any
sufficiently complicated Redux cache is an ad hoc implementation of half
of Postgres."

Greenspun, a pioneer of database-backed websites, probably groks the
irony. We have a full *relational* database on the backend, and a fancy
*reactive* UI on the frontend, and they're synchronized by… manually
exchanging handcrafted trees of data? In a perfect world, there is no
manual synchronization: the app should be a function of database state.
In practice, however, we cache a poor denormalized copy of a database in
the browser and synchronize it through REST, or maybe GraphQL. (If you're
lucky?) It's 2023, *why*?

Synchronizing state through REST is like emptying a lake with a cup.
Open the floodgates, replicate the database client-side, and a sea of
possibilities opens up. What would websites look like if we could query
a replica of a database from the browser?

This is the amable vision of [local first software][local], that "everyone owns
their data, in spite of the cloud". With this shift in perspective, we
can imagine a React app that reactively streams database updates
between the browser's replica and other computers they own (or the cloud). (To paint a fuller
picture of this vision, see Geoffrey Litt's [talk on Riffle and reactive
relational state][litt].)

These are all old ideas cast in a new light, of course. There are a
number of competing client-side data synchronizers: the most promising
solutions generally follow the pattern of wrapping a small relational
database (like SQLite) with conflict-free replicated data types (CRDTs).

I *love* CRDTs, but must remain clear-eyed. Having written and worked
with CRDTs, I can say that they are no silver bullet. CRDTs enforce
eventual consistency by maintaining *local invariants*. They guarantee
nothing about the *global validity* of merged states. As time progresses,
the need for "authoritative servers" will become clear: it is impossible
to enforce global invariants using CRDTs, and clients can't be trusted
to always be honest.

This limitation leads to a nice business model for database replication
companies, I guess: keep the popular CRDT libraries open source and easy
to integrate, but charge a subscription for hosted conflict resolution
of global invariants, and long-term state storage. I'm certain you could market that a little better,
and I'm certain people will.

[stop]: https://sqlsync.dev/posts/stop-building-databases/

[local]: https://www.inkandswitch.com/local-first/

[litt]: https://www.youtube.com/watch?v=zjl7CpG9h3w

<p class="tag">~540 words in 47 minutes, 11 wpm sustained</p>
