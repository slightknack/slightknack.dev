+++
title = "Intelligence and the importance of consistency"
date = 2024-08-13

[extra]
artbit = "3_puzzle.png"
+++

People are quick to point out that Large Language Models (LLMs) tend to
hallucinate facts and lack the ability to reason. LLMs are not grounded
in reality. Hallucination is an architectural limitation due to how
Transformers, as auto-regressive sequence predictors, are constructed.

<!-- more -->

It has been shown that larger models hallucinate less. However, these
improvements are due to extracting additional reasoning patterns from a
larger or more informationally dense training corpus, and not due to
improved reasoning over constraints, search, or backtracking.

If we hope to scale a LLM beyond human intelligence, it will be required
to generate training data that is both self-consistent and contains new
information. This requirement is at odds with the linear nature of
auto-regressive sequence predictors.

**Intelligence as Search**

When finding a proof for a mathematical theorem, we often translate a
theorem into a language composed of axioms capable of expressing the
theorem. Mechanistically, we can compare finding a proof of such a
theorem to searching the tree of all possible logical reduction steps
for a solution. Like a game of chess, the further we search, the more
likely we are to find a valid proof. Likewise, there will always be some
branches of the proof-tree that will never result in a valid proof of
the theorem. We would like to prioritize taking reduction steps that are
likely to bring us closer to the solution.

**Intelligence as learning**

One way to prioritize reduction steps is to do what has been done in the
past for similarly-shaped problems. For example, when proving a geometry
theorem, it is sometimes necessary to construct additional points that
make future reductions possible. The exact point required may be one
among many, but if we have an intuition as to which approaches are
possible, we can prioritize constructing the points we know will take us
in this direction.

Transformers as auto-regressive sequence predictors are very good at
showing which reduction steps are probable given the line of reasoning
so far. However, randomly sampling the top-N choices for the next
reduction step discards important information about the structure of the
problem: we may end up accidentally taking a step that will lead us down
a branch that will never result in a valid proof. The better our model
is, the less likely we are to sample incorrect branches. However, once
we have sampled an incorrect branch, there is no way to go back and fix
our error when unable to resolve constraints later on.

We need, in a sense, both search and learning: search to explore the
entire state-space for valid solutions, and learning to more effectively
prioritize and navigate that state-space. Transformers that sample one
token at a time are highly effective learners but highly ineffective
searchers: they search in a straight line and don't stop when they are
wrong. This ungrounded approach to sequence modeling will always lead to
violated constraints and hallucinations for sufficiently complex
problems.

**Hints at a better architecture**

Each forward inference pass of a transformer uses a fixed amount of
compute, per token. It has been observed that telling a Transformer to
generate a longer response and summarize at the end, or to think
step-by-step, can improve the quality of reasoning. This allows the
Transformer to make smaller logical inferences that are more likely to
be correct, and to self-correct potentially incorrect assumptions. This,
while seemingly an ad-hoc crutch, hints at a solution.

**Training on edits, not just insertions**

The ability to think step-by-step and self-correct are not properties of
LLMs in general, but are emergent behaviors of having been trained on
many traces of human reasoning. When a human writes some text they
rarely write it from start to finish, but revise, prune, and improve the
text, until the document both contains new information and is
self-consistent.

A company like Google could, for example, train an LLM to predict
insertions and deletions using, for example, the edit history of Google
Docs, or the different revisions of the many branches of the Google3
codebase. These examples of editing would provide more examples of human
reasoning over time; allowing a model to delete generated text may allow
it to emulate backtracking and revision. A model with the ability to
revise would likely hallucinate less than models of the same size
trained purely on final documents or codebases.

**Random editing is not reasoning**

However, notice that we have still kicked the problem up a level. To
generate a history of edits, we still randomly sample the top-N most
likely edits, auto-regressively. While an individual final document may
show reasoning and avoid hallucinations, the edit history of such a
document is vulnerable to the same problems of hallucinations and the
selection of non-optimal edits. How do we resolve this problem at an
architectural level, instead of simply pushing the problem up a level
and requiring more human-curated training data?

**Reasoning is resolving constraints**

The fundamental idea is that we would like to include some way for the
model to reason about constraints and backtrack when constraints are
violated, much like the way a logical language like prolog or miniKanren
seeks to unify queries with facts about the world. To be clear, this
will not look like embedding a prolog interpreter in an LLM, as fun as
that may be. Instead, it may look like giving an LLM more time to
compute before generating a token, or allowing an LLM to generate a
branching tree of responses, prune branches that are not
self-consistent, propagate this information to other branches, and
sample the best completion.

In some sense, intelligence requires agency, or the ability to imagine
the consequences of choices, and act on those imagined consequences. A
large language model can act on pre-imagined consequences generalized
from its training corpus, but it lacks the grounding to discover new
consequences for itself, which it can remember in the future.

**How to identify constraints?**

The largest problem facing adding search to existing architectures is
the question of how to train them. For a closed, well-defined problem
like sudoku, we can train a model to recognize constraint violations:
when two digits are present in the same row, column, or box. However,
recognizing when the constraints of the real world are violated is not
as simple. In the most extreme case, checking constraint violations
requires performing experiments against the real world, or accurate
models of the world. There is hope that a multi-modal model with
backtracking trained on both text generation and sudoku-like puzzles may
learn to generalize the concept of constraint violation. In the general
case, though, how to infer an accurate simulation of the universe given
a bounded corpus of internet text is an open problem.

**Diffusion models also violate constraints**

An alternative approach to consider is the approach taken by diffusion
models. Diffusion models start with a noisy image, and progressively
remove small amounts of noise to obtain an image similar to those
present in the training distribution. This sampling can be guided with
an embedded prior, to sample, for example, descriptions of cats,
landscapes, and so on.

Diffusion models, however, are also susceptible to constraint violations
and are bad at spatial reasoning. You may ask for a blue cube on top of
a red sphere and receive a red cube beneath a blue sphere. This is
because the diffusion process, like transformers, is linear. Once an
image is mostly denoised, a diffusion model is not able to swap the
positions or colors of the sphere and the cube, nor return to an earlier
diffusion step before the shapes and the colors of the objects were
fixed.

Unlike autoregressive modeling, which proceeds linearly across the
output, under diffusion, the entire output is available at each
inference step. This output may be easier to check for constraint
violations. Diffusion might be amenable to something along the lines of
a beam search through latent space.

For example, standard text-guided diffusion models may be able to
recognize constraint violations by comparing predicted descriptions of a
scene to the actual guidance vector?

**How to learn constraints from training data**

Learning constraints is the process of determining the global invariants
of the output distribution, and preventing outputs composed of local
samples from creating an output that violates global invariants. This
can be illustrated by the following problem:

Given a static offline dataset of images of fully-solved sudoku puzzles,
how could you train a diffusion model that can sample novel solved
sudoku puzzles, without encoding any knowledge about sudoku itself into
the model? In other words, how do you teach a model to recognize global
constraints present in the training data, without specifying what they
are?

The above research problem is hard, and it's what the best minds are
currently working on. I'm not going to attempt to hint at an answer
here, as there are a lot of potential approaches, and I don't want to
sell any individual approach that I am aware of as the solution.
However, I would like to take a second to discuss the implications of a
model architecture that solves this problem.

**The Holy Grail of AI capabilities research**

What we want is self-improvement through self-consistent training data:
in other words, a linearly-scalable model that can generate additional
self-consistent training data, which can be fed into a new model of the
same architecture, scaled up larger.

A language model sampled by selecting the most likely token will not
generate informationally-richer training data. You need an external
process that prunes generations: training a model on its most likely
output will simply reinforce existing distributions and make it go off
the rails.

On the other hand, consider a language model sampled by selecting the
best token for self-consistent generation through search. This
generation will contain new information. Specifically, that the chosen
token should be prioritized more in the given context. Returning to the
duals of search and learning, self-consistent searches provide new data
for models to improve at learning.

**Learning from nothing**

Let's return to the example of generating mathematical proofs for
theorems: by generating new self-consistent training data, it might be
possible to train a theorem-proving model from scratch without any
external training data.

We could start by enumerating all possible theorems in a language of
axioms, ordered by complexity. Using a randomly initialized Transformer
and an interleaving search of theorems, sample branches from the proof
tree of each theorem, weighed by the probability of given by the
Transformer, until a proof of any theorem is found (this is equivalent
to a randomly-guided brute-force interleaving search). Take the proven
theorem and perform a step of gradient descent using the theorem and its
discovered proof, then continue to sample branches of the proof tree
with the updated model until another proof is found. As more proofs are
discovered, the Transformer should improve at navigating proof-space,
even though no human examples of solved proofs were provided.

I believe that multimodal models have something to offer here. Take an
LLM trained on an internet corpus and augment the architecture with
backtracking. By then adding a multi-modal head and self-training on
theorem-proving, sudoku-solving, or programming puzzles, the model may
learn to generalize reasoning and backtracking even when generating
normal text. This is an experiment worth trying.

**Connection to reinforcement learning**

Techniques for searching game states have been a part of the
reinforcement learning toolkit for a long time. The recent focus on
autoregressive LLMs, which are principally trained in using supervised
learning, would have been met with skepticism from those deep in the RL
ethos in the early 2010s. The reason is simple: supervised learners can
never surpass the sum of the best examples they see. When trained on the
entirety of the public internet, the sum of the best examples is quite a
high bar, but it is a finitely high bar.

LLMs need to adopt more lessons from reinforcement learning. There have
been some steps in this direction. For example, the Decision Transformer
(DT) shows how the best examples can be elicited from a model trained on
a mixture of good and bad examples. (We do this by prompting the DT with
the expected remaining reward during training, and then sampling the DT
with a high expected reward during inference).

**Taking RLHF a step further**

There is also RLHF, which poses text generation as an RL problem: which
sequence of tokens (actions) can I generate that will give me the
highest score (reward) from a human evaluator, at the end of my
response? Except instead of using this learned policy as the basis for
an AlphaGo-style search of the best sequence of actions to take to
generate the best response, we simply use this policy to fine-tune the
LLM to be aligned to human preferences, performing no search. This makes
economic sense when deployed at scale, but denies the possibility of
searching for the best response.

What would RLHF look like with a richer evaluation metric (perhaps
multiple scores for consistency, reasoning, whether the final answer is
correct, whether the predicted human response after the model response
matches what the model expects the human to ask as a follow up, and so
on) and deployed with actual search for “the best response”? It remains
to be seen.

**Increasing compute**

Recently, quite a few new chips have been announced that can run large
models (70B+) at hundreds of thousands of tokens per second. Many
transformers can process tokens in batches, capable of generating
multiple responses at once. Naively, it is likely possible to improve
reasoning quality by generating thousands of completions for a single
prompt, scoring the resulting responses, and taking the best one.

It is potentially possible to improve performance further by reusing
computation: generate thousands of completions, but in the process of
generation, remove completions that are wrong and backtrack to points of
uncertainty. If done correctly, the tree-search for a self-consistent
answer can be massively parallelized, and may not be that much more
expensive than regular inference.

Before we worry about how any particular architecture may be optimized,
we need to find an architecture that works.

**A thought on AI safety**

Autoregressive LLMs will not take us to full superintelligence, but a
model that incorporates both search and learning might. This is one of
the most exciting research problems of our time.

Solving the problem of consistency will have a direct impact on AI
safety: if human values are modeled as learned constraints that are
corrigible and must be satisfied, we can ensure that model outputs do
not violate human values. Constraint solving on its own is not enough:
if a model can learn the constraints of sudoku from solved sudoku
puzzles, we must also have the model learn the constraints of human
values from the volition we express. Capabilities and safety must
advance lockstep. I believe this to be the clearest path towards safe
superintelligence.

**A thought on ARC-AGI**

Benchmarks like ARC-AGI involve inferring the simplest rule, or drawing
program, that describes a visual transformation, then applying that rule
to a new context. If we have a language for describing drawing programs,
and a series of edit operations to build programs, it might be possible
to express the problem of inferring the simplest rule as a constrained
diffusion problem, where the constraint is that the diffused program,
applied to the example inputs, must produce the target output. I posit
that a generalized diffusion architecture capable of generating solved
sudoku puzzles from examples may be scaled up and adapted to generate
programs that solve ARC-AGI puzzles as well.

**Last thoughts**

LLMs tend to hallucinate because they are not grounded in reality. This
is a direct consequence of the architecture of autoregressive
sequence-based transformers. To improve reasoning and eliminate
hallucinations, we must invest time in identifying architectures that
are capable of generalized constraint solving. To do so, we must figure
out how to teach models to learn constraints from training data and
consider said constraints during inference. We should take inspiration
from the large body of RL research available.

# Notes

- Needs links. At least one per sentence

- Needs a better closing thought

- Need to define technical terms. I use some acronyms without
  introducing them. I use LLM, autoregressive LLM, Transformer,
  backtracking transformer, etc. I need to figure out what different
  ideas I'm talking about, and adopt consistent terminology

# Glossary

- LLM: Large Language Model. A model based on the Transformer that
  generates text. Many different types and architectures.

- transformer (stylized lowercase): autoregressive sequence predictor,
  generally for predicting text

- constraint: a global property which must be satisfied

- constraint-solving: enumerating possible solutions and only selecting
  solutions which satisfy all constraints

- backtracking: discarding a solution when a constraint is violated

- consistent: when all constraints are satisfied

- search: enumerating all possible solutions and selecting the best one

- learning: the order in which solutions are generated, with more likely
  correct solutions first

- intelligence: the ability to use existing information to generate a
  solution to an unseen problem.

-
