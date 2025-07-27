import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import UniversalPDFProcessor from './components/UniversalPDFProcessor';
import AudioControls from './components/AudioControls';
import TextDisplay from './components/TextDisplay';

function App() {
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

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎵 AudioLeaf</h1>
        <p>Transform your PDFs into spoken words</p>
      </header>

      <main className="app-main">
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
        <p>Built with React & Web Speech API</p>
      </footer>
    </div>
  );
}

export default App;
