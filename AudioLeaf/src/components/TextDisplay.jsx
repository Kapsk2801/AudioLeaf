import React from 'react';

const TextDisplay = ({ text, currentPage, totalPages }) => {
  if (!text) {
    return (
      <div className="text-display">
        <div className="no-text">
          <p>No text content available for this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-display">
      <div className="text-header">
        <h3>Page {currentPage} Content</h3>
        <span className="page-indicator">
          {currentPage} of {totalPages}
        </span>
      </div>
      
      <div className="text-content">
        <div 
          className="text-body"
          role="region"
          aria-label={`Page ${currentPage} content`}
          tabIndex="0"
        >
          {text.split('\n').map((paragraph, index) => (
            <p key={index} className="text-paragraph">
              {paragraph.trim() || '\u00A0'}
            </p>
          ))}
        </div>
      </div>
      
      <div className="text-footer">
        <div className="text-stats">
          <span className="char-count">
            {text.replace(/\s/g, '').length} characters
          </span>
          <span className="word-count">
            {text.trim().split(/\s+/).filter(word => word.length > 0).length} words
          </span>
        </div>
      </div>
    </div>
  );
};

export default TextDisplay; 