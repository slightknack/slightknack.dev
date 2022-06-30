+++
title = "On the Practical Applications of Blockchains"
date = 2022-04-14
draft = true

[extra]
artbit = "1_pretzel.png"
+++

> Do blockchains have any practical applications?

Yes, but I think you're asking the wrong question. Asking if blockchains have practical applications is like asking if integers do. I mean ostensibly yes, but what's the context? Unsigned integers are great for counting up, but are horrible at counting down. Signed integers can do both, but you wouldn't use one to index into a list. Yet see how strange this comparison is? Blockchains themselves are simple mechanisms that allow one to verify the integrity the data that a message depends on. Consensus and synchronization mechanisms can be tacked on top of an append-only log to create blockchain-like structures.

Other than PoW over an append-only log (e.g. 'Nakamoto Consensus, i.e. a blockchain'), we do not have another distributed consensus mechanism with the same CAP guarantees. Other than cases that require extreme security and zero centralization, PoW is usually overkill.

Limited constructions of blockchains with different CAP guarantees have different _practical_ uses. For example, a signed append-only log can be very useful for distributed data replication (see for example, the dat/hypercore protocol). dat is commonly used in scientific communities to synchronize large datasets incrementally.

SCP, while not a traditional blockchain, provides blockchain-like guarantees at the expense of federation over decentralization. By making trust graphs explicit, you can make it much faster to arrive at consensus. While PoW usually has 10 minute closing times, SCP can have closing times as low as a few seconds (because no 'mining' needs to be done).

Gnome and other swarm-like protocols are designed for distributed mesh networks, where a collective of nodes agree to execute a common behavior while only communicating with a fraction of the larger whole. They have real-world applications in coordinating drone/robot swarms and establishing consensus over a portion of a larger fragmented network. The simplicity of these protocols make them real-time and resistant to bad actors, but upon a network partition sub-networks will continue operating independently.

If you're ever dealing with synchronization or establishment of consensus in federated or distributed contexts, different constructions of blockchain-like structures hold immense practical utility.
