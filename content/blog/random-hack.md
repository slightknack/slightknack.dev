+++
title = "Quick hack to generate random numbers using rust's standard library"
date = 2021-10-14
draft = true

[extra]
artbit = "2_police.png"
+++

If you want random numbers in Rust, you usually have two choices:

1. Pull in a crate like `rand`.
2. Implement a small pseudorandom number generator yourself.

Writing a good pseudorandom generator can be hard, which is why people tend to rely on external crates. But what if you want a simple solution that doesn't depend on an external crate?

I'm not particularly proud of this hack, but I thought it would be neat to document it.

As you may know, Rust has a HashMap.
