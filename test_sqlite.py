# test_sqlite.py - Verification script for SQLite simplified database schema
import sys
import os
import json
from datetime import datetime

# Adjust path to find modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.config import config
from modules.conversation_memory import ConversationMemory

def run_test():
    print("=== VERIFYING SQLITE SIMPLIFIED CONNECTION ===")
    print(f"Target DB Path: {config.db_path}")
    print("----------------------------------------")
    
    try:
        # Initialize the memory (this automatically triggers table drops and SQLite database setup)
        print("[1/4] Initializing simplified SQLite database tables...")
        memory = ConversationMemory()
        print("[SUCCESS] SQLite database initialization completed successfully.")
        
        # Test session CRUD operations
        session_id = "11111111-2222-3333-4444-555555555555"
        print(f"\n[2/4] Creating test session '{session_id}'...")
        conv = memory.get_session(session_id)
        
        test_persona = {
            "name": "Database Verification Tester",
            "age": 25,
            "riasec_code": "IRC",
            "stream": "Computer Science"
        }
        
        # Set Persona
        print("Setting persona metadata...")
        memory.set_persona(session_id, test_persona)
        
        # Verify Persona retrieval
        retrieved_persona = memory.get_persona(session_id)
        print(f"Retrieved Persona: {retrieved_persona}")
        assert retrieved_persona == test_persona, "Persona mismatch!"
        
        # Set career matches
        test_matches = [{"name": "Software Engineer", "score": 95.0}]
        print("Setting career matches metadata...")
        memory.set_career_matches(session_id, test_matches)
        
        retrieved_matches = memory.get_career_matches(session_id)
        print(f"Retrieved Career Matches: {retrieved_matches}")
        assert retrieved_matches == test_matches, "Career matches mismatch!"
        
        # Set RIASEC answers and scores
        test_answers = [{"question_id": 1, "question": "I like to work on cars", "category": "Realistic", "value": 5, "response_text": "Exactly Like Me"}]
        test_scores = {"R": 5, "I": 0, "A": 0, "S": 0, "E": 0, "C": 0}
        print("Setting RIASEC answers and scores...")
        memory.set_riasec_data(session_id, test_answers, test_scores)
        
        retrieved_answers = memory.get_riasec_answers(session_id)
        retrieved_scores = memory.get_riasec_scores(session_id)
        print(f"Retrieved Answers: {retrieved_answers}")
        print(f"Retrieved Scores: {retrieved_scores}")
        assert retrieved_answers == test_answers, "Answers mismatch!"
        assert retrieved_scores == test_scores, "Scores mismatch!"
        
        # Test message logs
        print("Adding message logs...")
        memory.add_message(session_id, "user", "Test message logged to SQLite.", "GREETING")
        memory.add_message(session_id, "assistant", "Test reply logged to SQLite.", "GREETING")
        
        # Check history
        history = memory.get_history(session_id)
        print(f"Total messages logged: {len(history)}")
        for idx, msg in enumerate(history, 1):
            print(f"  {idx}. [{msg.role.upper()}]: {msg.content}")
            
        # Test Career Seeding & Fetching
        print("\n[3/4] Testing career record upserts & query retrieval...")
        test_career = {
            "career_name": "Test Engineer",
            "riasec_tags": ["I", "R"],
            "description": "Designs and executes tests to ensure software quality.",
            "course_fee": "INR 50,000",
            "personality_traits": ["Analytical", "Methodical"]
        }
        print("Upserting test career record...")
        memory.upsert_careers([test_career])
        
        # Verify get_career_detail
        print("Fetching career detail by primary key...")
        fetched_career = memory.get_career_detail("Test Engineer")
        print(f"Fetched Career: {fetched_career}")
        assert fetched_career and fetched_career.get("career_name") == "Test Engineer", "Career details fetch mismatch!"
        
        # Verify get_all_careers
        print("Listing all careers in SQLite...")
        all_careers = memory.get_all_careers()
        print(f"Total careers found: {len(all_careers)}")
        assert any(c.get("career_name") == "Test Engineer" for c in all_careers), "Test career missing from list!"
        
        # Test Relational Student Profile Seeding
        print("\n[4/4] Testing save_relational_profile (JSON format)...")
        mock_student_info = {
            "name": "Alex Mercer",
            "email": "alex.mercer@gmail.com",
            "phone": "9876543210",
            "age": 18,
            "class": "Class 12",
            "stream": "Science",
            "preferred_learning_mode": "Hybrid",
            "budget": "Medium Budget",
            "location_preference": "Outstation",
            "preferred_city": "Mumbai",
            "college_type": "Private College",
            "subjects": ["Physics", "Mathematics"],
            "weak_subjects": ["Chemistry"],
            "hobbies": ["Coding", "Gaming"],
            "interests": ["Machine Learning", "Robotics"],
            "strengths": ["Analytical thinking"],
            "career_aspirations": ["Software Engineer"]
        }
        memory.save_relational_profile(session_id, mock_student_info)
        print("[SUCCESS] Relational SQLite database seeding executed without errors.")
        
        # Test Overall Session Snapshot Seeding
        print("\n[5/5] Testing set_overall_session snapshot...")
        test_overall = {
            "student_info": mock_student_info,
            "riasec_answers": [{"question_id": 1, "value": 5}],
            "riasec_scores": {"R": 5},
            "persona": {"name": "Alex"},
            "career_matches": [{"name": "Software Engineer"}],
            "riasec_code": "R"
        }
        memory.set_overall_session(session_id, test_overall)
        
        # Verify snapshot retrieval
        retrieved_conv = memory.get_session(session_id)
        print(f"Retrieved Snapshot: {retrieved_conv.overall_session}")
        assert retrieved_conv.overall_session == test_overall, "Snapshot details mismatch!"
        print("[SUCCESS] Overall session snapshot saved and verified successfully.")
        
        # Clean up session
        print(f"\nCleaning up test session '{session_id}'...")
        memory.clear_session(session_id)
        
        # Verify cleanup
        cleaned_conv = memory.get_session(session_id)
        print(f"Verified: Session messaging history size after clean is {len(cleaned_conv.messages)}")
        
        print("\n========================================")
        print("[SUCCESS] SQLite CRUD Verification Completed!")
        print("========================================")
        
    except Exception as e:
        print(f"\n[ERROR] SQLite Verification failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_test()
