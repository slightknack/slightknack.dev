+++
title = "Stellar Quest (Mis)Adventures"
date = 2021-05-03
draft = true

[extra]
artbit = "1_saturn.png"
+++

Good evening fellow Lumenauts!

For those of you who don't know what [Stellar](https://stellar.org) is yet, it's a cryptocurrency that's been around since about 2015 by the same guys who made Ripple. I personally find it notable for a couple of reasons:

Instead of using [Proof-of-Work](https://en.bitcoin.it/wiki/Proof_of_work) or [Proof-of-Stake](https://en.bitcoin.it/wiki/Proof_of_Stake), Stellar uses the [Stellar Consensus Protocol](https://www.stellar.org/papers/stellar-consensus-protocol), which is a construction of Federated Byzantine Agreement. I've written more about (and am working on an implementation of) SCP [here](https://github.com/slightknack/drop-in-fba), for those interested. Stellar is _really_ fast (e.g. closing times are <5s on average) and environmentally friendly (no [mining](https://news.ycombinator.com/item?id=26386741) or [farming](https://www.tomsguide.com/news/what-is-chia-cryptocurrency-and-why-is-it-bad-news-for-hard-drives)).

<!-- more -->

In my opinion, Stellar doesn't have the usual crypto-dystopia-air about it. Some may see this as a bad thing, but I see it as the opposite: extreme decentralization is just bad centralization (I mean, just look at bitcoin exchanges if you need an example), so by building the protocol with federation in mind, Stellar feels like email, but for money, and Just Works™. It's all about finding that balance, and Stellar hits the sweet spot.

Of course, I sound like just another Stellar shill. And that's fine! I think it's a cool project. If you're looking for a longer-form introduction to the rationale behind Stellar, good ol' [`patio11` can hook you up](https://www.kalzumeus.com/2014/08/05/harry-potter-and-the-cryptocurrency-of-stars/).

# Anyway, What's Stellar Quest?

The _Stellar Development Foundation_ (you know, the governing body responsible for the development of Stellar) does a lot of things to help people familiarize themselves with Stellar, and these things usually have something to do with giving away free _Lumens_ (XLM).

One such thing is a competition/challenge called [Stellar Quest](https://quest.stellar.org/). Quest teaches people how to use Stellar's API ([Horizon](https://github.com/stellar/go/tree/master/services/horizon), for the pedantic) through a set of developer-oriented challenges that increase in difficulty as time goes on. (Don't worry, it's all done on the test network.)

As of writing, there are two finished Quest Series; the third is in progress right now:

![Series 3 begins May 3rd](/content/series-3.png)

I've participated in Quest in the past, but always _after_ they happened. I didn't want to miss out again, so I made sure to be prepared.

Series 3 is a bit different than previous series for two reasons:

1. Stellar Quest is now only accessible through an app. In the past, you could also do it in-browser. I'm personally not a fan, because it means you have to email the public/private keys they give you to yourself. This is also the first time the app is being used, so it's buggy as _heck_. I mean, it's impressive the developers build it off as quickly as they did, but it definitely needs some polish.

2. Instead of playing globally, you have to register an hour before the competition. After registering, you'll be put into a room with about 20 other people, and compete to finish first. First person to finish the challenge will get 500 XLM, ..., fifth will get 250 XLM, and so on and so forth.

Anyway, let's talk prizes. Currently, 1 stellar XLM is about 0.56 USD, so that **first-place 500 XLM prize is worth about $280\*!** This is quite a lot, considering you're only competing against 20 others, there are multiple rounds per series, and a challenge takes about an hour to complete (depending).

> \* Edit: Three days later, the exchange rate was even better at $315 per 500 XLM.

So, hearing that the Series 3 challenge would be starting soon, I decided to practice and prepare so I could secure that top spot. As you'll soon see, it didn't go entirely to plan...

# Some Background

(Un)Luckily enough, I have exams over these next two weeks, which means... **Study Leave!** I had no exams today, so, after reviewing some calculus this morning, my afternoon was completely free to follow my stellar aspirations.

Installing the app and setting up an account with [Albedo](https://albedo.link/) was simple enough — it's the same process as that of the other challenges, so no surprise here. I double-checked the countdown timer, then set an alarm on my phone. Shortly thereafter, I fired up Discord, opened a fresh browser pane, made sure everything was in order, then...

...waited...

...patiently...

... until it started! I quickly registered, and got into a room with a few other people. I was itching to get started, but, alas:

> After the Challenge opens, you'll have 1 hour to register: after that hour is up, you can begin the challenge.

So there I sat, with an hour to kill. I reviewed the [Stellar Docs](https://developers.stellar.org/docs/start/list-of-operations/#account-merge), created a couple accounts on the testnet so I had an ample supply of lumens to work with, then spent some time working on this website's homepage.

There are generally two ways to complete Stellar Quest Challenges: [RunKit](https://runkit.com/home) (JS environment), or [Stellar Laboratory](https://laboratory.stellar.org/#txbuilder) (interactive interface). Given that this was the first challenge, I choose the latter for easier experimentation, but RunKit is needed as challenges get more complex later on.

_Suddenly_, The alarm I had set on my phone went off: it was time to start!

> ## Note
>
> I would've included more pictures, but I didn't take any screenshots at the time.

## Part I: Off to the races!

As expected, as soon as we hit 3pm, Stellar Quest started sorting us into rooms. I was put into a room with one other person before the challenge prompt slid up on my screen:

> Make use of a sequence number bump operation in a transaction
>
> Welcome to Stellar Quest series 3! In today's inagural challenge you must submit a transaction from your account, making use of the sequence number and bump operation.

'Oh, just a sequence number bump operation?' I thought. That's not too bad: for the uninitiated, all transactions from an account have an associated sequence number, and each sequence number must be higher than the last. All a sequence number bump does is set the sequence number to a specific value, but only if that value is greater than the current sequence number. Here's a basic example:

```
Sequence number: 7

Transaction:
- Bump sequence number: 24

Sequence number: 24
```

Honestly pretty simple.

To complete this challenge, Quest generates a keypair, i.e. a public key and private key, for usage on the testnet. Stellar public keys start with `G`; secret keys start with `S`. Here's an example:

```
public: GB6RRYSQVIKX5K5GIOAEK6ZSCTK675IYADGUWRCWDMIG5YXJB6C7ABDA
secret: SAWPW6MVPCTHQL7ZPTTA34HQOVIPZBHUSHC7CJ7R774RS73W2NOQ6UGE
```

What's important to note is that this keypair _isn't_ initialized as an account on the stellar ledger: we have to do that ourselves. Stellar provides a tool, friendbot, that turns keypairs into accounts with some starting XLM on the testnet ledger, however, it's usually better to create and fund the account yourself, using a different keypair.

With this in mind, my plan of action was straightforward:

1. Generate a 'fake' keypair, and fund that account using friendbot.
2. Use the fake keypair to create an account for the 'real' keypair. (The keypair SQ gave me)
3. Use the fake keypair to bump the sequence number.
4. ???
5. Profit!

As you'll see, this solution wasn't too far off. I whipped out Stellar Laboratory, created the 'fake' account, and then used that account to fund the real account. To make sure I did it right, I checked the transaction history on [Stellar Explorer](https://testnet.steexp.com). As expected, the account was initialized; I had transfered 5000 testnet XLM from the original account as well:

![A new account with a little less than 5000 XLM on Stellar Explorer](/content/explorer.png)

Perfect! I tabbed over to Laboratory, heart racing, and threw together a quick transaction that bumped the sequence number to `3329437173022725`. Easy, right?

I copied over my signing key, signed the envelope, and submitted it to the network...

![Success! Wait...](/content/success.png)

Success! I pulled out my phone, tapped 'Verify Solution', and...

```
In Progress - Error
{
    ...
    "status": 400,
    "detail": "no valid bump sequence operations...",
}
```

What!? That _can't_ be...

In a rush of panic, I wrap up a new transaction, and bumped again...

```
"status": 400,
```

And again...

```
"status": 400
```

And again...

To no avail. What's wrong?

# Part II: Status 400

So obviously, something _is_ wrong with my solution. I looked at the prompt again, and saw the following line I had skipped over the first time:

> ...
>
> Imagine a scenario where you have two potential outcomes but only one of them should actually execute. Rather than having both transactions compete for the same sequence number you can control the outcome by bumping the sequence number to support whichever of the two scenarios you wish.
>
> ...

Hmm, interesting. I'd done stuff like this before, but this scenario seemed overly complicated for the first challenge.

But what could I do? I laced up my boots and put on my brave face: I published a pair of transactions, and skipped to the second using bump sequence... still `"status": 400`.

I used Stellar Explorer to check my work: nope, looked good as far as I could tell. What was I missing?

---

At this point, the [Stellar Quest Discord Server](https://discord.gg/Agvuv2cGvk) was a bit of a mess: I had been one of the lucky ones, actually being able to start the challenge, but many others were having trouble getting into a lobby or registering at all.

I navigated the chaos of `#general`, and slid into `#support` to see if anyone else was having the same issue as me:

> **slightknack (me):** Is verification not working atm?
>
> **falconis:** I have done two of the required operations, but the solution verification seems to not recognize it
>
> **Smephite:** +1

So it looked like I wasn't alone... pressing further:

> **slightknack:** Maybe we should loop in `@kalepail`.
>
> > Note: `@kalepail` is a server mod
>
> **kalepail:** Fun fact. This challenge isn't so much in doing the operation but in ensuring you bump to a specific number
>
> **kalepail:** Nothing is ever quite as easy as it seems

Huh, we need to bump to a specific sequence number. I reread the instructions, but didn't see anything about a _magic number_. I sat there, waiting. A few others voiced their concerns.

Ah, one last hint, coming in hot:

> **kalepail:** Maybe try the Resources tab

The resources tab, eh? The race was back on!

---

The reason I hadn't checked the resources tab initially was a simple one: in past quests, the resources tab usually contained links to documentation, but not anything essential to the challenge, per se.

Pulling up my phone again — all this switching was a bit nauseating — I scrolled down to the resources tab and skimmed through the resources:

1. Documentation — Nope
2. Laboratory — Already there
3. [Horizon](https://horizon.stellar.org/transactions/073cde1fab7d28d3e322e5f61ac385c37859c3e82b17b6c92a9f0444420336cb) — Already familiar with it... wait!

The last link wasn't a link to _documentation_, it was a JSON blob detailing a _specific transaction_ that had occured on the network! Perhaps we would find the magic number here?

---

Meanwhile, on Discord:

> **zajko:** _slides into my dms_
>
> **zajko:** hey, im trying to solve the quest, did you figure out what sequence number did he [kalepail] mean?
>
> **zajko:** when he said a specific one
>
> **slightknack:** no, sorry
>
> **zajko:** _You've been invited to join a server: stellar quest 3 solving_

A secret server, eh? May as well join.

![A secret server invite link card](/content/server.png)

Here goes nothing...

---

Where were we? Oh yeah:

> The last link wasn’t a link to documentation, it was a JSON blob detailing a specific transaction that had occured on the network! Perhaps we would find the magic number here?

I opened the JSON blob on my phone, and scrolled through it. A few things stood out:

```
...
"memo": "nesho as a buffer",
"envelope_xdr": "AAAAAgAAAABDM3D4KwszNoKJQeNDrAnazm6igHWI+HjMZq6Vce8wewAAAMgB59RMAAAAQgAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAQAAABFuZXNobyBhcyBhIGJ1ZmZlcgAAAAAAAAIAAAAAAAAAAAAAAABnZypA5k1X4DWczszJHmBLbKUdrQhOSRWLAScXA4g7KgAAAAAAmJaAAAAAAQAAAABnZypA5k1X4DWczszJHmBLbKUdrQhOSRWLAScXA4g7KgAAAAsAAGQi6drrbwAAAAAAAAACA4g7KgAAAEAB7UMxUSq/tSuTyE7U87nbKuGI7PJ/R3MAnC4eP89ErZXu5rsZnQYyrKEVSOj1ttQk1s9Fc79JlxaJzZ0296kCce8wewAAAEClYmILATIFceLvHTuJ7XVPkknaVIR5LXcBwYB3bSRd/F1YptNruX/GGN7RHtO6GoEtFNIVEZBiO9z+0qLN6lEL",
...
```

Aha! I had found the transaction envelope! Here it is, in all its XDR glory:

```
AAAAAgAAAABDM3D4KwszNoKJQeNDrAnazm6igHWI+HjMZq6Vce8wewAAAMgB59RMAAAAQgAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAQAAABFuZXNobyBhcyBhIGJ1ZmZlcgAAAAAAAAIAAAAAAAAAAAAAAABnZypA5k1X4DWczszJHmBLbKUdrQhOSRWLAScXA4g7KgAAAAAAmJaAAAAAAQAAAABnZypA5k1X4DWczszJHmBLbKUdrQhOSRWLAScXA4g7KgAAAAsAAGQi6drrbwAAAAAAAAACA4g7KgAAAEAB7UMxUSq/tSuTyE7U87nbKuGI7PJ/R3MAnC4eP89ErZXu5rsZnQYyrKEVSOj1ttQk1s9Fc79JlxaJzZ0296kCce8wewAAAEClYmILATIFceLvHTuJ7XVPkknaVIR5LXcBwYB3bSRd/F1YptNruX/GGN7RHtO6GoEtFNIVEZBiO9z+0qLN6lEL
```

> ## Aside: XDR
>
> When transactions are sent through the Stellar network, a compact encoding of the transaction, called XDR, is used. From the [Stellar Docs](https://developers.stellar.org/docs/glossary/xdr/):
>
> > XDR, also known as External Data Representation, is used throughout the Stellar network and protocol. The ledger, transactions, results, history, and even the messages passed between computers running stellar-core are encoded using XDR.
> >
> > XDR is specified in [RFC 4506](http://tools.ietf.org/html/rfc4506.html) and is similar to tools like Protocol Buffers or Thrift.
>
> It's important to note that although XDR is a binary format, it is usually base-64 encoded when sent through JSON (for good reason).

Luckily enough for us, Stellar Laboratory provides a tool to [inspect the content of XDR blobs](https://laboratory.stellar.org/#xdr-viewer). I grabbed `envelope_xdr` from from the JSON response, emailed it to myself, [then opened it with the XDR viewer](https://laboratory.stellar.org/#xdr-viewer?input=AAAAAgAAAABDM3D4KwszNoKJQeNDrAnazm6igHWI%2BHjMZq6Vce8wewAAAMgB59RMAAAAQgAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAQAAABFuZXNobyBhcyBhIGJ1ZmZlcgAAAAAAAAIAAAAAAAAAAAAAAABnZypA5k1X4DWczszJHmBLbKUdrQhOSRWLAScXA4g7KgAAAAAAmJaAAAAAAQAAAABnZypA5k1X4DWczszJHmBLbKUdrQhOSRWLAScXA4g7KgAAAAsAAGQi6drrbwAAAAAAAAACA4g7KgAAAEAB7UMxUSq%2FtSuTyE7U87nbKuGI7PJ%2FR3MAnC4eP89ErZXu5rsZnQYyrKEVSOj1ttQk1s9Fc79JlxaJzZ0296kCce8wewAAAEClYmILATIFceLvHTuJ7XVPkknaVIR5LXcBwYB3bSRd%2FF1YptNruX%2FGGN7RHtO6GoEtFNIVEZBiO9z%2B0qLN6lEL%0A&type=TransactionEnvelope&network=test).

If we look at the decoded blob, we can see it's made up of two operations:

```
operations: Array[2]
  [0] body: [createAccount]
  [1] body: [bumpSequence]
```

So we _do_ need to bump the sequence number! Does this transaction contain the magical sequence number `@kalepail` mentioned? Lo and behold:

```
[1]
  sourceAccount: [keyTypeEd25519]
    ed25519: GBTWOKSA4ZGVPYBVTTHMZSI6MBFWZJI5VUEE4SIVRMASOFYDRA5SUQTE
  body: [bumpSequence]
    bumpSequenceOp
      bumpTo: 110101115104111
```

Do you see what I see! it looks like `110101115104111` is our lucky number!

At the speed of light, I created a new fake keypair, merged my old account to reset the sequence number to zero, authored a transaction that bumped the sequence number to that oh-so-special `110101115104111`, signed it, and clicked submit...

![Success! Again!](/content/success.png)

Palms sweating, I reached for my phone, pressed reload, and:

```
In Progress - Error
{
  "error": "rate_limit_exceeded",
  "message": "There have been too many requests to this server. Try again later.",
  "status": 429
}
```

A rate limit? Oh no...

# Part III: Or, 429, You've been rate limited

At this point, I had to leave for _calcio_ practice. I knew my solution was correct, as far as I could tell (once again checking Stellar Explorer), and knew I could just try again when I got back.

![Two Hours Later](/content/two-hours-later.jpg)

Still sweaty, I popped open laptop, pulled out my phone, and tried verifying the solution again:

```
"error": "rate_limit_exceeded",
"status": 429,
```

Huh. Was it just me?

---

I brought up Discord, and checked the `#announcements`:

> **kalepail:** `@everyone` We're aware of the `rate_limit_exceeded` error and l'm looking into it. In the mean time please just be patient. For those stuck in the `Check Status` state I'm investigating what's going on there as well. I know it's frustrating but this was a possibility at the scale and complexity of this app. Will hopefully have things squared up soon. If you were registered you should be fine and I'll make another announcement here once things are good to go again.

Hmm. I slid into the _Secret Stellar Club_:

> **rmaguiar:** Yep, what I still don't understand is what kalepail said about the number

I got excited! I knew the number! I'd already submitted the transaction, so it wouldn't hurt to share:

> **slightknack:**  
> I know what the secret number is  
> let me find it  
> it's in the transaction  
> you can see it w/ xdr explorer

I pulled up XDR explorer again:

![Magic Number](/content/magic.png)

Perfect! Copy... and... paste!

> **slightknack:**  
> 110101115104111  
> you have to set account to < than that number (via merge, might not be necessary), then bump.  
> but idk, still can't verify, am rate limited

This was news to everyone. `@Hugo.` and a few others tried it... would it work?

---

At this point in time, we had been rate limited for a couple hours. Someone had mentioned that reinstalling the app fixed the issue.

So that's what I did next.

Big mistake.

---

Literal seconds later, the following message was blasted out in `#announcements`:

> **kalepail:** `@everyone` I've just pushed a fix for the `rate_limit_exceeded` issue. You should be able to start checking your answers. For anyone still stuck on the Building Lobby... Check Status button not working page please join the `#check-status-issue`\* channel and let me know. Having a really hard time reproducing the issue and thus putting out a fix.

> \* Note: this channel was later deleted, so I've invented a name here.

Kalepail then followed up in `#check-status-issue`:

> [paraphrasing, channel was deleted]
>
> **kalepail:** If you've reinstalled the app, a new account is generated, which means your progress will be lost. So don't reinstall the app.

Wait, what?

Our progress would be lost?

_Oh, crap._

---

At this point in time I was literally shaking. Registrations were closed, so I couldn't compete again with my freshly installed version of the app. Literal hundreds of dollars were on the line.

---

I slid into the _Secret Stellar Club_. Some members were able to verify their solutions.

The solution I had suggested _worked_.

What?

My solution _was correct_:

> **Hugo.:**  
> OH MY GOD  
> I FINISH FIRST  
> **I WON 500 XLM**  
> **BUMP TO 110101115104111**  
> guys bump to 110101115104111

_Holy cow!_

I couldn't believe it!

...

But alas

...

I'd reinstalled the app.

So was no longer in the running.

And had missed my shot at `500 XLM`.

...

_Oh well._

# Part IV: It's not all bad

It's not over yet.

I was really excited that I'd helped those on the group Discord server succeed. `@Hugo.`, the person who won first, took pity on me for getting locked out of my account, and kindly send me about 50 XLM of his winnings. Thanks!

If I've learned anything, it's that:

1. In the future, wait out all bugs, and follow instructions!
2. Making friends is a good thing, and it's more fun to compete together! 😉

With those lessons in mind, I hope future challenges go more smoothly 😄

# Part V: Closing thoughts

Welp, that was an adventure for sure! I probably won't be able to compete in the next challenge, but I'll try to compete in the ones after that.

Huge thanks to the organizers of Stellar Quest, especially `@kalepail`. I'd also like to thank the developers at the Stellar Development Foundation for all their hard work, the members of the Stellar Quest Discord server for the great interactions I've had there, `@zajko`, who organized the Secret Stellar Club, and most especially, `@Hugo.`, who was kind enough to send me some of the Lumens he won in return for helping him reach the right solution.

Stay safe everyone!

I'll see you around!

## Don't Buy me a Coffee!

Because I don't drink coffee! ... but, if you want to, idk, buy me a _half-gallon of crypto-funded chocolate milk_, I'm game. My stellar address is `slightknack*stellarx.com`; alternatively, my public key is:

```
GBKDWR2YMORRJVKLJGVWBOBVFWCBJEITSGNFQLKS6O6E2RYE364UBK6I
```

I usually don't do this, but since I've adopted the role of a crypto-shill for one article, I may as well.

If you enjoyed this article, consider [subscribing to this website's RSS feed](/atom.xml), checking out [my work on Github](https://github.com/slightknack), or sharing this post with a friend.
