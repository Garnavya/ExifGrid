import React, { useState, useEffect } from 'react';

export default function MetadataForm({ onApply, onCancel }) {
    const [artist, setArtist] = useState('');
    const [copyright, setCopyright] = useState('');

    // Load saved preferences on mount
    useEffect(() => {
        setArtist(localStorage.getItem('exifgrid_artist') || '');
        setCopyright(localStorage.getItem('exifgrid_copyright') || '');
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Save preferences for future use
        localStorage.setItem('exifgrid_artist', artist);
        localStorage.setItem('exifgrid_copyright', copyright);
        onApply({ artist, copyright });
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content batch-settings">
                <div className="modal-header">
                    <h3>Inject Metadata</h3>
                    <button className="close-btn" onClick={onCancel}>&times;</button>
                </div>
                <p className="modal-desc">Add professional IPTC/Copyright data before export.</p>
                
                <form onSubmit={handleSubmit}>
                    <div className="caption-input-group">
                        <label>Artist / Photographer</label>
                        <input 
                            type="text" 
                            value={artist} 
                            onChange={(e) => setArtist(e.target.value)} 
                            placeholder="e.g. Garnavya Rawal"
                        />
                    </div>
                    <div className="caption-input-group">
                        <label>Copyright Notice</label>
                        <input 
                            type="text" 
                            value={copyright} 
                            onChange={(e) => setCopyright(e.target.value)} 
                            placeholder="e.g. © 2026 All Rights Reserved"
                        />
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
                        <button type="submit" className="btn-primary">Apply & Export</button>
                    </div>
                </form>
            </div>
        </div>
    );
}