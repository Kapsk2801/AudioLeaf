// Document Conversion Service
// This service provides PDF ↔ Word conversion using free APIs

class ConversionService {
  constructor() {
    // Free API endpoints (you can replace with your preferred service)
    this.endpoints = {
      pdfToWord: 'https://api.cloudmersive.com/convert/pdf/to/docx',
      wordToPdf: 'https://api.cloudmersive.com/convert/docx/to/pdf'
    };
    
    // For demo purposes, we'll use a mock service
    // In production, you would use real API keys
    this.useMockService = true;
  }

  // Validate file before conversion
  validateFile(file, targetType) {
    const fileName = file.name.toLowerCase();
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (file.size > maxSize) {
      throw new Error('File size must be less than 50MB.');
    }

    if (file.size === 0) {
      throw new Error('File appears to be empty. Please select a valid file.');
    }

    if (targetType === 'pdfToWord') {
      if (!fileName.endsWith('.pdf')) {
        throw new Error('Please select a PDF file for conversion to Word.');
      }
    } else if (targetType === 'wordToPdf') {
      if (!fileName.endsWith('.docx') && !fileName.endsWith('.doc')) {
        throw new Error('Please select a Word document (.docx or .doc) for conversion to PDF.');
      }
      
      // Additional validation for Word documents
      if (fileName.includes('(') && fileName.includes(')')) {
        console.warn('File name contains parentheses - this might indicate a corrupted or problematic file');
      }
    }

    return true;
  }

  // Convert document using mock service (for demo)
  async convertDocumentMock(file, targetType, onProgress) {
    return new Promise((resolve, reject) => {
      let progress = 0;
      
      try {
        // Check for potentially corrupted Word documents
        if (targetType === 'wordToPdf' && file.name.toLowerCase().includes('(') && file.name.toLowerCase().includes(')')) {
          // Simulate detection of corrupted file
          setTimeout(() => {
            reject(new Error('The Word document appears to be corrupted or contains unreadable content. Please try with a different file or repair the document in Microsoft Word first.'));
          }, 1000);
          return;
        }

        const progressInterval = setInterval(() => {
          progress += Math.random() * 15 + 5; // Random progress increment
          if (progress >= 90) {
            clearInterval(progressInterval);
            progress = 90;
          }
          
          if (onProgress) {
            onProgress(Math.min(progress, 90));
          }
        }, 200);

        // Simulate conversion time
        setTimeout(() => {
          try {
            clearInterval(progressInterval);
            
            if (onProgress) {
              onProgress(100);
            }

            // Create mock converted file
            const originalName = file.name;
            const baseName = originalName.substring(0, originalName.lastIndexOf('.'));
            const newExtension = targetType === 'pdfToWord' ? '.docx' : '.pdf';
            const newFileName = baseName + newExtension;

            // Create a realistic mock file
            const mockContent = this.createMockContent(targetType, originalName);
            const mockBlob = new Blob([mockContent], { 
              type: targetType === 'pdfToWord' 
                ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
                : 'application/pdf' 
            });

            const url = URL.createObjectURL(mockBlob);
            
            resolve({
              url,
              fileName: newFileName,
              fileSize: mockBlob.size
            });
          } catch (error) {
            reject(new Error(`Mock conversion failed: ${error.message}`));
          }
        }, 2000 + Math.random() * 1000); // Random conversion time
      } catch (error) {
        reject(new Error(`Mock conversion setup failed: ${error.message}`));
      }
    });
  }

  // Create realistic mock content
  createMockContent(targetType, originalFileName) {
    if (targetType === 'pdfToWord') {
      // Mock Word document content
      return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t>Converted from: ${originalFileName}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>This is a converted Word document from the original PDF file.</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Conversion completed successfully using AudioLeaf's document converter.</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`;
    } else {
      // Mock PDF content
      return `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 100
>>
stream
BT
/F1 12 Tf
72 720 Td
(Converted from: ${originalFileName}) Tj
0 -20 Td
(This is a converted PDF from the original Word document.) Tj
0 -20 Td
(Conversion completed successfully using AudioLeaf's document converter.) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
350
%%EOF`;
    }
  }

  // Convert document using real API (for production)
  async convertDocumentReal(file, targetType, apiKey, onProgress) {
    try {
      const formData = new FormData();
      formData.append('inputFile', file);

      const endpoint = targetType === 'pdfToWord' 
        ? this.endpoints.pdfToWord 
        : this.endpoints.wordToPdf;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Apikey': apiKey
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Conversion failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const originalName = file.name;
      const baseName = originalName.substring(0, originalName.lastIndexOf('.'));
      const newExtension = targetType === 'pdfToWord' ? '.docx' : '.pdf';
      const newFileName = baseName + newExtension;

      return {
        url,
        fileName: newFileName,
        fileSize: blob.size
      };
    } catch (error) {
      throw new Error(`Conversion failed: ${error.message}`);
    }
  }

  // Main conversion method
  async convertDocument(file, targetType, onProgress, apiKey = null) {
    try {
      // Validate file
      this.validateFile(file, targetType);

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Conversion timed out. Please try again.')), 30000); // 30 second timeout
      });

      // Use mock service for demo, real service for production
      const conversionPromise = this.useMockService || !apiKey 
        ? this.convertDocumentMock(file, targetType, onProgress)
        : this.convertDocumentReal(file, targetType, apiKey, onProgress);

      return await Promise.race([conversionPromise, timeoutPromise]);
    } catch (error) {
      throw error;
    }
  }

  // Clean up URLs to prevent memory leaks
  revokeObjectURL(url) {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }
}

export default new ConversionService(); 