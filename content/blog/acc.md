+++
title = "Spatiotemporal Acceleration Structures"
date = 2021-10-14
draft = true

[extra]
artbit = "1_cylindera.png"
+++

- Introduction
- Goals
    - Simulating the universe
    - Explaining traditional algorithms

- Cellular Automata
    - Game of Life
        - Grid
        - Hashlife
            - Explanation
                - Quadtrees, splitting
                - Each layer doubles the timestep
            - Hashing and Memory Reuse
                - Parallels to Memoization
                - Where it breaks down
    - Non-deterministic
        - Smooth life
            - Generalized GOL kernel to the continuous domain
        - Fluid Simulation
            - Continuous Reintegration
        - Problems with hashing
            - Never visit the same state twice
                - Can't use normal hashing
    - Hashing as function approximation
        - Have base function f
        - Have function in macrocell n + 1 fn
        - Hashing approximates fn over a partial input domain
    - Forms of function approximation:
        - Locality sensitive hashing?
        - Interpolation
        - Neural Networks

- Neural Networks for function approximation
    - Maps input to output
    - Can be trained to approximate a function

- Forget Hashlife, what about Neurallife?
    - use neural networks instead of hashing
    - problems:
        - collecting training data
            - no problem, traditional k, v that would be inserted into life
        - we have base rule, base function, but we need n networks for each level of depth, each network is bigger than the last?
            - parallel to autoencoders, reduce each layer to a fixed-size vector from previous layers
            - each fn is the same size.
            - for self-similar rules, i.e. fluid, use a single f for all n
            - only have to store vector, can collapse parts of the tree
        - when to apply approximation, when to use strict base rule?
            - measure of confidence
                - lower layers will always be more accurate
                - step this layer and the layer before, take difference between them
            - a few options:
                - drop to a lower layer if the confidence is too low, until confidence is high enough
        - how to deal with symmetries?
            - implement them as transformations for data augmentation

- Spatiotemporal acceleration structure definition
    - Given a local transformation rule over a space, A spatiotemporal acceleration structure:
        - divides the space into a structured hierarchy
        - builds a new rule that approximates the base rule at each level of the hierarchy

- Use-cases:
    - efficiently simulating anything that can be approximated with a cellular automata

- What can be simulated with cellular automata?
    - Have already discussed life and fluid simulation
    - Fields?
        - Gravitational fields
        - Electromagnetic fields
        - Quantum fields
    - Physics simulations
        - Continuous integration for fluid, what about objects
        - Rotationally symmetrical

- Open problems
    - speed of light is ticks per second times size of smallest unit
    - Imagine a 100 by 100 by 100 meter simulation at 1m granularity:
        - 1 million blocks
        - 30 ticks per second, takes light 3.3 seconds realtime to travel across the block
        - This is 10 million times slower than real life
    - extracting information from the simulation
    - parallelization
        - how to train the network efficiently?
        - multiple blocks can be simulated at once.
