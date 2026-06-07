import os
from sentence_transformers import SentenceTransformer
from threading import Lock

# Upgrade embedding model to bge-small-en-v1.5
# Shared model instance to prevent duplicate loading in memory
MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "BAAI/bge-small-en-v1.5")
_model = None
_model_lock = Lock()

def get_model():
    global _model
    if _model is None:
        with _model_lock:
            if _model is None:
                _model = SentenceTransformer(MODEL_NAME)
    return _model
