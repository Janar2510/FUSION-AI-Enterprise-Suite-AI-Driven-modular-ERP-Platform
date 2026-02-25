import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { GradientButton } from '../../../components/shared/GradientButton';
import { 
  PencilIcon, 
  TrashIcon, 
  CheckIcon, 
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface SignatureCanvasProps {
  onSignatureComplete: (signatureData: string) => void;
  onCancel: () => void;
}

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  onSignatureComplete,
  onCancel
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureMethod, setSignatureMethod] = useState<'draw' | 'type'>('draw');
  const [typedSignature, setTypedSignature] = useState('');
  const [isClearing, setIsClearing] = useState(false);

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (signatureMethod !== 'draw') return;
    
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  }, [signatureMethod]);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || signatureMethod !== 'draw') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    setHasSignature(true);
  }, [isDrawing, signatureMethod]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsClearing(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setTypedSignature('');
    
    setTimeout(() => setIsClearing(false), 300);
  }, []);

  const saveSignature = useCallback(() => {
    if (signatureMethod === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas || !hasSignature) return;

      const signatureData = canvas.toDataURL('image/png');
      onSignatureComplete(signatureData);
    } else if (signatureMethod === 'type' && typedSignature.trim()) {
      onSignatureComplete(typedSignature.trim());
    }
  }, [signatureMethod, hasSignature, typedSignature, onSignatureComplete]);

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 600;
    canvas.height = 200;

    // Set drawing properties
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw border
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
  }, []);

  useEffect(() => {
    setupCanvas();
  }, [setupCanvas]);

  const isSignatureReady = signatureMethod === 'draw' ? hasSignature : typedSignature.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Signature Method Selection */}
      <div className="flex space-x-2">
        <button
          onClick={() => setSignatureMethod('draw')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
            signatureMethod === 'draw'
              ? 'bg-primary-purple text-white'
              : 'bg-glass-bg text-text-secondary hover:text-white hover:bg-glass-hover'
          }`}
        >
          <PencilIcon className="w-5 h-5" />
          <span>Draw Signature</span>
        </button>
        <button
          onClick={() => setSignatureMethod('type')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
            signatureMethod === 'type'
              ? 'bg-primary-purple text-white'
              : 'bg-glass-bg text-text-secondary hover:text-white hover:bg-glass-hover'
          }`}
        >
          <span className="text-lg font-bold">A</span>
          <span>Type Signature</span>
        </button>
      </div>

      {/* Signature Area */}
      {signatureMethod === 'draw' ? (
        <div className="relative">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="w-full border border-glass-border rounded-lg cursor-crosshair"
            style={{ touchAction: 'none' }}
          />
          {!hasSignature && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-text-secondary text-lg">Draw your signature here</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <input
            type="text"
            value={typedSignature}
            onChange={(e) => setTypedSignature(e.target.value)}
            placeholder="Type your full name"
            className="w-full p-4 bg-glass-bg border border-glass-border rounded-lg text-white text-xl font-semibold text-center focus:outline-none focus:ring-2 focus:ring-primary-purple"
            style={{ fontFamily: 'cursive' }}
          />
          <div className="text-center">
            <p className="text-text-secondary text-sm">
              Preview: <span className="text-white font-semibold" style={{ fontFamily: 'cursive' }}>
                {typedSignature || 'Your signature will appear here'}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <GradientButton
          variant="ghost"
          size="md"
          onClick={clearSignature}
          disabled={isClearing}
        >
          {isClearing ? (
            <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <TrashIcon className="w-5 h-5 mr-2" />
          )}
          Clear
        </GradientButton>

        <div className="flex space-x-4">
          <GradientButton
            variant="ghost"
            size="md"
            onClick={onCancel}
          >
            <XMarkIcon className="w-5 h-5 mr-2" />
            Cancel
          </GradientButton>
          <GradientButton
            variant="primary"
            size="md"
            onClick={saveSignature}
            disabled={!isSignatureReady}
            pulse={isSignatureReady}
          >
            <CheckIcon className="w-5 h-5 mr-2" />
            Sign Document
          </GradientButton>
        </div>
      </div>

      {/* Signature Guidelines */}
      <div className="bg-glass-bg rounded-lg p-4">
        <h4 className="text-white font-medium mb-2">Signature Guidelines</h4>
        <ul className="text-sm text-text-secondary space-y-1">
          <li>• Your signature should match the one on your official documents</li>
          <li>• Make sure the signature is clear and readable</li>
          <li>• For typed signatures, use your full legal name</li>
          <li>• The signature will be legally binding once applied</li>
        </ul>
      </div>
    </div>
  );
};




