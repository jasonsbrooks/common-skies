# Video Script — Common Skies (~5 minutes)

Format: screen recording of the live site with voiceover. Directions in
brackets; spoken lines in plain text. Target pace ~150 wpm; the spoken
text below is ~770 words.

---

**[0:00 — Site hero on screen, scrolled to the headline]**

Do index funds make your plane tickets more expensive? That question is one of the biggest open fights in economics, and this is Common Skies — an interactive site that doesn't try to win the fight. It hands you the levers the economists have been fighting over, on a decade of real government data, and lets you judge it yourself.

Here's the setup in thirty seconds. Competition keeps prices down. But three investment firms — Vanguard, BlackRock, and State Street — run the index funds most retirement money sits in, and buying a slice of everything means they ended up owning fifteen to twenty-five percent of nearly every major U.S. airline, all at the same time. In 2018, a team of economists said: that overlap quietly softens competition, and fares are three to seven percent higher because of it. In 2022, another team said: measure it properly and the effect disappears. Both papers are in the same top journal. Nobody has won.

**[0:45 — Scroll to ① Learn; drag the playground sliders, add an airline]**

Before you can judge that fight, you need the scoreboard. Regulators score market concentration with a number called HHI — you take each company's share of the market, square it, add it up. This playground lets you feel it: drag an airline bigger and the score climbs toward monopoly; add rivals and it falls.

**[1:15 — FundCo toy: drag both stakes up, point at the two score cards]**

But watch the blind spot. Here are two airlines splitting a route fifty-fifty. Now a fund buys stock in both of them. The official score doesn't move — no merger happened. The extended score, MHHI, climbs toward merger territory, because each airline's biggest shareholders now win either way. That gap is called MHHI delta, and the entire fight is about whether that number is real money.

**[1:45 — The two dials card]**

The fight comes down to two dials, and this is the design thesis of the whole site: the disputed assumptions ARE the interface. Dial one — whose stock-holdings count as influence? The 2018 team counted every big owner. The critics say the Big Three are passive and shouldn't count at all. Dial two — how strongly do points become dollars? The 2018 estimate says every thousand points is about two percent on your fare. The critics' estimate says essentially zero.

**[2:15 — Explore: Atlanta–Chicago, flip Dial 1, point at the purple cliff at 2020]**

Now the real data. Fifty routes, every quarter since 2014, with the news drawn on the charts. Here's Atlanta to Chicago — and look at this cliff in 2020. That's Warren Buffett. Berkshire held about ten percent of all four major airlines, sold everything in one month, and under the critics' dial setting, shared ownership on this route essentially died that day. The dashed line on the fare chart is your dials talking: what tickets would cost with no shared-owner effect at all. Flip a dial and a decade of history recalculates.

**[3:00 — Simulate: Spirit shutdown, the receipt; flip Dial 2 back and forth]**

Then reality handed us an experiment. On May 2, 2026, Spirit Airlines stopped flying — hundreds of routes lost a competitor overnight. This receipt itemizes the predicted fare change on a route Spirit just left, and the disputed line is the whole fight in one row: under the 2018 numbers it's eight dollars; flip to the critics and it nearly vanishes.

And there's a wrinkle most coverage would miss: by the shutdown, Spirit didn't even belong to the index funds anymore — bankruptcy had handed it to its lenders. Run the math with its old owners and its exit would have loosened the ownership web. With its real owners, the exit tightens it. Same event, opposite directions, hinging on bankruptcy paperwork.

**[3:50 — Prediction: the two groups, the 2×2 grid, the timestamp chip]**

So the site ends with a bet. Fuel prices spiked at the same time Spirit died, so we compare two groups: fifty-two routes that lost Spirit, and fifty-two look-alikes that never had it. The fuel spike hits both; losing Spirit hits only one. Four predictions — one per dial combination — were frozen with a public, tamper-proof timestamp before any post-shutdown data existed. Reality grades this page in early 2027, and because the site never picked a side, any outcome vindicates one of its settings.

**[4:30 — Fine print briefly, then back to hero]**

Everything is built honestly underneath: the math is implemented twice and tested to agree to twelve decimal places, every ownership number carries the SEC filing it came from, and the fine print steelmans both camps and lists every simplification we made on purpose.

I spent about seven hours across two days building this with Claude — the transcripts show the parts I'm proudest of, which are the errors we caught, not just the features we shipped. Thanks for watching — the dials are yours now.

**[4:55 — End on the hero headline]**
