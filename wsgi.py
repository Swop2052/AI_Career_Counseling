# wsgi.py - Production WSGI Entry Point for SkillSense
"""
Production WSGI Entry Point
Usage with Gunicorn:
    gunicorn wsgi:app -w 4 -b 0.0.0.0:5000
Usage with Waitress:
    waitress-serve --listen=0.0.0.0:5000 wsgi:app
"""
import os
import sys

# Ensure root application directory is in Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app

if __name__ == '__main__':
    app.run()
