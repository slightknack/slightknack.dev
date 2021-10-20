+++
title = "Building a distributed computer"
date = 2021-10-20
draft = true
+++

# A distributed computer

## Runners

## Effect engines
An effect engine is a computer that produces a stream of effects. Each effect must be handled by the host, which may result in other effect engines being created or destroyed.

## Effect
An effect tells the runner to execute a certain side effect. This will pause the effect engine until the side effect is executed, in which case the effect engine will be resumed.
