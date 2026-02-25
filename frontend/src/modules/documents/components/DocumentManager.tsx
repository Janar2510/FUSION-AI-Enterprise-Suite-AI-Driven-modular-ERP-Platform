import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Search, 
  Filter, 
  Grid, 
  List, 
  Download, 
  Share, 
  Edit, 
  Trash2, 
  Eye,
  FileText,
  Image,
  File,
  FileSpreadsheet,
  FileImage,
  Archive,
  Tag,
  Calendar,
  User,
  MoreVertical,
  Plus,
  Folder,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { GlassCard } from '../../../components/shared/GlassCard';
import { GradientButton } from '../../../components/shared/GradientButton';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { api } from '../../../lib/api';

interface Document {
  id: number;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  document_type: string;
  storage_url?: string;
  processing_status: string;
  processing_started_at?: string;
  processing_completed_at?: string;
  processing_error?: string;
  title?: string;
  description?: string;
  keywords: string[];
  categories: string[];
  tags: string[];
  ocr_text?: string;
  ocr_confidence?: number;
  ocr_language?: string;
  vision_analysis?: Record<string, any>;
  detected_objects?: string[];
  text_regions?: any[];
  layout_analysis?: Record<string, any>;
  classification?: string;
  classification_confidence?: number;
  is_invoice: boolean;
  is_contract: boolean;
  is_receipt: boolean;
  invoice_number?: string;
  invoice_date?: string;
  invoice_amount?: number;
  invoice_currency?: string;
  vendor_name?: string;
  customer_name?: string;
  is_public: boolean;
  is_encrypted: boolean;
  version: number;
  parent_document_id?: number;
  created_at: string;
  updated_at?: string;
  created_by?: number;
}

interface DocumentManagerProps {
  className?: string;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({ className = '' }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    document_type: '',
    classification: '',
    tags: [] as string[],
    is_invoice: null as boolean | null,
    is_contract: null as boolean | null,
    is_receipt: null as boolean | null,
    processing_status: '',
    created_after: '',
    created_before: ''
  });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { socket, isConnected } = useWebSocket('/documents/ws');

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (searchQuery) params.append('search', searchQuery);
      if (filters.document_type) params.append('document_type', filters.document_type);
      if (filters.classification) params.append('classification', filters.classification);
      if (filters.tags.length > 0) params.append('tags', filters.tags.join(','));
      if (filters.is_invoice !== null) params.append('is_invoice', filters.is_invoice.toString());
      if (filters.is_contract !== null) params.append('is_contract', filters.is_contract.toString());
      if (filters.is_receipt !== null) params.append('is_receipt', filters.is_receipt.toString());
      if (filters.processing_status) params.append('processing_status', filters.processing_status);
      if (filters.created_after) params.append('created_after', filters.created_after);
      if (filters.created_before) params.append('created_before', filters.created_before);

      const response = await api.get(`/api/v1/documents?${params.toString()}`);
      setDocuments(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters]);

  // WebSocket event handlers
  useEffect(() => {
    if (socket) {
      socket.on('document_processed', (data) => {
        console.log('Document processed:', data);
        fetchDocuments();
      });

      socket.on('document_uploaded', (data) => {
        console.log('Document uploaded:', data);
        fetchDocuments();
      });

      return () => {
        socket.off('document_processed');
        socket.off('document_uploaded');
      };
    }
  }, [socket, fetchDocuments]);

  // Initial data fetch
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Handle file upload
  const handleFileUpload = async (files: FileList) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadPromises = Array.from(files).map(async (file, index) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', file.name);
        formData.append('is_public', 'false');

        const response = await api.post('/api/v1/documents/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total!);
            setUploadProgress(progress);
          },
        });

        return response.data;
      });

      const uploadedDocuments = await Promise.all(uploadPromises);
      setDocuments(prev => [...uploadedDocuments, ...prev]);
      setShowUploadModal(false);
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle document actions
  const handleDownload = async (document: Document) => {
    try {
      const response = await api.get(`/api/v1/documents/${document.id}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', document.original_filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handleDelete = async (documentId: number) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await api.delete(`/api/v1/documents/${documentId}`);
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      } catch (err) {
        console.error('Delete failed:', err);
      }
    }
  };

  const handleShare = async (document: Document) => {
    try {
      const response = await api.post(`/api/v1/documents/${document.id}/share`, {
        can_view: true,
        can_download: true,
        can_comment: true
      });
      
      // Copy share URL to clipboard
      const shareUrl = `${window.location.origin}/documents/shared/${response.data.share_token}`;
      await navigator.clipboard.writeText(shareUrl);
      alert('Share link copied to clipboard!');
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  const handleProcessDocument = async (documentId: number) => {
    try {
      await api.post(`/api/v1/documents/${documentId}/process`);
      fetchDocuments();
    } catch (err) {
      console.error('Processing failed:', err);
    }
  };

  // Get document icon
  const getDocumentIcon = (documentType: string) => {
    switch (documentType) {
      case 'pdf':
        return <FileText className="w-6 h-6 text-red-500" />;
      case 'image':
        return <Image className="w-6 h-6 text-green-500" />;
      case 'word':
        return <File className="w-6 h-6 text-blue-500" />;
      case 'excel':
        return <FileSpreadsheet className="w-6 h-6 text-green-600" />;
      case 'powerpoint':
        return <FileImage className="w-6 h-6 text-orange-500" />;
      default:
        return <File className="w-6 h-6 text-gray-500" />;
    }
  };

  // Get processing status icon
  const getProcessingStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw className="w-8 h-8 text-purple-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-dark-bg via-purple-900/20 to-dark-bg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-glass-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Document Manager
            </h1>
            <p className="text-gray-400 mt-1">
              {documents.length} documents • {isConnected ? 'Connected' : 'Disconnected'}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <GradientButton
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
              Filters
            </GradientButton>
            
            <GradientButton
              variant="ghost"
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
              {viewMode === 'grid' ? 'List' : 'Grid'}
            </GradientButton>
            
            <GradientButton onClick={() => setShowUploadModal(true)}>
              <Plus className="w-4 h-4" />
              Upload Documents
            </GradientButton>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-glass-bg border border-glass-border rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 bg-glass-bg border border-glass-border rounded-lg"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Document Type</label>
                  <select
                    value={filters.document_type}
                    onChange={(e) => setFilters(prev => ({ ...prev, document_type: e.target.value }))}
                    className="w-full px-3 py-2 bg-glass-bg border border-glass-border rounded-lg text-white focus:border-purple-400 focus:outline-none"
                  >
                    <option value="">All Types</option>
                    <option value="pdf">PDF</option>
                    <option value="image">Image</option>
                    <option value="word">Word</option>
                    <option value="excel">Excel</option>
                    <option value="powerpoint">PowerPoint</option>
                    <option value="text">Text</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Classification</label>
                  <select
                    value={filters.classification}
                    onChange={(e) => setFilters(prev => ({ ...prev, classification: e.target.value }))}
                    className="w-full px-3 py-2 bg-glass-bg border border-glass-border rounded-lg text-white focus:border-purple-400 focus:outline-none"
                  >
                    <option value="">All Classifications</option>
                    <option value="invoice">Invoice</option>
                    <option value="contract">Contract</option>
                    <option value="receipt">Receipt</option>
                    <option value="report">Report</option>
                    <option value="correspondence">Correspondence</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Processing Status</label>
                  <select
                    value={filters.processing_status}
                    onChange={(e) => setFilters(prev => ({ ...prev, processing_status: e.target.value }))}
                    className="w-full px-3 py-2 bg-glass-bg border border-glass-border rounded-lg text-white focus:border-purple-400 focus:outline-none"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Business Type</label>
                  <select
                    value={filters.is_invoice ? 'invoice' : filters.is_contract ? 'contract' : filters.is_receipt ? 'receipt' : ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFilters(prev => ({
                        ...prev,
                        is_invoice: value === 'invoice',
                        is_contract: value === 'contract',
                        is_receipt: value === 'receipt'
                      }));
                    }}
                    className="w-full px-3 py-2 bg-glass-bg border border-glass-border rounded-lg text-white focus:border-purple-400 focus:outline-none"
                  >
                    <option value="">All Business Types</option>
                    <option value="invoice">Invoice</option>
                    <option value="contract">Contract</option>
                    <option value="receipt">Receipt</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <GradientButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilters({
                      document_type: '',
                      classification: '',
                      tags: [],
                      is_invoice: null,
                      is_contract: null,
                      is_receipt: null,
                      processing_status: '',
                      created_after: '',
                      created_before: ''
                    })}
                  >
                    Clear Filters
                  </GradientButton>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {documents.length === 0 ? (
          <div className="text-center py-12">
            <Archive className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No documents found</h3>
            <p className="text-gray-400 mb-4">Upload your first document to get started</p>
            <GradientButton onClick={() => setShowUploadModal(true)}>
              <Upload className="w-4 h-4" />
              Upload Documents
            </GradientButton>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
            {documents.map((document) => (
              <DocumentCard
                key={document.id}
                document={document}
                viewMode={viewMode}
                onDownload={() => handleDownload(document)}
                onDelete={() => handleDelete(document.id)}
                onShare={() => handleShare(document)}
                onProcess={() => handleProcessDocument(document.id)}
                getDocumentIcon={getDocumentIcon}
                getProcessingStatusIcon={getProcessingStatusIcon}
                formatFileSize={formatFileSize}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowUploadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-glass-bg backdrop-blur-md border border-glass-border rounded-xl max-w-md w-full mx-4 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold text-white mb-4">Upload Documents</h3>
              
              <div className="border-2 border-dashed border-glass-border rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-300 mb-4">Drag and drop files here, or click to select</p>
                <input
                  type="file"
                  multiple
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-block px-4 py-2 bg-purple-600 text-white rounded-lg cursor-pointer hover:bg-purple-700 transition-colors"
                >
                  Choose Files
                </label>
              </div>
              
              {uploading && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
              
              <div className="flex justify-end mt-6">
                <GradientButton
                  variant="ghost"
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancel
                </GradientButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Document Card Component
interface DocumentCardProps {
  document: Document;
  viewMode: 'grid' | 'list';
  onDownload: () => void;
  onDelete: () => void;
  onShare: () => void;
  onProcess: () => void;
  getDocumentIcon: (type: string) => React.ReactNode;
  getProcessingStatusIcon: (status: string) => React.ReactNode;
  formatFileSize: (bytes: number) => string;
  formatDate: (dateString: string) => string;
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  viewMode,
  onDownload,
  onDelete,
  onShare,
  onProcess,
  getDocumentIcon,
  getProcessingStatusIcon,
  formatFileSize,
  formatDate
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`group relative ${viewMode === 'grid' ? 'h-64' : 'h-20'}`}
    >
      <GlassCard className={`h-full p-4 hover:border-glass-active transition-all duration-300 ${viewMode === 'list' ? 'flex items-center' : ''}`}>
        {/* Grid View */}
        {viewMode === 'grid' && (
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                {getDocumentIcon(document.document_type)}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate" title={document.title || document.filename}>
                    {document.title || document.filename}
                  </h3>
                  <p className="text-xs text-gray-400 truncate">
                    {document.document_type?.toUpperCase() || 'UNKNOWN'} • {formatFileSize(document.file_size)}
                  </p>
                </div>
              </div>
              
              <div className="relative">
                <GradientButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMenu(!showMenu)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-4 h-4" />
                </GradientButton>
                
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 top-8 bg-glass-bg backdrop-blur-md border border-glass-border rounded-lg shadow-lg z-10 min-w-[160px]"
                  >
                    <div className="py-1">
                      <button
                        onClick={onDownload}
                        className="w-full px-3 py-2 text-left text-sm text-white hover:bg-glass-hover flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </button>
                      
                      <button
                        onClick={onShare}
                        className="w-full px-3 py-2 text-left text-sm text-white hover:bg-glass-hover flex items-center space-x-2"
                      >
                        <Share className="w-4 h-4" />
                        <span>Share</span>
                      </button>
                      
                      <button
                        onClick={onProcess}
                        className="w-full px-3 py-2 text-left text-sm text-white hover:bg-glass-hover flex items-center space-x-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Reprocess</span>
                      </button>
                      
                      <div className="border-t border-glass-border my-1" />
                      
                      <button
                        onClick={onDelete}
                        className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center space-x-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center space-x-2 text-xs text-gray-400">
                {getProcessingStatusIcon(document.processing_status)}
                <span className="capitalize">{document.processing_status}</span>
              </div>
              
              {document.classification && (
                <div className="text-xs">
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded">
                    {document.classification}
                  </span>
                </div>
              )}
              
              {document.tags && document.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {document.tags.slice(0, 3).map((tag, index) => (
                    <span key={index} className="text-xs px-2 py-1 bg-gray-500/20 text-gray-400 rounded">
                      {tag}
                    </span>
                  ))}
                  {document.tags.length > 3 && (
                    <span className="text-xs text-gray-500">+{document.tags.length - 3}</span>
                  )}
                </div>
              )}
            </div>
            
            <div className="text-xs text-gray-400">
              {formatDate(document.created_at)}
            </div>
          </>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <>
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              {getDocumentIcon(document.document_type)}
              
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white truncate">
                  {document.title || document.filename}
                </h3>
                <p className="text-xs text-gray-400">
                  {document.document_type.toUpperCase()} • {formatFileSize(document.file_size)} • {formatDate(document.created_at)}
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                {getProcessingStatusIcon(document.processing_status)}
                {document.classification && (
                  <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded">
                    {document.classification}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <GradientButton variant="ghost" size="sm" onClick={onDownload}>
                <Download className="w-4 h-4" />
              </GradientButton>
              <GradientButton variant="ghost" size="sm" onClick={onShare}>
                <Share className="w-4 h-4" />
              </GradientButton>
              <GradientButton variant="ghost" size="sm" onClick={onDelete}>
                <Trash2 className="w-4 h-4" />
              </GradientButton>
            </div>
          </>
        )}
      </GlassCard>
    </motion.div>
  );
};

export default DocumentManager;
