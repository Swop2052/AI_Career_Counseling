import os
import sys

# Add project root to sys.path so core modules can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.translator_cache import translate_career_data

test_career = {
    'name': 'Software Engineer',
    'reason': 'Great match based on your logic skills.',
    'strengths': ['Problem solving', 'Coding'],
    'data': {
        'overview': 'Develops software applications.',
        'skills': ['Python', 'JavaScript']
    }
}

print("Translating to Marathi...")
translated_mr = translate_career_data(test_career, 'mr')
print("Translated (mr):", translated_mr)

print("\nTranslating to Hindi...")
translated_hi = translate_career_data(test_career, 'hi')
print("Translated (hi):", translated_hi)
