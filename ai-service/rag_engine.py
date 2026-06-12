import os
from dotenv import load_dotenv
load_dotenv()
import faiss
import numpy as np
from typing import List, Dict, Optional
from openai import OpenAI

print("API KEY =", os.getenv("OPENAI_API_KEY"))
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

EMBEDDING_MODEL = "text-embedding-3-small"
CHAT_MODEL = "gpt-4o-mini"

class RAGEngine:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.chunks: List[Dict] = []
        self.index = None
        self.embeddings_matrix = None

    def _get_embedding(self, text: str) -> List[float]:
        """Get OpenAI embedding for a text"""
        response = client.embeddings.create(
            model=EMBEDDING_MODEL,
            input=text.replace("\n", " ")
        )
        return response.data[0].embedding

    def _get_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """Get embeddings for a batch of texts"""
        clean_texts = [t.replace("\n", " ") for t in texts]
        response = client.embeddings.create(
            model=EMBEDDING_MODEL,
            input=clean_texts
        )
        return [item.embedding for item in response.data]

    def build_vector_store(self, chunks: List[Dict]):
        """Build FAISS index from chunks"""
        self.chunks = chunks
        texts = [c["text"] for c in chunks]
        
        print(f"[RAGEngine] Building vector store for {len(texts)} chunks...")
        
        # Batch embed (max 100 at a time)
        all_embeddings = []
        batch_size = 100
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i+batch_size]
            batch_embeddings = self._get_embeddings_batch(batch)
            all_embeddings.extend(batch_embeddings)

        # Build FAISS index
        dim = len(all_embeddings[0])
        self.embeddings_matrix = np.array(all_embeddings, dtype=np.float32)
        
        # Normalize for cosine similarity
        faiss.normalize_L2(self.embeddings_matrix)
        
        self.index = faiss.IndexFlatIP(dim)  # Inner product = cosine after normalization
        self.index.add(self.embeddings_matrix)
        
        print(f"[RAGEngine] Vector store built. {self.index.ntotal} vectors indexed.")

    def _similarity_search(self, query: str, k: int = 5) -> List[Dict]:
        """Find most relevant chunks for a query"""
        query_embedding = np.array([self._get_embedding(query)], dtype=np.float32)
        faiss.normalize_L2(query_embedding)
        
        distances, indices = self.index.search(query_embedding, k)
        
        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx >= 0 and dist > 0.3:  # Relevance threshold
                chunk = self.chunks[idx]
                results.append({
                    **chunk,
                    "score": float(dist)
                })
        
        return results

    def _format_sources(self, relevant_chunks: List[Dict]) -> List[Dict]:
        """Format source references, deduplicating by page"""
        seen = set()
        sources = []
        for chunk in relevant_chunks:
            meta = chunk["metadata"]
            key = (meta["source"], meta["page"])
            if key not in seen:
                seen.add(key)
                sources.append({
                    "file": meta["source"],
                    "page": meta["page"],
                    "paragraph": meta["paragraph"],
                    "total_pages": meta["total_pages"],
                    "excerpt": chunk["text"][:200] + "..." if len(chunk["text"]) > 200 else chunk["text"]
                })
        return sources

    def _build_context(self, relevant_chunks: List[Dict]) -> str:
        """Build context string from relevant chunks"""
        context_parts = []
        for chunk in relevant_chunks:
            meta = chunk["metadata"]
            context_parts.append(
                f"[Source: {meta['source']}, Page {meta['page']}, Paragraph {meta['paragraph']}]\n"
                f"{chunk['text']}"
            )
        return "\n\n---\n\n".join(context_parts)

    def _build_messages(self, question: str, context: str, chat_history: List[Dict]) -> List[Dict]:
        """Build message list with system prompt, history, and current question"""
        system_prompt = """You are an expert document analysis assistant. Your job is to answer questions based ONLY on the provided document context.

Rules:
1. Answer ONLY from the context provided. Do not use external knowledge.
2. If the answer isn't in the context, say: "I couldn't find this information in the uploaded documents."
3. Be concise but thorough. Use bullet points for lists.
4. Remember the conversation history - the user may refer to previous questions or answers.
5. When you reference information, mentally note which page/section it came from (the system will provide sources separately).
6. If the user asks follow-up questions using pronouns (he, she, it, they), resolve them from conversation history.

Always be helpful, accurate, and grounded in the document content."""

        messages = [{"role": "system", "content": system_prompt}]
        
        # Add conversation history (last 10 turns for memory)
        for turn in chat_history[-10:]:
            messages.append({
                "role": turn.get("role", "user"),
                "content": turn.get("content", "")
            })

        # Add current question with context
        user_message = f"""Context from uploaded documents:
{context}

---

Question: {question}

Please answer based on the context above. If referring to previous conversation, you may use that context too."""
        
        messages.append({"role": "user", "content": user_message})
        return messages

    def ask(self, question: str, chat_history: List[Dict] = []) -> Dict:
        """Answer a question using RAG"""
        if not self.index:
            raise ValueError("Vector store not built. Process PDFs first.")

        # Find relevant chunks
        relevant_chunks = self._similarity_search(question, k=5)
        
        if not relevant_chunks:
            # Try broader search
            relevant_chunks = self._similarity_search(question, k=3)

        context = self._build_context(relevant_chunks) if relevant_chunks else "No relevant content found."
        messages = self._build_messages(question, context, chat_history)

        # Call GPT-4o Mini
        response = client.chat.completions.create(
            model=CHAT_MODEL,
            messages=messages,
            temperature=0.2,
            max_tokens=1500,
        )

        answer = response.choices[0].message.content
        sources = self._format_sources(relevant_chunks)

        return {
            "answer": answer,
            "sources": sources,
            "tokens_used": response.usage.total_tokens
        }
