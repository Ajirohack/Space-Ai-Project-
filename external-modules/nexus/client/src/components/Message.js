import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFile } from '@fortawesome/free-solid-svg-icons';
import NexusAvatar from './NexusAvatar';

const Message = ({ message, isNexus }) => {
  return (
    <div className={`message ${isNexus ? 'nexus-message' : 'user-message'}`}>
      {isNexus && <NexusAvatar status={message.status || 'active'} />}
      <div className="message-content">
        <div className="message-text">{message.text}</div>
        
        {/* Render attachments if present */}
        {message.attachments && message.attachments.map((attachment, index) => (
          <div className="attachment" key={index}>
            {attachment.type === 'image' && (
              <div className="image-attachment">
                <img src={attachment.url} alt="User uploaded" />
              </div>
            )}
            {attachment.type === 'document' && (
              <div className="document-attachment">
                <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                  <div className="document-icon">
                    <FontAwesomeIcon icon={faFile} />
                  </div>
                  <span>{attachment.name}</span>
                </a>
              </div>
            )}
            {attachment.type === 'audio' && (
              <div className="audio-attachment">
                <audio controls src={attachment.url}></audio>
                <span>{attachment.duration ? `${Math.round(attachment.duration)}s` : ''}</span>
              </div>
            )}
          </div>
        ))}
        
        <div className="message-time">{message.timestamp}</div>
      </div>
    </div>
  );
};

export default Message;
