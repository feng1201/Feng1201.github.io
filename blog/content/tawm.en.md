My internship has kept me busy, and some papers I read never made it into written notes. Consider this a little overdue catching up (and confession). Here is my third note on world models.

The paper is [Time-Aware World Model for Adaptive Prediction and Control](https://proceedings.mlr.press/v267/nhu25a.html), published at the 2025 International Conference on Machine Learning (ICML).

## A problem from my internship

I picked this paper because of a timing problem I encountered while using Seedance for video generation at work. Specifying a video's total duration and making an action happen at a precise time are two different things.

Take “pick up the cup within 2.3 seconds.” In practice, these fine-grained timing instructions have been difficult to enforce. That made me wonder: how do world models deal with time?

## The paper's question

A world model predicts, internally, “if I take this action now, what happens next?” The authors point out that conventional methods are often trained with a fixed interval between observations.

A model may therefore adapt to its training observation frequency but struggle with a different one at deployment.

The introduction gives an example: observations arrive every 2.5 milliseconds during training, but only every 20 milliseconds at deployment. Both predictions are called “the next step,” yet they cover different amounts of time.

In a sense, this is a shift in the distribution of time intervals. But this example illustrates the limitation of fixed-step training; it does not mean the proposed model was trained only at 2.5 milliseconds.

The question is: without increasing the number of training samples or training steps, can one world model learn dynamics at different timescales and support control at different observation frequencies?

The authors propose a Time-Aware World Model (TAWM). The intuition is simple: instead of making the model guess how long “the next step” is, tell it explicitly.

## Reading the method figure

![TAWM architecture: an encoder maps observations to latent states; time-aware models use the state, action, and time interval to predict rewards, values, candidate actions, and future states.](/static/assets/blog/tawm-architecture.png)

On the left, oₜ is the current observation, such as the view from a robot arm. Encoder h turns it into a latent state zₜ: the model's internal representation of the current environment. Predictions are made in this representation space.

The central M contains time-aware dynamics, reward, value, and policy-prior models. Roughly: how the environment changes, what immediate reward an action brings, whether it pays off in the long run, and which actions are worth trying.

Three kinds of information enter the model in the diagram: zₜ, the current state; aₜ, the current action; and Δt, the elapsed time for this step. TAWM explicitly conditions its predictions on the time interval.

For the same state and action, Δt values of 10 and 50 milliseconds call for predictions over different durations. The encoder itself does not need this time condition; the other submodels listed above do receive it.

The orange path predicts the future state. The model learns a rate of change in latent space, then uses numerical integration—accumulating that rate into a change over time—to update the state. The figure shows Euler and RK4 updates.

> A quick aside on those two names; feel free to skip it and keep reading.
>
> Euler refers to the Euler method. The intuition is: next state ≈ current state + current rate of change × time interval.
>
> RK4 is the fourth-order Runge–Kutta method. This was my first encounter with the name, which sounds rather cool. It estimates rates at the start, two trial midpoint states, and a trial endpoint, then combines them with prescribed weights.
>
> Euler looks at the initial trend; RK4 also probes intermediate and endpoint trends. These are rates of change of a latent state, not necessarily physical velocity or acceleration. The method does not require real future observations.
>
> The Euler expression above is only an intuitive sketch. The paper actually uses a logarithmically scaled time factor, τ(Δt), rather than multiplying by the raw interval, to stabilize training.

The updated ẑ(t + Δt) is the predicted state after that interval. The orange bypass means the current state participates directly in the update: add the estimated change to the starting state.

On the right, the hatted r, q, and a represent predicted reward, long-term value, and candidate actions from the policy prior. Planning then compares the expected returns of actions before choosing what to execute.

One more important point: adding a time input is not enough. Training also exposes the model to different intervals. An interval is sampled at the start of each episode of environment interaction and stays fixed within that episode.

For example, in Meta-World, a robot-arm task environment, TAWM trains with a mixture of intervals from 1 to 50 milliseconds. The time condition therefore has corresponding training data; it is not suddenly changed only at deployment.

In the authors' comparisons, Euler performs better on most Meta-World tasks. For control tasks involving partial differential equations (PDEs), RK4's benefit depends on the task and interval.

Here, these equations describe how a quantity changes across space and time.

Neither method is always better. Also, equal sample counts and training steps do not imply equal wall-clock time: RK4 updates require more model computation.

## My take

That is roughly it for this paper. It felt less “wow” than the previous two, but its question is more concrete and closer to a difficulty I have actually encountered in engineering work.

Although, by the end, I realized it still had not directly solved my problem (ha). TAWM mainly asks what the environment will look like after a given interval, and how to control it.

My question is different: can an action in a generated video happen at a specified time? Both involve time, but they are not the same problem. This paper does not directly test action-timing constraints in video generation.

For me, it is more of a reminder: if we want a model to take time seriously, its training data and conditioning inputs should take time seriously too.

The paper and demonstrations are available on the [authors' project page](https://anh-nn01.github.io/time-aware-world-models/).
