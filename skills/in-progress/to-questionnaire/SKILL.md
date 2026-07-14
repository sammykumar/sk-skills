---
name: to-questionnaire
description: Turn a decision you can't fully answer into a questionnaire for someone else to fill in.
disable-model-invocation: true
---

Turn something the user can't answer alone into a **questionnaire** — a Markdown document they hand to one person to fill in async, or fill out together over a meeting. The recipient holds knowledge the user lacks; the questionnaire pulls it out of them.

**Grill the send, not the subject.** The user is offloading this precisely because they don't hold the answers, so interrogating them about the subject just yields "I don't know, I don't know" — the failure this skill exists to avoid. Interview the user only about the _send_, which they can always answer: who it goes to, and what they need back. The questions in the document then target the **gap** between what the recipient knows and what the user needs.

1. **Who is it going to?** Ask, in one exchange, the recipient's role, expertise, and relationship to the user. This fixes the questionnaire's tone and how much context it must carry. Done when you know who the recipient is and what they know that the user doesn't.

2. **What do you need back?** Ask, in one exchange, the specific decisions or facts the user can't resolve alone and needs from this person. Done when you have a concrete list of what the user must walk away able to do or decide.

3. **Write the questionnaire.** Draft questions aimed at the gap from steps 1–2, following the Document structure below. Write it to `to-questionnaire-<slug>.md` in the current directory (slug from the topic) and report the path. Done when the file exists and every item the user named in step 2 is covered by a question.

## Document structure

Frame the whole document as a **discovery questionnaire**: the user lacks context, the recipient holds it. Top to bottom:

- **Metadata header** — purpose, who's asking, who's answering, and how the answers will be used. Naming the downstream decision gets sharper answers.
- **Context** — one paragraph orienting a recipient who wasn't in the user's head. Not a page.
- **How to answer** — one line: the deadline and rough effort, and explicit permission to give partial answers or flag unknowns.
- **Questions** — grouped under `##` headings by theme once there are more than a handful, ordered most-important-first (async means you may only get one pass). Each question carries:
  - one idea only — no compound questions;
  - a one-line _why this matters_ only where the question could be misread or invite a throwaway answer, never on a self-evident one;
  - an answer stub (`> `) directly beneath, so there is an obvious place to type.
- **Catch-all** — a closing "anything we didn't ask that we should know?"
