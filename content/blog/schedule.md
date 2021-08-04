+++
title = "Architecting Asynchronous Schedulers"
date = 2020-07-10
+++

# Note
This post explores one design methodology for asynchronous schedulers in the context of a language that is maximally asynchronous, *i.e.* everything is executed asynchronously. This post is largely a reflection of trying to grapple with [this blog post about Tokio's scheduler](https://tokio.rs/blog/2019-10-scheduler/)
<!-- more -->
> ## Another Note
> This document was written around the time I started formulating Passerine. The general goal of this post, with respect to Passerine (that still exists fwiw), is to implement such a scheduler in `aspen` and use ffi hooks to automatically schedule the execution of passerine programs in an asynchronous / parallel though effectually temporally correct manner.

# Introduction
As we approach [the end of Moore's law](https://rodneybrooks.com/the-end-of-moores-law/), we can no longer rely on increased processor speed to increase the performance of our software. In recent years, computers are being shipped with more **CPU**s Cores and Memory, but naïve single-threaded applications do not take advantage of this.

*Asynchronous programming* has been becoming popular, but faces a [few core issues in terms of design](http://journal.stuffwithstuff.com/2015/02/01/what-color-is-your-function/). Although *futures* have made some headway in recent years towards resolving this issue, the small overhead of writing asynchronous code prevents many from doing so in practice.

In a perfect world, programs would be maximally parallel, using *dataflow analysis* at compile time to determine which operations can be done in parallel. The main issue with this, however, is that compile-time dataflow analysis is expensive, requiring `O(n²)` time. In this post, we'll explore the architecture of what automatic runtime parallelism may look like.

# Everything is Asynchronous
When writing asynchronous code, it is common to use the *async/await syntax* to denote asynchronous functions. The issue with this is that [asynchronous code is contagious](https://en.wikipedia.org/wiki/Async/await#Benefits_and_criticisms) — any function calling asynchronous code must be declared `async`, and asynchronous function calls must be `await`ed. On the other hand, async/await allows for asynchronous code to be written in the same manner as traditional code; in the case the no parallelism is possible, async/await-ed code won't take much longer than its single-threaded counterpart.

The only downside to fully asynchronous code is the overhead of scheduling the execution of said code. However, as we'll soon see, it's possible to design asynchronous execution schemes with minimal overhead.

# Designing a Scheduler
When an asynchronous function is called, it does not immediately execute; rather, it immediately returns a [future](https://en.wikipedia.org/wiki/Futures_and_promises), which is a *promise to evaluate to a value in the future*, and is scheduled for execution.

To evaluate an awaited future, all values the future depends upon must be known. A future whose arguments are resolved is *calculable*, or 'ready', and one whose arguments are unresolved is *incalculable*, and hence 'waiting' for it's arguments to resolve.

A *process* takes a ready future and resolves it, possibly creating more futures while doing so. Processes are also non-blocking, meaning that they do not depend on the futures they create to terminate to finish executing the current future.

A *scheduler* manages futures and distributes ready futures (we'll call them tasks from now) to processes for execution. Naïvely, a simple scheduler might maintain a simple global queue of futures and distribute tasks to processes for resolution.

There are a few issues with a global queue — primarily, expensive synchronization between processes is required to keep the queue in a valid state. Luckily for us, there has been much research surrounding scheduler design. A good scheduler should do the following:

1. Maintain task locality
2. Limit synchronization between processes
3. Evenly distribute tasks among processes
4. Not waste time searching for ready tasks.

## Maintaining Task Locality
Processes working on a task should complete sub-tasks related to the task they're working on. This speeds up the execution of tasks as they will not have to be sent between processes, and processes will not have to wait for others to finish tasks they may depend on.

So how does a scheduler maintain task locality? The general consensus seems to be giving each task its own queue rather than synchronizing a global queue. Whenever a process spawns a new future, it adds it to its own queue, and when a process needs a new task, it pulls from the queue of tasks it has accumulated.

A process with its own queue may limit cross-process synchronization, but it does not ensure the workload is evenly distributed. One process could accumulate a large number of tasks, while others remain idle, already having completed the work they were assigned. So, how do we evenly distribute tasks among processes?

## Evenly Distributing Tasks Among Processes
When a process has run out of work to do, it should be able to aquire more work. To do this, it 'steals' work from sibling processes. This is known as a work-stealing synchronizer, and is used by languages like Go, Kotlin, and Rust (Tokio).

The way we'll implement stealing is simple. When a task has run out of stuff to do, it selects a sibling at random, and attempts to steal half their tasks.

## Time is Short — Savor it
But what if there are few tasks to steal? Processes shouldn't waste **CPU** time trying to steal from others in vain. A processor with nothing better to do should do nothing. We'll call the state of doing nothing *sleeping*. If a process attempts to steal from another awake process and finds nothing, it goes to sleep. If it is able to steal successfully, it tries to wake up a random process to further the distribution of work.

This wake-up/sleep mechanism smoothly ramps the number of awake processes to match the computational workload.

## A Small Optimization
When a process spawns a new future, that future may immediately be ready to run. Processes don't want to waste time cycling through waiting tasks in their queue. So, if a process spawns a new ready future, it stores it in a special 'next' slot, which it always checks before searching the queue. If there is already a task in the next slot, it is simply moved to the back of the queue. This ensures that the process almost always has access to a ready task, and doesn't have to waste time searching.

Additionally, a processes queue may be completely full of waiting futures. If a process cycles through its entire queue and all futures are waiting, it goes to sleep. While asleep, the process can still be stolen from, it just prevents the process from cycling repeatedly, searching for a new task.

## Dataflow Analysis
Dataflow analysis is the act of building a graph of how data flows through a program. Traditionally, it has been used within the framework of compile time to determine the set of possible values that may be used at. However, dataflow analysis also determines which values are dependent on others. Asynchronously executing independent code can increase the speed at which certain series of operations can be done by parallelizing operations that can be done in parallel.

Instead of building a static external data-dependency graph, our above implementation intrinsically builds a graph of operations dynamically. In a sense, we store a slice of the graph at each moment in time, computing our way down the graph as time goes on.

# A Quick Summary of Our Scheduler
**In short:** A process can be searching for more tasks, running tasks from its own queue, or sleeping.

When a process is searching, it:

1. Selects a random sister process and tries to steal half her tasks.
2. If the sister has no tasks and is awake, the stealer goes to sleep.
3. If the stealer steals successfully, it tries to wake up another process at random.

When a process is running, it:

1. Checks the next slot for a task.
2. If no task is found, it cycles through its futures queue until it finds a task.
3. If no futures are ready, it goes to sleep.
4. If the queue is empty, it starts searching.
5. Once a task has been found, it runs it.
6. Any new tasks created while running are pushed into the next slot, moving the previous task in that slot to the end of the queue.
7. Any new waiting futures are pushed to the end of the queue.

When a process is sleeping:

1. It waits to be woken up. It can still be stolen from, etc., but it isn't doing anything.

# Takeaway
Asynchronous programming will be a big deal in the years forward as we obtain access to more cores and reach the end of Moore's law. By designing languages to be asynchronous-first, programmers can take advantage of the increased efficiency that they bring.

In this post, we discussed the design a simple *work-stealing scheduler* that limited synchronization and evenly distributed the workload among processes.

Asynchronous programming will be an interesting component of language design going forward, and it will be important for programmers to understand how to write asynchronous code. In **Part II**, we'll implement the above schema.

---

[Discuss this post on HN](https://news.ycombinator.com/item?id=24722178).
