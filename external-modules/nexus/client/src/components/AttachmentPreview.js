import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFile, faTimes } from '@fortawesome/free-solid-svg-icons';

const AttachmentPreview = ({ attachment, onRemove }) => {
  return (
    <div className="pending-attachment">
      {attachment.type === 'image' && (
        <div className="attachment-preview image-preview">
          <img src={attachment.url} alt="Preview" />
        </div>
      )}
      {attachment.type === 'document' && (
        <div className="attachment-preview document-preview">
          <FontAwesomeIcon icon={faFile} />
          <span>{attachment.name}</span>
        </div>
      )}
      {attachment.type === 'audio' && (
        <div className="attachment-preview audio-preview">
          <audio src={attachment.url} controls></audio>
        </div>
      )}
      <button 
        className="remove-attachment" 
        onClick={() => onRemove(attachment)}
      >
        <FontAwesomeIcon icon={faTimes} />
      </button>
    </div>
  );
};

export default AttachmentPreview;
