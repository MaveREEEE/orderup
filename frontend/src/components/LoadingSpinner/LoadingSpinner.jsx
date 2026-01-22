import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', fullScreen = false, message = 'Loading...' }) => {
  if (fullScreen) {
    return (
      <div className="loading-spinner-fullscreen">
        <div className={`spinner spinner-${size}`}></div>
        {message && <p className="loading-message">{message}</p>}
      </div>
    );
  }

  return (
    <div className="loading-spinner-container">
      <div className={`spinner spinner-${size}`}></div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
