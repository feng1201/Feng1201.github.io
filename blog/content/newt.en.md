This is the second paper in my world-model reading notes. Once again, I am recording its ideas and methods without getting into the math.

***Learning Massively Multitask World Models for Continuous Control, ICLR 2026***

## What Newt aims to solve

The authors also believe that world models should generalize, and they introduce a benchmark containing 200 diverse tasks.

They propose their own model, Newt: first, it looks at a large collection of existing demonstration trajectories to learn roughly what the tasks involve and how to act. The same Newt model then interacts with environments across many tasks, using the new experience to keep improving.

(To me, the idea feels quite similar to DINO-WM: both aim to build a model that generalizes across tasks, and the recipe looks similar too — offline pretraining followed by online optimization. Interesting.)

## Requirements for a world model

The authors argue that a reasonable world-model approach should:

- (i) Scale as the model and dataset grow — scaling laws.
- (ii) Be robust to different observation spaces, action spaces, reward functions, and task horizons. The model supports inputs such as state information and RGB images. Different reward scales are handled with discrete regression/cross-entropy and logarithmic transformations. Different tasks have different discount factors, which discount future rewards.
- (iii) Distinguish sufficiently between different tasks.
- (iv) Finish training within a reasonable amount of time.

## Newt's model architecture

![Newt architecture: multitask inputs, a shared world model, and a TD-MPC2-based control architecture.](/static/assets/blog/newt-architecture.png)

The figure above shows the method. On the left are the inputs: Newt receives data from many different tasks, including RGB images, state information, and textual task descriptions. Images first go through DINOv2 — the previous paper used it as an encoder too, so the ideas seem to follow a similar line. Text is encoded with CLIP. I feel this corresponds to requirement (iii), distinguishing between tasks, since different tasks have different natural-language inputs.

In the middle is the Newt World Model. Information from these different tasks goes into one shared world model, which mainly learns **what reward might result from taking a particular action in the current state**. Because different tasks have different action dimensions, invalid components are masked out.

On the right is the specific world-model architecture. Based on TD-MPC2, it encodes observations into hidden states, learns how those hidden states change with actions, and predicts rewards and values. These predictions are then used to plan actions. In other words, it first learns a world model that can predict the future, then uses that model to plan internally.

## What Newt learns

Newt mainly learns the following:

- **Dynamics**: what the next state will be after an action is taken.
- **Reward**: how much reward the action will produce.
- **Value/Q**: whether the action is good in the long run.
- **Policy Prior**: which actions are worth trying in the current state.

It looks like Newt predicts the future in latent space to support control.

## From expert demonstrations to online interaction

During training, Newt learns these together:

**Current state + action → next state + reward + long-term value.**

It also considers the long-term reward after the action, which ties back to the discount factor.

At test time, it chooses the action with the highest predicted return. One point worth noting is Newt's training pipeline:

***Pretrain on expert demonstrations → obtain an initial world model and action prior → interact with environments online → collect new experience → continually update the world model and policy.***

(DINO-WM starts with random sampling when training begins; could Newt be viewed as using experts for a warm start? That would fit requirement (iv): training within a reasonable amount of time.)

## Comparing Newt with DINO-WM

Overall, Newt, like DINO-WM, chooses to predict the future in latent space. It seems latent space is the right direction for now. The difference is that Newt also explicitly learns rewards and values, directly adopting a reinforcement-learning control framework to serve control tasks.
