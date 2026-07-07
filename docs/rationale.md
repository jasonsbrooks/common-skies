# Design Rationale: Common Skies

**Live site:** https://jasonsbrooks.github.io/common-skies/
**Repository:** https://github.com/jasonsbrooks/common-skies
**Theme:** 1, Exploration & Understanding

## Why this theme, and this specific approach

I decided to ideate and brainstorm around Theme 1 for this project as it maps closely to the type of work I've always enjoyed: taking a concept that's relatively complicated and hard to reason through, and making it easier to understand by explaining it step-by-step and visually.

The topic I landed on is a real debate in economics. There's a small number of very large investment firms (i.e., BlackRock, State Street, and Vanguard) that own meaningful stakes in many of the major US airlines at the same time, mostly through their index funds and retirement products. In 2018, a group of economists argued that this overlapping ownership ends up softening competition and raising airfares 3-7%. A few years later in 2022, a different group of economists said that the effect of this ownership is actually effectively zero, and that the original paper measured it incorrectly. Both of these papers were published in the same major journal, and since then, there has been no clear consensus on which paper was correct.

My project, Common Skies, is aimed at turning this debate into an interactive tool. Rather than just asking the viewer to read the papers or accept a single side's conclusion, my tool teaches the math and logic behind each paper from the ground up using real airline and ownership data. The user is able to change the disputed assumptions between the two papers directly and reach their own conclusion on this issue.

This project is also personally interesting to me. I'm a longtime follower of the aviation industry and airline markets, and I came across this issue a couple of years ago. While I understood the high-level claim, I never really found an intuitive explanation. This project is basically the explainer that finally let me reach a deep understanding of the debate and teach it to others in a much simpler way.

This wasn't the only idea I considered. I originally came up with a number of other concepts I was personally interested in, including a physician-payment anomaly detector, a food supply-chain explorer, and a wastewater disease detector. I evaluated them against the same set of criteria: which problems had real, complicated data, no setup burden for the person using the tool, and a meaningful way to interact with it.

This airline idea held up the best. It's a real, unresolved debate between top economists. The core math is simple enough to turn into an interactive tool. And the data is entirely public and shippable. There was also a timely real-world event to test the hypothesis against: Spirit Airlines shut down just a few months ago, leaving just major airlines in many of the markets they previously served.

## What makes it interesting or non-obvious

Any tool or explainer I found for this issue ended up choosing a side from the start. My goal was that, instead of being opinionated on a side from the start, it would show where the disagreement comes from. The main design decision is that the assumptions that are contested between the two sets of economists become the core of the user interface. The user has the ability to change them and immediately see the downstream effect, allowing them to draw their own conclusion.

There are three parts of the project that I think are really important:

**There are really two debates**
When first looking at this problem, the common ownership fight sounds like only one disagreement: if there's overlapping ownership across multiple airlines, does that raise prices or not? But when breaking it down, there are really two separate questions:

1. How should overlapping ownership actually be measured? Should large index funds count as owners that can actually influence the behavior of an airline, or should they be treated as passive shareholders?
2. Even if the ownership score changes, how much does that actually matter for fares? The initial paper says there's a meaningful effect. But the other side found no effect.

In the tool, I separate these two choices into different controls to make the debate easier to understand. This allows the tool to explain the result in an intuitive way. For example, in the scenario where large index funds sell their stake in the airlines, one setting predicts no fare change at all. That's not a bug: it's the result of the user's assumption that those funds were passive in the first place.

**Spirit's Shutdown is More Complicated Than it Looks.**
Spirit shutting down ended up being a much more interesting situation than I had originally expected. The obvious assumption is that Spirit shuts down, so there's no more competition and fares in their previous markets rise. But the ownership story actually ended up being non-obvious: by the time it shut down, it was no longer owned in the same way, as bankruptcy had shifted control to previous lenders.

That meant that the result changes depending on which ownership model is used. If Spirit still had its old index-fund owners, its exit would have weakened shared ownership. But under its actual post-bankruptcy ownership, Spirit passengers now move to airlines that do share major owners.

This scenario is hard to understand in abstract, but becomes much more understandable in the tool when you can see the scenario change on the screen.

**This tool makes a prediction that can be checked in the future**
Spirit shutting down actually creates a really interesting opportunity for a natural test. The problem is that airline fares are affected by many things at the same time. This spring, jet fuel prices significantly increased due to the war in Iran, so if you only compare fares before and after Spirit shut down, it would conflate multiple variables.

I handle this by comparing routes that lost Spirit service against similar routes that did not. That way, industry-wide price changes from things like fuel pricing should affect both groups and cancel out.

The site shares four predictions, one for each combination of assumptions. Those predictions are timestamped before the post-shutdown fare data exists, and I explain when the relevant data should become available. Since the tool specifically doesn't pick a side, the future data won't prove the site "right" or "wrong." Instead, it will eventually show which set of assumptions actually best matched what happened.

## Key design decisions and tradeoffs

**Precompute the heavy work**
The site is static and lives on GitHub Pages. To support having just a lightweight site, all of the heavier data processing happens ahead of time in an offline pipeline, which outputs just a small data file to use on the frontend. The site then loads that file and only does simple arithmetic in the browser.

This decision makes the experience super fast and easy to review. There's no need for any servers, accounts, API keys, or loading delays. The tradeoff is that the site can only expose the specific scenarios/routes I precomputed. I did add in sliders that still allow users to vary the assumptions being used to make it feel interactive.

**Keep the math testable**
I implemented the formulas twice, once in the data pipeline and once in the website. This was intentional. There is an automated test that makes sure the two implementations produce the same result before the site ships.

The pipeline also has sanity checks against known real-world events. For example, Warren Buffett sold his airline stakes in 2020. If that event ever stops showing up as a visible step in the ownership score, the build fails.

The main goal is to ensure the site never ships when the chart *looks* visually correct but the data doesn't match the actual history.

**I measured market share with a simpler dataset than the papers used.**
The academic papers use a government ticket survey to estimate market share. I used a different government dataset that counts passengers flown on each route.

That design decision made the project much easier to build within my time constraints. The dataset is smaller and cleaner. But it's not the exact same measurement used in the original papers, so I call that out directly on the site.

**The ownership table was built by hand**
The ownership data comes from four snapshots: 2016, 2019, 2022, and 2025. I was able to build these snapshots from SEC filings, with the 2016 data coming from the published table in the 2018 paper.

A more complete version would use quarter-by-quarter ownership data, which would be more accurate, but would have taken a significantly larger share of the build time to fetch. I decided to use a smaller number of snapshots and place them around the major ownership events, like Buffett's exit and Spirit's takeover. So the charts still line up with important real-world changes.

**Written for a non-specialist reader**
The initial version of the site was very technically rigorous, but after reading through it, it was clear that it assumed far too much background knowledge. Even as someone who understood this problem space decently, it felt very technical.

I decided to rewrite much of the explanatory layer. The final version starts from a simpler premise: competition usually helps keep prices down. From there, it introduces all of the concepts from the paper using interactive explainers.

Rewriting it to be much simpler also allowed me to catch factual issues in the text. I used AI to do a complete fact check across all of the information explained, and was able to find an outdated regulatory threshold and a chart bug that was much more obvious once the surrounding explanation was clearer.

## How I'd extend it with more time

The extension I would most want to build is a "grade the prediction" mode. Once the post-shutdown fare data becomes available, the site could ingest it, compare it against the frozen predictions, and show which assumptions best matched reality. This data should be available in late 2026.

After that, I would add in the quarter-by-quarter ownership history mentioned earlier, and use the academic papers' preferred market-share source for a subset of routes. I'd also add scenarios for other airline mergers or shutdowns.

I also think it would be really interesting to generalize this beyond airlines. The same "assumptions as interface" pattern would work really well for other contested data sets, like minimum-wage effects or hospital mergers. Similarly to this, the hard part there is not just explaining the result but showing why different people disagree.

## Time spent

It took roughly 7 hours to build this, but only 4-5 hours of that was active time from me. I leveraged AI to help build out the product, so my AI coding assistant autonomously executed against the plans I put together for each step.

I shipped this tool as a stack of ~35 small, reviewable changes. That structure made it easy for me to inspect the work of the AI assistant as it built each piece, and keep a clear trail of how the project evolved.
