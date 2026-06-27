# trait_definitions.py - Production ready

TRAITS = {
    "R": {
        "name": "Realistic",
        "traits": ["Practical", "Hands-on", "Mechanical"],
        "description": "You are practical, hands-on, and enjoy working with your hands, tools, and machines."
    },
    "I": {
        "name": "Investigative",
        "traits": ["Analytical", "Research Oriented", "Curious"],
        "description": "You are analytical, curious, and enjoy exploring ideas, solving complex problems, and conducting research."
    },
    "A": {
        "name": "Artistic",
        "traits": ["Creative", "Innovative", "Expressive"],
        "description": "You are creative, expressive, and enjoy self-expression through art, design, writing, or music."
    },
    "S": {
        "name": "Social",
        "traits": ["Helpful", "Empathetic", "Collaborative"],
        "description": "You are helpful, empathetic, and enjoy working with people. You have strong interpersonal skills."
    },
    "E": {
        "name": "Enterprising",
        "traits": ["Leadership", "Persuasive", "Goal Oriented"],
        "description": "You are ambitious, persuasive, and goal-oriented. You enjoy leading and influencing others."
    },
    "C": {
        "name": "Conventional",
        "traits": ["Organized", "Detail Oriented", "Structured"],
        "description": "You are organized, detail-oriented, and prefer structure and order."
    }
}

RIASEC_CODES = tuple(TRAITS.keys())


def get_trait_definition(code):
    """Return normalized trait definition for a RIASEC code."""
    key = str(code or "").upper().strip()
    return TRAITS.get(key)