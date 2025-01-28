
+++
title = "Reasoning Trace"
date = 2025-01-28

[extra]
artbit = "2_skeletons.png"
+++

[DeepSeek-R1-Zero is cool][ds]. I [wrote about reasoning models][cc] before o1, and I'm excited to the way this area of research has been cracked wide open, it seems. It's also remarkably simple. I'm messing around with llama (running locally!), trying to see if I can at least partially reproduce the results (for fun). I figure I can collect reasoning chains and then adapt some existing RLHF code to fine-tune the model on successful chains vs. unsuccessful chains, maybe by prefixing the response with a reward token, a la [decision transformer][dt].

> *N.B.* I'm doing something a little more complicated where the model is allowed to write and run python programs to arrive at an answer. I'm testing on some [*Project Euler*][pe] questions, because I think they are a fun blend of a mathematical and computational challenge.

It turns out that `llama-3.2-3b-instruct` is pretty bad at *Project Euler*. I've tested it on the first <s>77</s> 109 questions, and it's gotten about 12 right. About half the time (43 cases), it gets stuck in a reasoning loop and never produces an answer (like generating Python code that isn't properly indented and then trying everything to debug the syntax error *except indenting the code*). Sometimes this makes llama frustrated:

<!-- more -->

<img src="/content/driving-me-crazy.png" alt="llama: This problem is driving me crazy. It seems like every time I make a change to the program, I run into the same problem. I am starting to think that this is just a limitation of the sandboxed runtime.">

Yet sometimes it gets lucky!

I wanted to share a couple of the successful cases, because they're mildly amusing.

(There's the question of whether the model has seen these problems before in its training set—maybe, but it's so bad at solving them that if RL improves even the baseline success rate, I'll see that as a success.)

<details>
<summary> <em>Here's the prompt I'm using</em></summary>

<div class="tag-light">

> A conversation between user and assistant. The user asks a question, and the assistant solves it by reasoning and writing a Python program:
>
> 1. The assistant first thinks about the reasoning process in the mind and then writes a program.
>
> 2. The program is then run, and the program output is given to the assistant.
>
> 3. The assistant then reasons about the output. If the output is correct, the assistant provides the user with a final answer. If the output is incorrect, the assistant may write another program in the same manner as before.
>
> The format of the assistant response is important:
>
> - The reasoning process is enclosed within `<think>` `</think>` tags.
>
> - The program is enclosed within `<program>` `</program>` tags. The program is directly passed to a sandboxed runtime, and the output of the program is recorded. The assistant must be sure to indent the program correctly.
>
> - The output of the program is enclosed within `<output>` `</output>` tags. The program should print any results the assistant wants.
>
> - The summary of the final answer is enclosed within `<summary>` `</summary>` tags. From the summary the assistant will box a final answer.
>
> - The final answer is enclosed within `<boxed>` `</boxed>` tags. The answer must be a single number, as specified by the user.
>
> An example of the conversation format:
>
> user: question here
>
> assistant: `<think>` reasoning process here `</think>`
>
> `<program>` program here `</program>`<br>
> `<output>` output here `</output>`<br>
> `<think>` reasoning process here `</think>`<br>
> ...<br>
> `<summary>` summary here `</summary>`<br>
> `<boxed>` boxed answer here `</boxed>`
>
> Here is the actual conversation:
>
> user: `QUESTION`
>
> assistant: `ANSWER`

</div>

The code I used to collect reasoning traces samples tokens from the model such that the format of `ANSWER` matches the format described in the prompt. In the examples reproduced below, I've decided to format the model response based on the corresponding tag (e.g. `<think>` is quoted) and use [MathJAX][mj] to format the LaTeX.

</details>

> ⚠️ *ACHTUNG:* This post contains spoilers for *Project Euler*, which is why the model's reasoning traces are collapsed by default. *Project Euler* is a lot of fun (and in fear of spoiling the fun, I'm conflicted as to whether I should even *include* the model's answers...) so I *strongly* suggest that you try some of these problems for yourself before looking at what the model did! (And to be clear: I verified these answers myself, and did not submit them to the *Project Euler* website.)

In no particular order, here are some problems that *were* solved successfully:

# Problem 56

> [Try it here](https://projecteuler.net/problem=56)!

This sample is interesting because the model reasons a decent amount before writing some code. It also correctly computes a few expressions while reasoning (e.g. $99^2 = 9801$ and $1+9+8+0+1 = 19$). The reasoning however is faulty in a few places: the maximum number is $99^{99}$, not $99^2$. Despite this, the generated code works without revision.

<details>
<summary> <em>Expand trace...</em></summary>

> `user:`
>
> A googol ($10^{100}$) is a massive number: one followed by one-hundred zeros; $100^{100}$ is almost unimaginably large: one followed by two-hundred zeros. Despite their size, the sum of the digits in each number is only $1$.
>
> Considering natural numbers of the form, $a^b$, where $a, b \lt 100$, what is the maximum digital sum?
>
> `assistant:`
>
> > <p class="tag-light"> To solve this problem, we need to think about the numbers in the form, $a^b$, where $a, b \lt 100$. The problem asks for the maximum digital sum of such numbers. In order to solve this problem, we should start by finding the maximum possible value of $a^b$ where $a, b \lt 100$. We know that $a$ can be at most $99$, and $b$ can be at most $99$. Let's try to find the maximum value of $a^b$ where $a, b \lt 99$. We can see that the maximum value is $99^2$, and we can also see that $99^2 = 9801$, which has a maximum digital sum of $1+9+8+0+1 = 19$. So we should find the maximum digital sum of $a^b$ where $a, b \lt 99$ by trying all the numbers $a^b$ in the given range. We can use a loop to try all the numbers in the given range, and find the maximum digital sum. </p>
> ```python
> max_digit_sum = 0
> for a in range(1, 100):
>     for b in range(1, 100):
>         digit_sum = 0
>         for digit in str(a**b):
>             digit_sum += int(digit)
>         if digit_sum > max_digit_sum:
>             max_digit_sum = digit_sum
> print(max_digit_sum)
> ```
> ```
> 972
> ```
> > <p class="tag-light"> Based on the output of the program, we can see that the maximum digital sum is $972$. So the maximum digital sum of $a^b$ where $a, b \lt 100$ is $972$. </p>
>
> The maximum digital sum of numbers in the form $a^b$ where $a, b \lt 100$ is $972$.
>
> <div class=boxed><p>972</p></div>

<!-- modified from https://zola.discourse.group/t/maths-support-via-mathjax/1000 -->
<script>
window.MathJax = {
  tex: {
    inlineMath: [['$','$']],
    displayMath: [['$$','$$']],
  },
  startup: {
    ready: () => MathJax.startup.defaultReady(),
  }
};
</script>

</details>

# Problem 53

> [Try it here](https://projecteuler.net/problem=53)!

This sample is interesting because the model fixes a couple of formatting bugs, and arrives at the correct answer. The fact that it was able to generate the (incorrectly-formatted) program with little thought suggests it has seen this type of problem before, though. It's also a brute-force solution.

<details>
<summary> <em>Expand trace...</em></summary>

> `user:`
>
> There are exactly ten ways of selecting three from five, 12345:
>
> 123, 124, 125, 134, 135, 145, 234, 235, 245, and 345
>
> In combinatorics, we use the notation, $\displaystyle \binom 5 3 = 10$.
>
> In general, $\displaystyle \binom n r = \dfrac{n!}{r!(n-r)!}$, where $r \le n$, $n! = n \times (n-1) \times ... \times 3 \times 2 \times 1$, and $0! = 1$.
>
> It is not until $n = 23$, that a value exceeds one-million: $\displaystyle \binom {23} {10} = 1144066$.
>
> How many, not necessarily distinct, values of $\displaystyle \binom n r$ for $1 \le n \le 100$, are greater than one-million?
>
> `assistant:`
>
> > <p class="tag-light"> The problem can be solved by iterating through all values of n and r, calculating the binomial coefficient, and checking if it exceeds one million. </p>
>
> ```python
> import math
>
> max_value = 1000000
>
> for n in range(1, 101):
> for r in range(1, n + 1):
> binomial_coefficient = math.comb(n, r)
> if binomial_coefficient > max_value:
> answer += 1
> print(answer)
> ```
> ```
>   File "/var/folders/vp/h53p2mbs5f334wqgcfz9ntq80000gn/T/tmpfgsnmgii.py", line 6
>     for r in range(1, n + 1):
>     ^^^
> IndentationError: expected an indented block after 'for' statement on line 5
> ```
>
> > <p class="tag-light">I made a mistake in the program. The indentation is incorrect. The inner loop should be indented to 4 spaces.  </p>
>
> ```python
> import math
>
> max_value = 1000000
>
> for n in range(1, 101):
>     for r in range(1, n + 1):
>         binomial_coefficient = math.comb(n, r)
>         if binomial_coefficient > max_value:
>             answer += 1
> print(answer)
> ```
> ```
> Traceback (most recent call last):
>   File "/var/folders/vp/h53p2mbs5f334wqgcfz9ntq80000gn/T/tmpnkfk79sn.py", line 9, in <module>
>     answer += 1
>     ^^^^^^
> NameError: name 'answer' is not defined
> ```
>
> > <p class="tag-light"> I forgot to define the variable answer. </p>
>
> ```python
> import math
>
> max_value = 1000000
>
> answer = 0
> for n in range(1, 101):
>     for r in range(1, n + 1):
>         binomial_coefficient = math.comb(n, r)
>         if binomial_coefficient > max_value:
>             answer += 1
> print(answer)
> ```
> ```
> 4075
> ```
>
> > <p class="tag-light">The final answer is correct. I found 4075 values of $\displaystyle \binom n r$ that are greater than one-million.  </p>
>
> The final answer is $\boxed{4075}$.
>
> <div class=boxed><p>4075</p></div>

</details>

# Problem 3

> [Try it here](https://projecteuler.net/problem=3)!

This sample is interesting because the code generated is a little non-trivial—there's a lot of indentation which could mess it up—but the model gets it right the first time. The model doesn't really ever verify its responses, maybe if I collected more reasoning traces there would be examples of that that could be magnified during fine tuning?

<details>
<summary> <em>Expand trace...</em></summary>

> `user:`
>
> The prime factors of $13195$ are $5, 7, 13$ and $29$.
>
> What is the largest prime factor of the number $600851475143$?
>
> `assistant:`
>
> > <p class="tag-light"> First, let's list the factors of 600851475143 and then we will find the prime factorization. </p>
>
> ```python
> def find_prime_factors(n):
>     i = 2
>     factors = []
>     while i * i <= n:
>         if n % i:
>             i += 1
>         else:
>             n //= i
>             factors.append(i)
>     if n > 1:
>         factors.append(n)
>     return factors
>
> prime_factors = find_prime_factors(600851475143)
> prime_factors.sort()
> max_prime_factor = prime_factors[-1]
>
> print(max_prime_factor)
> ```
> ```
> 6857
> ```
>
> > <p class="tag-light"> The output shows that 6857 is the largest prime factor of 600851475143. Since 6857 is indeed a prime number, this is our final answer. </p>
>
> The largest prime factor of 600851475143 is 6857.
>
> <div class=boxed><p>6857</p></div>

</details>

# Problem 15

[Try it yourself](https://projecteuler.net/problem=15)!

This sample is interesting because the problem contains an image (that is missing), yet the model is still able to reduce the problem to something much simpler, and outputs a very minimal python program to compute the solution.

<details>
<summary> <em>Expand trace...</em></summary>

> `user:`
>
> Starting in the top left corner of a $2 \times 2$ grid, and only being able to move to the right and down, there are exactly $6$ routes to the bottom right corner.
>
> \[missing image\]
>
> How many such routes are there through a $20 \times 20$ grid?
>
> `assistant:`
>
> > <p class="tag-light"> To solve this problem, we can use combinatorics. The number of routes is equal to the number of ways to choose 20 steps to the right and 20 steps down from a total of 40 steps. This is a combination problem. The number of routes can be calculated using the formula for combinations: C(n, k) = n! / (k!(n-k)!), where n is the total number of steps, k is the number of steps to the right, and C(n, k) is the number of combinations. In this case, n = 40 and k = 20. So, we need to calculate C(40, 20). </p>
>
> ```python
> import math
> n = 40
> k = 20
> ans = math.comb(n, k)
> print(ans)
> ```
> ```
> 137846528820
> ```
>
> > <p class="tag-light"> The number of routes through a 20x20 grid is equal to the number of combinations of 40 steps taken 20 at a time, which is C(40, 20). Using the formula for combinations, we get C(40, 20) = 40! / (20! * 20!) = 137846528820. Therefore, there are 137846528820 routes through a 20x20 grid. </p>
>
> There are 137846528820 routes through a 20x20 grid.
>
> <div class=boxed><p>137846528820</p></div>

</details>

# Final Thoughts

Quite obviously the next step is to try some real RL on the collected reasoning traces! I have access to some compute through MIT (as a member of the [MIT AI Alignment](https://aialignment.mit.edu/) group), so we'll see what comes of that. (Classes also start next week, so I have no idea how much time I'll *actually* have ...)

I'll also try to clean the code up and put it up on GitHub, at some point. It's a little hacky. Stay tuned?

On a more personal note: I first got excited about AI around 2015. This was after [Deepmind played Atari][dm], when we caught the first glimpse that RL could [scale beyond human performance][dq]. This was before [PPO][ppo] (though [TRPO][trpo] was new), before [AlphaGo versus Lee Sedol][ag]. Most importantly, this was before [Transformers][at], GPT2, or anything of that sort. I was excited, and I was excited about GOFAI too (scheme, prolog, and things of that sort). I decided then and there that I wanted to do RL and work on AI.

A few years later, though, when all the AI research labs started scaling transformers on reams of data (yes, I was impressed by GPT2!), I was at least a little internally disappointed. I thought back to [percent behaviour cloning][bc]: In a supervised training regime, a model will never be able to do better than the best examples from training data. What do we do when we run out of examples? What do we do when we want to scale beyond expert performance? The dream of AI is not to discover new things. It's learning new ways to discover new things!

Disillusioned with the [*Bitter Lesson*][bl] and GPU-poor, I moved on to other things, like [compilers][pn]. I still followed AI research, but it wasn't my main obsession. I had all these crazy ideas for RL—new approaches in the vein of [Random Network Distillation][rnd], [Go-Explore][ge]; an information-optimal strategy for extracting observations from stochastic environment.

> *N.B.* The idea is still very cool! Essentially, if we have a way to compute [surprisal][ig] (information gain), we can use a [decision transformer][dt] to sample trajectories that maximize surprisal-to-go. To handle the [noisy-tv problem][tv], we quantify [surprisal as epistemic uncertainty][eu], which can be computed by subtracting observed aleatoric uncertainty from the KL-divergence (expected excess surprise) of the observed state vs. the predicted state (using the state transition dynamics of the decision transformer). Perhaps I'll write about this sometime.

Despite my excitement for RL, it seemed as though the field had moved on, pouring resources into a direction that seemed ... like it'd hit a wall at some point, I don't know. I also felt the sting when AI research companies stopped releasing open-source model training code. Which I could read, learn from, and try to reproduce.

Deepseek-R1 has me got excited again. The technique is remarkably simple, it scales, *and it <u>extracts information from the environment</u> which can be used to <u>improve existing models beyond the performance of expert examples</u> in training data*. I wish I could underscore how cool this is. Wait, this is my website, I can.

I'm excited because there's an [open effort to reproduce R1][or1]. I can read and learn from that code. I can try to reproduce it. My younger self really wanted to go to MIT to "become an AI researcher". Consciously or not, I've continued to work toward that goal, and now I'm here. If you want to do foundational work, you still need a lot of compute. (Or maybe not, post-R1.) What next?

I'm excited to do research. Maybe the research I do won't work, for whatever reason. Maybe it doesn't really matter: it's fun to be able to try, once more.

What a time to be alive.

<img src="/content/snow.jpg" alt="Fresh snow on the ground in Cambridge, MA.">

<script id="MathJax-script" defer src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>

[ds]: https://arxiv.org/abs/2501.12948
[cc]: /blog/constraints
[dt]: https://arxiv.org/pdf/2106.01345
[pe]: https://projecteuler.net/archives
[tt]: https://x.com/slightknack/status/1884236593483198705
[mj]: https://www.mathjax.org/
[ag]: https://www.youtube.com/watch?v=WXuK6gekU1Y
[dq]: https://storage.googleapis.com/deepmind-media/dqn/DQNNaturePaper.pdf
[ppo]: https://arxiv.org/abs/1707.06347
[trpo]: https://arxiv.org/abs/1502.05477
[at]: https://arxiv.org/abs/1706.03762
[dm]: https://arxiv.org/abs/1312.5602
[bc]: https://cgi.cse.unsw.edu.au/~claude/papers/MI15.pdf
[pn]: https://github.com/vrtbl/passerine
[ge]: https://arxiv.org/abs/1901.10995
[rnd]: https://openai.com/index/reinforcement-learning-with-prediction-based-rewards/
[bl]: http://www.incompleteideas.net/IncIdeas/BitterLesson.html
[tv]: https://arxiv.org/abs/1810.12894
[ig]: https://arxiv.org/abs/1703.01732
[dt]: https://arxiv.org/abs/2106.01345
[eu]: https://arxiv.org/pdf/2206.01558
[or1]: https://github.com/huggingface/open-r1
