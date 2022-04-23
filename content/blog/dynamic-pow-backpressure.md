+++
title = "Using Proof-of-Work to Manage Backpressure"
date = 2021-12-01

[extra]
artbit = "1_small.png"
+++

> **Note:** This is a quick piece that assumes some prior knowledge of PoW and backpressure. If you want to build up an intuition about backpressure before jumping in, you could read [*this piece*](https://medium.com/@jayphelps/backpressure-explained-the-flow-of-data-through-software-2350b3e77ce7) or [*that one*](https://www.tedinski.com/2019/03/05/backpressure.html). If you'd like to learn more about PoW in the context of this article, check out [*this article*](https://en.wikipedia.org/wiki/Hashcash) (and [*that one as well*](https://en.wikipedia.org/wiki/Proof_of_work)).

On the bus this afternoon, I was reading up on backpressure in distributed systems. Backpressure, long story short, is the backward force acting on data as it moves through a system.

# What's Backpressure?
Maintaining a healthy level of backpressure is important for creating a well-running system monolithic, microservice, distributed, or otherwise. Too little backpressure and services will be spending time idle waiting for work to arrive. Too much backpressure, on the other hand, can lead to a buildup of work and fatal system resets.

One of the first mistakes I made when first building distributed systems was not paying attention to the backpressure bottlenecks of the system. Although there are many ways to classify, manage, and build systems that main consistent backpressure, one system I want to focus on is proof-of-work based rate limiting.

# Proof of Work
Proof-of-work (PoW) is nothing new. Now primarily associated with consensus mechanisms used BitCoin et al., PoW was first used an obscure email tool used to rate-limit spam and DoS attacks. In no small part due to the popularity of BitCoin, PoW has found a number of other uses.

I was prompted to write this post after re-reading the [Pest](http://pest.bitdash.io/whitepaper.html) specification, a distributed IRC-like protocol that uses PoW to maintain a steady influx of messages.

# Managing Backpressure
When managing backpressure, there are essentially two things that can be going wrong:

1. You're not receiving enough messages, meaning there's probably a *bottleneck* somewhere else in the system.
2. You're receiving too many messages, meaning *you're* probably the bottleneck in the system.

It's important to remember that not all messages sent in a distributed system are necessary for the healthy operation of the system. When a service gets too stressed, services calling that service can reduce the number of messages they're sending to improve the latency of the system (while maintaining consistent throughput).

# PoW and Backpressure
The PoW Backpressure scheme I propose is pretty simple. Whenever a node—let's call it the *client*—establishes a connection with a service it relies on—the *server*—the server returns a nonce and a work level for use in the next request. We'll call this the *challenge*:

```json
{
    "nonce": "C9B76FBD",
    "work":  3,
}
```

To make a request, the client must complete the challenge. To do so, it must calculate the hash of the request it wants to send, append the nonce, and compute `N` rounds of proof of work (e.g. repeated hashing) until the specified work level has been met. The response and corresponding *proof* are then sent to the server for processing:

```json
{
    "nonce": "C9B76FBD",
    "N":     456,
    "req":   { "..." }
}
```

PoW proofs are cheap to verify. If the server tries to validate the PoW and finds it to be invalid (incorrect `nonce` or incorrect `N`), it simply drops the message. If the proof is valid, however, the server unwraps the inner request `req` from the client and processes it as usual.

> **Aside:** Whenever the server receives a message, it should *immediately* send a new challenge to the client.

Proof-of-work acts as a natural rate limiter of requests. It requires the client to do the bulk of the work creating a valid request. This is especially important in the context of untrusted distributed contexts, where it is easy to increase the work attackers need to perform without impacting the work the server needs to do to validate correctly formed packets.

# Adjusting the rate limit
In the last section, we know how PoW can act as a rate limit. In this section I want to talk about adjusting that rate limit.

When the backpressure is too low, the work limit should be decreased; when it is to high, it should be increased. Say we have a queue of unprocessed requests `B`. We can set the backpressure as a function of the length of `B`:

Each successive work factor is twice as hard as the previous one: `2` is twice as much work as `1`, just as `11` is twice as much work as `10`. We can quantify the rate of incoming messages as:

```js
incoming = network_capacity * (2 ^ -work_factor)
```

So at a rate of `1000` messages per second when the work factor is `0`, changing the work factor to `3` would change the rate of incoming messages to `1000 * (1/8)`, or `125`, messages per second.

Let's say we want to maintain a backpressure of `K` items in queue `B`, out of the length of our queue, `len(B)`. We know we can send `outgoing` messages per second, and can estimate the network capacity given the current work factor. To calculate the work factor we want to set, we could use something like:

```js
work_factor = log_2((network_capacity / outgoing) * (len(B) / K))
```

This equation will try to match the throughput of the input, times some adjustment used to maintain constant backpressure. Let's try out an example.

Let's say we're receiving `1000` messages per second, we want `100` in queue, and we process `200` per second. Our queue currently has `800` messages in it. What should we set our work factor to be?

```js
work_factor = log_2((network_capacity / outgoing) * (len(B) / K))
work_factor = log_2((            1000 / 200     ) * (   800 / 100))
work_factor = log_2(40)
work_factor = 5.32
work_factor = 5 // rounded
```

Once the target backpressure is restored, this work factor will decrease until a steady state is reached. Once the state is reached (i.e. `len(B) == K`), in the above example, the work factor will decrease to `2`:

```js
work_factor = log_2((1000 / 200) * (100 / 100)) // len(B) == K
work_factor = log_2(5)
work_factor = 2.32
work_factor = 2 // rounded
```

This work factor is quick to calculate and will adjust to automatically. For *servers* that can scale horizontally, it can also be a good metric as to when to spin up more instances (if you want to maintain low latency without rate limiting your users).

# Dynamic Rate Limiting
There is nothing that requires that PoW be universal across all clients. Servers can be selective and choose to increase work for IPs exhibiting DoS-like behavior, clients sending too many messages, or untrusted clients in a distributed network.

There's a lot more that can be explored now, but it's getting late and I value my sleep. :P

# Conclusion
I hope you've found this little piece interesting. If you're ever dealing with managing backpressure, I hope that you'll find PoW-based rate limiting to be a useful tool in your toolbox. Until next time!
