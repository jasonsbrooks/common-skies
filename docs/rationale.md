# Design Rationale — Common Skies

**Live site:** https://jasonsbrooks.github.io/common-skies/
**Repository:** https://github.com/jasonsbrooks/common-skies
**Theme:** 1 — Exploration & Understanding

## Why this theme, and this specific approach

I chose Theme 1 because it rewards the thing I have spent my career doing: taking a system that is too complex to explain statically and making it legible through interaction. The project has a Theme 4 flavor around its edges — assumptions, validation, falsifiability — but it is a Theme 1 submission at heart.

The topic itself is personal. Aviation is a long-standing interest of mine — I follow the industry and the market closely — and I first ran into the common-ownership fight a few years ago. My understanding of it was the kind I dislike having: directionally right, mechanically vague. The claim made intuitive sense. The machinery behind it (MHHI) was a wall of math I never sat down to work through, and I never found an explanation that made it visual. That is, almost verbatim, Theme 1's premise: a hard concept that static explanation failed to teach me. This project is me building the explainer I wanted years ago — the sixty-second slider version of the thirty-page derivation.

Personal interest was not a sufficient reason to build it, though. The selection process, visible in my transcripts, was deliberately adversarial: I generated and killed a dozen candidates — an agent chaos-testing harness, an LLM-judge calibration bench, a physician-payments anomaly detector, a food supply-chain explorer — scoring each against the same filter: real data over synthetic; an interaction that manipulates the model rather than the view; self-contained by construction; and a payoff that does not depend on luck. This idea entered late, as my own candidate rather than the AI's top-ranked recommendation, and displaced the leader under the same scoring.

Common ownership survived that filter for four reasons. It is a genuinely unresolved fight between top economists in a top journal — not a settled fact dressed up as a question. The math at its center (HHI versus MHHI) is simple enough to teach with a slider in sixty seconds. Every byte of data needed is public and small. And a natural experiment started nine weeks before I began building: Spirit Airlines went out of business on May 2, 2026, which means the tool can make predictions that reality will grade on a known schedule.

## What makes it interesting or non-obvious

Every existing explainer of this debate picks a side. The non-obvious move is refusing to: the contested assumptions become the interface. You flip whose economics you believe and watch the same scenario swing from "fares jump" to "nothing happens." The tool's neutrality is not diplomacy — it is the design thesis. Contested empirical claims are contested at specific, findable joints, and a good tool shows you the joints instead of laundering a verdict.

Three specifics I would point a reviewer at:

**Two dials, not one.** The public fight is usually presented as a single dispute. It is actually two. Dial 1 controls how the exposure measure is constructed — do passive index funds exert control at all? Dial 2 controls how much a unit of exposure moves fares — the 2018 paper's coefficient against the critics' statistically-zero estimate. Separating them is the single most clarifying thing the tool does, and it pays off in an unexpected way: the "Big Three divest everything" scenario predicts exactly $0.00 under one Dial 1 setting, and the tool tells you why your own assumptions already answered the question.

**The Spirit wrinkle.** The flagship scenario contains a trap most coverage would fall into. After its 2025 restructuring, Spirit's equity belonged to its former lenders — firms like Citadel and PIMCO — not to index funds. It had largely left the common-ownership pool before it died. Running the math both ways produced something better than the talking point I expected: with Spirit's old index-fund owners, its exit would have *reduced* the shared-ownership score on a typical route; with its actual creditor owners, the exit *increases* it, because Spirit's passengers scatter onto airlines that do share owners. Same event, opposite directions, hinging on bankruptcy paperwork. The app teaches exactly that split instead of overstating the effect.

**A pre-registered prediction with a public timestamp.** Because jet-fuel prices spiked for every airline this spring, a naive before/after on ex-Spirit routes would be confounded. The registered prediction is a difference-in-differences: 52 routes Spirit dominated against 52 matched routes it never flew, committed to the repository in a dated artifact before any post-shutdown fare data existed, with the site displaying when the deciding data publishes (~early 2027). Because the tool never picked a side, any outcome vindicates one of its dial settings. The falsification hook is outcome-proof.

## Key design decisions and tradeoffs

**Everything client-side, everything precomputed.** An offline Python pipeline produces one ~330KB bundle; the browser only swaps precomputed columns and does small linear arithmetic. I get instant interaction and a genuinely self-contained demo; I give up runtime flexibility (assumption variants are fixed at build time, mitigated by a custom-coefficient slider).

**Two implementations of the math, locked together.** The scoring formulas exist twice — in TypeScript for the page's live scenarios and in Python for the historical pipeline — and a golden-vector test suite generated from real route-quarters insists they agree to twelve decimal places before any deploy. The pipeline is deterministic (same inputs, byte-identical bundle) and asserts its own story: if Buffett's exit ever stops producing a visible step in the ownership-adjusted series, the build fails rather than the chart lying.

**T-100 segment data instead of the paper-faithful ticket survey.** The original paper used DB1B ticket samples; I use T-100 segment counts, which are a fraction of the size and far cleaner to pipeline. The cost is a segment-versus-market mismatch, which I chose to disclose in the in-app fine print rather than hide. Honest simplification, stated plainly, beats false fidelity.

**Hand-curated ownership snapshots instead of a continuous series.** Four registers (2016, 2019, 2022, 2025) built from primary filings: the 2016 snapshot comes from the 2018 paper's own published table, and the rest were verified against SEC proxy statements and 13G filings, with each cell carrying its source and the handful of unverifiable cells labeled approximate. Snapshot boundaries were placed at the big ownership events — Buffett's exit, Spirit's creditor takeover — so the annotated history and the chart steps line up by construction. A continuous 13F-based series would be more faithful and would have consumed the entire time budget.

**Readability as a late, deliberate pivot.** The first complete version was rigorous and assumed too much. After watching a real first-time reader (me, wearing that hat) get confused, we adopted a hard rule — every sentence must survive a reader with zero background in finance or economics — and rewrote the entire narrative layer: a from-first-principles intro, an interactive HHI playground, plain-language dial explanations, adaptive takeaway boxes that state the conclusion the numbers actually support, and a fact-check pass that caught real errors (including a merger-guidelines threshold that had been stale since 2023, and a chart-animation bug the readout numbers exposed).

## How I'd extend it with more time

The extension I most want is the one the design already points at: a "grade yourself" mode that ingests the post-shutdown fare data when it publishes (monthly data covering the shutdown arrives ~late 2026; the full-quarter verdict ~early 2027) and scores the registered predictions in-app — the tool closing its own loop. Beyond that: continuous ownership from 13F filings instead of snapshots; paper-faithful DB1C market shares for a subset of routes; the rumored-merger scenarios. And the chassis generalizes: the same assumption-forward pattern would work for any contested empirical fight — minimum-wage effects, hospital mergers — where explainers currently launder verdicts.

## Time spent

Roughly seven hours of wall-clock build time across two days, of which my own hands-on time was about four to five hours — the AI executed long stretches autonomously against pre-agreed plans while I reviewed at checkpoints, tested the product, and drove the design and readability iterations. The work shipped as a stack of 32 small pull requests, each independently reviewable, which is also how the judgment trail in the transcripts is organized.
