+++
title = "Can't get bindgen working on NixOS"
date = 2021-07-08
+++

> # Note
> this is a collection of a set of discord messages sent on the NixOS discord server.

# Troubles w/ NixOS

I'm back! This is a hard one, I swear, and I've been banging my head against it for hours: I'm trying to compile a rust library that wraps `libcec`. To wrap `libc`, this library uses `bindgen`. Here's what the crate roughly looks like:
```
.
├── build.rs
├── Cargo.toml
└── src
    ├── lib.rs
    └── wrapper.h
```
Two important things to note: `build.rs` invokes bindgen, doing something like the following:
```rust
bindgen::Builder::default()
    .header("src/wrapper.h")
    // ...
    .generate()
```
And `wrapper.h` is just a simple header that includes `libcec`:
```
#include <libcec/cecc.h>
```
On most operating systems, clang or whatever leafs through well-known `include` locations to toss together a big ol' binary salad. NixOS, of course, loathes this. So, upon trying to compile this crate via `cargo build`, we get an error, sensibly enough:
```
src/wrapper.h:1:10: fatal error: 'libcec/cecc.h' file not found
```
No problemo! We can use `.clang_arg(...)` to send clang some args about where to look for `include` locations. Here's an example that works with macOS, say:
```
bindgen::Builder::default()
    .header("src/wrapper.h")
    .clang_arg("-I/usr/local/include")
    ...
```
So we just need to find the include location for `libcec` on NixOS, right? tossing this into our `shell.nix`:
```nix
  # ...
  LIBCEC_PATH="${libcec}/include";
```
We then *should* be able to specify the right include location:
```
.clang_arg("-I$LIBCEC_PATH")
```
Huh, this doesn't work, same error as before:
```
src/wrapper.h:1:10: fatal error: 'libcec/cecc.h' file not found
```
Well, we can always just skip the wrapper and pull in the header file directly, right? Let's echo `$LIBCEC_PATH` to find where in the heavens above `libcec` is, locate the header file, then schloop that in:
```
$ tree $LIBCEC_PATH
/nix/store/klsqc20n71gja5b8sa9ncw1jl6lcaxw9-libcec-6.0.2/include
└── libcec
    ├── cecc.h
    └── ...
```
There it is!

I know this isn't best practice, but let's use this as the path to the header file we want in `build.rs`:
```rust
bindgen::Builder::default()

 .header("/home/slightknack/Repos/tonari/portal/cec/cec-sys/build.rs")
```
It's not the prettiest, but it should work, right? ... uh... right... ?
```
$ cargo build
...
/nix/store/klsqc20n71gja5b8sa9ncw1jl6lcaxw9-libcec-6.0.2/include/libcec/cectypes.h:38:10:
fatal error: 'stdint.h' file not found
```
Drat! Foiled again! It seems NixOS is too clever for me. This time the entirety of `libc` has gone missing!

At this point, I spent about another few hours trying to get `libc` to show up. I also read a ton (e.g. https://nixos.wiki/wiki/C, https://www.gnu.org/software/gnulib/manual/html_node/stdint_002eh.html, https://github.com/NixOS/nixpkgs/issues?q=is%3Aissue+stdint.h+, etc.) to no avail.

So here's my question: What am I doing wrong? How can I use `bindgen` to wrap a c library in a crate? If you need any additional information, ping me and I'll send it right over! Thank you!
