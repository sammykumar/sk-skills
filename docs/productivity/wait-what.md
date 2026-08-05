Quickstart:

```bash
npx skills@latest add mattpocock/skills --skill=wait-what
```

```bash
npx skills@latest update wait-what
```

[Source](https://github.com/mattpocock/skills/tree/main/skills/productivity/wait-what)

## What it does

`wait-what` is the fire extinguisher for a message that didn't land. You fire it the moment you lose the thread, and the agent re-pitches what it just said: a little of the context you were missing, plain English, and the vocabulary from your project's `CONTEXT.md`.

It is three lines long, and that is the design rather than an unfinished draft. Skills that fight verbosity fail by growing — a four-hundred-line concision skill still leaves the model verbose, because the model reads the volume, not the plea. This one carries a single precise leading word and nothing else.

## When to reach for it

You invoke this by typing `/wait-what` — the agent won't reach for it on its own, and it shouldn't: only you know when you stopped following.

Reach for it the second you notice you're skimming — the agent has drifted into jargon it invented, stacked five acronyms, or explained a decision whose premise you never saw. It's a one-shot corrective on the conversation you're already in. To stop the jargon arriving in the first place, use [grill-with-docs](https://aihero.dev/skills-grill-with-docs) instead, which builds the shared language upfront.

## The name is the mechanism

The leading word is **wait**. Not "be concise" — an instruction about the agent's output, which the model satisfies by clipping words and losing you further. **Wait** is about *your* state: it says comprehension failed here. An agent that hears "be brief" writes telegrams. An agent that hears "wait, you lost me" backs up and explains.

That distinction is the whole skill. Every popular fix for verbosity — `/tldr`, `/no-fluff`, `/talk-normal` — names the *output*, so the model over-corrects into a caveman register that's shorter and no clearer. Naming the *listener* asks for both halves at once: fewer words **and** the context you were missing.

The re-pitch is deliberately vague about its own scope. It says re-pitch **that**, not "that last message", because what lost you is usually bigger than one paragraph — the agent decides how far back to go.

## It plugs into the language you already have

The body reuses the leading words already sitting in your global `CLAUDE.md` and your project's `CONTEXT.md`: ASD-STE100 Simplified Technical English for the register, ubiquitous language for the nouns. Skill, `CLAUDE.md` and `CONTEXT.md` reach for the same tokens, so firing it isn't a new instruction — it's a reminder of one the agent already agreed to.

If you have no `CONTEXT.md`, it still works; you just lose the domain-vocabulary half.

## It's working if

- The re-pitch is **shorter and clearer**, not shorter and blunter.
- It adds the premise you were missing rather than just deleting words.
- Project nouns replace invented ones — the terms in your `CONTEXT.md` come back.
- You can fire it twice in a row without it degrading into terseness.

## Where it fits

`wait-what` is a reach-for-it-anytime standalone — it sits inside whatever conversation you're already having, in any skill, at any point. It's the extinguisher; [grill-with-docs](https://aihero.dev/skills-grill-with-docs) is the sprinkler system, because a shared language agreed upfront is the real cure for jargon, and [domain-modeling](https://aihero.dev/skills-domain-modeling) is what you reach for when the *words themselves* are the problem rather than one bad message. When you're unsure which skill fits the moment, [ask-matt](https://aihero.dev/skills-ask-matt) routes you.
