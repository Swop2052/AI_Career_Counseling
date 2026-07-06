# test_vector.py - Test local vector search performance
import time
from modules.vector_store import vector_store
from modules.retrieval_pipeline import retrieval_pipeline
from app import CAREER_DB

def run_test():
    print("=== VERIFYING CHROMADB VECTOR SEARCH ===")
    print(f"ChromaDB Enabled: {vector_store.enabled}")
    
    if not vector_store.enabled:
        print("[ERROR] ChromaDB is not enabled. Please check if chromadb and sentence-transformers are installed.")
        return
        
    # Sample persona
    sample_persona = {
        "student_info": {"name": "Test Student"},
        "academic_profile": {
            "subjects": ["Computer Science", "Mathematics", "Physics"],
            "strengths": ["Analytical thinking", "Coding", "Math solving"]
        },
        "interests": {
            "interests": ["Robotics", "AI", "Software Development"],
            "hobbies": ["Building games", "Chess"]
        },
        "riasec_profile": {
            "code": "IRC",
            "traits": ["Investigative", "Realistic", "Conventional"]
        }
    }
    
    print("\n1. Test direct vector semantic search query:")
    query_str = retrieval_pipeline._build_vector_query(sample_persona)
    print(f"Query String: '{query_str}'")
    
    start_time = time.time()
    results = vector_store.search_careers(query_str, n_results=5)
    elapsed = (time.time() - start_time) * 1000
    
    print(f"Retrieval took: {elapsed:.2f}ms")
    print("Top 5 matches:")
    for i, c in enumerate(results, 1):
        print(f"  {i}. {c.get('career_name')} - Tags: {c.get('riasec_tags')}")
        
    print("\n2. Test full retrieval pipeline (Vector candidates + Weighted scoring):")
    start_time = time.time()
    matches = retrieval_pipeline.retrieve(sample_persona, CAREER_DB)
    elapsed = (time.time() - start_time) * 1000
    
    print(f"Full pipeline took: {elapsed:.2f}ms")
    print("Top matches returned:")
    for i, m in enumerate(matches, 1):
        print(f"  {i}. {m.career_name} - Score: {m.match_score:.1f}% (RIASEC Match: {m.riasec_match:.1f}%)")

if __name__ == "__main__":
    run_test()
