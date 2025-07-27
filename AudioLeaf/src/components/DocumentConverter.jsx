import React, { useState } from 'react';
import './DocumentConverter.css';
import conversionService from '../services/conversionService';

const DocumentConverter = () => {
  const [conversionType, setConversionType] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [error, setError] = useState(null);

  // API key for real conversion (optional - demo uses mock service)
  const API_KEY = null; // Add your API key here for real conversion

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setDownloadUrl(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setDownloadUrl(null);
    }
  };

  const validateFile = (file, targetType) => {
    if (!file) {
      throw new Error('No file selected');
    }
    
    // Additional validation for Word documents
    if (targetType === 'wordToPdf') {
      const fileName = file.name.toLowerCase();
      
      // Check for potentially problematic file names
      if (fileName.includes('(') && fileName.includes(')')) {
        console.warn('File name contains parentheses - this might indicate a corrupted file');
      }
      
      // Check file size
      if (file.size === 0) {
        throw new Error('File appears to be empty. Please select a valid file.');
      }
      
      if (file.size < 100) { // Very small files might be corrupted
        throw new Error('File appears to be too small or corrupted. Please select a valid Word document.');
      }
    }
    
    try {
      conversionService.validateFile(file, targetType);
    } catch (error) {
      throw new Error(`File validation failed: ${error.message}`);
    }
  };

  const convertDocument = async (targetType) => {
    if (!selectedFile) {
      setError('Please select a file first.');
      return;
    }

    try {
      validateFile(selectedFile, targetType);
      
      setIsConverting(true);
      setConversionProgress(0);
      setError(null);
      setDownloadUrl(null);

      // Retry mechanism for better reliability
      let retries = 0;
      const maxRetries = 2;
      let result;

      while (retries <= maxRetries) {
        try {
          // Use the conversion service
          result = await conversionService.convertDocument(
            selectedFile, 
            targetType, 
            (progress) => setConversionProgress(progress),
            API_KEY
          );

          if (!result || !result.url) {
            throw new Error('Conversion failed: No result received');
          }

          break; // Success, exit retry loop
        } catch (err) {
          retries++;
          if (retries > maxRetries) {
            throw err; // Re-throw if max retries exceeded
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        }
      }

      setDownloadUrl({
        url: result.url,
        fileName: result.fileName,
        fileSize: result.fileSize
      });

    } catch (err) {
      console.error('Conversion error:', err);
      
      // Handle specific error types
      let errorMessage = err.message || 'Conversion failed. Please try again.';
      
      if (err.message.includes('corrupted') || err.message.includes('unreadable')) {
        errorMessage = 'The document appears to be corrupted or contains unreadable content. Please try opening it in Microsoft Word first and save it as a new file, then try converting again.';
      } else if (err.message.includes('timeout')) {
        errorMessage = 'Conversion timed out. Please try with a smaller file or check your internet connection.';
      } else if (err.message.includes('size')) {
        errorMessage = 'File is too large. Please select a file smaller than 50MB.';
      }
      
      setError(errorMessage);
    } finally {
      setIsConverting(false);
      setConversionProgress(0);
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      const link = document.createElement('a');
      link.href = downloadUrl.url;
      link.download = downloadUrl.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL after download
      setTimeout(() => {
        conversionService.revokeObjectURL(downloadUrl.url);
      }, 1000);
    }
  };

  const resetConversion = () => {
    // Clean up any existing download URL
    if (downloadUrl) {
      conversionService.revokeObjectURL(downloadUrl.url);
    }
    
    setSelectedFile(null);
    setConversionType(null);
    setError(null);
    setDownloadUrl(null);
    setConversionProgress(0);
  };

  return (
    <div className="document-converter">
      <div className="converter-header">
        <h2>📄 Document Converter</h2>
        <p>Convert between PDF and Word documents seamlessly</p>
      </div>

      <div className="conversion-options">
        <div className="conversion-card">
          <div className="conversion-icon">📄→📝</div>
          <h3>PDF to Word</h3>
          <p>Convert PDF documents to editable Word format</p>
          <button 
            className={`conversion-btn ${conversionType === 'pdfToWord' ? 'active' : ''}`}
            onClick={() => setConversionType('pdfToWord')}
          >
            Select PDF to Convert
          </button>
        </div>

        <div className="conversion-card">
          <div className="conversion-icon">📝→📄</div>
          <h3>Word to PDF</h3>
          <p>Convert Word documents to PDF format</p>
          <button 
            className={`conversion-btn ${conversionType === 'wordToPdf' ? 'active' : ''}`}
            onClick={() => setConversionType('wordToPdf')}
          >
            Select Word to Convert
          </button>
        </div>
      </div>

      {conversionType && (
        <div className="file-upload-section">
          <div className="upload-area">
            <div 
              className="upload-zone"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="upload-icon">📁</div>
              <h3>Drop your file here or click to browse</h3>
              <p>
                {conversionType === 'pdfToWord' 
                  ? 'Supported: PDF files (.pdf)' 
                  : 'Supported: Word files (.docx, .doc)'
                }
              </p>
              <input
                type="file"
                accept={conversionType === 'pdfToWord' ? '.pdf' : '.docx,.doc'}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                id="file-input"
              />
              <label htmlFor="file-input" className="browse-btn">
                Browse Files
              </label>
            </div>

            {selectedFile && (
              <div className="selected-file">
                <div className="file-info">
                  <span className="file-icon">📄</span>
                  <div className="file-details">
                    <h4>{selectedFile.name}</h4>
                    <p>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    {conversionType === 'wordToPdf' && selectedFile.name.includes('(') && selectedFile.name.includes(')') && (
                      <div className="file-warning">
                        <span className="warning-icon">⚠️</span>
                        <span>This file might be corrupted. Consider opening it in Word first.</span>
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  className="convert-btn"
                  onClick={() => convertDocument(conversionType)}
                  disabled={isConverting}
                >
                  {isConverting ? (
                    <>
                      <span className="loading-spinner"></span>
                      Converting...
                    </>
                  ) : (
                    'Convert Now'
                  )}
                </button>
              </div>
            )}
          </div>

          {isConverting && (
            <div className="conversion-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${conversionProgress}%` }}
                ></div>
              </div>
              <p>Converting your document... {conversionProgress}%</p>
            </div>
          )}

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <p>{error}</p>
              <div className="error-suggestions">
                <p><strong>Suggestions:</strong></p>
                <ul>
                  <li>Make sure the file is not corrupted or password-protected</li>
                  <li>Try with a smaller file (under 50MB)</li>
                  <li>Check that the file format is supported</li>
                  <li>For Word documents: Open in Microsoft Word and save as a new file</li>
                  <li>For corrupted files: Try repairing the document first</li>
                  <li>Refresh the page and try again</li>
                </ul>
              </div>
            </div>
          )}

          {downloadUrl && (
            <div className="download-section">
              <div className="success-message">
                <span className="success-icon">✅</span>
                <h3>Conversion Complete!</h3>
                <p>Your document has been successfully converted.</p>
              </div>
              <button className="download-btn" onClick={handleDownload}>
                📥 Download {downloadUrl.fileName}
              </button>
              <button className="reset-btn" onClick={resetConversion}>
                Convert Another File
              </button>
            </div>
          )}
        </div>
      )}

      <div className="privacy-notice">
        <h4>🔒 Privacy & Security</h4>
        <p>
          Your files are processed securely and are not stored permanently. 
          For production use, consider using a self-hosted conversion service 
          for enhanced privacy and control.
        </p>
      </div>
    </div>
  );
};

export default DocumentConverter; 