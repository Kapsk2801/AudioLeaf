import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import UniversalPDFProcessor from './components/UniversalPDFProcessor';
import AudioControls from './components/AudioControls';
import TextDisplay from './components/TextDisplay';
import DocumentConverter from './components/DocumentConverter';

function App() {
  const [page, setPage] = useState('main');
  const [pdfText, setPdfText] = useState('');
  const [isReading, setIsReading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pages, setPages] = useState([]);
  const [currentText, setCurrentText] = useState('');
  const [speechRate, setSpeechRate] = useState(0.9); // Slightly slower for more natural speech
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [availableVoices, setAvailableVoices] = useState([]);
  
  const speechRef = useRef(null);

  useEffect(() => {
    // Set document title
    document.title = 'AudioLeaf - Transform PDFs to Speech';
    
    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      speechRef.current = window.speechSynthesis;
      
      // Load available voices
      const loadVoices = () => {
        const voices = speechRef.current.getVoices();
        
        // Filter to only Hindi voices (most are female by default)
        const filteredVoices = voices.filter(voice => {
          const lang = voice.lang.toLowerCase();
          const name = voice.name.toLowerCase();
          
          // Only Hindi voices
          return lang.startsWith('hi') || 
                 lang.includes('hindi') ||
                 name.includes('hindi') || 
                 name.includes('india') ||
                 name.includes('google हिंदी') ||
                 name.includes('microsoft hindi') ||
                 name.includes('हिंदी');
        });
        
        // Limit to 5 voices maximum
        const limitedVoices = filteredVoices.slice(0, 5);
        setAvailableVoices(limitedVoices);
        
        // Select the first available voice
        if (limitedVoices.length > 0) {
          setSelectedVoice(limitedVoices[0]);
        }
      };

      loadVoices();
      speechRef.current.onvoiceschanged = loadVoices;
    }
  }, []);

  const handlePDFProcessed = (data) => {
    // Handle both old format (text, pageData) and new format (object)
    let text, pageData;
    
    if (typeof data === 'object' && data !== null) {
      // New format: { text, pages, totalPages }
      text = data.text || '';
      pageData = data.pages || [];
    } else {
      // Old format: (text, pageData)
      text = arguments[0] || '';
      pageData = arguments[1] || [];
    }
    
    setPdfText(text);
    setPages(pageData);
    setTotalPages(pageData.length);
    setCurrentPage(1);
    setCurrentText(pageData[0]?.text || text);
    
    // Auto-select Hindi voice
    if (text.trim() && availableVoices.length > 0) {
      // Always select the first available Hindi voice
      setSelectedVoice(availableVoices[0]);
    }
  };

  const handlePlay = () => {
    if (!speechRef.current || !currentText) return;

    // Stop any current speech
    speechRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(currentText);
    utterance.voice = selectedVoice;
    utterance.rate = speechRate;
    utterance.pitch = 1.0; // Natural pitch
    utterance.volume = 1.0; // Full volume
    
    // Improve speech quality settings
    utterance.onstart = () => setIsReading(true);
    utterance.onend = () => setIsReading(false);
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsReading(false);
    };
    utterance.onpause = () => setIsReading(false);
    utterance.onresume = () => setIsReading(true);

    // Use better speech synthesis settings
    speechRef.current.speak(utterance);
  };

  const handlePause = () => {
    if (speechRef.current) {
      speechRef.current.pause();
      setIsReading(false);
    }
  };

  const handleResume = () => {
    if (speechRef.current) {
      speechRef.current.resume();
      setIsReading(true);
    }
  };

  const handleStop = () => {
    if (speechRef.current) {
      speechRef.current.cancel();
      setIsReading(false);
    }
  };

  const handlePageChange = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
      setCurrentText(pages[pageNum - 1]?.text || '');
      handleStop(); // Stop current reading when changing pages
    }
  };

  const handleVoiceChange = (voice) => {
    setSelectedVoice(voice);
  };

  const handleRateChange = (rate) => {
    setSpeechRate(rate);
  };

  // Update title when page changes
  useEffect(() => {
    if (page === 'main') {
      document.title = 'AudioLeaf - Transform PDFs to Speech';
    } else if (page === 'convert') {
      document.title = 'AudioLeaf - Document Converter';
    }
  }, [page]);

  if (page === 'convert') {
    return (
      <div className="app">
        <header className="app-header">
          <div className="logo-container">
            <div className="leaf-logo">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 4C12 16 8 32 24 44C40 32 36 16 24 4Z" fill="#10b981" stroke="#059669" strokeWidth="2"/>
                <path d="M24 44V20" stroke="#059669" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h1>AudioLeaf</h1>
          </div>
          <p className="tagline">Convert PDF to Word or Word to PDF</p>
        </header>
        <main className="app-main">
          <DocumentConverter />
          <button className="clear-text-btn" style={{marginTop: '2rem', display: 'block', margin: '2rem auto 0'}} onClick={() => setPage('main')}>← Back to Main</button>
        </main>
        <footer className="app-footer">
          <p>© 2025 AudioLeaf. All rights reserved. | Made with <span style={{color: '#10b981', fontWeight: 'bold'}}>❤️</span> for accessible reading.</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="falling-leaves">
          {[...Array(20)].map((_, i) => (
            <div key={i} className={`leaf leaf-${i % 3}`} style={{
              '--fall-duration': `${Math.random() * 4 + 3}s`,
              '--fall-delay': `${Math.random() * 3}s`,
              '--sway-duration': `${Math.random() * 3 + 2}s`,
              '--sway-delay': `${Math.random() * 2}s`,
              '--leaf-size': `${Math.random() * 25 + 12}px`,
              '--leaf-left': `${Math.random() * 100}%`,
              '--leaf-color': `hsl(${100 + Math.random() * 60}, 60%, ${50 + Math.random() * 30}%)`,
              '--leaf-rotation': `${Math.random() * 360}deg`
            }}></div>
          ))}
        </div>
        <div className="logo-container">
          <div className="leaf-logo">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 4C12 16 8 32 24 44C40 32 36 16 24 4Z" fill="#10b981" stroke="#059669" strokeWidth="2"/>
              <path d="M24 44V20" stroke="#059669" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1>AudioLeaf</h1>
        </div>
        <p className="tagline">Transform your PDFs into spoken words with natural voices</p>
      </header>

      <main className="app-main">
        <button className="clear-text-btn" style={{marginBottom: '2rem'}} onClick={() => setPage('convert')}>Convert PDF ↔ Word</button>
        <UniversalPDFProcessor onPDFProcessed={handlePDFProcessed} />
        
        {pdfText && (
          <div className="audio-section">
            <AudioControls
              isReading={isReading}
              onPlay={handlePlay}
              onPause={handlePause}
              onResume={handleResume}
              onStop={handleStop}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              speechRate={speechRate}
              onRateChange={handleRateChange}
              selectedVoice={selectedVoice}
              availableVoices={availableVoices}
              onVoiceChange={handleVoiceChange}
            />
            
            <TextDisplay
              text={currentText}
              currentPage={currentPage}
              totalPages={totalPages}
            />
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>© 2025 AudioLeaf. All rights reserved. | Made with <span style={{color: '#10b981', fontWeight: 'bold'}}>❤️</span> for accessible reading.</p>
      </footer>
    </div>
  );
}

export default App;
