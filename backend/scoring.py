from typing import Dict

class ScoringService:
    @staticmethod
    def calculate_score(bid: int, tricks: int, bonus: int, round_cards: int, rules: Dict) -> int:
        score = 0
        
        # 1. Handle ZERO Bid
        if bid == 0:
            multiplier = 10  # Standard
            if tricks == 0:
                score = round_cards * multiplier
                # Bonuses apply if bid is successful
                score += bonus
            else:
                score = (round_cards * multiplier) * -1
                # Bonuses are NOT added if you fail a zero bid
            return score

        # 2. Handle NON-ZERO Bid
        if bid == tricks:
            # Success
            score = (tricks * 20) + bonus
        else:
            # Failure
            diff = abs(bid - tricks)
            score = (diff * -10)
            # Note: In standard rules, you get 0 points for tricks won if you fail,
            # and you do NOT get bonus points if the bid fails.
        
        return score
