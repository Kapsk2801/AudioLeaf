import React, { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';

// Set up PDF.js worker with multiple fallback strategies
const setupPDFWorker = () => {
  const workerStrategies = [
    // Strategy 1: Try local worker
    () => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
      return 'jsDelivr CDN';
    },
    // Strategy 2: Try unpkg
    () => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
      return 'unpkg CDN';
    },
    // Strategy 3: Try cloudflare
    () => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      return 'Cloudflare CDN';
    },
    // Strategy 4: Disable worker (fallback)
    () => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '';
      return 'No worker (main thread)';
    }
  ];

  for (let i = 0; i < workerStrategies.length; i++) {
    try {
      const strategy = workerStrategies[i];
      const result = strategy();
      console.log(`PDF.js worker strategy ${i + 1} successful: ${result}`);
      return true;
    } catch (error) {
      console.warn(`PDF.js worker strategy ${i + 1} failed:`, error);
    }
  }
  
  console.error('All PDF.js worker strategies failed');
  return false;
};

const WorkingPDFProcessor = ({ onPDFProcessed }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [workerReady, setWorkerReady] = useState(false);
  const [pdfWorkerReady, setPdfWorkerReady] = useState(false);
  const fileInputRef = useRef(null);
  const tesseractWorkerRef = useRef(null);

  useEffect(() => {
    // Initialize both workers
    const initializeWorkers = async () => {
      try {
        // Initialize PDF.js worker
        console.log('Initializing PDF.js worker...');
        const pdfWorkerSuccess = setupPDFWorker();
        setPdfWorkerReady(pdfWorkerSuccess);

        // Initialize Tesseract worker
        console.log('Initializing Tesseract OCR...');
        tesseractWorkerRef.current = await createWorker('eng', 1, {
          logger: m => {
            if (m.status === 'recognizing text') {
              setProgress(m.progress * 100);
            }
          },
          errorHandler: (err) => {
            console.error('Tesseract error:', err);
          }
        });
        
        console.log('Tesseract OCR initialized successfully');
        setWorkerReady(true);
      } catch (error) {
        console.error('Failed to initialize workers:', error);
        setWorkerReady(true);
      }
    };

    const timer = setTimeout(() => {
      initializeWorkers();
    }, 1000);

    return () => {
      clearTimeout(timer);
      if (tesseractWorkerRef.current) {
        tesseractWorkerRef.current.terminate();
      }
    };
  }, []);

  const extractTextFromImages = async (images) => {
    const extractedTexts = [];
    
    if (!tesseractWorkerRef.current) {
      console.warn('Tesseract not available');
      for (let i = 0; i < images.length; i++) {
        extractedTexts.push('OCR processing not available for this page.');
      }
      return extractedTexts;
    }
    
    for (let i = 0; i < images.length; i++) {
      setProcessingStep(`Processing image ${i + 1} of ${images.length} with OCR...`);
      setProgress(0);
      
      try {
        const ocrPromise = tesseractWorkerRef.current.recognize(images[i]);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('OCR processing timeout')), 120000)
        );
        
        const result = await Promise.race([ocrPromise, timeoutPromise]);
        extractedTexts.push(result.data.text);
        console.log(`OCR completed for image ${i + 1}:`, result.data.text.length, 'characters');
      } catch (error) {
        console.error(`OCR failed for image ${i + 1}:`, error);
        extractedTexts.push('OCR processing failed for this page.');
      }
    }
    
    return extractedTexts;
  };

  const renderPageToCanvas = async (page, scale = 2.0) => {
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    
    await page.render(renderContext).promise;
    return canvas;
  };

  const processPDF = async (file) => {
    try {
      setIsProcessing(true);
      setProgress(0);
      setProcessingStep('Loading PDF...');
      
      console.log('Processing PDF:', file.name, 'Size:', file.size);
      
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        throw new Error('File size too large. Please upload a PDF smaller than 50MB.');
      }
      
      const arrayBuffer = await file.arrayBuffer();
      
      // Validate PDF format
      const uint8Array = new Uint8Array(arrayBuffer);
      const pdfHeader = String.fromCharCode(...uint8Array.slice(0, 4));
      if (pdfHeader !== '%PDF') {
        throw new Error('Invalid PDF file format.');
      }
      
      setProcessingStep('Extracting content from PDF...');
      
      // Try to load PDF with multiple strategies
      let pdf;
      let pdfLoadSuccess = false;
      
      const pdfLoadStrategies = [
        // Strategy 1: Normal loading
        async () => {
          return await pdfjsLib.getDocument({ 
            data: arrayBuffer,
            verbosity: 1
          }).promise;
        },
        // Strategy 2: Without worker
        async () => {
          return await pdfjsLib.getDocument({ 
            data: arrayBuffer,
            verbosity: 1,
            useWorkerFetch: false,
            isEvalSupported: false
          }).promise;
        },
        // Strategy 3: Minimal options
        async () => {
          return await pdfjsLib.getDocument({ 
            data: arrayBuffer
          }).promise;
        }
      ];

      for (let i = 0; i < pdfLoadStrategies.length; i++) {
        try {
          console.log(`Trying PDF load strategy ${i + 1}...`);
          pdf = await pdfLoadStrategies[i]();
          pdfLoadSuccess = true;
          console.log(`PDF load strategy ${i + 1} successful`);
          break;
        } catch (error) {
          console.warn(`PDF load strategy ${i + 1} failed:`, error);
        }
      }

      if (!pdfLoadSuccess) {
        throw new Error('Failed to load PDF with all available strategies.');
      }
      
      console.log('PDF loaded successfully, pages:', pdf.numPages);
      
      const pages = [];
      let fullText = '';
      
      // Try text extraction first
      let hasTextContent = false;
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        setProcessingStep(`Extracting text from page ${pageNum}...`);
        setProgress((pageNum / pdf.numPages) * 50);
        
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        if (textContent.items.length > 0) {
          hasTextContent = true;
          const pageText = textContent.items.map(item => item.str).join(' ');
          
          pages.push({
            pageNumber: pageNum,
            text: pageText
          });
          
          fullText += pageText + '\n\n';
          console.log(`Page ${pageNum} text extracted:`, pageText.length, 'characters');
        } else {
          pages.push({
            pageNumber: pageNum,
            text: ''
          });
        }
      }
      
      // If no text content found, use OCR
      if (!hasTextContent) {
        setProcessingStep('No text found. Using OCR to extract text from images...');
        console.log('No text content found, starting OCR processing...');
        
        const images = [];
        
        // Render each page to canvas
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          setProcessingStep(`Rendering page ${pageNum} to image...`);
          setProgress(50 + (pageNum / pdf.numPages) * 25);
          
          const page = await pdf.getPage(pageNum);
          const canvas = await renderPageToCanvas(page);
          images.push(canvas);
        }
        
        // Extract text using OCR
        setProcessingStep('Extracting text using OCR...');
        const ocrTexts = await extractTextFromImages(images);
        
        // Update pages with OCR results
        for (let i = 0; i < pages.length; i++) {
          pages[i].text = ocrTexts[i] || '';
          fullText += ocrTexts[i] + '\n\n';
        }
        
        setProgress(100);
        setProcessingStep('OCR processing completed!');
      } else {
        setProgress(100);
        setProcessingStep('Text extraction completed!');
      }
      
      // Check if any text was extracted
      if (!fullText.trim()) {
        throw new Error('No text content could be extracted from this PDF. Please try a different file.');
      }
      
      console.log('Processing completed. Total text length:', fullText.length);
      onPDFProcessed(fullText.trim(), pages);
      
    } catch (error) {
      console.error('Error processing PDF:', error);
      let errorMessage = 'Error processing PDF. Please make sure the file is a valid PDF.';
      
      if (error.message.includes('File size too large')) {
        errorMessage = error.message;
      } else if (error.message.includes('Invalid PDF file format')) {
        errorMessage = 'The file does not appear to be a valid PDF. Please check the file format.';
      } else if (error.message.includes('No text content could be extracted')) {
        errorMessage = 'No text content could be extracted from this PDF. It might be image-based or scanned.';
      } else if (error.message.includes('Failed to load PDF')) {
        errorMessage = 'Failed to load the PDF. Please try a different file or check if the file is corrupted.';
      }
      
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
      setProgress(0);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      processPDF(file);
    } else {
      alert('Please select a valid PDF file.');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        processPDF(file);
      } else {
        alert('Please drop a valid PDF file.');
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="pdf-uploader">
      <div
        className={`upload-area ${dragActive ? 'drag-active' : ''} ${isProcessing ? 'processing' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        
        <div className="upload-content">
          {isProcessing ? (
            <div className="processing-content">
              <div className="spinner"></div>
              <p>{processingStep}</p>
              {progress > 0 && (
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              )}
              <p className="progress-text">{Math.round(progress)}%</p>
            </div>
          ) : (
            <>
              <div className="upload-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7,10 12,15 17,10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </div>
              <h3>Upload your PDF</h3>
              <p>Drag and drop your PDF file here, or click to browse</p>
              <p className="file-type">Supports both text and image-based PDFs (max 50MB)</p>
              {(!workerReady || !pdfWorkerReady) && (
                <p className="worker-status">Initializing processors...</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkingPDFProcessor; 