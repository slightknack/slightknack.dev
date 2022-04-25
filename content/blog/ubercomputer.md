+++
title = "Ubercomputer"
date = 2021-11-30
draft = true

[extra]
artbit = "3_closed.png"
+++

One solution I've thought about in a different context is this: when a node evaluates a transaction in a different context, it must publish how many operations (e.g. beta-reductions) the transaction took, as well a single merkle-tree root hash (or something similar but less computationally expensive) of the evaluation process (e.g. form after each step). We'll call this the 'full-evaluation proof'.

If another node gets a different result evaluating the same transaction, they can contest the transaction. They publish a different full-evaluation proof, as well as a half-evaluation proof, which is a snapshot of the state of the form after a set number of operations (e.g. beta reductions with a defined evaluation order). Now the transaction is divided in two, and the previous transaction is reversed. Each partial transaction may also be subdivided if further conflicts arise; as more of the merkle-tree is revealed, the location where the malicious node lied about the execution of the contract is bisected and determined. In the worse case, the entire merkle-tree will be revealed, each state transition being formally proven.
