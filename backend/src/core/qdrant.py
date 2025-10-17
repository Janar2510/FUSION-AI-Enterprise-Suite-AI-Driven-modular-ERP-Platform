"""
Qdrant vector database configuration and client management
"""

import logging
from typing import List, Dict, Any, Optional, Tuple
import asyncio

from qdrant_client import QdrantClient
from qdrant_client.http import models
from qdrant_client.http.models import Distance, VectorParams, PointStruct
from sentence_transformers import SentenceTransformer

from src.core.config import get_settings

logger = logging.getLogger(__name__)

# Get settings
settings = get_settings()

# Global Qdrant client
qdrant_client: Optional[QdrantClient] = None
embedding_model: Optional[SentenceTransformer] = None


async def init_qdrant() -> None:
    """Initialize Qdrant client and create collections."""
    global qdrant_client, embedding_model
    
    try:
        # Initialize Qdrant client
        qdrant_client = QdrantClient(
            url=settings.QDRANT_URL,
            timeout=30,
        )
        
        # Test connection
        collections = qdrant_client.get_collections()
        logger.info("Qdrant connection established successfully")
        
        # Initialize embedding model
        embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        logger.info("Embedding model loaded successfully")
        
        # Create collections if they don't exist
        await create_collections()
        
    except Exception as e:
        logger.error(f"Failed to initialize Qdrant: {e}")
        raise


async def create_collections() -> None:
    """Create necessary collections in Qdrant."""
    try:
        collections_to_create = [
            {
                "name": "fusionai_vectors",
                "vector_size": 384,  # all-MiniLM-L6-v2 embedding size
                "distance": Distance.COSINE,
            },
            {
                "name": "agent_memories",
                "vector_size": 384,
                "distance": Distance.COSINE,
            },
            {
                "name": "document_embeddings",
                "vector_size": 384,
                "distance": Distance.COSINE,
            },
            {
                "name": "conversation_embeddings",
                "vector_size": 384,
                "distance": Distance.COSINE,
            },
        ]
        
        for collection_config in collections_to_create:
            try:
                # Check if collection exists
                collections = qdrant_client.get_collections()
                collection_names = [col.name for col in collections.collections]
                
                if collection_config["name"] not in collection_names:
                    qdrant_client.create_collection(
                        collection_name=collection_config["name"],
                        vectors_config=VectorParams(
                            size=collection_config["vector_size"],
                            distance=collection_config["distance"],
                        ),
                    )
                    logger.info(f"Created collection: {collection_config['name']}")
                else:
                    logger.info(f"Collection already exists: {collection_config['name']}")
                    
            except Exception as e:
                logger.error(f"Error creating collection {collection_config['name']}: {e}")
                
    except Exception as e:
        logger.error(f"Error creating collections: {e}")
        raise


def get_qdrant_client() -> QdrantClient:
    """Get Qdrant client instance."""
    if qdrant_client is None:
        raise RuntimeError("Qdrant client not initialized. Call init_qdrant() first.")
    return qdrant_client


def get_embedding_model() -> SentenceTransformer:
    """Get embedding model instance."""
    if embedding_model is None:
        raise RuntimeError("Embedding model not initialized. Call init_qdrant() first.")
    return embedding_model


class VectorStore:
    """Vector store manager for Qdrant operations."""
    
    def __init__(self, collection_name: str = "fusionai_vectors"):
        self.client = get_qdrant_client()
        self.embedding_model = get_embedding_model()
        self.collection_name = collection_name
    
    async def add_documents(
        self, 
        documents: List[Dict[str, Any]], 
        metadatas: Optional[List[Dict[str, Any]]] = None
    ) -> List[str]:
        """Add documents to the vector store."""
        try:
            if not documents:
                return []
            
            # Generate embeddings
            texts = [doc.get("text", "") for doc in documents]
            embeddings = self.embedding_model.encode(texts).tolist()
            
            # Prepare points
            points = []
            for i, (doc, embedding) in enumerate(zip(documents, embeddings)):
                point_id = f"{self.collection_name}_{i}_{hash(doc.get('text', ''))}"
                
                metadata = {
                    "text": doc.get("text", ""),
                    "source": doc.get("source", "unknown"),
                    "timestamp": doc.get("timestamp", ""),
                    **(metadatas[i] if metadatas and i < len(metadatas) else {}),
                }
                
                point = PointStruct(
                    id=point_id,
                    vector=embedding,
                    payload=metadata
                )
                points.append(point)
            
            # Upload points
            self.client.upsert(
                collection_name=self.collection_name,
                points=points
            )
            
            logger.info(f"Added {len(points)} documents to {self.collection_name}")
            return [point.id for point in points]
            
        except Exception as e:
            logger.error(f"Error adding documents: {e}")
            raise
    
    async def search(
        self, 
        query: str, 
        limit: int = 10,
        score_threshold: float = 0.7
    ) -> List[Dict[str, Any]]:
        """Search for similar documents."""
        try:
            # Generate query embedding
            query_embedding = self.embedding_model.encode([query]).tolist()[0]
            
            # Search in Qdrant
            search_results = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_embedding,
                limit=limit,
                score_threshold=score_threshold
            )
            
            # Format results
            results = []
            for result in search_results:
                results.append({
                    "id": result.id,
                    "score": result.score,
                    "text": result.payload.get("text", ""),
                    "metadata": {k: v for k, v in result.payload.items() if k != "text"},
                })
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching documents: {e}")
            raise
    
    async def get_document(self, document_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific document by ID."""
        try:
            result = self.client.retrieve(
                collection_name=self.collection_name,
                ids=[document_id]
            )
            
            if result:
                point = result[0]
                return {
                    "id": point.id,
                    "text": point.payload.get("text", ""),
                    "metadata": {k: v for k, v in point.payload.items() if k != "text"},
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting document {document_id}: {e}")
            return None
    
    async def delete_documents(self, document_ids: List[str]) -> bool:
        """Delete documents by IDs."""
        try:
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=models.PointIdsList(points=document_ids)
            )
            
            logger.info(f"Deleted {len(document_ids)} documents from {self.collection_name}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting documents: {e}")
            return False
    
    async def update_document(
        self, 
        document_id: str, 
        text: str, 
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Update a document."""
        try:
            # Generate new embedding
            embedding = self.embedding_model.encode([text]).tolist()[0]
            
            # Prepare updated payload
            payload = {
                "text": text,
                "timestamp": str(asyncio.get_event_loop().time()),
                **(metadata or {}),
            }
            
            # Update point
            self.client.upsert(
                collection_name=self.collection_name,
                points=[PointStruct(
                    id=document_id,
                    vector=embedding,
                    payload=payload
                )]
            )
            
            logger.info(f"Updated document {document_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating document {document_id}: {e}")
            return False


# Global vector store instances (lazy initialization)
vector_stores = {}

def get_vector_store(store_name: str) -> VectorStore:
    """Get or create a vector store instance"""
    if store_name not in vector_stores:
        vector_stores[store_name] = VectorStore(store_name)
    return vector_stores[store_name]




# Health check
async def check_qdrant_health() -> bool:
    """Check if Qdrant is healthy."""
    try:
        if qdrant_client is None:
            return False
        
        collections = qdrant_client.get_collections()
        return True
    except Exception as e:
        logger.error(f"Qdrant health check failed: {e}")
        return False
