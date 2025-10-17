import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GradientButton } from '../../../components/shared/GradientButton';
import { SignatureRequest } from '../types';
import { 
  XMarkIcon, 
  MagnifyingGlassPlusIcon, 
  MagnifyingGlassMinusIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  EyeIcon,
  PrinterIcon,
  ShareIcon
} from '@heroicons/react/24/outline';

interface DocumentViewerProps {
  document: SignatureRequest;
  onClose: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  onClose
}) => {
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  const totalPages = 1; // This would come from the document metadata
  const maxZoom = 300;
  const minZoom = 25;
  const zoomStep = 25;

  useEffect(() => {
    // Simulate document loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [document.id]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + zoomStep, maxZoom));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - zoomStep, minZoom));
  };

  const handleResetZoom = () => {
    setZoom(100);
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const renderDocumentContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <ArrowPathIcon className="w-12 h-12 text-primary-purple animate-spin mx-auto mb-4" />
            <p className="text-text-secondary">Loading document...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <DocumentTextIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 mb-2">Failed to load document</p>
            <p className="text-text-secondary text-sm">{error}</p>
            <GradientButton
              variant="primary"
              size="sm"
              onClick={() => {
                setIsLoading(true);
                setError(null);
                setTimeout(() => setIsLoading(false), 1000);
              }}
              className="mt-4"
            >
              <ArrowPathIcon className="w-4 h-4 mr-2" />
              Retry
            </GradientButton>
          </div>
        </div>
      );
    }

    // This would be replaced with actual document rendering
    // For now, we'll show a placeholder
    return (
      <div className="w-full h-full bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-8 h-full overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              {document.document_title}
            </h1>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 mb-4">
                This is a placeholder for the actual document content. In a real implementation,
                this would render the actual PDF, Word document, or other file type.
              </p>
              
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      <strong>Signature Required:</strong> This document requires your digital signature.
                      Please review the content carefully before signing.
                    </p>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Document Details</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Document ID</dt>
                    <dd className="text-sm text-gray-900">{document.id}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                    <dd className="text-sm text-gray-900">
                      {new Date(document.created_at).toLocaleDateString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Due Date</dt>
                    <dd className="text-sm text-gray-900">
                      {new Date(document.due_date).toLocaleDateString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        document.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        document.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        document.status === 'signed' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {document.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Signers</h2>
              <div className="space-y-3">
                {document.signers.map((signer, index) => (
                  <div key={signer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-purple rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {signer.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{signer.name}</p>
                        <p className="text-sm text-gray-500">{signer.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {signer.status.replace('_', ' ').toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {signer.signed_at ? new Date(signer.signed_at).toLocaleDateString() : 'Not signed'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-blue-50 border-l-4 border-blue-400">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      <strong>Legal Notice:</strong> By signing this document, you acknowledge that you have
                      read and understood its contents and agree to be bound by its terms.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-glass-border">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-white">
            {document.document_title}
          </h2>
          <span className="text-sm text-text-secondary">
            Page {currentPage} of {totalPages}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Zoom Controls */}
          <div className="flex items-center space-x-1 bg-glass-bg rounded-lg p-1">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= minZoom}
              className="p-2 rounded hover:bg-glass-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MagnifyingGlassMinusIcon className="w-4 h-4 text-white" />
            </button>
            <span className="text-sm text-white px-2 min-w-[3rem] text-center">
              {zoom}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= maxZoom}
              className="p-2 rounded hover:bg-glass-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MagnifyingGlassPlusIcon className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-2 rounded hover:bg-glass-hover"
            >
              <ArrowPathIcon className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Action Buttons */}
          <GradientButton
            variant="ghost"
            size="sm"
            onClick={() => window.print()}
          >
            <PrinterIcon className="w-4 h-4 mr-2" />
            Print
          </GradientButton>
          
          <GradientButton
            variant="ghost"
            size="sm"
          >
            <ShareIcon className="w-4 h-4 mr-2" />
            Share
          </GradientButton>

          <GradientButton
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <XMarkIcon className="w-4 h-4" />
          </GradientButton>
        </div>
      </div>

      {/* Document Content */}
      <div 
        ref={viewerRef}
        className="flex-1 overflow-hidden"
        style={{ 
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'top left',
          width: `${100 / (zoom / 100)}%`,
          height: `${100 / (zoom / 100)}%`
        }}
      >
        {renderDocumentContent()}
      </div>

      {/* Footer with Page Navigation */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t border-glass-border">
          <GradientButton
            variant="ghost"
            size="sm"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
          >
            Previous
          </GradientButton>
          
          <span className="text-sm text-text-secondary">
            Page {currentPage} of {totalPages}
          </span>
          
          <GradientButton
            variant="ghost"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            Next
          </GradientButton>
        </div>
      )}
    </motion.div>
  );
};




