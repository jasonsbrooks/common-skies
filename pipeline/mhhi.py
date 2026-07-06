"""Python mirror of the app's market-math core (app/src/lib/market-math/).

Two implementations, one tested truth: the TS module is the reviewer-facing
source of truth; this mirror computes the decade of historical series. The
tests in tests/test_mhhi.py assert the same hand-worked numbers as the TS
suite, and build_bundle.py emits golden vectors that the TS suite replays,
so the two implementations cannot drift apart silently.
"""

BIG_THREE = ("Vanguard", "BlackRock", "State Street")


def normalize_shares(shares: dict[str, float]) -> dict[str, float]:
    positive = {c: s for c, s in shares.items() if s > 0}
    total = sum(positive.values())
    if total <= 0:
        return {}
    return {c: s / total for c, s in positive.items()}


def hhi(shares: dict[str, float]) -> float:
    return sum(s * s for s in normalize_shares(shares).values())


def mhhi_delta(
    shares: dict[str, float],
    ownership: list[tuple[str, str, float]],  # (owner, carrier, beta)
    assumption: str,  # "proportional" | "passive-index"
    passive_owners: tuple[str, ...] = BIG_THREE,
) -> float:
    s = normalize_shares(shares)
    carriers = list(s)
    if len(carriers) < 2:
        return 0.0

    passive = set(passive_owners) if assumption == "passive-index" else set()

    beta: dict[str, dict[str, float]] = {}
    for owner, carrier, b in ownership:
        if b <= 0 or owner in passive or carrier not in s:
            continue
        row = beta.setdefault(owner, {})
        row[carrier] = row.get(carrier, 0.0) + b

    def profit_weight(j: str, k: str) -> float:
        numerator = 0.0
        denominator = 0.0
        for row in beta.values():
            gamma_j = row.get(j, 0.0)
            if gamma_j == 0.0:
                continue
            numerator += gamma_j * row.get(k, 0.0)
            denominator += gamma_j * gamma_j
        return numerator / denominator if denominator > 0 else 0.0

    delta = 0.0
    for j in carriers:
        for k in carriers:
            if j != k:
                delta += s[j] * s[k] * profit_weight(j, k)
    return delta
