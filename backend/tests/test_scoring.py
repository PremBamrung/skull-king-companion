import pytest
from scoring import ScoringService

calc = ScoringService.calculate_score


# --- Zero bid: success ---

def test_zero_bid_success():
    assert calc(bid=0, tricks=0, bonus=0, round_cards=5, rules={}) == 50

def test_zero_bid_success_with_bonus():
    assert calc(bid=0, tricks=0, bonus=30, round_cards=5, rules={}) == 80

def test_zero_bid_success_round1():
    assert calc(bid=0, tricks=0, bonus=0, round_cards=1, rules={}) == 10


# --- Zero bid: failure ---

def test_zero_bid_failure():
    assert calc(bid=0, tricks=1, bonus=0, round_cards=5, rules={}) == -50

def test_zero_bid_failure_ignores_bonus():
    # Bonus must NOT be added when zero bid fails
    assert calc(bid=0, tricks=2, bonus=50, round_cards=5, rules={}) == -50

def test_zero_bid_failure_round10():
    assert calc(bid=0, tricks=1, bonus=0, round_cards=10, rules={}) == -100


# --- Non-zero bid: success ---

def test_nonzero_bid_success():
    assert calc(bid=3, tricks=3, bonus=0, round_cards=5, rules={}) == 60

def test_nonzero_bid_success_with_bonus():
    assert calc(bid=3, tricks=3, bonus=40, round_cards=5, rules={}) == 100

def test_nonzero_bid_success_bid1():
    assert calc(bid=1, tricks=1, bonus=0, round_cards=1, rules={}) == 20


# --- Non-zero bid: failure ---

def test_nonzero_bid_over_bid():
    # bid=5, tricks=3 => diff=2 => -20
    assert calc(bid=5, tricks=3, bonus=0, round_cards=7, rules={}) == -20

def test_nonzero_bid_under_bid():
    # bid=2, tricks=5 => diff=3 => -30
    assert calc(bid=2, tricks=5, bonus=0, round_cards=7, rules={}) == -30

def test_nonzero_bid_failure_ignores_bonus():
    # Bonus must NOT be added when bid fails
    assert calc(bid=3, tricks=1, bonus=50, round_cards=5, rules={}) == -20


# --- Misc ---

def test_rules_dict_does_not_affect_score():
    # rules dict is currently unused; ensure it doesn't crash or change outcome
    assert calc(bid=2, tricks=2, bonus=0, round_cards=5, rules={"some_future_rule": True}) == 40
