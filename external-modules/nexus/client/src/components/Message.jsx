import React from 'react';
import NexusLogo from './NexusLogo';
import '../styles/Message.css';

const Message = ({ message, isNexus }) => {
    const { text, attachments, timestamp } = message;

    return (
        <div className={`message ${isNexus ? 'nexus-message' : 'user-message'}`}>
            {isNexus && (
                <div className="message-avatar">
                    <NexusLogo size={24} variant="chat" />
                </div>
            )}
            <div className="message-content">
                {text && <div className="message-text">{text}</div>}

                {attachments && attachments.length > 0 && (
                    <div className="attachments-container">
                        {attachments.map((attachment, index) => (
                            <div key={index} className={`attachment ${attachment.type}`}>
                                {attachment.type === 'image' && (
                                    <img src={attachment.url} alt={attachment.name || 'Image'} />
                                )}
                                {attachment.type === 'document' && (
                                    <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                                        <span className="document-icon">📄</span>
                                        <span>{attachment.name}</span>
                                    </a>
                                )}
                                {attachment.type === 'audio' && (
                                    <audio controls src={attachment.url}>
                                        Your browser does not support the audio element.
                                    </audio>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <div className="message-timestamp">{timestamp}</div>
            </div>
        </div>
    );
};

export default Message;