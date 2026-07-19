import os
from bs4 import BeautifulSoup
import re

html_path = 'templates/index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html_content = f.read()

soup = BeautifulSoup(html_content, 'html.parser')

# Sections to extract
sections = {
    'home': soup.find('header', class_='hero'),
    'how': soup.find('section', id='how'),
    'test': [soup.find('section', id='quiz-section'), soup.find('div', id='resultsContainer')],
    'counselor': soup.find('section', id='counselor'),
    'contact': soup.find('section', id='contact-section')
}

# Create base.html by removing the sections from the soup
# Wait, if we remove them, we can replace them with a single placeholder
placeholder = soup.new_tag('div')
placeholder.string = "CONTENT_BLOCK_PLACEHOLDER"

# Insert placeholder before the first section (hero)
if sections['home']:
    sections['home'].insert_before(placeholder)

# Remove all extracted sections from the soup
for key, sec in sections.items():
    if isinstance(sec, list):
        for s in sec:
            if s: s.extract()
    else:
        if sec: sec.extract()

base_html = str(soup).replace('<div>CONTENT_BLOCK_PLACEHOLDER</div>', '{% block content %}{% endblock %}')

# Let's fix the nav-links in base.html to use the new routes
base_html = re.sub(r'<a href="#how">How it works</a>', '<a href="/how-it-works">How it works</a>', base_html)
base_html = re.sub(r'<a href="#quiz-section">Take Test</a>', '<a href="/take-test">Take Test</a>', base_html)
base_html = re.sub(r'<a href="#counselor">AI Counselor</a>', '<a href="/ai-counselor">AI Counselor</a>', base_html)
base_html = re.sub(r'<a href="#contact-section">Contact</a>', '<a href="/contact">Contact</a>', base_html)

# Hero button 'Start Career Test'
base_html = re.sub(r'<button class="btn nav-cta" onclick="startQuiz\(\)">Start Career Test</button>', 
                   '<button class="btn nav-cta" onclick="window.location.href=\'/take-test\'">Start Career Test</button>', base_html)

os.makedirs('templates', exist_ok=True)
with open('templates/base.html', 'w', encoding='utf-8') as f:
    f.write(base_html)

for key, sec in sections.items():
    if key == 'test':
        sec_html = str(sec[0]) + '\n' + str(sec[1])
    else:
        sec_html = str(sec)
    
    # Let's replace the inline onclicks in home.html
    if key == 'home':
        sec_html = re.sub(r'onclick="startQuiz\(\)"', 'onclick="window.location.href=\'/take-test\'"', sec_html)
        sec_html = re.sub(r'onclick="document.getElementById\(\\\'counselor\\\'\).scrollIntoView\(\{behavior:\\\'smooth\\\'\}\)"', 'onclick="window.location.href=\'/ai-counselor\'"', sec_html)
    
    template_content = "{% extends 'base.html' %}\n{% block content %}\n" + sec_html + "\n{% endblock %}\n"
    with open(f'templates/{key}.html', 'w', encoding='utf-8') as f:
        f.write(template_content)

print("HTML split successful!")
