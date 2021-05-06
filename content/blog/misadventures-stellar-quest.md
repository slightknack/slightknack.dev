+++
title = "Stellar Quest (Mis)Adventures"
date = 2021-05-03
+++

Good evening fellow Lumenauts!

For those of you who don't know what [Stellar](https://stellar.org) is yet, it's a cryptocurrency that's been around since about 2015 by the same guys who made Ripple. I personally find it notable for a couple of reasons:

Instead of using [Proof-of-Work](https://en.bitcoin.it/wiki/Proof_of_work) or [Proof-of-Stake](https://en.bitcoin.it/wiki/Proof_of_Stake), Stellar uses the [Stellar Consensus Protocol](https://www.stellar.org/papers/stellar-consensus-protocol), which is a construction of Federated Byzantine Agreement. I've written more about (and am working on an implementation of) SCP [here](https://github.com/slightknack/drop-in-fba), for those interested. Stellar is *really* fast (e.g. closing times are <5s on average) and environmentally friendly (no [mining](https://news.ycombinator.com/item?id=26386741) or [farming](https://www.tomsguide.com/news/what-is-chia-cryptocurrency-and-why-is-it-bad-news-for-hard-drives)).
<!-- more -->
In my opinion, Stellar doesn't have the usual crypto-dystopia-air about it. Some may see this as a bad thing, but I see it as the opposite: extreme decentralization is just bad centralization (I mean, just look at bitcoin exchanges if you need an example), so by building the protocol with federation in mind, Stellar feels like email, but for money, and Just Works™️. It's all about finding that balance, and Stellar hits the sweet spot.

Of course, I sound like just another Stellar shill. And that's fine! I think it's a cool project. If you're looking for a longer-form introduction to the rationale behind Stellar, good ol' [`patio11` can hook you up](https://www.kalzumeus.com/2014/08/05/harry-potter-and-the-cryptocurrency-of-stars/).

# Anyway, What's Stellar Quest?
The *Stellar Development Foundation* (you know, the governing body responsible for the development of Stellar) does a lot of things to help people familiarize people with Stellar, and usually have something to do with giving away free *Lumens* (XLM).

One such thing is a competition/challenge called [Stellar Quest](https://quest.stellar.org/). Quest teaches people how to use Stellar's API ([Horizon](https://github.com/stellar/go/tree/master/services/horizon), for the pedantic) through a set of developer-oriented challenges that increase in difficulty as time goes on. (Don't worry, it's all done on the test network.)

As of writing, there are two finished Quest Series; the third is in progress right now:

![Series 3 begins May 3rd](/content/series-3.png)

I've participated in Quest in the past, but always *after* they happened. I didn't want to miss out again, so I made sure to be prepared.

Series 3 is a bit different than previous series for two reasons:

1. Stellar Quest is now only accessible through an app. In the past, you could also do it in-browser. I'm personally not a fan, because it means you have to email the public/private keys they give you to yourself. This is also the first time the app is being used, so it's buggy as *heck*. I mean, it's impressive the developers build it off as quickly as they did, but it definitely needs some polish.

2. Instead of playing globally, you have to register an hour before the competition. After registering, you'll be put into a room with about 20 other people, and compete to finish first. First person to finish the challenge will get 500 XLM, ..., fifth will get 250 XLM, and so on and so forth.

Anyway, let's talk prizes. Currently, 1 stellar XLM is about 0.56 USD, so that **first-place 250 XLM prize is worth about $280!** This is quite a lot, considering you're only competing against 20 others, there are multiple rounds per series, and a challenge takes about an hour to complete (depending).

So, hearing that the Series 3 challenge would be starting soon, I decided to practice and prepare so I could secure that top spot. As you'll soon see, it didn't go entirely to plan...

# Fly me to the moon!
(Un)Luckily enough, I have exams over these next two weeks, which means... **Study Leave!** I had no exams today, so, after reviewing some calculus this morning, my afternoon was completely free to follow my stellar aspirations.

Installing the app and setting up an account with [Albedo](https://albedo.link/) was simple enough — it's the same process as that of the other challenges, so no surprise here. I double-checked the countdown timer, then set an alarm on my phone. Shortly thereafter, I fired up Discord, opened a fresh browser pane, made sure everything was in order, then...

...waited...

...patiently...

... until it started! I quickly registered, and got into a room with a few other people. I was itching to get started, but, alas:

> After the Challenge opens, you'll have 1 hour to register: after that hour is up, you can begin the challenge.

So there I sat, with an hour to kill. I reviewed the [Stellar Docs](https://developers.stellar.org/docs/start/list-of-operations/#account-merge), created a couple accounts on the testnet so I had an ample supply of lumens to work with, then spent some time working on this website's homepage.

There are generally two ways to complete Stellar Quest Challenges: RunKit (JS environment), or Stellar Laboratory (interactive interface). Given that this was the first challenge, I choose the latter for easier experimentation, but RunKit is needed as challenges get more complex later on.

The alarm on my phone went off, it was time to start!

## Off to the races!

> This post is a Work in Progress

- Challenge starts
- Read the prompt
- Immediate idea
- Create and fund new account
- Set transaction with bump
- 400: Doesn't work?
- Try again...
- Still doesn't work!?!?
- Repeatedly trying
- Check the discord server
- organizer mentions magic number
- someone else mentions resources
- find transaction
- locate xdr blob
    - explain what xdr is
- decipher it, locate magic number: 110101115104111
- try to bump transaction
- sequence number too high!
- merge in another account, bump again
- challenge should be solved,
- but...
- Rate limited!
- have to go

# 429: You're been rate limited

- later, check back
- still rate limited
- invited to secret stellar club
- share my solution
- others use it and it works
- still waiting
- reinstall the app
- announcement on main discord server: rate limiting fixed, don't reinstall the app!
- lost all my progress, registration is closed
- but solution works!
- Arghhghgh!

# It's not all bad

- It's not all bad
- people I helped on secret server gave me a portion of their winnings for helping them.
- In the future, wait out all bugs!
- Making friends is a good thing!
- Hope that thursday goes better.
- The end

- Closing thoughts

> ## Don't Buy me a Coffee!
> Because I don't drink coffee! ... but, if you want to, idk, buy me a *half-gallon of crypto-funded chocolate milk*, I'm game. My stellar address is `slightknack*stellarx.com`; alternatively, my public key is:
> ```
> GBKDWR2YMORRJVKLJGVWBOBVFWCBJEITSGNFQLKS6O6E2RYE364UBK6I
> ```
> I usually don't do this, but since I've adopted the role of a crypto-shill for one article, I may as well.
