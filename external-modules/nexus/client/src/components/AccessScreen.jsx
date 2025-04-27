import React, { useState } from 'react';
import App from '../App';
import NexusLogo from './NexusLogo';
import '../styles/AccessScreen.css';

function AccessScreen() {
    const [apiKey, setApiKey] = useState('');
    const [showInput, setShowInput] = useState(false);
    const [authenticated, setAuthenticated] = useState(false);
    const [error, setError] = useState('');
    const [fadeOut, setFadeOut] = useState(false);

    const handleClick = () => {
        if (!showInput) {
            setShowInput(true);
        }
    };

    // Cancel access modal and revert to logo screen
    const handleCancel = (e) => {
        e.stopPropagation();
        setShowInput(false);
        setApiKey('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (apiKey === '1234567890') {
            setError('');
            setFadeOut(true);
            // Add a delay before transitioning to the main app
            setTimeout(() => {
                setAuthenticated(true);
            }, 800); // Match this with the CSS transition duration
        } else {
            setError('Invalid API key. Please try again.');
            // Shake animation effect for error
            const input = document.querySelector('.input-wrapper');
            input.classList.add('shake');
            setTimeout(() => input.classList.remove('shake'), 500);
        }
    };

    if (authenticated) {
        return <App apiKey={apiKey} />;
    }

    return (
        <div className={`access-container ${fadeOut ? 'fade-out' : ''}`} onClick={handleClick}>
            <div className={`logo-container ${showInput ? 'blur' : ''}`}>
                <div className="logo-wrapper">
                    <NexusLogo size={259} color="#C8B38C" background="transparent" />
                </div>
                {/* NEXUS text removed per UX update */}
            </div>

            {showInput && (
                <div className="api-key-modal" onClick={(e) => e.stopPropagation()}>
                    <h2>Enter Access Key</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="input-wrapper">
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Enter your access key"
                                autoFocus
                            />
                        </div>
                        {error && <p className="error-message">{error}</p>}
                        <div className="modal-actions">
                            <button type="button" className="cancel-button" onClick={handleCancel}>
                                Cancel
                            </button>
                            <button type="submit" className="submit-button">
                                Enter
                            </button>
                        </div>
                    </form>
                </div>
            )}
            
            <div className="background-pattern"></div>
        </div>
    );
}

export default AccessScreen;