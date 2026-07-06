# modules/vector_store.py - Local ChromaDB Vector Store Integration
import os

# Limit CPU thread pools to prevent virtual memory bloating on Windows
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["VECLIB_MAXIMUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"

import json
import traceback
from typing import List, Dict, Any

CHROMA_AVAILABLE = False
try:
    import chromadb
    from chromadb.utils import embedding_functions
    CHROMA_AVAILABLE = True
    
    # Configure PyTorch CPU threads count to 1 to minimize memory allocations
    try:
        import torch
        torch.set_num_threads(1)
    except ImportError:
        pass
except ImportError:
    print("[WARNING] ChromaDB or sentence-transformers is not installed. Vector search is disabled, running on heuristic fallback.")

class VectorStore:
    """
    Manages local semantic candidate search using ChromaDB and sentence-transformers.
    Includes fallback guards for environment safety.
    """
    
    def __init__(self):
        self.client = None
        self.collection = None
        self.enabled = False
        
        if CHROMA_AVAILABLE:
            try:
                # Store ChromaDB SQLite files inside the data directory
                base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                db_path = os.path.join(base_dir, "data", "chroma_db")
                
                self.client = chromadb.PersistentClient(path=db_path)
                
                # Setup embedding function with sentence-transformers all-MiniLM-L6-v2
                self.emb_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
                    model_name="all-MiniLM-L6-v2"
                )
                
                # Get or create collection using cosine similarity metric
                self.collection = self.client.get_or_create_collection(
                    name="careers",
                    embedding_function=self.emb_fn,
                    metadata={"hnsw:space": "cosine"}
                )
                
                # Warm load the model on the main thread to prevent thread conflicts with Werkzeug on Windows
                print("[INFO] Warm loading SentenceTransformer model weights on the main thread...")
                self.emb_fn(["warmup"])
                
                self.enabled = True
                print("[SUCCESS] ChromaDB Vector Store successfully initialized with all-MiniLM-L6-v2.")
            except BaseException as e:
                print(f"[WARNING] Failed to initialize ChromaDB Vector Store (running on fallback): {e}")
                traceback.print_exc()
                
    def add_careers(self, careers: List[Dict[str, Any]]):
        """Add careers to ChromaDB."""
        if not self.enabled:
            return
            
        try:
            ids = []
            documents = []
            metadatas = []
            
            for career in careers:
                name = career.get("career_name", "")
                if not name:
                    continue
                    
                # Format a rich text document for embedding
                desc = career.get("description", "")
                pathway = str(career.get("educational_pathway", ""))
                traits = ", ".join(career.get("personality_traits", []))
                related = ", ".join(career.get("related_careers", []))
                
                doc_text = f"Career: {name}\nDescription: {desc}\nTraits: {traits}\nPathway: {pathway}\nRelated fields: {related}"
                
                ids.append(name)
                documents.append(doc_text)
                metadatas.append({"career_data": json.dumps(career)})
                
            if ids:
                self.collection.add(
                    ids=ids,
                    documents=documents,
                    metadatas=metadatas
                )
                print(f"[SUCCESS] Added/Updated {len(ids)} careers in ChromaDB Vector Store.")
        except Exception as e:
            print(f"[ERROR] Failed to add careers to ChromaDB: {e}")
            traceback.print_exc()
            
    def search_careers(self, query: str, n_results: int = 15) -> List[Dict[str, Any]]:
        """Search careers by semantic vector similarity."""
        if not self.enabled:
            return []
            
        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=n_results
            )
            
            retrieved_careers = []
            if results and results.get("metadatas") and results["metadatas"][0]:
                for metadata in results["metadatas"][0]:
                    career_json = metadata.get("career_data")
                    if career_json:
                        retrieved_careers.append(json.loads(career_json))
            return retrieved_careers
        except Exception as e:
            print(f"[ERROR] ChromaDB query failed: {e}")
            return []


# Singleton instance
vector_store = VectorStore()
