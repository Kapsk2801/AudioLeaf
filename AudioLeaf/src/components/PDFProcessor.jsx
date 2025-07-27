import React, { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';

// Set up PDF.js worker with proper fallback
const setupPDFWorker = () => {
  try {
    // Use jsDelivr CDN which is more reliable
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
    console.log('PDF.js worker set to jsDelivr CDN');
  } catch (error) {
    console.warn('Failed to setup PDF.js worker:', error);
  }
};

setupPDFWorker();

const PDFProcessor = ({ onPDFProcessed }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [workerReady, setWorkerReady] = useState(false);
  const fileInputRef = useRef(null);
  const tesseractWorkerRef = useRef(null);

  useEffect(() => {
    // Initialize Tesseract worker
    const initTesseract = async () => {
      try {
        console.log('Initializing Tesseract OCR...');
        setWorkerReady(false);
        
        // Create worker with better error handling
        tesseractWorkerRef.current = await createWorker('eng', 1, {
          logger: m => {
            console.log('Tesseract log:', m);
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
        console.error('Failed to initialize Tesseract:', error);
        // Set as ready anyway - we'll handle OCR failures gracefully
        setWorkerReady(true);
      }
    };

    // Delay initialization to ensure page is fully loaded
    const timer = setTimeout(() => {
      initTesseract();
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
    
    // Check if Tesseract is available
    if (!tesseractWorkerRef.current) {
      console.warn('Tesseract not available, providing fallback message');
      for (let i = 0; i < images.length; i++) {
        extractedTexts.push('OCR processing not available. This appears to be an image-based PDF. Please try a text-based PDF or contact support.');
      }
      return extractedTexts;
    }
    
    for (let i = 0; i < images.length; i++) {
      setProcessingStep(`Processing image ${i + 1} of ${images.length} with OCR...`);
      setProgress(0);
      
      try {
        // Add timeout for OCR processing (2 minutes per image)
        const ocrPromise = tesseractWorkerRef.current.recognize(images[i]);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('OCR processing timeout')), 120000)
        );
        
        const result = await Promise.race([ocrPromise, timeoutPromise]);
        extractedTexts.push(result.data.text);
        console.log(`OCR completed for image ${i + 1}:`, result.data.text.length, 'characters');
      } catch (error) {
        console.error(`OCR failed for image ${i + 1}:`, error);
        if (error.message.includes('OCR processing timeout')) {
          extractedTexts.push('OCR processing timed out for this page.');
        } else {
          extractedTexts.push('OCR processing failed for this page.');
        }
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
      
      // Load PDF with better error handling
      let pdf;
      try {
        pdf = await pdfjsLib.getDocument({ 
          data: arrayBuffer,
          verbosity: 1
        }).promise;
      } catch (pdfError) {
        console.error('PDF loading failed:', pdfError);
        throw new Error(`Failed to load PDF: ${pdfError.message}`);
      }
      
      console.log('PDF loaded, pages:', pdf.numPages);
      
      const pages = [];
      let fullText = '';
      
      // Try text extraction first
      let hasTextContent = false;
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        setProcessingStep(`Extracting text from page ${pageNum}...`);
        setProgress((pageNum / pdf.numPages) * 50); // First 50% for text extraction
        
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
          // No text content, will need OCR
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
          setProgress(50 + (pageNum / pdf.numPages) * 25); // 50-75% for rendering
          
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
        // If no text was extracted, provide a helpful message
        const fallbackText = 'This PDF appears to be image-based or contains no extractable text. The OCR processing will attempt to extract text from the images.';
        fullText = fallbackText;
        pages.forEach(page => {
          if (!page.text.trim()) {
            page.text = 'Image content - OCR processing required.';
          }
        });
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
        errorMessage = 'No text content could be extracted from this PDF. Please try a different file.';
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
              {!workerReady && (
                <p className="worker-status">Initializing OCR processor...</p>
              )}
                             <div className="demo-section">
                 <p className="demo-text">Don't have a PDF? Try the demo text below:</p>
                 <button 
                   className="demo-btn"
                   onClick={() => {
                     const demoText = "Welcome to AudioLeaf! This is a demonstration of the text-to-speech functionality. You can upload your own PDF files to have them read aloud. The application supports multiple voices and adjustable speech rates. Enjoy listening to your documents!";
                     const demoPages = [{
                       pageNumber: 1,
                       text: demoText
                     }];
                     onPDFProcessed(demoText, demoPages);
                   }}
                 >
                   Load Demo Text
                 </button>
                 <button 
                   className="test-btn"
                   onClick={() => {
                     console.log('=== System Test ===');
                     console.log('PDF.js version:', pdfjsLib.version);
                     console.log('Tesseract available:', !!tesseractWorkerRef.current);
                     console.log('Worker ready:', workerReady);
                     console.log('Browser:', navigator.userAgent);
                     
                     // Test PDF.js
                     const testArray = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF
                     pdfjsLib.getDocument({ 
                       data: testArray,
                       verbosity: 1
                     }).promise
                       .then(() => console.log('PDF.js test: SUCCESS'))
                       .catch(err => console.log('PDF.js test: FAILED', err));
                     
                     console.log('==================');
                   }}
                 >
                   Test System
                 </button>
                 <button 
                   className="create-test-pdf-btn"
                   onClick={() => {
                     // Create a simple test PDF-like structure
                     const testText = "This is a test PDF content. It contains sample text that can be read aloud. This demonstrates that the text-to-speech functionality is working correctly. You can now try uploading your actual PDF file.";
                     const testPages = [{
                       pageNumber: 1,
                       text: testText
                     }];
                     onPDFProcessed(testText, testPages);
                   }}
                 >
                   Create Test PDF
                 </button>
               </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFProcessor; 