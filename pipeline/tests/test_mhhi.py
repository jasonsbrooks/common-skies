"""Mirrors app/src/lib/market-math/market-math.test.ts — the same
hand-worked arithmetic must hold in both languages (golden vectors then
lock parity on real data)."""

import pytest

from mhhi import hhi, mhhi_delta, normalize_shares


def test_hhi_monopoly_and_duopoly():
    assert hhi({"AA": 1}) == 1
    assert hhi({"AA": 0.5, "DL": 0.5}) == 0.5
    assert hhi({"AA": 300, "DL": 100}) == pytest.approx(0.625, abs=1e-12)


def test_normalize_drops_nonpositive():
    assert normalize_shares({"AA": 2, "DL": 0, "NK": -1}) == {"AA": 1}


def test_separate_ownership_is_zero():
    ownership = [("X", "AA", 0.3), ("Y", "DL", 0.3)]
    assert mhhi_delta({"AA": 0.5, "DL": 0.5}, ownership, "proportional") == 0


def test_single_common_owner_duopoly_is_merger_equivalent():
    ownership = [("Fund", "AA", 1.0), ("Fund", "DL", 1.0)]
    assert mhhi_delta({"AA": 0.5, "DL": 0.5}, ownership, "proportional") == pytest.approx(0.5, abs=1e-12)
    small = [("Fund", "AA", 0.1), ("Fund", "DL", 0.1)]
    assert mhhi_delta({"AA": 0.5, "DL": 0.5}, small, "proportional") == pytest.approx(0.5, abs=1e-12)


def test_hand_worked_asymmetric_example_both_assumptions():
    # Same worked example as the TS suite (see market-math.test.ts).
    shares = {"A": 0.6, "B": 0.4}
    ownership = [
        ("Vanguard", "A", 0.10), ("Vanguard", "B", 0.08),
        ("BlackRock", "A", 0.06), ("BlackRock", "B", 0.07),
        ("Berkshire", "A", 0.04), ("Berkshire", "B", 0.05),
        ("HedgeCo", "A", 0.05),
        ("UndivCo", "B", 0.20),
    ]
    assert mhhi_delta(shares, ownership, "proportional") == pytest.approx(
        0.25588809778841914, abs=1e-12
    )
    assert mhhi_delta(shares, ownership, "passive-index") == pytest.approx(
        0.12836728837876616, abs=1e-12
    )


def test_passive_index_zeroes_big_three_only_webs():
    ownership = [
        ("Vanguard", "AA", 0.1), ("Vanguard", "DL", 0.1),
        ("State Street", "AA", 0.05), ("State Street", "DL", 0.05),
        ("Solo", "AA", 0.2),
    ]
    shares = {"AA": 0.5, "DL": 0.5}
    assert mhhi_delta(shares, ownership, "proportional") == pytest.approx(13 / 42, abs=1e-12)
    assert mhhi_delta(shares, ownership, "passive-index") == 0


def test_ownerless_carrier_contributes_zero_without_nan():
    ownership = [("Fund", "A", 0.1), ("Fund", "B", 0.1)]
    delta = mhhi_delta({"A": 0.4, "B": 0.4, "C": 0.2}, ownership, "proportional")
    assert delta == pytest.approx(0.32, abs=1e-12)
