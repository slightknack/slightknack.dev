+++
title = "About"
weight = 0
sort_by = "weight"
template = "section-about.html"
page_template = "page.html"

[extra]
artbit = "3_human.png"
+++

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

# Who am I?

My name's Isaac, nice to meet you!

Professionally, I've been a Software Engineer at [Zed](https://zed.dev) and [Tonari](https://tonari.no), as well as an [Apprentice Cheesemaker](https://hebervalleyartisancheese.com). I discovered the joy of programming when I was very young; this little hobby quickly grew to underpin the way I think about hard problems. I'm best known for my work on the [Passerine](https://passerine.io) programming language, but this is really just one facet of the type of work I find interesting.

I'm most interested in using computational systems as a foundation for building novel tools for creation and collaboration. For this reason, I’m most interested in problems at the intersection between humans, computers, art, and language.

If you want to get in touch, you can email me at `hello` at this domain; elsewhere, I'm `slightknack`. Contrary to popular belief, I am not a robot.

# About this Website?

Isaac's Website (aka [`slightknack.dev`](https://slightknack.dev)) is a random web of thoughts. Loosely technical but with no common theme, it's really just a place to link against ideas I'd like to share with others.

> Editor's Note: Man, some of these posts need some serious love.

The [current incarnation](https://github.com/slightknack/slightknack.dev) of this website is built with [Zola](https://www.getzola.org) and [GitHub Pages](https://github.io). This website _used_ to run on a custom git-like database I wrote, hosted via Cloudflare Workers, with a little CMS for writing new posts in-browser. Although fun, I was getting tired of paying hosting for a website that doesn't get a whole lot of traffic. If you'd like a little blast-from-the-past, here's a [mirror](https://website.slightknack.workers.dev/home).

There is an [RSS/Atom feed](https://slightknack.dev/atom.xml) for those of you who use newsreaders. For those of you who do not, just bookmark this site or check back for new posts occasionally, I guess.
