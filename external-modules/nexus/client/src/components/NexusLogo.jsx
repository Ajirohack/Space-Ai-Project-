import React from 'react';
import logoMain from '../assets/logos/PNG-image-1-dark.png';
import logoSubtle from '../assets/logos/PNG-image-2-dark-gold.png';

const NexusLogo = ({ size = 120, variant = 'default' }) => {
  const logoPath = variant === 'subtle' ? logoSubtle : logoMain;

  return (
    <div className="nexus-logo-container" style={{ width: size, height: size }}>
      <img
        src={logoPath}
        alt="Nexus Logo"
        className={`nexus-logo-image logo-variant-${variant}`}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain'
        }}
      />
    </div>
  );
};

export default NexusLogo;
