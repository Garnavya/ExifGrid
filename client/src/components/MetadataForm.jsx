import React, { useState, useEffect } from 'react';

export default function MetadataForm({ onApply, onCancel }) {
    const [isAdvanced, setIsAdvanced] = useState(false);
    
    // Form State
    const [metadata, setMetadata] = useState({
        artist: '',
        copyright: '',
        title: '',
        contact: '',
        usage: '',
        jobId: ''
    });

    // Load saved preferences on mount
    useEffect(() => {
        setMetadata({
            artist: localStorage.getItem('exifgrid_artist') || '',
            copyright: localStorage.getItem('exifgrid_copyright') || '',
            title: '', // Title and Job ID shouldn't be saved globally as they change per batch
            contact: localStorage.getItem('exifgrid_contact') || '',
            usage: localStorage.getItem('exifgrid_usage') || '',
            jobId: ''
        });
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setMetadata(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Save persistent preferences
        localStorage.setItem('exifgrid_artist', metadata.artist);
        localStorage.setItem('exifgrid_copyright', metadata.copyright);
        localStorage.setItem('exifgrid_contact', metadata.contact);
        localStorage.setItem('exifgrid_usage', metadata.usage);
        
        onApply(metadata);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content batch-settings" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                <div className="modal-header">
                    <h3>Inject Metadata</h3>
                    <button className="close-btn" onClick={onCancel}>&times;</button>
                </div>
                <p className="modal-desc">Add professional IPTC/Copyright data before export.</p>
                
                <form onSubmit={handleSubmit}>
                    {/* Standard Fields */}
                    <div className="caption-input-group">
                        <label>Creator / Photographer</label>
                        <input type="text" name="artist" value={metadata.artist} onChange={handleChange} placeholder="e.g. Jane Doe" />
                    </div>
                    <div className="caption-input-group">
                        <label>Copyright Notice</label>
                        <input type="text" name="copyright" value={metadata.copyright} onChange={handleChange} placeholder="e.g. © 2026 All Rights Reserved" />
                    </div>

                    {/* Advanced Toggle */}
                    <div style={{ margin: '16px 0', textAlign: 'right' }}>
                        <span 
                            style={{ color: 'var(--accent)', fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-mono)' }} 
                            onClick={() => setIsAdvanced(!isAdvanced)}
                        >
                            {isAdvanced ? '- Hide Advanced Fields' : '+ Show Advanced Fields'}
                        </span>
                    </div>

                    {/* Advanced Fields */}
                    {isAdvanced && (
                        <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', marginBottom: '24px' }}>
                            <div className="caption-input-group">
                                <label>Image Title</label>
                                <input type="text" name="title" value={metadata.title} onChange={handleChange} placeholder="e.g. Neon Streets" />
                            </div>
                            <div className="caption-input-group">
                                <label>Contact Info</label>
                                <input type="text" name="contact" value={metadata.contact} onChange={handleChange} placeholder="e.g. email@example.com" />
                            </div>
                            <div className="caption-input-group">
                                <label>Usage Terms / License</label>
                                <input type="text" name="usage" value={metadata.usage} onChange={handleChange} placeholder="e.g. Editorial Use Only" />
                            </div>
                            <div className="caption-input-group">
                                <label>Job Identifier</label>
                                <input type="text" name="jobId" value={metadata.jobId} onChange={handleChange} placeholder="e.g. REQ-99201" />
                            </div>
                        </div>
                    )}

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
                        <button type="submit" className="btn-primary">Apply & Export</button>
                    </div>
                </form>
            </div>
        </div>
    );
}