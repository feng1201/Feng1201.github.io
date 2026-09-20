This paper marks the start of my journey into world models. Okay, let's get into it!

> A quick disclaimer: much of this was written spontaneously as I read, so I can't guarantee that everything is correct. My aim is to explain the **ideas** and **methods** behind DINO-WM with as little math as possible.

***DINO-WM: World Models on Pre-trained Visual Features enable Zero-shot Planning, ICML 2025***

## What should a world model be able to do?

The authors begin by laying out what they believe a real world model should be able to do:

1. Train on trajectories collected offline. This feels like the most basic requirement, so there isn't much to add.
2. Support action optimization at test time, i.e., online optimization.
3. Enable task-agnostic reasoning, i.e., generalization.

To meet these requirements, they propose a new way to model visual dynamics without reconstructing the visual world. Quite a mouthful!

## Unpacking the three requirements

Let's go through them one by one.

First, **training on trajectories collected offline**. The paper uses spatial patch features from a pretrained DINOv2 model to learn from offline action trajectories by predicting future patch features. Think of DINOv2 as a pretrained visual encoder.

Second, **supporting action optimization at test time**. The paper says it uses model predictive control and inference-time optimization to reach a goal without any extra information. My understanding is that the world model's parameters stay fixed during testing, and only the action sequence is optimized.

Finally, **enabling task-agnostic reasoning**. The authors conduct zero-shot evaluations in six environments. The coverage is very broad, and I think it supports this claim well.

## How DINO-WM works

The authors then define what a world model is. Put simply:

**What I see now + the action I take → what the world will look like next.**

Here is how DINO-WM does this:

1. Feed an image into DINOv2 to obtain latent features — the observation model.
2. Combine past features with actions to predict future features — the transition model.
3. Turn future features into RGB images — the decoder model. This step is for visualization and is not required.

![DINO-WM architecture: a visual encoder, an action-conditioned transition model, and an optional decoder.](/static/assets/blog/dino-wm-architecture.png)

The figure above shows the method. On the left and right, DINOv2 provides task-agnostic state representations. In the middle, the transition model uses a Vision Transformer (ViT) architecture with frame-level attention: the current frame can only read past frames, and all patches in a frame are predicted together. In a sense, large language models do something similar — when predicting a token, they can see all the preceding tokens.

Actions are encoded by a multilayer perceptron (MLP) and concatenated with each patch feature, allowing the model to learn how actions change the environment. Training directly minimizes the mean squared error (MSE) between the predicted DINOv2 features and the actual DINOv2 features of the next frame.

## Searching for an action sequence

For actions, the authors combine model predictive control (MPC) with the cross-entropy method (CEM), repeatedly searching for action sequences so that the predicted final state is as close to the goal state as possible. To be honest, I know cross-entropy, but “MPC” reminds me of those “MPC” interfaces for large language models that were popular for a while last year…

Anyway, this part feels like an optimal-search method to me, and it is a little abstract. In the appendix, the authors explain that CEM samples a set of action sequences from a distribution, initially a Gaussian. So it looks like a random-sampling method.

For each sampled action sequence, the model then predicts the resulting trajectory in latent space. The lowest-cost sequences are selected, and the distribution's mean and covariance are updated accordingly. This loop continues until the stopping condition is met or the iteration limit is reached.
