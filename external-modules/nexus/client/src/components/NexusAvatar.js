import React from 'react';

const NexusAvatar = ({ status = 'active' }) => {
  // Status can be 'active', 'processing', or 'recording'
  return (
    <div className="nexus-avatar">
      <div className="nexus-avatar-inner">
        <div className={`nexus-avatar-pulse ${status}`}></div>
      </div>
    </div>
  );
};

export default NexusAvatar;
