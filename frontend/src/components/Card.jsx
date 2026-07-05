import React from 'react';
import './Card.css';

export default function Card({ children, className = '', noPadding = false }) {
  return (
    <div className={`card ${noPadding ? 'no-padding' : ''} ${className}`}>
      {children}
    </div>
  );
}
