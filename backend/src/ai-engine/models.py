import os
from sentence_transformers import SentenceTransformer

# Upgrade embedding model to bge-small-en-v1.5
# Shared model instance to prevent duplicate loading in memory
MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "BAAI/bge-small-en-v1.5")
model = SentenceTransformer(MODEL_NAME)
