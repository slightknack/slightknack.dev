+++
title = "Late Night Conversations about Nothing in Particular"
date = 2022-07-15

[extra]
artbit = "1_dinosaur.png"
+++

## The Beginning of the End (of Today)

As I write this today, it's tomorrow.

## And... We're talking about school?

> N.B. This post is not about school, bear with me.

Throughout the school year, I'm usually pretty consistent with my sleep schedule. It's like a rhythm, every hour of my day planned out. I wake up at 5:55 exactly, do some morning studying (it's always so much easier to get stuff done in the morning), shower an hour later, breakfast, and I'm out the door.

School's rhythmic too. This was my last year of high school, my senior year. I think I overdid it a bit, to be honest. 6 APs and 2 college math courses, on top of, you know, everything else that goes on in life, is a bit much for anyone, *especially* for a simple-minded guy like me. I appreciate the rhythm school brings to my life. 

So why am I writing this at 1 AM?

<!-- more -->

I moved schools between my Sophomore and Junior year. Before moving, I was at a much larger school (though still small by most standards, only about ~250 kids to a grade). The campus was pretty big, so it could easily take 10 minutes to walk from one class to another (classrooms were in different buildings, or 'modules,' scattered across campus, so it was a long outdoor walk). Because of this long walking time between classrooms, we had a long break between classes. 20 minutes of break. Like most of my friends, I hung around outside, slowly drifting from one class to another, watching a friend play Osu with a trackpad in the bright sun, or someone attempting to heroically finish the homework due next block.

Moving here, the campus was a lot smaller. We only had ~50 kids per grade, 15 classrooms in a single building made up the entire high school. Breaks were much shorter, 5 minutes, tops. But it doesn't take that long to move from one class to another next door, and there's not much room to congregate in the halls.

Either way, at the end of the day, during the school year, there exists a rhythm. Wake up at 5:55, do homework (just me?), go to school, attend a club, play a sport, get home, do some programming, hit the hay at 8:55, repeat. Every minute is planned and accounted for: time is allocated for work, time is allocated for play, a gentle pattern to lead your body as your mind works.

Summers, on the other hand, are very different. There is no bus leaving at 8:13 in the morning you need to catch; there's no need to go to bed at 8:55 to get a full 9 hours of sleep. But then summer rolls around, and you find out you can get away with 6 hours of sleep, kinda, and your world becomes a mess. (Because you really can't live on 6 in the long run; at least I can't). School is a marathon, summer is a series of short sprints.

I don't particularly like school, but I deeply appreciate a couple things about it. 

For one, it structures my day. The rhythm of school is like steady onslaught of ocean waves. Understanding this rhythm helps me plan ahead, figuring out how to fortify my day to avoid burnout after each wave hits.

For two, it's where social stuff happens. For those of you who know me, you know that I move often. (For those of you who don't, welcome to the blog!) In general, I think the friends you make is highly dependent on the people you're around, and there's nobody your around more often than the peeps at school.

I've been lucky enough to have done well in school (so far, we'll see what MIT makes of me. A mess, I suppose). I take tests well; I do my homework at school so I don't have to do it at home; and I generally get along well with people.

As I've now graduated, however, I've realized that this structure I have come to rely on in high school will no longer exist, at least not to the same degree. With graduation comes an eternal summer, school optional. Enough with school!

So as I write this today, it's tomorrow.

## Wait, if it's today, how's it tomorrow?

It's currently past midnight, yet I'm still awake, therefore it's still yesterday. I don't think my day counter increments until I've woken up. It's funny how that works. Before time was standardized, you went to bed when it was dark, and woke up when it was light. Nowadays you can *relax* in the dark. Join me: turn down your screen real low, and type the night away.

## A Meta Break

When I started writing this post, I wasn't quite sure what it was going to be about. I'm still not. As you can tell, dear reader, I've adopted the role of a meta commentator. You should be able to tell we're approaching a topic transition. Something new's coming up, a little different, but I'll all tie it together in the end. Or so you hope; maybe you've stopped reading. I, personally, have no idea what the next topic's going to be.

Speaking of, I originally started this post to paste in two things I wrote earlier today. Someone commented that since I "seem good at sciency writing" and "good with words" I "should write a book (or at least a blog) some time." 

The problem is, I *do* have a blog (hiya, you're reading it), but I fill it with whatever I think up of at 1:04 AM. (When else do you blog?) 90% of the posts on this blog are messages I've written elsewhere, e.g. via email or discord, and then have wanted to repost elsewhere without literally having N different copies of X floating around. 

## The Mess \[I'm\] In

That reminds me. I swear I've mentioned this talk before, but I keep coming back for it. It's called "The Mess We're In" and it's by Joe Armstrong of Erlang fame. Y'know what? I really wished I had had the chance to meet Joe Armstrong. He reminds my of my grandpa: concise with his words, able to break down any idea, no matter how complex, into a simple string of words a twelve year old could not just acknowledge, but deeply understand. It's a true talent, and it's one I hope to develop myself. 

Perhaps that's why I'm staying up late writing. Practice is essential.

But I digress. I love this talk because, in all honestly, we're all screwed. And not just in a metaphorical sense. Software, in general, is a mess. A big one. Javascript on the Web is Duct-Tape and \[object Superglue\]. I try to avoid it with a 10-foot pole, made mostly of Wasm and CSS, but sometimes that isn't even enough.

Joe mentions that the reason for this mess is needless duplication. For example, in our day to day work as programmers, we probably author about 3 new files a day, on average. By the time you're old and wise like Armstrong, that's thousands of files! If we're going with raw numbers:

> 3 files a day, 365 1/4 days a year, 50 years programming is 54 thousand files!

54k files is insane! It's a lifetime of work! Given how easy it is to repeat ourselves online, it's dubious that every single one of those files is unique. There's bound to be, within that collection, files that you've copied and modified, files that you've written once, forgotten about, and reimplemented from scratch. Files that do the same thing in different orders, or different things in the same order.

So if you were to take this massive corpus accumulated over the course of a lifetime, and add a single new file, how much new, unique information would it actually contain? I posit very little, through no fault of anyone.

## Least Compression Difference

Armstrong proposes the idea of least compression difference. Now this is particularly clever. Let's say you have two files, A and B, and you want to know how similar A is to B. 

First, you compress A, and then you compress B—you take the sizes of these two compressed files and add them together—that's your baseline.

Then, you concatenate A and B, and compress them both together. Because A and B are compressed at the same time, a really good compressor should be able to factor out information in B that already exists in A. If A and B were identical, then the final size of the pair would be very small indeed: just duplicate the contents of the first compressed file, and so on.

So the distance is a scalar value between zero and one, calculated by taking the size of both files compressed together over the sum of the sizes of both files separately. To whip out the reliable ol' pseudocode, something like this:

```rust
fn least_compression_distance(A, B) {
    separate = size(compress(A)) + size(compress(B))
    together = size(compress(A ++ B))
    return together / separate
}
```

The problem is that this is pretty expensive to calculate. Lossless compression can't magically make everything smaller: for every string that compresses to something smaller, theres another string that compresses to exactly that much larger.

Lossless compression assigns shorter strings to more structured patterns. In a sense, compression aims to make the length of whatever string you're compressing equal to the amount of information it contians.

You can turn any lossy compressor into a lossless one by compressing, decompressing, and recording the differences. In essence, each level of lossy compression leaves some noise behind that is slightly harder to compress.

And nonetheless, yet again, I digress.

## Compression and Intelligence

It's a well-known fact that compression is equivalent to general intelligence. (I say it's a well-known fact because it's 1:28 AM and I'm too tired to go around digging for a link, but maybe future me will grab one for ya after this goes live.) Better compressors are smarter. As the residual noise becomes harder and harder to compress, smarter compressors will find the hidden structure in the noise, pull it out, and keep moving forward.

So Armstrong's least compression is very interesting, because it does indeed tell you how much new information is actually introduced in B. If A is the entire corpus of what you've written, and B is a new file, taking `compress(A + B) - compress(A)` will tell you *exactly* how much new information B contains. And as compressors get better, so will the accuracy of the above expression.

## Fixing the Mess We're In

So I've long had a dream, like Armstrong, of this magical program that follows you around. It tracks everything you do. Everything you type, everything you read, everything you watch, everything you listen to. (Locally, of course, we wouldn't want this to get dystopian quite yet; after all, it is a mess that we're trying to clean up.)

This program takes everything you're taking in and writing out, and looks for patterns. It takes the unorganized, repetitive firehose of information, compares it against information it's neatly packaged away, fills a cup with the new information introduced, and neatly packages it away for future reference.

Over time, you accumulate a massive library. But this is not a messy library. Those 54 thousand files you wrote? Oh, there there, but you realize that only 3 thousand of them contain new information, right? You'd like me to rewrite those 54 thousand to the equivalent 3, pulling in what other stuff you've read to make them as human-readable and understandable as possible? It's a lot to ask, but here you go. I recommend you start with the simple computational axioms, and build up from there; a monad is simply a monoid in the category of enfunctors, and it takes more than one universe to show that.

I think this is what I want my life's work to be. Armstrong jokes that 'if you want a problem that will keep you busy for the next 40 years, here's one,' but I'm serious. I don't want 40 years, I want to work on this for the rest of my life.

I think we're in a huge mess. For real. And I apologize, some of it is my fault; just look at this website. Zstd says that this file, while being 24 kilobytes large, only contains 3 kilobytes of unique (uncompressable) information.

## Out of the Blue

All this talk of compression has got me thinking, so now is the time I'll paste in the actual discussion I wrote this blog post to discuss:

<div class="boxed">

## Human values are universal, because we all share similar experiences

I don't think it's possible to comprehend how much our imparted values affect our worldview. I think human culture across the globe is fairly homogenous in this sense.

For example, let's say you learn how to ride a bike, or drive a car, or type on a keyboard, or read. It's really hard at first, because you have to think about what every little motor action will end up doing, even if it doesn't map to past experience. But after like a few months of consistent practice, these conscious thoughts get chained together and pushed down to lower levels of abstraction in the brain (in the Hawkinsian sense), to the point where you are no longer 'pushing on pedals' and 'steering to stay balanced,' but 'biking to a friend's house.' The input -> output map is completely different than what would physically happen if the tool were not there, but your body quickly adapts to the nonlinearities and treats the tool as if it were merely an extension of your body. This is all well-known.

Now here's what I posit: What if you grew up where you didn't just learn how to ride a bike, but were always riding a bike? If that convoluted analogy didn't make much sense, here's an analogy: the neocortex is fairly uniform and unspecialized at birth, essentially hijacking the lower brain, like a parasite animating a corpse (ok, that could've been worded better). Needless to say, your body doesn't start with preconceived mappings (or if they are, they're fairly plastic, if riding a bike is any indication). If you took a slice of neocortex—some head cheese, if you will—and mapped I/O to something completely arbitrary, say a 2D simulation or game, or a car with cameras and motors, I believe that (despite being very inhumane) the brain would eventually learn correct I/O pairs, and be able to act in its limited environment. 

Because their experience is so different than our own, their worldviews, and hence their values, will be alien and incomprehensible compared to our own, wouldn't you agree?

</div>

And more importantly:

<div class="boxed">

## Welcome to Earth, the Cosiest Corner of the Universe Fractal

> Here's a video for ya: [Can we create new senses for humans?](https://www.youtube.com/watch?v=4c1lqFXHvqI)

I just started this talk, and I'm already enjoying it. The other day I was thinking about how the universe is fractal-like in complexity and activity at every scale. Just compare sprawling human cityscapes to sprawling proteins in the cell, millions of little machines doing their best to deal with the hurricane of movement all around. Zoom out to the galactic level, and watch the dance of planets: complex emergent behavior driven by an infinite number of gravitational interactions at every point in space. At every scale, there exists this underlying idea of 'computational irreducibility'—behaviors that are too complex to model too far into the future. We exist at a single scale, 10^0 meters, and in a single location: 1g, 1atm, 1au. Just imagine the amount of possible stimuli that exist. Our values are shaped by the world we inhabit, and yet there are a near-infinite of worlds—as complex as our own—right where you are now, just at different scales, both spatially and temporally. It's incredible, really. 

</div>

The universe is fractal-like in complexity and activity at every scale. Compressing the universe, locally reversing entropy (and using this word wrong in two ways), requires *understanding* the structure universe at a deep level, beyond anything what we're capable of.

And I think this idea: creating things beyond what I alone am capable of, is what I find to be the most appealing. I want to simulate the universe, baby!

So this reminds me of two related topics, which I'll sketch out here.

## The Universe, Approximated

First is the idea of Spatiotemporal Accelaration Structures, or modeling the universe with Neural Cellular Automata. The idea is pretty simple:

1. We start with a base rule. This could be something simple like Conway's Game of Life, something more complex, like Reaction Diffusion, or something impossible, like encoding the laws of quantum mechanics in cells a planck-length wide, stepping time one planck after another. Let's say that the stepping the base rule requires only the 8 surrounding neighbor cells (or say 26 in 3D).

2. Next, we group each group of four cells into groups of 2x2, a macrocell (hashlife flashbacks). This is like laying another grid over the one we have now, but twice as big. We look at each macrocell, and its 8 surrounding neighbors. Taking a neural network, we take all 2x2x3x3 = 36 surrounding base cells, convert them into a vector of length 36, and pass them through a neural network to create a new vector representing the base cell. We train two networks: one that can turn base cells into macrocells, and one that can turn macrocells into base cells.

3. Then, on the base layer, we step the simulation not once, but twice, and compute a new vector for each macrocell. We train a third neural network on predicting the new vector for each macrocell given the old one. This can be trained end-to-end with the other two neural networks, minimizing the predictive error between the initial state at the base layer and the predicted state at the base layer, flowing through macrocells in the middle.

4. This step is the trickiest one. We recurse. Take each macrocell, and treat it as a base cell. Your rule at this level is not hardcoded, but determined by the neural network trained on predicting the underlying layer at double speed. Create a new macrocell layer—this one's 4x4—and train 3 more neural networks on raising, lowering, and taking steps 4 at a time. If you're feeling really fancy, you can re-use the original three networks, and hope that it generalizes rules across scales, encoding scale-based information in the vector representation of each macrocell. Repeat *ad infinitum*: 4x4 -> 8x8 -> ... -> length x height of universe.

5. And now this is where things get fast. Instead of storing the base grid, store a lazily populated quadtree. Run the simulation 1 step at a time, training the network as you go along. When a macrocell predicts its base cells at, say, 99% accuracy, trim the base cells. When accuraly drops below a certain threshold, regenerate the base cells and step a layer of abstraction lower. Parts of the simulation that are more complex to model will require more cells.

And that's it. That's how you build a universe simulator.

Hubris aside, this is an idea I've been playing around with in my head for a while. I started implementing it, got some promising smooth life speedups (after all, SAT is sort of a generalized continuous hashlife), but that's when I ran out of steam.

## The Universe, Content Addressed

The next idea I've had for a while is much more similar to Armstrong's Sherlock, e.g. universal information compresser and mess cleaner upper, and it has to do with content-addressed storage.

For the unfamiliar, content-addressed storage is quite interesting. Essentially, we take a blob of information, and hash it, take its fingerprint. If we give the store the fingerprint, it'll give us back our blob. Easy as pie.

But the interesting question is not how to make the store, but how to make one that's space-effective. If two blobs are very similar (say by the measure of, I don't know, least compression distance, wink wink), we'd ideally want one blob to be encoded in terms of the other, deduplicating information. But to do this, we'd need some way to quickly compare similar blobs. We can't use full least-compression distance—that's very expensive—but we can use these bloom filter things I came up with that don't have a name.

But first, hash splitting. A pure content-addressed store doesn't care about blob size. Got a 2TB blob lying around? Chuck it in, we'll handle it! But large blobs are problematic for a number of reasons. What if you change a single character in that 2TB blob. Are you going to store the whole thing again? Well, ideally no, and that's where hash splitting comes in.

The idea is deceptively simple: slide a window 32 characters in length across the entire big blob we want to store. Hash each window. When we hit a hash with a certain number of leading high bits set, split the blob at that point. For example, if you made it so that 1 in every 1024 hashes causes a split, then you'd end up with blobs close to 1024 bytes (i.e. 1KiB) in length (or something, these sorts of distributions are weird).

Storing a lot of 1KiB blobs is a lot easier than storing a few 2TB blobs, especially because they're content addressed. If you make a 1 character change to that 2TB file, the splitting algorithm should preserve all other blocks; in other words, only 1KiB block out of the 2TB file will need to be added.

But we only changed 1 character! Why do we need to add 1KB worth of new information!?

## The Universe, Compressed

And this is where the second cool idea comes in. Bloom filter things! Divide your rolling window hash into an even number of buckets, say 512. Each hash lands in one of these buckets. When processing a small 1KiB block, create a 512 bit array. As you go over the block, take the bucket of the hash of each window, and set the corresponding bit in the bit array to high. If two blocks are identical, they'll have the same bloom representation. If only one character is changed, they'll both have similar bloom representations. We can quantify the distance between two blocks in a pretty simple way: just `XOR` the bloom filters and take a `popcnt`. In other words, count the number of bits that are different between the two.

This isn't as accurate as least compression distance, but from my tests, it does a pretty dang good job. 

When inserting a new block, we could compare against every existing bloom filter, but that would be slow. Instead, here's another idea: What if we treated each bit array as a discrete vector of sorts, and used something like FAISS to built an efficient index of all the vectors? Then, finding the most similar block to the one we have would be a simple index lookup, which is way cheaper that comparing our new block's bloom against every other bloom in existence.

So when we insert a new block, we grab, say, the top K closest blocks. We then run something like least compression distance or a myers diff to find the most similar blocks (this is cheap, because blocks are around 1KiB in size; it's not like we're diffing 2TB files). Instead of storing the new block, we store a compressed representation of it, and the address of the most similar other block. This way, a one-character change to a 2TB file becomes a 1 block change, but we found the closest block and know it's just a 1 character insertion, so we encode that insertion in 4 bytes, plus a few more for the address of the block we're appending to, for a grand total of, say, 36 bytes. 

```
This sentence is only 36 bytes long.
```

For effect, the above sentence is as long as how much additional information we need to store. For changing a single character in a 2TB file. Recording this change so effectively is like finding a needle in a haystack. This is why I love content-addressed storage.

So if I were to flesh out my prototype of a mess-cleaner-upper, I think it would look something like this. Hash-splitting to divvy up information, content-addressing for identifying it, locality-sensitive hashing for finding similar blocks, and least compression and diffing for storing changes effectively. This is what we're missing.

## And... Recurse

As I write this today, it's tomorrow.

It's 2:36 AM. I'm getting really tired. But I think it was worth it.

These are ideas that have been simmering in my mind for a while, no doubt. I'm glad that I got it all out today. This is what summer is for, in all its chaos. During the school year, goin through the motions of class, it's hard to sit down for a couple of hours to entertain ideas like these. To see where the mind leads. Yet here we are.

I think balance and moderation in all things is one of the most important principles of all, when used in moderation. 

So before I hit the hay, a few final words:

> Don't be afraid to suspend disbelief and follow where new ideas take you; you never know where you might end up.

## Editor's Note

This post is a mess. Sometime in the future, maybe I'll swing by add some headings, pictures, videos; clean up my prose, make it feel nice. If you made it this far, you probably just jumped to the bottom—but if you scrolled and read it... than there's nothing more that I can say than Thank You, I hope you enjoyed the ride. 