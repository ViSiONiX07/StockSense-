import React from 'react';
import './Badge.css';

export default function Badge({ status, label }) {
  const getStatusClass = () => {
    switch(status) {
      case 'Critical': return 'badge-critical';
      case 'Low Supply': return 'badge-warning';
      case 'In Stock': return 'badge-healthy';
      case 'Waste Risk': return 'badge-waste';
      default: return 'badge-default';
    }
  };

  return (
    <span className={`badge label-caps ${getStatusClass()}`}>
      <span className="badge-dot"></span>
      {label || status}
    </span>
  );
}
