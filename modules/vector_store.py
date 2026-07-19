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
import threading
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
    except (ImportError, OSError, Exception):
        pass
except (ImportError, OSError, Exception):
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
        self.is_initializing = False
        
        if CHROMA_AVAILABLE:
            self.is_initializing = True
            # Start background initialization so app boots instantly
            threading.Thread(target=self._async_init, daemon=True).start()
            
    def _async_init(self):
        """Asynchronously load ChromaDB and SentenceTransformer weights."""
        try:
            print("[INFO] Starting background initialization for ChromaDB and ML models...")
            # Store ChromaDB SQLite files inside the data directory
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            db_path = os.path.join(base_dir, "data", "chroma_db")
            
            self.client = chromadb.PersistentClient(path=db_path)
            
            # Setup embedding function (Cloud API if HF_TOKEN is provided, otherwise Local SentenceTransformer)
            hf_token = os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACE_API_KEY")
            is_local = True
            
            if hf_token:
                print("[INFO] Initializing Hugging Face Cloud Embedding API (sentence-transformers/all-MiniLM-L6-v2)...")
                self.emb_fn = embedding_functions.HuggingFaceEmbeddingFunction(
                    api_key=hf_token,
                    model_name="sentence-transformers/all-MiniLM-L6-v2"
                )
                is_local = False
            else:
                print("[INFO] No HF_TOKEN found. Initializing local SentenceTransformerEmbeddingFunction...")
                self.emb_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
                    model_name="all-MiniLM-L6-v2"
                )
            
            # Get or create collection using cosine similarity metric
            try:
                self.collection = self.client.get_or_create_collection(
                    name="careers",
                    embedding_function=self.emb_fn,
                    metadata={"hnsw:space": "cosine"}
                )
            except ValueError as val_err:
                if "Embedding function conflict" in str(val_err):
                    print("[WARNING] Embedding function conflict detected. Rebuilding collection 'careers'...")
                    try:
                        self.client.delete_collection(name="careers")
                    except Exception:
                        pass
                    self.collection = self.client.get_or_create_collection(
                        name="careers",
                        embedding_function=self.emb_fn,
                        metadata={"hnsw:space": "cosine"}
                    )
                else:
                    raise val_err
            
            if is_local:
                print("[INFO] Warm loading SentenceTransformer model weights...")
                self.emb_fn(["warmup"])
            
            self.enabled = True
            self.is_initializing = False
            print("[SUCCESS] ChromaDB Vector Store successfully initialized in background!")
        except BaseException as e:
            self.is_initializing = False
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
