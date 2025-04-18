+++
title = "We need an LLVM project for browser engines"
date = 2025-04-18

[extra]
artbit = "1_saturn.png"
+++

<div class="boxed">

*N.B.* I'm publishing some gems from writing I did over the course of two years while living in Brazil. Read [the first post](/blog/writing) for more context.

</div>

<p class="tag">2023-09-13 · Isaac Clayton</p>

You're reading this in Chrome. Or, probably Firefox. Or Safari. Heaven-forbid Edge (only joking).

There is a web browser hegemony. [More than 60% of the world uses Chrome][1]. As we've seen with recent proposals for [Web Integrity][2], [Attestation][3], and the antonymic meme that is the [Privacy Sandbox][4], all roads from a browser monopoly lead to undesirable outcomes. How can we keep the open web resilient against the whims of a few vendors?

Everyone uses Chrome because [writing a browser is *hard*][5] (and at some point, Chrome sucked the least). The Web Standard is incredibly [huge][6]. It has many [quirks][7]; major browsers [deviate][8] from the standard. A proper 'modern' browser is, frankly, too big for any one individual to implement. If an individual could write a full browser in a weekend, we might not have this problem. Sounds impossible, right?

Let's talk about programming languages. Writing an optimizing compiler backend *used* to be hard, too. There are a number of instruction sets, hundreds of platforms, and thousands of optimizations that can be applied. Where to begin? For a long time there was something of a language monopoly. Any hobbyist could hack together a lisp interpreter, but a *Real Language* required a [committee][9] or a [corporate sponsor][10].

This all changed after [LLVM][11]. LLVM is a *universal compiler backend*. LLVM started its life as the backend for [clang][12], the C compiler. It has since been picked up by a number of your favorite projects, including [Rust][13], [Swift][14], [Julia][15], and [Zig][16].

LLVM is a big tool that does a lot of heavy lifting. It's popular because (compared to writing an optimizing compiler) it's very easy to use. There's an [official guide][17] showing how, in about a weekend, one may implement a small language (Kaleidoscope) that [compiles to machine code][18], with [optimization passes][19], that can [interact with existing C libraries][20]. LLVM grows with you: keep at it for a few months, and you'll have a full compiler on your hands.

In this sense, programming languages have been democratized. Anyone can write a compiler for any language. Better yet, we have hundreds of competing languages. As the [pedagogical ramp][21] improves, creating a new programming language will only become easier. Now, what of the web?

To keep the dream of the open web alive, we need something of a *universal browser backend*. Call it an LLVM for browsers:

This universal browser backend would have to implement a large useful subset of the web standard. Ideally as many composable componentized modules, possessing simple interfaces, with bindings for many languages.

Developers could 'mix and match' modules for https, layout, rendering, JS, websockets, Wasm, and so on to develop their own browser engine. Library authors could write higher-level interfaces that help people to compose their own browser from greater component parts. Using such libraries, people could write a browser in a weekend, and, with a little work, a full browser in a few months.

Just as the diversity of popular languages has exploded since the arrival of LLVM, we should expect an equivalent explosion of the types of browsers available once a universal browser backend arrives. Anyone could write a browser for any subset (or superset!) of standards, and we would have hundreds of competing browsers, filling hundreds of different niches. The web would fulfill its goal of becoming a *universal application platform*. What type of browser would you write?

A universal browser engine would need a project to drive it forward. Before LLVM's cambrian explosion, it was a backend for clang, a standard C compiler. Likewise, for a universal browser backend to happen, we'll need 'a clang': a standards-compliant tabbed web browser driving development forward. This 'clang'-type project could come from:

1. An independent organization, with a lot of capital, that wants to break into the browser market (e.g. Microsoft).

2. Motivated developers, modularizing the implementation of an existing browser engine like Firefox or Chromium.

3. Browser engineers, starting a [new project][22], built from the ground up, that has reached escape velocity and has paved the road for others to do the same.

You are in a position to do something, right now. If you're reading this in Chrome, stop. Please give [Firefox][23]—or [literally][24] [any][25] [other][26] [browser][27]—a try.

If you're curious about how browsers work, try implementing one. There are plenty of guides: here's a [good place to start][28].

If you work on browsers, share what you know with others. I fell in love with computers reading blogs and exploring the better parts of the open web. I learned things I wouldn't've learned otherwise. It pains me to see people using their web-browser without an adblocker, or running into broken websites with no idea how to fix them. I like to think about the web I would want the *next generation* to explore. I would like to work towards realizing that vision. As a kid, one of the things that annoyed me most was that it cost money to ~buy~ rent a domain name. Why limit browsers to http via dns? What if kids could write *real websites* in an editor based on Scratch, shared P2P in a little community? What if there was a standard protocol for extending browsers  with new protocols and presentation formats (in a secure sandboxed manner)? What wonderful types of application platforms and paradigms exist but are yet to be discovered? (Or have been lost and must be [rediscovered][30]?) As the open web becomes ravaged by scrapers and bots, a tight-knit web of alternate browser communities might be woven together. What primitives might a browser expose if it were [built to support local-first software by default][29]? What powerful content-presentation tools would a browser expose if enabling online advertizing weren't a priority? The sky is the limit! We're counting on you!

There is a browser hegemony: it's stifling innovation and limiting the web's potential of becoming a universal application platform. Just as LLVM made it possible for anyone to write a compiler, we need a *universal browser backend*, so that *anyone* can write a browser. What type of browser would you write?

# Postscript, Solidarity

<p class="tag">2025-04-18 · Isaac Clayton</p>

In 2020, I started messing around with a project I called [Solidarity](https://github.com/sldty). It was more of a proof-of-concept; I haven't worked on it in years. The goal was to build a fun exploratory alternate to the web, from first principles. As a joke, I called it "The Internet, 2".

I wanted to write a browser where a client-server architecture was obsolete, so over-the-network collaboration was the default. To that end, Solidarity introduced a new protocol, `kitbag`, for realtime P2P replication of data over UDP; an unfinished crdt library, `together`, for data synchronization; a self-describing binary data format, `d3t`, for encoding messages for the network; a WebAssembly runtime for running apps and browser components (named `jiggle`, I guess?); an implementation of a distributed consensus algorithm, `drop-in-fba`, for creating a global linear order of events (when CRDTs fell short). On top of this, systems for assigning names to content-addresses could be built.

Everything was content-addressed, so apps and static assets were replicated to your device on demand. All parts of the browser ran as little components compiled to WebAssembly, exposing interfaces to interact with other components and the host system. The browser could be extended with new protocols and formats by installing an app with the right capabilities. The browser was also the application editor. As easily as you could download an app, you could also fork an app and edit it in-browser to work however you wanted it to!

There were lots of other ideas in the works. Instead of html and css, applications could be written in any language (compiled to Wasm), and would render pages by interfacing with a WebGPU component (also providing an accessibility tree, of course). There was no such thing as a 'per-website account': only a browser-wide component providing high-level primitives for identity, through public-key cryptography. Browsers weren't limited to a single machine: if you had a beefy home server you owned (or, say, a desktop tied to your phone), apps could offload computationally-intensive tasks to run on the more powerful machine (application code and processed data automatically being replicated between the beefy computer and your edge device using `kitbag`, of course). If you wanted to, you could rent, say, a beefy computer from aws; this is your homeserver; you control what runs on it. All the benefits of the cloud, none of the drawbacks.

The foundation, `kitbag`, is a protocol for real-time data sync. All apps are collaborative and local-first by default. If an app pointed two different computers at the same `kitbag` document, the computers would find each other, sync up, and start exchanging edits. What if making an application collaborative was as easy as telling the browser, "yes, both these identities can now edit the same document", and it *just worked*?

I'm still very excited by this idea, and perhaps one day I'll write it up in full. If the web ever becomes unbearable, I'll build Solidarity for my friends. I hope we never reach that point :)

[1]: https://en.wikipedia.org/wiki/Usage_share_of_web_browsers#Summary_tables
[2]: https://arstechnica.com/gadgets/2023/07/googles-web-integrity-api-sounds-like-drm-for-the-web/
[3]: https://www.osnews.com/story/136502/apple-already-shipped-attestation-on-the-web-and-we-barely-noticed/
[4]: https://arstechnica.com/gadgets/2023/09/googles-widely-opposed-ad-platform-the-privacy-sandbox-launches-in-chrome/
[5]: https://stackoverflow.com/questions/598841/how-to-get-started-building-a-web-browser
[6]: https://www.w3.org/standards/
[7]: https://html.spec.whatwg.org/#obsolete
[8]: https://v4.chriskrycho.com/2017/chrome-is-not-the-standard.html
[9]: https://isocpp.org/std/the-committee
[10]: https://en.wikipedia.org/wiki/Sun_Microsystems
[11]: https://llvm.org
[12]: https://clang.llvm.org
[13]: https://rustc-dev-guide.rust-lang.org/backend/codegen.html
[14]: https://github.com/swiftlang/llvm-project
[15]: https://docs.julialang.org/en/v1/devdocs/llvm/
[16]: https://kristoff.it/blog/zig-new-relationship-llvm/
[17]: https://llvm.org/docs/tutorial/
[18]: https://llvm.org/docs/tutorial/MyFirstLanguageFrontend/LangImpl08.html
[19]: https://llvm.org/docs/tutorial/MyFirstLanguageFrontend/LangImpl04.html
[20]: https://llvm.org/docs/tutorial/MyFirstLanguageFrontend/LangImpl03.html
[21]: https://craftinginterpreters.com
[22]: https://ladybird.dev
[23]: https://www.mozilla.org/en-US/firefox/new/
[24]: https://lynx.browser.org
[25]: https://browser.kagi.com
[26]: https://arc.net
[27]: https://github.com/SerenityOS/ladybird
[28]: https://limpet.net/mbrubeck/2014/08/08/toy-layout-engine-1.html
[29]: https://en.wikipedia.org/wiki/Beaker_(web_browser)
[30]: https://www.amber-lang.net/
