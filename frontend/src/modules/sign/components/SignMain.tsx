import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '../../../components/shared/GlassCard';
import { GradientButton } from '../../../components/shared/GradientButton';
import { SignatureCanvas } from './SignatureCanvas';
import { DocumentViewer } from './DocumentViewer';
import { SignatureList } from './SignatureList';
import { useSignStore } from '../stores/signStore';
import { SignatureRequest, Signer, SignatureStatus } from '../types';
import { 
  DocumentTextIcon, 
  PencilIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon,
  UserGroupIcon,
  EyeIcon,
  ShareIcon
} from '@heroicons/react/24/outline';

export const SignMain: React.FC = () => {
  const { 
    signatureRequests, 
    selectedRequest, 
    selectRequest,
    updateSignatureStatus,
    addSignature,
    updateSignerStatus
  } = useSignStore();
  
  const [activeTab, setActiveTab] = useState<'requests' | 'signatures' | 'documents'>('requests');
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [currentSigner, setCurrentSigner] = useState<Signer | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSignDocument = useCallback((signer: Signer) => {
    setCurrentSigner(signer);
    setShowSignatureModal(true);
  }, []);

  const handleSignatureComplete = useCallback((signatureData: string) => {
    if (currentSigner && selectedRequest) {
      addSignature(selectedRequest.id, currentSigner.id, signatureData);
      updateSignerStatus(selectedRequest.id, currentSigner.id, 'signed');
      setShowSignatureModal(false);
      setCurrentSigner(null);
    }
  }, [currentSigner, selectedRequest, addSignature, updateSignerStatus]);

  const handleRejectSignature = useCallback((signer: Signer) => {
    if (selectedRequest) {
      updateSignerStatus(selectedRequest.id, signer.id, 'rejected');
    }
  }, [selectedRequest, updateSignerStatus]);

  const handleApproveRequest = useCallback((requestId: number) => {
    updateSignatureStatus(requestId, 'approved');
  }, [updateSignatureStatus]);

  const handleRejectRequest = useCallback((requestId: number) => {
    updateSignatureStatus(requestId, 'rejected');
  }, [updateSignatureStatus]);

  const getStatusColor = (status: SignatureStatus) => {
    switch (status) {
      case 'pending': return 'text-yellow-400';
      case 'in_progress': return 'text-blue-400';
      case 'signed': return 'text-green-400';
      case 'rejected': return 'text-red-400';
      case 'approved': return 'text-green-400';
      case 'expired': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: SignatureStatus) => {
    switch (status) {
      case 'pending': return <ClockIcon className="w-5 h-5" />;
      case 'in_progress': return <PencilIcon className="w-5 h-5" />;
      case 'signed': return <CheckCircleIcon className="w-5 h-5" />;
      case 'rejected': return <XCircleIcon className="w-5 h-5" />;
      case 'approved': return <CheckCircleIcon className="w-5 h-5" />;
      case 'expired': return <ClockIcon className="w-5 h-5" />;
      default: return <ClockIcon className="w-5 h-5" />;
    }
  };

  const pendingRequests = signatureRequests.filter(req => req.status === 'pending');
  const inProgressRequests = signatureRequests.filter(req => req.status === 'in_progress');
  const completedRequests = signatureRequests.filter(req => ['signed', 'approved', 'rejected'].includes(req.status));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6"
    >
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">Digital Signatures</h1>
        <p className="text-text-secondary text-lg">
          Manage document signatures, track signing progress, and ensure compliance
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-8 bg-glass-bg rounded-lg p-1">
        {[
          { id: 'requests', label: 'Signature Requests', icon: DocumentTextIcon, count: signatureRequests.length },
          { id: 'signatures', label: 'My Signatures', icon: PencilIcon, count: signatureRequests.filter(req => req.signers.some(s => s.status === 'signed')).length },
          { id: 'documents', label: 'Documents', icon: EyeIcon, count: signatureRequests.length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-primary-purple text-white'
                : 'text-text-secondary hover:text-white hover:bg-glass-hover'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span>{tab.label}</span>
            <span className="bg-white/20 text-xs px-2 py-1 rounded-full">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Request List */}
        <div className="lg:col-span-1">
          <GlassCard className="p-6 h-[80vh] overflow-hidden flex flex-col">
            <h2 className="text-2xl font-semibold text-white mb-6">
              {activeTab === 'requests' && 'Signature Requests'}
              {activeTab === 'signatures' && 'My Signatures'}
              {activeTab === 'documents' && 'Documents'}
            </h2>

            <div className="flex-grow overflow-y-auto custom-scrollbar pr-2">
              {activeTab === 'requests' && (
                <div className="space-y-4">
                  {/* Pending Requests */}
                  {pendingRequests.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-white mb-3">Pending ({pendingRequests.length})</h3>
                      {pendingRequests.map((request) => (
                        <motion.div
                          key={request.id}
                          layout
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-4 rounded-lg cursor-pointer transition-all duration-200 mb-3 ${
                            selectedRequest?.id === request.id
                              ? 'bg-primary-purple/30 border-primary-purple'
                              : 'bg-glass-bg border-glass-border hover:bg-glass-hover'
                          }`}
                          onClick={() => selectRequest(request.id)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-white font-medium truncate">{request.document_title}</h4>
                            <span className={`flex items-center space-x-1 ${getStatusColor(request.status)}`}>
                              {getStatusIcon(request.status)}
                            </span>
                          </div>
                          <p className="text-sm text-text-secondary mb-2">
                            {request.signers.length} signer{request.signers.length !== 1 ? 's' : ''}
                          </p>
                          <div className="flex items-center justify-between text-xs text-text-secondary">
                            <span>Created {new Date(request.created_at).toLocaleDateString()}</span>
                            <span>Due {new Date(request.due_date).toLocaleDateString()}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* In Progress Requests */}
                  {inProgressRequests.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-white mb-3">In Progress ({inProgressRequests.length})</h3>
                      {inProgressRequests.map((request) => (
                        <motion.div
                          key={request.id}
                          layout
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-4 rounded-lg cursor-pointer transition-all duration-200 mb-3 ${
                            selectedRequest?.id === request.id
                              ? 'bg-primary-purple/30 border-primary-purple'
                              : 'bg-glass-bg border-glass-border hover:bg-glass-hover'
                          }`}
                          onClick={() => selectRequest(request.id)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-white font-medium truncate">{request.document_title}</h4>
                            <span className={`flex items-center space-x-1 ${getStatusColor(request.status)}`}>
                              {getStatusIcon(request.status)}
                            </span>
                          </div>
                          <p className="text-sm text-text-secondary mb-2">
                            {request.signers.filter(s => s.status === 'signed').length} of {request.signers.length} signed
                          </p>
                          <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                            <div 
                              className="bg-primary-purple h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${(request.signers.filter(s => s.status === 'signed').length / request.signers.length) * 100}%` 
                              }}
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Completed Requests */}
                  {completedRequests.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-white mb-3">Completed ({completedRequests.length})</h3>
                      {completedRequests.map((request) => (
                        <motion.div
                          key={request.id}
                          layout
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-4 rounded-lg cursor-pointer transition-all duration-200 mb-3 ${
                            selectedRequest?.id === request.id
                              ? 'bg-primary-purple/30 border-primary-purple'
                              : 'bg-glass-bg border-glass-border hover:bg-glass-hover'
                          }`}
                          onClick={() => selectRequest(request.id)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-white font-medium truncate">{request.document_title}</h4>
                            <span className={`flex items-center space-x-1 ${getStatusColor(request.status)}`}>
                              {getStatusIcon(request.status)}
                            </span>
                          </div>
                          <p className="text-sm text-text-secondary">
                            Completed {new Date(request.updated_at || request.created_at).toLocaleDateString()}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {signatureRequests.length === 0 && (
                    <div className="text-center py-8">
                      <DocumentTextIcon className="w-16 h-16 text-text-secondary mx-auto mb-4" />
                      <p className="text-text-secondary">No signature requests found</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'signatures' && (
                <SignatureList />
              )}

              {activeTab === 'documents' && (
                <div className="text-center py-8">
                  <EyeIcon className="w-16 h-16 text-text-secondary mx-auto mb-4" />
                  <p className="text-text-secondary">Document viewer coming soon</p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Right Panel - Request Details */}
        <div className="lg:col-span-2">
          {selectedRequest ? (
            <GlassCard className="p-6 h-[80vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-white">{selectedRequest.document_title}</h2>
                  <p className="text-text-secondary">
                    {selectedRequest.signers.length} signer{selectedRequest.signers.length !== 1 ? 's' : ''} • 
                    Due {new Date(selectedRequest.due_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <GradientButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDocumentViewer(true)}
                  >
                    <EyeIcon className="w-4 h-4 mr-2" />
                    View Document
                  </GradientButton>
                  <GradientButton
                    variant="ghost"
                    size="sm"
                  >
                    <ShareIcon className="w-4 h-4 mr-2" />
                    Share
                  </GradientButton>
                </div>
              </div>

              {/* Status Overview */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-glass-bg rounded-lg">
                  <div className="text-2xl font-bold text-white">
                    {selectedRequest.signers.filter(s => s.status === 'signed').length}
                  </div>
                  <div className="text-sm text-text-secondary">Signed</div>
                </div>
                <div className="text-center p-4 bg-glass-bg rounded-lg">
                  <div className="text-2xl font-bold text-white">
                    {selectedRequest.signers.filter(s => s.status === 'pending').length}
                  </div>
                  <div className="text-sm text-text-secondary">Pending</div>
                </div>
                <div className="text-center p-4 bg-glass-bg rounded-lg">
                  <div className="text-2xl font-bold text-white">
                    {selectedRequest.signers.filter(s => s.status === 'rejected').length}
                  </div>
                  <div className="text-sm text-text-secondary">Rejected</div>
                </div>
              </div>

              {/* Signers List */}
              <div className="flex-grow overflow-y-auto custom-scrollbar">
                <h3 className="text-lg font-medium text-white mb-4">Signers</h3>
                <div className="space-y-3">
                  {selectedRequest.signers.map((signer) => (
                    <motion.div
                      key={signer.id}
                      layout
                      className="flex items-center justify-between p-4 bg-glass-bg rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-purple rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">
                            {signer.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-white font-medium">{signer.name}</div>
                          <div className="text-sm text-text-secondary">{signer.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`flex items-center space-x-1 ${getStatusColor(signer.status)}`}>
                          {getStatusIcon(signer.status)}
                          <span className="text-sm capitalize">{signer.status}</span>
                        </span>
                        {signer.status === 'pending' && (
                          <div className="flex space-x-2">
                            <GradientButton
                              variant="primary"
                              size="sm"
                              onClick={() => handleSignDocument(signer)}
                            >
                              Sign
                            </GradientButton>
                            <GradientButton
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRejectSignature(signer)}
                            >
                              Reject
                            </GradientButton>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              {selectedRequest.status === 'pending' && (
                <div className="flex justify-end space-x-4 mt-6 pt-6 border-t border-glass-border">
                  <GradientButton
                    variant="ghost"
                    onClick={() => handleRejectRequest(selectedRequest.id)}
                  >
                    Reject Request
                  </GradientButton>
                  <GradientButton
                    variant="primary"
                    onClick={() => handleApproveRequest(selectedRequest.id)}
                  >
                    Approve Request
                  </GradientButton>
                </div>
              )}
            </GlassCard>
          ) : (
            <GlassCard className="p-6 h-[80vh] flex items-center justify-center">
              <div className="text-center">
                <DocumentTextIcon className="w-16 h-16 text-text-secondary mx-auto mb-4" />
                <p className="text-text-secondary text-lg">Select a signature request to view details</p>
              </div>
            </GlassCard>
          )}
        </div>
      </div>

      {/* Signature Modal */}
      <AnimatePresence>
        {showSignatureModal && currentSigner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowSignatureModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-dark-bg rounded-lg p-6 w-full max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-semibold text-white mb-4">
                Sign Document for {currentSigner.name}
              </h3>
              <SignatureCanvas
                onSignatureComplete={handleSignatureComplete}
                onCancel={() => setShowSignatureModal(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document Viewer Modal */}
      <AnimatePresence>
        {showDocumentViewer && selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDocumentViewer(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-dark-bg rounded-lg p-6 w-full max-w-6xl h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <DocumentViewer
                document={selectedRequest}
                onClose={() => setShowDocumentViewer(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};




