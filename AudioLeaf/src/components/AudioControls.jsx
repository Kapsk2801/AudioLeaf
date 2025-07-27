import React from 'react';

const AudioControls = ({
  isReading,
  onPlay,
  onPause,
  onResume,
  onStop,
  currentPage,
  totalPages,
  onPageChange,
  speechRate,
  onRateChange,
  selectedVoice,
  availableVoices,
  onVoiceChange
}) => {
  const isPaused = window.speechSynthesis?.paused;

  return (
    <div className="audio-controls">
      <div className="controls-section">
        <h3>Audio Controls</h3>
        
        <div className="control-buttons">
          {!isReading ? (
            <button 
              className="control-btn play-btn"
              onClick={onPlay}
              disabled={!selectedVoice}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21"/>
              </svg>
              Play
            </button>
          ) : isPaused ? (
            <button className="control-btn resume-btn" onClick={onResume}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21"/>
              </svg>
              Resume
            </button>
          ) : (
            <button className="control-btn pause-btn" onClick={onPause}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"/>
                <rect x="14" y="4" width="4" height="16"/>
              </svg>
              Pause
            </button>
          )}
          
          <button 
            className="control-btn stop-btn"
            onClick={onStop}
            disabled={!isReading && !isPaused}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12"/>
            </svg>
            Stop
          </button>
        </div>
      </div>

      <div className="controls-section">
        <h3>Page Navigation</h3>
        
        <div className="page-controls">
          <button 
            className="page-btn"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <polyline points="15,18 9,12 15,6"/>
            </svg>
            Previous
          </button>
          
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          
          <button 
            className="page-btn"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Next
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <polyline points="9,18 15,12 9,6"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="controls-section">
        <h3>Voice Settings</h3>
        
        <div className="voice-settings">
          <div className="setting-group">
            <label htmlFor="voice-select">Voice:</label>
            <select
              id="voice-select"
              value={selectedVoice ? `${selectedVoice.name} (${selectedVoice.lang})` : ''}
              onChange={(e) => {
                const voiceName = e.target.value.split(' (')[0];
                const voice = availableVoices.find(v => v.name === voiceName);
                onVoiceChange(voice);
              }}
            >
              {availableVoices.map((voice, index) => {
                // Create a friendly display name for female Hindi voices
                let displayName = voice.name;
                let icon = '👩‍🦰';
                
                // Simplify Hindi voice names and mark as female
                if (voice.name.toLowerCase().includes('google')) {
                  displayName = 'Google हिंदी Female Voice';
                } else if (voice.name.toLowerCase().includes('microsoft')) {
                  displayName = 'Microsoft Hindi Female Voice';
                } else if (voice.name.toLowerCase().includes('hindi')) {
                  displayName = 'Hindi Female Voice';
                } else if (voice.name.toLowerCase().includes('india')) {
                  displayName = 'India Hindi Female Voice';
                } else {
                  displayName = `Hindi Female Voice ${index + 1}`;
                }
                
                return (
                  <option key={index} value={`${voice.name} (${voice.lang})`}>
                    {icon} {displayName}
                  </option>
                );
              })}
            </select>
          </div>
          
          <div className="setting-group">
            <label htmlFor="rate-slider">Speed: {speechRate}x</label>
            <input
              id="rate-slider"
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={speechRate}
              onChange={(e) => onRateChange(parseFloat(e.target.value))}
              className="rate-slider"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioControls; 