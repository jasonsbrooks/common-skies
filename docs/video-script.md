# Video Script — Common Skies (~5 minutes)

This is the design rationale in spoken form — the same ground as
docs/rationale.md, not a product demo. Suggested format: screen recording
with the site visible as a backdrop, moving to the part of the page being
discussed. Directions in brackets are light cues, not a tour. The spoken
text is ~760 words, which is about five minutes at a natural pace.

---

**[0:00 — Site hero visible]**

Hi, I'm Jason, and this is Common Skies. I want to spend these five minutes not demoing the site — you have the link for that — but explaining why I built this particular thing and the decisions behind it.

I chose the Exploration and Understanding theme because it rewards what I've spent my career doing: taking a system that's too complicated to explain in words alone and making it understandable through interaction. The subject is a real fight in economics that's still going on. A handful of giant investment firms — the ones that manage most of our retirement savings — have ended up owning a piece of every major U.S. airline at the same time. In 2018, a team of economists said that overlap softens competition and makes plane tickets three to seven percent more expensive. In 2022, another team said the effect is zero, and the first team had measured wrong. Same top journal, eight years of back and forth, and still no winner.

**[0:55]**

The topic is personal for me. I follow aviation closely, and I ran into this fight years ago. I understood the headline, but the machinery underneath it was a wall of math I never worked through, and I never found an explanation that made it visual. That's exactly the premise of this theme — a hard idea that static explanations failed to teach me. So this project is the explainer I wish had existed.

But I didn't pick it on sentiment. My transcripts show a deliberately adversarial selection: I generated about a dozen candidate ideas and killed them one by one against the same filter — real data instead of made-up data, interaction that changes the assumptions instead of just the camera angle, nothing for a reviewer to install or sign into, and a payoff that doesn't depend on luck. This idea came in late, as my own candidate rather than the AI's top pick, and it beat the front-runner. It won for four reasons: the fight is genuinely unresolved, the math at its center is teachable with a slider in a minute, all the data is public and small, and — the gift — Spirit Airlines went out of business nine weeks before I started building, which means the tool can make predictions that reality will actually grade.

**[2:00 — Scroll slowly to the two dials]**

Here's the non-obvious part. Every existing explainer of this debate picks a side. This one refuses to, and that refusal is the design: the contested assumptions became the interface. The fight sounds like one disagreement, but it's really two, so the site gives you two dials — one for whether the big index funds count as influencing the airlines they own at all, and one for how strongly that influence shows up in ticket prices. You flip whose economics you believe and watch the same decade of data, and the same scenarios, change their answer.

Building it honestly produced my favorite discovery. By the time Spirit shut down, it didn't even belong to the index funds anymore — bankruptcy had handed it to its lenders a year earlier. Run the math with its old owners, and Spirit's exit would have loosened the web of shared ownership. With its real owners, the exit tightens it. Same event, opposite directions, hinging on bankruptcy paperwork. Most coverage would have gotten that wrong, and the app teaches it instead.

**[3:10 — The prediction section visible]**

The site ends with a bet: four predictions, one per dial combination, about the routes Spirit left behind versus look-alike routes it never flew — built that way so this spring's fuel-price spike cancels out. They were published with a tamper-proof timestamp before any post-shutdown data existed, and reality grades them in early 2027. Because the tool never picked a side, any outcome vindicates one of its settings.

**[3:40]**

A few decisions worth naming. All the heavy math happens before the site ever loads, which is why the dials feel instant and the demo needs no servers or accounts. The math is written twice on purpose — once in the site, once in the data build — and an automated test forces the two to agree before anything ships. The ownership table was built by hand from official filings, with a source attached to every number. And midway through, readability became a rule, not a preference: after watching a first-time reader get lost, we rewrote every sentence to survive someone with no background in finance — and that same pass fact-checked the whole site and caught real errors, including a regulatory threshold that had been out of date since 2023.

**[4:35]**

With more time, I'd build the mode the design already points at: when the post-shutdown fare data publishes, the site ingests it and grades its own frozen predictions. I spent about seven hours over two days, four to five of them hands-on, with the rest running autonomously against plans we'd agreed. The transcripts show the part I care most about: not just what we built, but what we caught. Thanks for watching.

**[4:55 — End]**
