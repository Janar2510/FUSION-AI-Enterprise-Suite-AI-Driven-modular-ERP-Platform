import { useEffect, useCallback } from 'react';
import { useDocumentsStore } from '../stores/documentsStore';
import { useWebSocket } from '../../../hooks/useWebSocket';

export const useDocuments = () => {
  const {
    documents,
    selectedDocument,
    searchQuery,
    filters,
    viewMode,
    loading,
    error,
    showUploadModal,
    showFilters,
    uploading,
    uploadProgress,
    totalCount,
    currentPage,
    pageSize,
    hasMore,
    fetchDocuments,
    uploadDocuments,
    downloadDocument,
    deleteDocument,
    shareDocument,
    processDocument,
    updateDocument,
    setSearchQuery,
    setFilters,
    clearFilters,
    setViewMode,
    setSelectedDocument,
    setShowUploadModal,
    setShowFilters,
    setUploading,
    setUploadProgress,
    setCurrentPage,
    setPageSize,
    loadMore
  } = useDocumentsStore();

  const { socket, isConnected } = useWebSocket('/documents/ws');

  // WebSocket event handlers
  useEffect(() => {
    if (socket) {
      const handleDocumentProcessed = (data: any) => {
        console.log('Document processed:', data);
        fetchDocuments();
      };

      const handleDocumentUploaded = (data: any) => {
        console.log('Document uploaded:', data);
        fetchDocuments();
      };

      const handleDocumentUpdated = (data: any) => {
        console.log('Document updated:', data);
        fetchDocuments();
      };

      const handleDocumentDeleted = (data: any) => {
        console.log('Document deleted:', data);
        fetchDocuments();
      };

      socket.on('document_processed', handleDocumentProcessed);
      socket.on('document_uploaded', handleDocumentUploaded);
      socket.on('document_updated', handleDocumentUpdated);
      socket.on('document_deleted', handleDocumentDeleted);

      return () => {
        socket.off('document_processed', handleDocumentProcessed);
        socket.off('document_uploaded', handleDocumentUploaded);
        socket.off('document_updated', handleDocumentUpdated);
        socket.off('document_deleted', handleDocumentDeleted);
      };
    }
  }, [socket, fetchDocuments]);

  // Document actions
  const handleUploadDocuments = useCallback(async (files: FileList) => {
    await uploadDocuments(files);
  }, [uploadDocuments]);

  const handleDownloadDocument = useCallback(async (documentId: number) => {
    await downloadDocument(documentId);
  }, [downloadDocument]);

  const handleDeleteDocument = useCallback(async (documentId: number) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      await deleteDocument(documentId);
    }
  }, [deleteDocument]);

  const handleShareDocument = useCallback(async (documentId: number, permissions?: any) => {
    try {
      const shareUrl = await shareDocument(documentId, permissions);
      alert('Share link copied to clipboard!');
      return shareUrl;
    } catch (error) {
      console.error('Share failed:', error);
    }
  }, [shareDocument]);

  const handleProcessDocument = useCallback(async (documentId: number) => {
    await processDocument(documentId);
  }, [processDocument]);

  const handleUpdateDocument = useCallback(async (documentId: number, updates: any) => {
    await updateDocument(documentId, updates);
  }, [updateDocument]);

  // Search and filter actions
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, [setSearchQuery]);

  const handleFilterChange = useCallback((filterUpdates: Partial<typeof filters>) => {
    setFilters(filterUpdates);
  }, [setFilters]);

  const handleClearFilters = useCallback(() => {
    clearFilters();
  }, [clearFilters]);

  const handleViewModeChange = useCallback((mode: 'grid' | 'list') => {
    setViewMode(mode);
  }, [setViewMode]);

  // UI actions
  const handleSelectDocument = useCallback((document: any) => {
    setSelectedDocument(document);
  }, [setSelectedDocument]);

  const handleCloseDocument = useCallback(() => {
    setSelectedDocument(null);
  }, [setSelectedDocument]);

  const handleOpenUploadModal = useCallback(() => {
    setShowUploadModal(true);
  }, [setShowUploadModal]);

  const handleCloseUploadModal = useCallback(() => {
    setShowUploadModal(false);
  }, [setShowUploadModal]);

  const handleToggleFilters = useCallback(() => {
    setShowFilters(!showFilters);
  }, [showFilters, setShowFilters]);

  // Pagination actions
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, [setCurrentPage]);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
  }, [setPageSize]);

  const handleLoadMore = useCallback(async () => {
    await loadMore();
  }, [loadMore]);

  // Computed values
  const filteredDocuments = documents.filter(doc => {
    // Apply client-side filtering if needed
    return true;
  });

  const documentStats = {
    total: documents.length,
    processed: documents.filter(doc => doc.processing_status === 'completed').length,
    processing: documents.filter(doc => doc.processing_status === 'processing').length,
    failed: documents.filter(doc => doc.processing_status === 'failed').length,
    pending: documents.filter(doc => doc.processing_status === 'pending').length,
    invoices: documents.filter(doc => doc.is_invoice).length,
    contracts: documents.filter(doc => doc.is_contract).length,
    receipts: documents.filter(doc => doc.is_receipt).length
  };

  const documentTypes = {
    pdf: documents.filter(doc => doc.document_type === 'pdf').length,
    image: documents.filter(doc => doc.document_type === 'image').length,
    word: documents.filter(doc => doc.document_type === 'word').length,
    excel: documents.filter(doc => doc.document_type === 'excel').length,
    powerpoint: documents.filter(doc => doc.document_type === 'powerpoint').length,
    text: documents.filter(doc => doc.document_type === 'text').length,
    other: documents.filter(doc => doc.document_type === 'other').length
  };

  const classifications = documents.reduce((acc, doc) => {
    if (doc.classification) {
      acc[doc.classification] = (acc[doc.classification] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Utility functions
  const getDocumentIcon = (documentType: string) => {
    switch (documentType) {
      case 'pdf':
        return '📄';
      case 'image':
        return '🖼️';
      case 'word':
        return '📝';
      case 'excel':
        return '📊';
      case 'powerpoint':
        return '📈';
      case 'text':
        return '📄';
      default:
        return '📁';
    }
  };

  const getProcessingStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'processing':
        return 'text-blue-500';
      case 'failed':
        return 'text-red-500';
      case 'pending':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDocumentPreviewUrl = (document: any) => {
    return `/api/v1/documents/${document.id}/preview`;
  };

  const canEditDocument = (document: any) => {
    // Add permission logic here
    return true;
  };

  const canDeleteDocument = (document: any) => {
    // Add permission logic here
    return true;
  };

  const canShareDocument = (document: any) => {
    // Add permission logic here
    return true;
  };

  return {
    // Data
    documents: filteredDocuments,
    selectedDocument,
    searchQuery,
    filters,
    viewMode,
    loading,
    error,
    showUploadModal,
    showFilters,
    uploading,
    uploadProgress,
    totalCount,
    currentPage,
    pageSize,
    hasMore,
    isConnected,

    // Computed values
    documentStats,
    documentTypes,
    classifications,

    // Document actions
    handleUploadDocuments,
    handleDownloadDocument,
    handleDeleteDocument,
    handleShareDocument,
    handleProcessDocument,
    handleUpdateDocument,

    // Search and filter actions
    handleSearch,
    handleFilterChange,
    handleClearFilters,
    handleViewModeChange,

    // UI actions
    handleSelectDocument,
    handleCloseDocument,
    handleOpenUploadModal,
    handleCloseUploadModal,
    handleToggleFilters,

    // Pagination actions
    handlePageChange,
    handlePageSizeChange,
    handleLoadMore,

    // Utility functions
    getDocumentIcon,
    getProcessingStatusColor,
    formatFileSize,
    formatDate,
    getDocumentPreviewUrl,
    canEditDocument,
    canDeleteDocument,
    canShareDocument,

    // Data fetching
    fetchDocuments
  };
};
