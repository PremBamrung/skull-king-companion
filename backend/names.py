import random

ADJECTIVES = [
    "fierce", "golden", "cursed", "silent", "crimson", "ancient", "bold",
    "stormy", "rotten", "sunken", "salty", "iron", "black", "scarlet",
    "haunted", "foggy", "brazen", "dread", "silver", "wild", "jade",
    "plundered", "midnight", "shattered", "burning", "hollow", "bloody",
    "wicked", "rusted", "frozen", "vengeful", "dark", "lost", "bitter",
    "gleaming", "grim", "spectral", "tattered", "lucky", "furious",
]

NOUNS = [
    "kraken", "tide", "anchor", "skull", "wave", "gale", "reef", "abyss",
    "cannonball", "mermaid", "cutlass", "galleon", "plank", "compass",
    "maelstrom", "doubloon", "tempest", "leviathan", "lantern", "bilge",
    "siren", "crow", "marlin", "squid", "horizon", "typhoon", "barnacle",
    "shoal", "captain", "deck", "cove", "frigate", "rigging", "porthole",
    "voyage", "brine", "starboard", "treasure", "phantom", "grog",
]


def generate_game_name() -> str:
    return f"{random.choice(ADJECTIVES)}-{random.choice(NOUNS)}"
