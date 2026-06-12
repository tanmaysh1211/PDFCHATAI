from pypdf import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from typing import List, Dict

class PDFProcessor:
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", ".", "!", "?", ",", " "],
            length_function=len,
        )

    def extract_text_from_pdf(self, pdf_path: str, file_name: str) -> List[Dict]:
        """Extract text page by page, tracking metadata"""
        pages_data = []
        
        try:
            reader = PdfReader(pdf_path)
            for page_num, page in enumerate(reader.pages, start=1):
                text = page.extract_text()
                if text and text.strip():
                    pages_data.append({
                        "text": text.strip(),
                        "page": page_num,
                        "source": file_name,
                        "total_pages": len(reader.pages)
                    })
        except Exception as e:
            print(f"Error reading {file_name}: {e}")
        
        return pages_data

    def process_pdfs(self, pdf_files: List[Dict]) -> List[Dict]:
        """Process multiple PDFs into chunks with metadata"""
        all_chunks = []

        for pdf_file in pdf_files:
            pages = self.extract_text_from_pdf(pdf_file["path"], pdf_file["name"])
            
            for page_data in pages:
                # Split page text into chunks
                raw_chunks = self.splitter.split_text(page_data["text"])
                
                for chunk_idx, chunk_text in enumerate(raw_chunks):
                    # Estimate paragraph number within page
                    para_num = chunk_idx + 1
                    
                    all_chunks.append({
                        "text": chunk_text,
                        "metadata": {
                            "source": page_data["source"],
                            "page": page_data["page"],
                            "paragraph": para_num,
                            "total_pages": page_data["total_pages"],
                            "chunk_index": len(all_chunks),
                        }
                    })

        return all_chunks
