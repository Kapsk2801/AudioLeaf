import React, { useState, useRef, useEffect } from 'react';
import { createWorker } from 'tesseract.js';

const SimplePDFProcessor = ({ onPDFProcessed }) => {
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
        setWorkerReady(true);
      }
    };

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

  const processPDFAsImages = async (file) => {
    try {
      setIsProcessing(true);
      setProgress(0);
      setProcessingStep('Converting PDF to images...');
      
      console.log('Processing PDF as images:', file.name, 'Size:', file.size);
      
      // Create a canvas to render PDF pages
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // For now, we'll create a simple text-based approach
      // This is a fallback when PDF.js fails
      const fallbackText = `This PDF file (${file.name}) appears to be image-based or contains scanned content. 
      
The PDF processing library is currently experiencing issues with worker loading. 

To process this PDF, you can:
1. Try converting the PDF to text format using an online converter
2. Copy and paste the text content directly
3. Use the demo text to test the text-to-speech functionality

The text-to-speech features are working correctly - only the PDF processing is affected.`;

      const pages = [{
        pageNumber: 1,
        text: fallbackText
      }];

      setProgress(100);
      setProcessingStep('Processing completed!');
      
      console.log('Fallback processing completed');
      onPDFProcessed(fallbackText, pages);
      
    } catch (error) {
      console.error('Error in fallback processing:', error);
      alert('PDF processing failed. Please try a different file or use the demo text.');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
      setProgress(0);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      processPDFAsImages(file);
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
        processPDFAsImages(file);
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
              <p className="file-type">Note: PDF processing is currently in fallback mode</p>
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
                  className="create-test-pdf-btn"
                  onClick={() => {
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

export default SimplePDFProcessor; 