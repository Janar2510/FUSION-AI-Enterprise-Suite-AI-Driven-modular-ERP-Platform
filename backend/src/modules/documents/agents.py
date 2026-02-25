"""
Documents Module AI Agent
Specialized AI agent for document processing, OCR, vision analysis, and classification
"""

import asyncio
import json
import base64
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from dataclasses import dataclass
from enum import Enum

from sqlalchemy.orm import Session
from ..core.agents.base import BaseAgent
from ..core.ai.openai_client import OpenAIClient
from ..core.ai.vector_db import VectorDB
from .models import Document, DocumentType, ProcessingStatus


class AnalysisType(str, Enum):
    """Types of document analysis"""
    OCR = "ocr"
    CLASSIFICATION = "classification"
    METADATA_EXTRACTION = "metadata_extraction"
    BUSINESS_EXTRACTION = "business_extraction"
    VISION_ANALYSIS = "vision_analysis"
    SEMANTIC_SEARCH = "semantic_search"


@dataclass
class DocumentAnalysisResult:
    """Result of document analysis"""
    analysis_type: str
    confidence: float
    result: Dict[str, Any]
    processing_time: float
    model_used: str


class DocumentAgent(BaseAgent):
    """AI Agent specialized for document processing and analysis"""
    
    def __init__(self):
        super().__init__()
        self.agent_name = "DocumentAgent"
        self.capabilities = [
            "document_classification",
            "ocr_processing",
            "metadata_extraction",
            "business_data_extraction",
            "vision_analysis",
            "semantic_search",
            "invoice_processing",
            "contract_analysis",
            "receipt_processing",
            "document_summarization",
            "text_extraction",
            "layout_analysis"
        ]
        
        # Initialize AI clients
        self.openai_client = OpenAIClient()
        self.vector_db = VectorDB()
        
        # Agent configuration
        self.confidence_threshold = 0.7
        self.max_file_size = 10 * 1024 * 1024  # 10MB
        self.supported_formats = [
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/tiff",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain"
        ]
    
    async def process_document(
        self, 
        document: Document, 
        db: Session
    ) -> Document:
        """Main document processing pipeline"""
        
        try:
            # Read document content
            content = await self._get_document_content(document)
            
            # Perform OCR if needed
            if document.document_type in [DocumentType.PDF.value, DocumentType.IMAGE.value]:
                ocr_result = await self._perform_ocr(content, document.mime_type)
                document.ocr_text = ocr_result.get("text", "")
                document.ocr_confidence = ocr_result.get("confidence", 0.0)
                document.ocr_language = ocr_result.get("language", "en")
                document.text_regions = ocr_result.get("text_regions", [])
                document.layout_analysis = ocr_result.get("layout_analysis", {})
            
            # Perform vision analysis for images
            if document.document_type == DocumentType.IMAGE.value:
                vision_result = await self._perform_vision_analysis(content)
                document.vision_analysis = vision_result
                document.detected_objects = vision_result.get("detected_objects", [])
            
            # Extract metadata
            metadata = await self.extract_metadata(document, content)
            document.title = metadata.get("title") or document.title
            document.description = metadata.get("description")
            document.keywords = metadata.get("keywords", [])
            document.categories = metadata.get("categories", [])
            
            # Classify document
            classification = await self.classify_document(document, content)
            document.classification = classification.get("classification")
            document.classification_confidence = classification.get("confidence", 0.0)
            
            # Extract business data
            business_data = await self.extract_business_data(document, content)
            if business_data:
                document.is_invoice = business_data.get("is_invoice", False)
                document.is_contract = business_data.get("is_contract", False)
                document.is_receipt = business_data.get("is_receipt", False)
                document.invoice_number = business_data.get("invoice_number")
                document.invoice_date = business_data.get("invoice_date")
                document.invoice_amount = business_data.get("invoice_amount")
                document.invoice_currency = business_data.get("invoice_currency")
                document.vendor_name = business_data.get("vendor_name")
                document.customer_name = business_data.get("customer_name")
            
            # Generate embedding for semantic search
            embedding = await self.generate_embedding(document)
            if embedding:
                document.embedding_vector = embedding
                document.embedding_model = "text-embedding-ada-002"
                document.embedding_dimension = len(embedding)
            
            return document
            
        except Exception as e:
            raise Exception(f"Document processing failed: {str(e)}")
    
    async def extract_metadata(
        self, 
        document: Document, 
        content: bytes
    ) -> Dict[str, Any]:
        """Extract metadata from document using AI"""
        
        try:
            # Prepare text for analysis
            text_content = ""
            if document.ocr_text:
                text_content = document.ocr_text
            elif document.document_type == DocumentType.TEXT.value:
                text_content = content.decode('utf-8', errors='ignore')
            
            if not text_content:
                return {}
            
            # Create prompt for metadata extraction
            prompt = f"""
            Analyze the following document and extract relevant metadata:
            
            Document Type: {document.document_type}
            Filename: {document.filename}
            Content: {text_content[:2000]}...
            
            Please extract and return the following information in JSON format:
            {{
                "title": "Document title or main heading",
                "description": "Brief description of the document content",
                "keywords": ["keyword1", "keyword2", "keyword3"],
                "categories": ["category1", "category2"],
                "summary": "Brief summary of the document",
                "entities": {{
                    "people": ["person1", "person2"],
                    "organizations": ["org1", "org2"],
                    "locations": ["location1", "location2"],
                    "dates": ["date1", "date2"]
                }},
                "topics": ["topic1", "topic2", "topic3"],
                "language": "detected language code",
                "sentiment": "positive/negative/neutral",
                "confidence": 0.0-1.0
            }}
            """
            
            response = await self.openai_client.generate_completion(
                prompt=prompt,
                model="gpt-4",
                max_tokens=1000,
                temperature=0.3
            )
            
            # Parse JSON response
            try:
                metadata = json.loads(response)
                return metadata
            except json.JSONDecodeError:
                # Fallback to basic extraction
                return {
                    "title": document.filename,
                    "description": f"Document of type {document.document_type}",
                    "keywords": [],
                    "categories": [document.document_type],
                    "confidence": 0.5
                }
                
        except Exception as e:
            print(f"Metadata extraction failed: {str(e)}")
            return {}
    
    async def classify_document(
        self, 
        document: Document, 
        content: bytes
    ) -> Dict[str, Any]:
        """Classify document type using AI"""
        
        try:
            # Prepare text for classification
            text_content = ""
            if document.ocr_text:
                text_content = document.ocr_text
            elif document.document_type == DocumentType.TEXT.value:
                text_content = content.decode('utf-8', errors='ignore')
            
            # Create classification prompt
            prompt = f"""
            Classify the following document into one of these categories:
            - invoice: Bills, invoices, payment requests
            - contract: Legal agreements, contracts, terms
            - receipt: Purchase receipts, payment confirmations
            - report: Business reports, analysis, summaries
            - correspondence: Letters, emails, communications
            - form: Forms, applications, templates
            - presentation: Slides, presentations, proposals
            - spreadsheet: Data tables, calculations, financial data
            - manual: Instructions, guides, documentation
            - other: Any other document type
            
            Document Type: {document.document_type}
            Filename: {document.filename}
            Content: {text_content[:1000]}...
            
            Return JSON format:
            {{
                "classification": "category_name",
                "confidence": 0.0-1.0,
                "reasoning": "Brief explanation of classification",
                "subcategory": "More specific subcategory if applicable",
                "is_business_document": true/false,
                "requires_attention": true/false
            }}
            """
            
            response = await self.openai_client.generate_completion(
                prompt=prompt,
                model="gpt-4",
                max_tokens=500,
                temperature=0.1
            )
            
            try:
                classification = json.loads(response)
                return classification
            except json.JSONDecodeError:
                return {
                    "classification": "other",
                    "confidence": 0.5,
                    "reasoning": "Unable to classify document",
                    "is_business_document": False
                }
                
        except Exception as e:
            print(f"Document classification failed: {str(e)}")
            return {
                "classification": "other",
                "confidence": 0.0,
                "reasoning": f"Classification error: {str(e)}"
            }
    
    async def extract_business_data(
        self, 
        document: Document, 
        content: bytes
    ) -> Optional[Dict[str, Any]]:
        """Extract business-specific data from document"""
        
        try:
            text_content = ""
            if document.ocr_text:
                text_content = document.ocr_text
            elif document.document_type == DocumentType.TEXT.value:
                text_content = content.decode('utf-8', errors='ignore')
            
            if not text_content:
                return None
            
            # Create business data extraction prompt
            prompt = f"""
            Extract business data from the following document:
            
            Content: {text_content[:2000]}...
            
            Look for and extract:
            - Invoice numbers, dates, amounts, currencies
            - Vendor/supplier names and contact information
            - Customer/client names and contact information
            - Payment terms and due dates
            - Tax information
            - Contract terms and conditions
            - Product/service descriptions
            - Quantities and prices
            
            Return JSON format:
            {{
                "is_invoice": true/false,
                "is_contract": true/false,
                "is_receipt": true/false,
                "invoice_number": "invoice number if found",
                "invoice_date": "YYYY-MM-DD format if found",
                "invoice_amount": 0.0,
                "invoice_currency": "currency code if found",
                "vendor_name": "vendor/supplier name",
                "customer_name": "customer/client name",
                "payment_terms": "payment terms if found",
                "due_date": "YYYY-MM-DD format if found",
                "tax_amount": 0.0,
                "tax_rate": 0.0,
                "line_items": [
                    {{
                        "description": "item description",
                        "quantity": 0,
                        "unit_price": 0.0,
                        "total_price": 0.0
                    }}
                ],
                "confidence": 0.0-1.0
            }}
            """
            
            response = await self.openai_client.generate_completion(
                prompt=prompt,
                model="gpt-4",
                max_tokens=1500,
                temperature=0.1
            )
            
            try:
                business_data = json.loads(response)
                return business_data
            except json.JSONDecodeError:
                return None
                
        except Exception as e:
            print(f"Business data extraction failed: {str(e)}")
            return None
    
    async def perform_ocr(
        self, 
        content: bytes, 
        mime_type: str
    ) -> Dict[str, Any]:
        """Perform OCR on document content"""
        
        try:
            # This would integrate with actual OCR services
            # For now, return a mock result
            
            # Convert content to base64 for API calls
            content_b64 = base64.b64encode(content).decode('utf-8')
            
            # Mock OCR processing
            ocr_result = {
                "text": "Mock OCR text extracted from document",
                "confidence": 0.85,
                "language": "en",
                "text_regions": [
                    {
                        "text": "Sample text",
                        "bbox": [100, 200, 300, 250],
                        "confidence": 0.9
                    }
                ],
                "layout_analysis": {
                    "pages": 1,
                    "blocks": [],
                    "paragraphs": [],
                    "lines": [],
                    "words": []
                }
            }
            
            return ocr_result
            
        except Exception as e:
            print(f"OCR processing failed: {str(e)}")
            return {
                "text": "",
                "confidence": 0.0,
                "language": "en",
                "text_regions": [],
                "layout_analysis": {}
            }
    
    async def perform_vision_analysis(
        self, 
        content: bytes
    ) -> Dict[str, Any]:
        """Perform computer vision analysis on image content"""
        
        try:
            # This would integrate with vision AI services
            # For now, return a mock result
            
            vision_result = {
                "detected_objects": ["text", "table", "signature", "logo"],
                "text_regions": [
                    {
                        "text": "Detected text",
                        "bbox": [50, 100, 200, 150],
                        "confidence": 0.9
                    }
                ],
                "layout_analysis": {
                    "document_type": "invoice",
                    "sections": ["header", "items", "totals", "footer"],
                    "tables": [
                        {
                            "bbox": [100, 200, 400, 300],
                            "rows": 5,
                            "columns": 3
                        }
                    ]
                },
                "confidence": 0.88
            }
            
            return vision_result
            
        except Exception as e:
            print(f"Vision analysis failed: {str(e)}")
            return {
                "detected_objects": [],
                "text_regions": [],
                "layout_analysis": {},
                "confidence": 0.0
            }
    
    async def generate_embedding(
        self, 
        document: Document
    ) -> Optional[List[float]]:
        """Generate embedding vector for document"""
        
        try:
            # Prepare text for embedding
            text_parts = []
            
            if document.title:
                text_parts.append(f"Title: {document.title}")
            
            if document.description:
                text_parts.append(f"Description: {document.description}")
            
            if document.ocr_text:
                text_parts.append(f"Content: {document.ocr_text[:1000]}")
            
            if document.keywords:
                text_parts.append(f"Keywords: {', '.join(document.keywords)}")
            
            if not text_parts:
                return None
            
            text = " ".join(text_parts)
            return await self.generate_embedding_for_text(text)
            
        except Exception as e:
            print(f"Embedding generation failed: {str(e)}")
            return None
    
    async def generate_embedding_for_text(
        self, 
        text: str
    ) -> Optional[List[float]]:
        """Generate embedding vector for text"""
        
        try:
            # This would integrate with embedding services
            # For now, return a mock embedding
            
            # Mock embedding (1536 dimensions for text-embedding-ada-002)
            import random
            embedding = [random.uniform(-1, 1) for _ in range(1536)]
            
            return embedding
            
        except Exception as e:
            print(f"Text embedding generation failed: {str(e)}")
            return None
    
    async def search_similar_documents(
        self, 
        query: str, 
        document_ids: List[int],
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Search for similar documents using semantic search"""
        
        try:
            # Generate query embedding
            query_embedding = await self.generate_embedding_for_text(query)
            if not query_embedding:
                return []
            
            # This would use vector database for similarity search
            # For now, return mock results
            
            results = []
            for doc_id in document_ids[:limit]:
                similarity = 0.8  # Mock similarity score
                results.append({
                    "document_id": doc_id,
                    "similarity": similarity,
                    "relevance_score": similarity
                })
            
            return sorted(results, key=lambda x: x["similarity"], reverse=True)
            
        except Exception as e:
            print(f"Similar document search failed: {str(e)}")
            return []
    
    async def summarize_document(
        self, 
        document: Document
    ) -> Dict[str, Any]:
        """Generate document summary"""
        
        try:
            text_content = document.ocr_text or ""
            if not text_content:
                return {"summary": "No text content available for summarization"}
            
            prompt = f"""
            Summarize the following document in 2-3 sentences:
            
            Title: {document.title or document.filename}
            Content: {text_content[:2000]}...
            
            Focus on:
            - Main purpose and content
            - Key information and data
            - Important dates, numbers, or names
            - Action items or next steps if applicable
            
            Return JSON format:
            {{
                "summary": "Brief summary of the document",
                "key_points": ["point1", "point2", "point3"],
                "action_items": ["action1", "action2"],
                "important_dates": ["date1", "date2"],
                "key_numbers": ["number1", "number2"],
                "confidence": 0.0-1.0
            }}
            """
            
            response = await self.openai_client.generate_completion(
                prompt=prompt,
                model="gpt-4",
                max_tokens=500,
                temperature=0.3
            )
            
            try:
                summary = json.loads(response)
                return summary
            except json.JSONDecodeError:
                return {
                    "summary": "Unable to generate summary",
                    "key_points": [],
                    "action_items": [],
                    "confidence": 0.0
                }
                
        except Exception as e:
            print(f"Document summarization failed: {str(e)}")
            return {
                "summary": f"Summarization error: {str(e)}",
                "key_points": [],
                "action_items": [],
                "confidence": 0.0
            }
    
    async def extract_entities(
        self, 
        document: Document
    ) -> Dict[str, List[str]]:
        """Extract named entities from document"""
        
        try:
            text_content = document.ocr_text or ""
            if not text_content:
                return {}
            
            prompt = f"""
            Extract named entities from the following document:
            
            Content: {text_content[:1500]}...
            
            Identify and categorize:
            - People (names, titles)
            - Organizations (companies, institutions)
            - Locations (addresses, cities, countries)
            - Dates (deadlines, events, periods)
            - Numbers (amounts, quantities, percentages)
            - Products/Services (items, offerings)
            - Contact Information (emails, phones, addresses)
            
            Return JSON format:
            {{
                "people": ["person1", "person2"],
                "organizations": ["org1", "org2"],
                "locations": ["location1", "location2"],
                "dates": ["date1", "date2"],
                "numbers": ["number1", "number2"],
                "products": ["product1", "product2"],
                "contacts": ["contact1", "contact2"]
            }}
            """
            
            response = await self.openai_client.generate_completion(
                prompt=prompt,
                model="gpt-4",
                max_tokens=800,
                temperature=0.1
            )
            
            try:
                entities = json.loads(response)
                return entities
            except json.JSONDecodeError:
                return {}
                
        except Exception as e:
            print(f"Entity extraction failed: {str(e)}")
            return {}
    
    async def detect_document_anomalies(
        self, 
        document: Document
    ) -> List[Dict[str, Any]]:
        """Detect anomalies or issues in document"""
        
        try:
            text_content = document.ocr_text or ""
            if not text_content:
                return []
            
            prompt = f"""
            Analyze the following document for potential anomalies or issues:
            
            Document Type: {document.document_type}
            Filename: {document.filename}
            Content: {text_content[:1000]}...
            
            Look for:
            - Missing or incomplete information
            - Inconsistent formatting
            - Potential errors or typos
            - Security concerns
            - Data quality issues
            - Compliance issues
            
            Return JSON format:
            {{
                "anomalies": [
                    {{
                        "type": "missing_information",
                        "severity": "low/medium/high",
                        "description": "Description of the issue",
                        "suggestion": "How to fix it",
                        "confidence": 0.0-1.0
                    }}
                ]
            }}
            """
            
            response = await self.openai_client.generate_completion(
                prompt=prompt,
                model="gpt-4",
                max_tokens=1000,
                temperature=0.2
            )
            
            try:
                result = json.loads(response)
                return result.get("anomalies", [])
            except json.JSONDecodeError:
                return []
                
        except Exception as e:
            print(f"Anomaly detection failed: {str(e)}")
            return []
    
    async def _get_document_content(self, document: Document) -> bytes:
        """Get document content from storage or database"""
        if document.content:
            return document.content
        elif document.storage_url:
            import os
            if os.path.exists(document.storage_url):
                with open(document.storage_url, "rb") as f:
                    return f.read()
        
        raise FileNotFoundError(f"Document content not found for {document.id}")
    
    async def _perform_ocr(self, content: bytes, mime_type: str) -> Dict[str, Any]:
        """Internal OCR processing method"""
        return await self.perform_ocr(content, mime_type)
    
    async def _perform_vision_analysis(self, content: bytes) -> Dict[str, Any]:
        """Internal vision analysis method"""
        return await self.perform_vision_analysis(content)




