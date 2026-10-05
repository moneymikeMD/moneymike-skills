---
name: review-writer
description: >-
  Use this skill to turn the user's own firsthand experience into a review they can paste
  and post. Trigger whenever someone describes a place they went, a business or pro they
  used, or something they bought, watched, or read, and asks you to write it up, draft it,
  put it into words, leave feedback, post their thoughts, or rate it. Covers restaurants,
  cafes, hotels, doctors, dentists, plumbers, contractors, apps, gadgets, movies, books,
  and events, for Google, Yelp, TripAdvisor, Letterboxd, App Store, Amazon, or social.
  They usually mix good and bad ("food great, parking awful") and may never say the word
  "review"; treat any "write up how it went / help me post this / leave them feedback"
  about a firsthand experience as a match. Handles the full workflow: gather the facts,
  ask any missing clarifying questions, draft, then run the humanizer skill so it doesn't
  read as AI-written. Not for: reading, finding, or summarizing other people's reviews;
  researching what to buy; writing a LinkedIn recommendation; reviewing code, PRs, or
  resumes; or booking a reservation.
license: MIT
---

# Review Writer

Read `~/.claude/skill-context/review-writer.md` first if it exists. It holds this environment's preferred question tool, and wins over anything general here.

Turn a person's real experience into a review they can paste and post. The output has
to sound like *them* — a normal human who went somewhere and is telling you how it was.
The single biggest failure mode is a review that reads as AI-generated: gushing,
perfectly balanced, em-dash-laden, promotional. Avoid that. The negatives are what make
a review trustworthy, so keep them.

## Workflow

Run these in order. Skip any step the user has already handled in the conversation.

### 1. Gather the facts

Use whatever the user already gave you. A review can only contain things the user
actually experienced — **never invent detail** (a dish they didn't mention, a price they
didn't state, a feature they didn't touch). Inventing specifics is both dishonest and a
dead AI giveaway.

If the raw material is thin, ask for the missing pieces:
- What is it / where did they go, and when
- What they got or did (dishes, room, product, service performed)
- What stood out (good and bad)
- Overall verdict and a star rating if they have one

### 2. Interview for specifics (scale the depth to the gap)

This is where reviews are won or lost. A review lives on concrete, unique detail: the
thing they'll still remember, the one annoyance that actually mattered, the fact a
stranger deciding whether to book/buy would want to know. Generic buckets ("what was
good? what was bad?") produce a generic review that reads as AI and helps no one. So
interview like a curious friend, not a form.

**Calibrate how many questions to how much you're missing.** If the user gave thin
context but had a lot of exposure — a two-week stay, a car they've driven for a month, a
place they visit often — you don't have enough to write something specific, so dig
properly: aim for around five or more questions, and follow the interesting threads across
more than one round. If they already handed you rich detail, just fill the few gaps. Match
the effort to their experience; a long, high-touch stay deserves a real conversation.

**Prefer open-ended questions when digging for specifics.** Fixed multiple-choice options
herd people toward generic answers ("Cleanliness", "Location") — the opposite of what you
want. Open prompts let the actual story out. If the context file names a preferred
question tool and it is available (load via ToolSearch if needed), use it; otherwise use
`AskUserQuestion`. Never ask as plain text. Reserve fixed-option questions
for genuinely closed choices (star rating, which platform).

Good directions to probe — ask the *specific* version for their subject, not the generic
label:
- The single best moment or feature, and *why* it landed for them
- The most annoying thing, and whether it would stop them recommending it
- Anything that surprised them, good or bad
- Who it's right or wrong for (families, couples, light sleepers, remote work, etc.)
- The concrete stuff a stranger wants: location feel, space, noise, cleanliness/condition,
  how responsive the host/staff were, whether it was worth the money
- What they'd actually tell a friend who asked about it

Then the closed items: **star rating** (if the platform uses one and they haven't said),
and **platform/length** if the default below doesn't fit.

Never invent to fill a gap — if they don't know or don't care to answer, leave it out. Do
not re-ask anything they already told you.

### 3. Draft the review

Write it first-person ("my partner and I", "I ordered..."). Aim for how a thoughtful regular
person writes:

- **Lead with the thing that mattered most** to their experience, not a scene-setter.
- **Be specific** using only their facts. Specific beats effusive: "light and bright with
  just the right amount of lemon" earns trust; "an unforgettable culinary journey" does not.
- **Keep the negatives in.** A weak coffee, a long wait, bad parking — these are the load
  bearing details. A five-part rave with no friction reads fake.
- **State the rating** naturally if they gave one (e.g. end with "4 out of 5 stars").
- **Match register** to the platform (see defaults below). Mixed feelings are fine and
  human; don't resolve everything into a tidy bow.

### 4. Humanize

Run the drafted review through the **humanizer** skill (invoke it via the Skill tool)
before presenting. This is not optional — it's the step that strips the AI tells:
em/en dashes, rule-of-three, promotional vocabulary, even cadence, fake punchlines.
Present the humanizer's final version as the deliverable, and keep it genuinely
paste-ready. The user copies this straight into a review box, so it must be clean plain
text with nothing to strip. Do **not** wrap the review in a Markdown blockquote: the `>`
prefix renders in many terminals as a leading `|` pipe that gets copied along with the
text. Do not use bold, headers, or bullet markers inside the review either. Present the
review inside a plain fenced code block (```) so there's a clean copy target with no
leading `>` or `|` characters. If you produce multiple platform versions, put each in its
own fenced block under a plain label.

## Platform defaults

Default to a **single Google Maps review**: conversational, medium length (roughly
2 short paragraphs), honest, no hashtags. Produce other formats only when the user asks
for them. When they do:

- **Google Maps / TripAdvisor** — conversational, 1–2 paragraphs, verdict + rating.
- **Yelp** — a bit longer, more of a story, still honest about the misses.
- **App Store / Amazon** — lead with the use case and whether it delivered; concrete pros
  and cons; rating.
- **Social (Instagram/X)** — short and casual, a few lines, light on adjectives, hashtags
  only if the user wants them.

If asked for multiple platforms, give each under its own heading so they're easy to copy.

## Character limits

Some platforms cap review length, and a review that's over the limit can't be posted. When
the target platform has a known cap, write to fit it and confirm the count before
presenting. Known caps:

- **Airbnb** — about 1000 characters. Keep it tight; cut throat-clearing before cutting
  the concrete details that make the review useful.
- **Google Maps** — very generous (no practical limit for normal reviews).
- **Yelp** — generous (thousands of characters); length isn't the constraint.
- **App Store** — review body caps around 1000 characters (title is separate).
- **X/Twitter** — 280 characters unless the account has a higher limit.

If you don't know a platform's exact cap, say so and offer to trim. When a limit is tight,
verify the actual character count (e.g. a quick `len()` check) rather than eyeballing it,
and trim by removing filler and hedging first, keeping the specifics.

## Example

**User's raw notes:** "went to a new ramen place, the tonkotsu broth was incredible and
super rich, noodles perfect. downside was it's tiny and we waited 40 min in the cold with
no waiting area. staff were friendly though. 4 stars"

**Deliverable (Google Maps, post-humanizer):**

> Came here for the tonkotsu and it did not disappoint. The broth is rich and deep, the
> kind you keep going back to, and the noodles had a perfect chew. Staff were friendly and
> quick once we sat down.
>
> The catch is the size. It's a tiny room with nowhere to wait, so we stood outside in the
> cold for about 40 minutes before a table opened up. Worth it for the bowl, but go early
> or be ready to wait. 4 out of 5 stars.

Note what the example does: leads with what mattered, uses only the user's facts, keeps
the wait complaint front and center, no em dashes, no "hidden gem" filler, ends on the
rating.
