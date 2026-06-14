import React, { useState, useEffect, useRef } from 'react';
import { generateAdvice } from '../utils/adviceEngine';
import '../css/ai-modal.css';

// COCO Joint Connections for drawing the skeleton
const CONNECTIONS = [
  [5, 7], [7, 9],   // Left arm
  [6, 8], [8, 10],  // Right arm
  [5, 6],           // Shoulders
  [5, 11], [6, 12], // Torso
  [11, 12]          // Hips
];

export default function AIAnalysisModal({ imageSrc, onClose }) {
  const [status, setStatus] = useState('idle'); // 'idle' | 'processing' | 'success' | 'error'
  const [advice, setAdvice] = useState([]);
  const [statusMessage, setStatusMessage] = useState('Initializing AI...');
  
  const workerRef = useRef(null);
  const imageRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    // 1. Initialize the Web Worker safely
    workerRef.current = new Worker(new URL('../utils/onnxWorker.js', import.meta.url), { type: 'module' });

    workerRef.current.onmessage = (event) => {
      const data = event.data;
      
      if (data.status === 'loading' || data.status === 'processing') {
        setStatus('processing');
        setStatusMessage(data.message);
      } else if (data.status === 'success') {
        setStatus('success');
        
        // Translate raw math into human advice
        const generatedAdvice = generateAdvice(data.pose, data.lighting);
        setAdvice(generatedAdvice);
        
        // Draw the skeleton overlay
        drawSkeleton(data.pose);
      } else if (data.status === 'error') {
        setStatus('error');
        setStatusMessage(`Error: ${data.error}`);
      }
    };

    // 2. Load the image and send to worker
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageSrc;
    img.onload = async () => {
      setStatus('processing');
      // Create a bitmap for the worker to process natively
      const bitmap = await createImageBitmap(img);
      workerRef.current.postMessage({ action: 'analyze', imageBitmap: bitmap });
    };

    // Cleanup worker when modal closes
    return () => {
      if (workerRef.current) workerRef.current.terminate();
    };
  }, [imageSrc]);

  const drawSkeleton = (poseData) => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    // Match canvas size to the actual displayed image size
    canvas.width = img.clientWidth;
    canvas.height = img.clientHeight;
    const ctx = canvas.getContext('2d');
    
    // Calculate scale (ONNX outputs coordinates based on a 224x224 square)
    const scaleX = canvas.width / 224;
    const scaleY = canvas.height / 224;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#00ffcc'; // Cyberpunk-style highlight
    ctx.fillStyle = '#ff0055';

    // Draw lines connecting the joints
    CONNECTIONS.forEach(([startIdx, endIdx]) => {
      const startX = poseData[startIdx * 2] * scaleX;
      const startY = poseData[startIdx * 2 + 1] * scaleY;
      const endX = poseData[endIdx * 2] * scaleX;
      const endY = poseData[endIdx * 2 + 1] * scaleY;

      // Only draw if the AI is fairly confident (points aren't crushed to [0,0])
      if (startX > 5 && startY > 5 && endX > 5 && endY > 5) {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }
    });

    // Draw dots at the joints
    for (let i = 5; i <= 12; i++) {
      const x = poseData[i * 2] * scaleX;
      const y = poseData[i * 2 + 1] * scaleY;
      if (x > 5 && y > 5) {
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  };

  return (
    <div className="ai-modal-overlay" onClick={(e) => e.stopPropagation()}>
      <div className="ai-modal-content">
        <button className="ai-close-btn" onClick={onClose}>×</button>
        
        <div className="ai-visual-container">
          {/* Base Image */}
          <img 
            ref={imageRef}
            src={imageSrc} 
            alt="Analysis target" 
            className={`ai-target-image ${status === 'processing' ? 'blur-effect' : ''}`}
          />
          
          {/* Skeleton Overlay */}
          <canvas 
            ref={canvasRef} 
            className={`ai-canvas-overlay ${status !== 'success' ? 'hidden' : ''}`}
          />

          {/* Loading Indicator overlaying the image */}
          {status === 'processing' && (
            <div className="ai-loading-state">
              <div className="spinner"></div>
              <p>{statusMessage}</p>
            </div>
          )}
        </div>

        {/* Advice Panel */}
        <div className="ai-advice-panel">
          <h3>AI Photography Insights</h3>
          {status === 'success' ? (
            <ul>
              {advice.map((text, idx) => (
                <li key={idx}>{text}</li>
              ))}
            </ul>
          ) : status === 'error' ? (
            <p className="error-text">{statusMessage}</p>
          ) : (
            <p className="waiting-text">Analyzing pixels...</p>
          )}
        </div>
      </div>
    </div>
  );
}