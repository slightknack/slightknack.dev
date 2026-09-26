+++
title = "About"
weight = 1
sort_by = "weight"
template = "section-about.html"
page_template = "page.html"

[extra]
artbit = "1_saturn.png"
+++

<div class="tag">
  <a href ="https://isaac.sh">isaac.sh</a> · Cambridge, Massachusetts
</div>

A friend of free software, pushing bits around as an undergrad at MIT. Interested in compilers, display hacks, and AI (as one must be in <s>2024</s> <s>2025</s> 2026).

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

# About me

I started programming in 2013 ([scratch.mit.edu](https://scratch.mit.edu) ♡). In 2015, I learned Python when my uncle told me it was easier to write neural networks if you didn't ... uh ... hardcode the matrix multiplication routines.

In 2017, I became obsessed with shaders and GPUs (thank you, Iñigo Quilez). In 2019, I learned Rust to develop a compiler for [Passerine](/passerine). I keep a [blog](/blog).

In 2021, I was a software engineering intern at [tonari.no](https://tonari.no), where I prototyped real-time depth estimation on the GPU. In 2022, I interned at [zed.dev](https://zed.dev), where I developed a webassembly [extension](https://zed.dev/extensions) runtime for e.g. adding new languages to the editor.

I graduated highschool in 2022. I deferred my enrollment and proceeded to live in Brazil for two years. I didn't use the Internet and learned a lot. (After two years offline, I realized that the Internet is overrated.)

In 2024, when I got back from Brazil, I started at MIT. I joined the men's lightweight crew. After my first year, in 2025, I (once again) worked at a startup, and a wrote _a lot_ of Rust. 

During my second year of school, I helped run Cohort 5 of [Prod](https://prod.so). In 2026, I worked at [Flapping Airplanes](https://flappingairplanes.com) on megakernels and data-efficient RL.

I am now in my third and final year of school. I plan to graduate a year early, pack my wagon, and migrate west. Wish me luck!

I love making art and taking photos! I have played basketball/soccer on 4 of 7 continents to date. I enjoy hiking and skiing with my family. Também falo português, meu rei. Y español.

# About this website

I've been running this personal website since around 2020. I point the domain [slightknack.dev](https://slightknack.dev) at it, but [isaac.sh](https://isaac.sh) redirects here too.

This website is static and compiled with [Zola](https://www.getzola.org/). It uses a custom theme that I wrote from scratch and have been incrementally tuning over the years. I currently host this website on GitHub pages; you can peruse its source code [here](https://github.com/slightknack/slightknack.dev).

The fonts used on this website are:

<ol>
    <li><code style="font-family: var(--font-body); font-weight: 400;">Ibarra Real Nova</code> for body text.</li>
    <li><code style="font-family: var(--font-title); font-weight: 900;">Texturina</code> for headings.</li>
    <li><code style="font-family: var(--font-mono); font-weight: 400;">IBM Plex Mono</code> for code.</li>
    <li><code style="font-family: var(--font-narrow); font-weight: 400;">Dear Ariella</code> for subtitles.</li>
</ol>

I love typography, as my uncle (the one who hooked me on Python) happens to be a [type designer](https://en.wikipedia.org/wiki/Roboto).

# Contact

Let's chat! I will respond to all emails sent to:

- Email: `hi@isaac.sh` · <span class=pill><a class="tag" onclick="navigator.clipboard.writeText('hi@isaac.sh'); this.innerText='copied!'; this.style.backgroundColor='var(--fill-accent)'; this.style.color='var(--fill-bg)';" style="cursor: copy;">copy</a></span>

I also have accounts on:

- GitHub: [slightknack](https://github.com/slightknack)
- "Twitter": [slightknack](https://x.com/slightknack)
- HN: [slightknack](https://news.ycombinator.com/threads?id=slightknack)
- Lobsters: [slightknack](https://lobste.rs/~slightknack/threads)
- *... and so on*

<!--Advice: programs should be built from small, composable parts that you understand and control. Find where an N×M problem hides internal structure, and factor it into a N×1 and 1×M, make the 1 as small and clear as possible.-->

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
