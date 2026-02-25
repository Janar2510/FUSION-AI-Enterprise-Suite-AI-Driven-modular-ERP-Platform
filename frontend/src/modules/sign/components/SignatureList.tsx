import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSignStore } from '../stores/signStore';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  DocumentTextIcon,
  EyeIcon,
  ShareIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

export const SignatureList: React.FC = () => {
  const { signatureRequests, selectRequest, selectedRequest } = useSignStore();
  const [filter, setFilter] = useState<'all' | 'signed' | 'pending' | 'rejected'>('all');

  // Get all signatures from all requests
  const allSignatures = signatureRequests.flatMap(request => 
    request.signers.map(signer => ({
      ...signer,
      requestId: request.id,
      documentTitle: request.document_title,
      requestStatus: request.status,
      createdAt: request.created_at
    }))
  );

  const filteredSignatures = allSignatures.filter(signature => {
    if (filter === 'all') return true;
    return signature.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'signed': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'rejected': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'signed': return <CheckCircleIcon className="w-5 h-5" />;
      case 'pending': return <ClockIcon className="w-5 h-5" />;
      case 'rejected': return <XCircleIcon className="w-5 h-5" />;
      default: return <ClockIcon className="w-5 h-5" />;
    }
  };

  const handleSignatureClick = (requestId: number) => {
    selectRequest(requestId);
  };

  const handleViewDocument = (requestId: number) => {
    selectRequest(requestId);
    // This would trigger the document viewer
  };

  const handleShareSignature = (signature: any) => {
    // This would open a share modal or copy link
    console.log('Share signature:', signature);
  };

  const handleDeleteSignature = (signature: any) => {
    // This would open a confirmation modal
    console.log('Delete signature:', signature);
  };

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-glass-bg rounded-lg p-1">
        {[
          { id: 'all', label: 'All', count: allSignatures.length },
          { id: 'signed', label: 'Signed', count: allSignatures.filter(s => s.status === 'signed').length },
          { id: 'pending', label: 'Pending', count: allSignatures.filter(s => s.status === 'pending').length },
          { id: 'rejected', label: 'Rejected', count: allSignatures.filter(s => s.status === 'rejected').length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-all duration-200 ${
              filter === tab.id
                ? 'bg-primary-purple text-white'
                : 'text-text-secondary hover:text-white hover:bg-glass-hover'
            }`}
          >
            <span>{tab.label}</span>
            <span className="bg-white/20 text-xs px-2 py-1 rounded-full">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Signatures List */}
      <div className="space-y-3">
        {filteredSignatures.length === 0 ? (
          <div className="text-center py-8">
            <DocumentTextIcon className="w-16 h-16 text-text-secondary mx-auto mb-4" />
            <p className="text-text-secondary">No signatures found</p>
          </div>
        ) : (
          filteredSignatures.map((signature) => (
            <motion.div
              key={`${signature.requestId}-${signature.id}`}
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                selectedRequest?.id === signature.requestId
                  ? 'bg-primary-purple/30 border-primary-purple'
                  : 'bg-glass-bg border-glass-border hover:bg-glass-hover'
              }`}
              onClick={() => handleSignatureClick(signature.requestId)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-purple rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {signature.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{signature.name}</h4>
                    <p className="text-sm text-text-secondary">{signature.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`flex items-center space-x-1 ${getStatusColor(signature.status)}`}>
                    {getStatusIcon(signature.status)}
                    <span className="text-sm capitalize">{signature.status}</span>
                  </span>
                </div>
              </div>

              <div className="mb-3">
                <h5 className="text-white font-medium mb-1">{signature.documentTitle}</h5>
                <p className="text-sm text-text-secondary">
                  Requested {new Date(signature.createdAt).toLocaleDateString()}
                  {signature.signed_at && (
                    <span> • Signed {new Date(signature.signed_at).toLocaleDateString()}</span>
                  )}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    signature.requestStatus === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                    signature.requestStatus === 'in_progress' ? 'bg-blue-500/20 text-blue-300' :
                    signature.requestStatus === 'signed' ? 'bg-green-500/20 text-green-300' :
                    'bg-gray-500/20 text-gray-300'
                  }`}>
                    {signature.requestStatus.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDocument(signature.requestId);
                    }}
                    className="p-2 text-text-secondary hover:text-white hover:bg-glass-hover rounded transition-colors"
                    title="View Document"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </button>
                  
                  {signature.status === 'signed' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShareSignature(signature);
                      }}
                      className="p-2 text-text-secondary hover:text-white hover:bg-glass-hover rounded transition-colors"
                      title="Share Signature"
                    >
                      <ShareIcon className="w-4 h-4" />
                    </button>
                  )}
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSignature(signature);
                    }}
                    className="p-2 text-text-secondary hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    title="Delete Signature"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Signature Details */}
              {signature.status === 'signed' && signature.signed_at && (
                <div className="mt-3 pt-3 border-t border-glass-border">
                  <div className="grid grid-cols-2 gap-4 text-xs text-text-secondary">
                    <div>
                      <span className="font-medium">Signed At:</span>
                      <br />
                      {new Date(signature.signed_at).toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">IP Address:</span>
                      <br />
                      {signature.ip_address || 'N/A'}
                    </div>
                    {signature.signature_method && (
                      <div>
                        <span className="font-medium">Method:</span>
                        <br />
                        {signature.signature_method.replace('_', ' ').toUpperCase()}
                      </div>
                    )}
                    {signature.verification_status && (
                      <div>
                        <span className="font-medium">Verification:</span>
                        <br />
                        <span className={`${
                          signature.verification_status === 'verified' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {signature.verification_status.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};




