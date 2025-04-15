+++
title = "About"
weight = 1
sort_by = "weight"
template = "section-about.html"
page_template = "page.html"

[extra]
artbit = "3_dinosaur.png"
+++

<div class="tag">
  <a href ="https://isaac.sh">isaac.sh</a> · Boston, Massachusetts
</div>

A friend of free software, pushing bits around as an undergrad at MIT. Interested in compilers, display hacks, and AI (as one must be in 2024).

<div class="shader">
    <img
        src="/content/path.jpg"
        alt="A trail weaving through the mountains on a cold spring day"
    >
        <div class="shader_layer specular">
            <!-- <div class="shader_layer mask"></div> -->
        </div>
    </img>
</div>

I started programming in 2013 ([scratch.mit.edu](https://scratch.mit.edu) ♡). In 2015, I learned Python when my uncle told me it was easier to write neural networks if you didn't ... uh ... hardcode the matrix multiplication routines.

In 2017, I became obsessed with shaders and GPUs (thank you, Iñigo Quilez). In 2019, I learned Rust to develop a compiler for [Passerine](/passerine). I keep a [blog](/blog).

In 2021, I was a software engineering intern at [tonari.no](https://tonari.no), where I prototyped real-time depth estimation on the GPU. In 2022, I interned at [zed.dev](https://zed.dev), where I developed a webassembly extension runtime for e.g. adding new languages to the editor.

From July 2022 to July 2024, I lived in Brazil, didn't use the Internet, and learned a lot. (Sadly, after two years offline, I realize that the Internet kinda sucks.)

I am now just about finishing my first year at MIT. Over the summer I'll perform a pilgrimage to San Francisco, to work at a bona-fide startup! I'll be once again writing Rust, because it looks like that's what I'm good at. The startup is very cool, I'll write about it sometime.

I love making art and taking photos! I have played basketball on 4 of 7 continents to date. I enjoy hiking with my family and skiing with my Dad. Também falo português, meu rei. Y español.

Let's chat! I'm <s>easily</s> reachable via:

- Email: `hi@isaac.sh` · <a onclick="navigator.clipboard.writeText('hi@isaac.sh')" style="cursor: copy;">copy</a>
- Phone: ask if you know me.

I also have accounts on:

- GitHub: [slightknack](https://github.com/slightknack)
- "Twitter": [slightknack](https://x.com/slightknack)
- HN: [slightknack](https://news.ycombinator.com/threads?id=slightknack)
- Lobsters: [slightknack](https://lobste.rs/~slightknack/threads)
- Discord: `slightknack`
- Matrix: ask if you know me.
- Are you detecting a pattern here?

<!-- For a full list of my accounts, keypairs, and domains, check [elsewhere](https://elsewhere.isaac.sh). -->

<style>
    .shader * {
        margin: 0;
        padding: 0;
    }

    .shader {
        position: relative;
        overflow: hidden;
        backface-visibility: hidden; /* to force GPU performance */
    }

    .shader img {
        object-fit: cover;
    }

    .shader_layer {
        background: black;
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-size: 100%;
        background-position: center;
    }

    .specular {
        mix-blend-mode: color-dodge;
        background-attachment: fixed;
        background-image: linear-gradient(180deg, black, #04348C77 30%, #E8172177 100%);
    }

    .mask {
        mix-blend-mode: multiply;
        background-image: linear-gradient(180deg, black 20%, #3c5e6d 35%, #f4310e, #f58308 80%, black);
    }
</style>
