+++
title = "Getting bindgen working on NixOS"
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
    .header("/nix/store/klsqc20n71gja5b8sa9ncw1jl6lcaxw9-libcec-6.0.2/include/libcec/cecc.h")
```
It's not the prettiest, but it should work, right? ... uh... right... ?
```
$ cargo build
...
/nix/store/klsqc20n71gja5b8sa9ncw1jl6lcaxw9-libcec-6.0.2/include/libcec/cectypes.h:38:10:
fatal error: 'stdint.h' file not found
```
Drat! Foiled again! It seems NixOS is too clever for me. This time the entirety of `libc` has gone missing!

At this point, I spent about another few hours trying to get `libc` to show up. I also read a ton (e.g. [C on Nix wiki](https://nixos.wiki/wiki/C), [stdint in gnulibc manual](https://www.gnu.org/software/gnulib/manual/html_node/stdint_002eh.html), [NixOS issue related to stdint](https://github.com/NixOS/nixpkgs/issues?q=is%3Aissue+stdint.h+, etc.)) to no avail.

So here's my question: What am I doing wrong? How can I use `bindgen` to wrap a c library in a crate? If you need any additional information, ping me and I'll send it right over! Thank you!

# Update! An incredible solution

Shortly after I posted this, I reached out to [Ben Siraphob](https://github.com/Siraben), a good friend of mine who convinced me to try out NixOS in the first place. We hopped on a call together, and he showed me how to reach a solution. Credit for the solution goes to him, I was in way over my head!

So, what was the solution, anyway? After searching for similar packages on Nixpkgs, we found that this issue itself was pretty uncommon (go figure). Luckily enough for us, it looked like the derivations of Firefox (I think?) and about two other projects had to deal with linking against evasive c library headers.

The first order of business was switching out `shell.nix` for a proper derivation. because it's a Rust project we're compiling, it's best to use `rustPlatform.buildRustPackage`. After declaring the package and including it's SHA, the first thing we needed to do was make sure `LIBCLANG` was in the right spot and could be found. This is simple enough:

```nix
rustPlatform.buildRustPackage rec {
    # ...
    LIBCLANG_PATH = "${llvmPackages.libclang.lib}/lib";
    # ...
}
```

Next thing we needed to do was pass in some c flags to bindgen. I'm not too sure what these do, but they're what was used by firefox and they seem to work:

```
configurePhase = ''
  BINDGEN_CFLAGS="$(< ${stdenv.cc}/nix-support/libc-crt1-cflags) \
    $(< ${stdenv.cc}/nix-support/libc-cflags) \
    $(< ${stdenv.cc}/nix-support/cc-cflags) \
    $(< ${stdenv.cc}/nix-support/libcxx-cxxflags) \
    ${lib.optionalString stdenv.cc.isClang "-idirafter ${stdenv.cc.cc.lib}/lib/clang/${lib.getVersion stdenv.cc.cc}/include"} \
    ${lib.optionalString stdenv.cc.isGNU "-isystem ${lib.getDev stdenv.cc.cc}/include/c++/${lib.getVersion stdenv.cc.cc} -isystem ${stdenv.cc.cc}/include/c++/${lib.getVersion stdenv.cc.cc}/${stdenv.hostPlatform.config}"} \
    $NIX_CFLAGS_COMPILE"
  export OUT=${placeholder "out"}
  echo $OUT
'';
```

Which is a lot, but it isn't a lot a lot. But wait! how does Rust know where libcec is during compilation? obviously hardcoding something in the `store` is a bad idea!

During the patch phase (which happens before the configuration phase seen above), we can perform a substitution. In `build.rs`, we can switch out the builder to be:

```rust
let bindings = bindgen::Builder::default()
    .header("LIBCEC_HEADERS/include/libcec/cecc.h")
    // ...
```

And then substitute out LIBCEC_HEADERS with the path to the actual headers:

```nix
patchPhase = ''
  substituteInPlace build.rs --replace "LIBCEC_HEADERS" "${libcec}"
'';
```

This seems like a bit of a hack, but hey, at least it works! Last but not least, we can set our build inputs, and...

```
nativeBuildInputs = [
  llvmPackages.clang
  tree
];

buildInputs = [
  libcec glibc
];
```

Tada! everything works as intended! There's a little cleanup that needs to be done to extract the resulting Rust binary, but I'll spare you the details.

NixOS is pretty cool, but it seems to be targeted towards people who like to roll their own solutions and stick to open source software. This is great! If you do decide to go all in, though, be prepared!

Thanks again to everyone who helped me resolve this issue! Nix has shown me how many assumptions are present when building modern software, and it's surprising how good of a job they've done categorizing different issues and dependencies and making reproducible builds as easy as `nix build`. 'Til next time!
