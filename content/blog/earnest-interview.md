+++
title = "Earnestly Responding to a Satirical Interview Guide"
date = 2021-09-28
draft = true

[extra]
artbit = "stack_pick.png"
+++

> This is my super secret proprietary no-nonsense guide on how to ~~interview engineers~~ pass a technical interview.

This morning, as I was scrolling through HN (with my topcolor set to `#abcdef`, of course), I came across a [wise piece](https://www.spakhm.com/p/how-to-interview-engineers) describing the raw-egg-for-breakfast *optimal* technical interview process.

Any interview process that falls short of the one laid out above, of course, imperfection, the article seemed to plead.

# A Question

Skimming the article on my Nokia 3310, I reach the meat of the interview. A technical challenge so tough, only 200 IQ *geniuses* could solve it in under 10 minutes:

> The [problem] I gave for years is to write a program that plays every possible tic-tac-toe game, and then prints the number of valid games.

Tic-tac-toe, eh? I guess you could say I'm [a bit of an expert myself](https://github.com/slightknack/tic-tac-toe).

Not wanting to fall prey to the classic mistake of *not* scrambling to write a solution whenever someone brings up `FizzBuzz`, I knew I had to take this article seriously and prove my *innate zen hackerbility* (as the kids are calling it).

But there's a catch. We don't just have to write a program that prints the number of valid games, we have to write it *fast*:

> The moment the program outputs the correct answer, take note of the time again. That's all you have to do to evaluate how talented the candidate is. The technical aspect of the interview is over. (Yes, you read that right!)

# The Optimal Development Environment

Palms sweating, I knew the timer had already started. "Ok Google, start a stopwatch now" I shout as I reach for my Rose-Gold-mid-2020-MacBook-Air M1 (with *only* 8GB of RAM because I messed up the order).

> "Lisp, Pointers, and the Universe rolled before my eyes as I felt for a crack in the problem, a way to get a grip..."

Is what a loser would say, ha! I already *knew* the solution for the problem. It has been the core of my being ever since practicing LeetCode for 40 hours a day since my parents were born!

Ignoring the trackpad, I `Command+Space` over to Firefox `Command+L` to focus the navbar, and navigate to `repl.it`...

Drat! I don't have time to sign up for a `repl.it` account! Drawing on HN wisdom from years past, I `Command+L` the navbar again, and enter the magic incantation: [`riju.codes`](https://riju.codes).

![A wall of languages](/content/riju.png)

Now we're talking.

Not wanting to fall prey to writing reusable software, I skim the list for dynamically typed languages; I need a language designed to *get stuff done*, one letter variable names and all. `Command+F`. *Python*. `Enter`. Click.

How would a 200 IQ genius approach this problem?

# The Solution

> write a program that plays every possible tic-tac-toe game, and then prints the number of valid games.

"Valid... games." Games that have reached a valid end state, I think. Without a single synapse firing, I've already started blocking out the solution:

```python
def game_over(board):

def count_games(board, turn):
    if game_over(board): return 1
```

A recursive depth-first tree summation. Of course! Not wanting to waste any more time, I start hacking on `game_over`.

The board will just be a list of integers: `-1` for `X`, `1` for `O`, `0` for empty. If there are no zeros left in the board, it's either a draw or a win, so let's handle this first:

```python
def game_over(board):
    if sum(abs(x) for x in board) == 9: return True
```

"A generator expression!" my subconcious whispers. I thank it as my fingers fly across the keyboard. On to rows, columns, and diagonals. If the absolute value of the sum of the board is three, we have a winner:

```python
    # check rows and cols
    for i in range(3):
        if abs(sum(board[3*i:3*i+3])) == 3: return True
        if abs(board[i] + board[i+3] + board[i+6]) == 3: return True
```

Ugly, I know. But I just need a solution; it's not like I'm writing *actual software*. That would be silly!

Diagonals pose more of an issue. "I could take advantage of the fact that diagonals fall along `(x, x)` coordinate pairs," my subconscious whispers.

Silly subconscious! I need an answer, not a general solution! Staring at the numpad on my keyboard, I slide my fingers across the diagonals:

```
159
357
```

Of course! it's so simple! In a burst of adrenaline, I hammer out a poem to the list gods above:

```python
    # check diags
    if abs(board[0] + board[4] + board[8]) == 3: return True
    if abs(board[2] + board[4] + board[6]) == 3: return True
```

How could I have not seen something so simple! Tying it all together, I stare at the first movement of my masterpiece:

```python
def game_over(board):
    # check for full board
    if sum(abs(x) for x in board) == 9: return True

    # check rows and cols
    for i in range(3):
        if abs(sum(board[3*i:3*i+3])) == 3: return True
        if abs(board[i] + board[i+3] + board[i+6]) == 3: return True

    # check diags
    if abs(board[0] + board[4] + board[8]) == 3: return True
    if abs(board[2] + board[4] + board[6]) == 3: return True

    return False
```

Yes, I'm well aware it's 3 lines of haskell; but this is a problem bound by typing speed, not creative thought, not actual effort. Why wrap your head around a monad when you can use beautiful imperative *Ur*-language instead?

"Ok Google! Time left!" I bark across the living room. "It's been 2 minutes, 28 seconds since you started the timer," it depressedly replies.

Focus time. Let's prepare ourselves for the main course. `count_games`. This is an inductive function, and we've already taken care of the base case:

```python
def count_games(board, turn):
    if game_over(board): return 1
```

9-cells in the board, 9 potential moves we can make:

```python
    total = 0
    for i in range(9):
        # ...
```

Remembering Python's pass-by-reference (and too lazy to figure out whether it actually matters in this case), I bang out the following code:

```python
    total = 0
    for i in range(9):
        if board[i] == 0:
            new_board = board.copy()
            new_board[i] = turn
            new_turn = turn * -1
            total += count_games(new_board, new_turn)
```

Figuring out what this does is *not* left as an excercise to the reader, neither the interviewer. (Why are we multiplying `turn` by `-1`? It doesn't matter.)

The recursive portion finished, I polish everything off, and stare at my finished masterpiece:

<blockquote>
<details>
<summary> Here it is in all its glory</summary>

A masterpiece, I know:

```python
def game_over(board):
    # check for full board
    if sum(abs(x) for x in board) == 9: return True

    # check rows and cols
    for i in range(3):
        if abs(sum(board[3*i:3*i+3])) == 3: return True
        if abs(board[i] + board[i+3] + board[i+6]) == 3: return True

    # check diags
    if abs(board[0] + board[4] + board[8]) == 3: return True
    if abs(board[2] + board[4] + board[6]) == 3: return True

    return False

def count_games(board, turn):
    if game_over(board): return 1

    total = 0

    for i in range(9):
        if board[i] == 0:
            new_board = board.copy()
            new_board[i] = turn
            new_turn = turn * -1
            total += count_games(new_board, new_turn)

    return total

print(count_games([0 for _ in range(9)], 1))
```

No reusable code in sight. Yesiree. That's how it's done.

</details>
</blockquote>

Heart racing, I mouse over to the big green `Run ▶` button. Click. My breath catches as interpreter spins up. And then, without warning, a single number shows up on the screen:

```
255168
```

"Two-hundred fifty-five thousand, one-hundred and sixty-eight," I sigh. A quick google confirms my work. I pat myself on the back for a job well done.

# Getting Hired

"Ok Google, Stop stopwatch" I ask. "6 minutes, 38 seconds," it responds.

> The moment the program outputs the correct answer, take note of the time again. That's all you have to do to evaluate how talented the candidate is. The technical aspect of the interview is over. (Yes, you read that right!)

The technical interview is over. My work stands, a perfect representation of everything I know about programming. Forget about that time I took an IQ test and got a score of 80 back in 7th grade, *this is for real*.

> The most talented candidates will think about it for a few seconds, then write the program as fast as they can type (and they'll type fast). [...] The whole process will take about 10 minutes from start to finish.

6:38 is way under 10:00, I smile. I've done it.

I wait patiently for a Google drone to break through my front window to whisk me away to the soft slopes of Silicon Valley. I've done it.

<div class="boxed">
This is satire. Please don't @ me. Why did I spend an hour to type this up? I don't even have an answer. See you around!
</div>
