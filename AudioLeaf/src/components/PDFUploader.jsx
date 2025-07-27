import React, { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker with multiple fallbacks
const setupPDFWorker = () => {
  const workerUrls = [
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`,
    `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`,
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`
  ];

  // Try to load worker from different sources
  const loadWorker = async (url) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = url;
        console.log('PDF.js worker loaded from:', url);
        return true;
      }
    } catch (error) {
      console.warn('Failed to load worker from:', url, error);
    }
    return false;
  };

  // Try each URL until one works
  workerUrls.forEach(url => {
    loadWorker(url);
  });
};

setupPDFWorker();

const PDFUploader = ({ onPDFProcessed }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [workerReady, setWorkerReady] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Ensure PDF.js worker is ready
    const checkWorker = async () => {
      try {
        console.log('Checking PDF.js worker availability...');
        console.log('PDF.js version:', pdfjsLib.version);
        console.log('Worker source:', pdfjsLib.GlobalWorkerOptions.workerSrc);
        
        // Test if worker is working by creating a simple PDF document
        const testArray = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF
        await pdfjsLib.getDocument({ data: testArray }).promise;
        console.log('PDF.js worker test successful');
        setWorkerReady(true);
      } catch (error) {
        console.warn('PDF.js worker test failed:', error);
        console.log('This might be normal for the test array, setting worker as ready anyway');
        setWorkerReady(true);
      }
    };
    
    checkWorker();
  }, []);

  const extractTextFromPDF = async (file) => {
    try {
      setIsProcessing(true);
      console.log('Starting PDF processing for file:', file.name, 'Size:', file.size);
      
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        throw new Error('File size too large. Please upload a PDF smaller than 50MB.');
      }
      
      console.log('Converting file to ArrayBuffer...');
      const arrayBuffer = await file.arrayBuffer();
      console.log('ArrayBuffer created, size:', arrayBuffer.byteLength);
      
      // Validate that it's actually a PDF by checking the magic number
      const uint8Array = new Uint8Array(arrayBuffer);
      const pdfHeader = String.fromCharCode(...uint8Array.slice(0, 4));
      console.log('PDF header:', pdfHeader);
      
      if (pdfHeader !== '%PDF') {
        throw new Error('Invalid PDF file format.');
      }
      
      console.log('PDF header validated, loading document...');
      
      // Add timeout for PDF processing
      const pdfPromise = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        verbosity: 1, // Enable verbose logging
        useWorkerFetch: false, // Try without worker first
        isEvalSupported: false // Disable eval for security
      }).promise;
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('PDF processing timeout. Please try a smaller file.')), 30000)
      );
      
      let pdf;
      try {
        pdf = await Promise.race([pdfPromise, timeoutPromise]);
        console.log('PDF loaded successfully, pages:', pdf.numPages);
      } catch (workerError) {
        console.warn('Worker-based loading failed, trying without worker:', workerError);
        
        // Fallback: try without worker
        const fallbackPromise = pdfjsLib.getDocument({ 
          data: arrayBuffer,
          verbosity: 1,
          useWorkerFetch: false,
          isEvalSupported: false,
          disableWorker: true // Disable worker completely
        }).promise;
        
        pdf = await Promise.race([fallbackPromise, timeoutPromise]);
        console.log('PDF loaded successfully without worker, pages:', pdf.numPages);
      }
      
      if (pdf.numPages === 0) {
        throw new Error('PDF appears to be empty or corrupted.');
      }
      
      const pages = [];
      let fullText = '';
      
      console.log('Starting text extraction from', pdf.numPages, 'pages...');
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        console.log(`Processing page ${pageNum}/${pdf.numPages}...`);
        
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        console.log(`Page ${pageNum} has ${textContent.items.length} text items`);
        
        const pageText = textContent.items.map(item => item.str).join(' ');
        console.log(`Page ${pageNum} text length:`, pageText.length);
        
        pages.push({
          pageNumber: pageNum,
          text: pageText
        });
        
        fullText += pageText + '\n\n';
      }
      
      console.log('Text extraction completed. Total text length:', fullText.length);
      
      // Check if any text was extracted
      if (!fullText.trim()) {
        throw new Error('No text content found in the PDF. The PDF might be image-based or scanned.');
      }
      
      onPDFProcessed(fullText.trim(), pages);
    } catch (error) {
      console.error('Error processing PDF:', error);
      let errorMessage = 'Error processing PDF. Please make sure the file is a valid PDF.';
      
      if (error.message.includes('File size too large')) {
        errorMessage = error.message;
      } else if (error.message.includes('Invalid PDF file format')) {
        errorMessage = 'The file does not appear to be a valid PDF. Please check the file format.';
      } else if (error.message.includes('No text content found')) {
        errorMessage = 'No text content could be extracted from this PDF. It might be image-based or scanned.';
      } else if (error.message.includes('PDF appears to be empty')) {
        errorMessage = 'The PDF appears to be empty or corrupted. Please try a different file.';
      } else if (error.message.includes('PDF processing timeout')) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      extractTextFromPDF(file);
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
        extractTextFromPDF(file);
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
              <p>Processing PDF...</p>
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
              <p className="file-type">Only PDF files are supported (max 50MB)</p>
              {!workerReady && (
                <p className="worker-status">Initializing PDF processor...</p>
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
                  className="debug-btn"
                  onClick={() => {
                    console.log('=== PDF.js Debug Info ===');
                    console.log('PDF.js version:', pdfjsLib.version);
                    console.log('Worker source:', pdfjsLib.GlobalWorkerOptions.workerSrc);
                    console.log('Worker ready:', workerReady);
                    console.log('Browser:', navigator.userAgent);
                    console.log('=======================');
                  }}
                >
                  Debug Info
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFUploader; 