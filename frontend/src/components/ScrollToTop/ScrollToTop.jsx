import React, { useState, useEffect } from 'react';
import './ScrollToTop.css';
import { assets } from '../../assets/assets'; 

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);


  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div 
      className={`scroll-to-top ${isVisible ? 'visible' : ''}`}
      onClick={scrollToTop}
      title="Scroll to top"
    >
      <img 
        src={assets.arrow_up} 
        alt="Scroll to top" 
        className="scroll-icon"
      />
    </div>
  );
};

export default ScrollToTop;