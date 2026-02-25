import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Download, 
  Share, 
  Edit, 
  Eye, 
  EyeOff,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  FileText,
  Image,
  File,
  AlertCircle,
  CheckCircle,
  Clock,
  Tag,
  Calendar,
  User,
  DollarSign,
  Building,
  Hash
} from 'lucide-react';
import { GlassCard } from '../../../components/shared/GlassCard';
import { GradientButton } from '../../../components/shared/GradientButton';
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

interface DocumentViewerProps {
  document: Document;
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  onShare: () => void;
  onEdit: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  isOpen,
  onClose,
  onDownload,
  onShare,
  onEdit
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'metadata' | 'ocr' | 'analysis'>('preview');
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Generate preview URL
  useEffect(() => {
    if (isOpen && document) {
      setPreviewUrl(`/api/v1/documents/${document.id}/preview`);
    }
  }, [isOpen, document]);

  // Handle zoom
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 25));
  const handleZoomReset = () => setZoom(100);

  // Handle rotation
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  // Get document icon
  const getDocumentIcon = (documentType: string) => {
    switch (documentType) {
      case 'pdf':
        return <FileText className="w-6 h-6 text-red-500" />;
      case 'image':
        return <Image className="w-6 h-6 text-green-500" />;
      case 'word':
        return <File className="w-6 h-6 text-blue-500" />;
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
        return <Clock className="w-4 h-4 text-blue-500 animate-pulse" />;
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen || !document) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-glass-bg backdrop-blur-md border border-glass-border rounded-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-glass-border">
            <div className="flex items-center space-x-3">
              {getDocumentIcon(document.document_type)}
              <div>
                <h2 className="text-xl font-semibold text-white">{document.title || document.filename}</h2>
                <p className="text-sm text-gray-400">
                  {document.document_type.toUpperCase()} • {formatFileSize(document.file_size)} • {formatDate(document.created_at)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <GradientButton variant="ghost" size="sm" onClick={onDownload}>
                <Download className="w-4 h-4" />
              </GradientButton>
              <GradientButton variant="ghost" size="sm" onClick={onShare}>
                <Share className="w-4 h-4" />
              </GradientButton>
              <GradientButton variant="ghost" size="sm" onClick={onEdit}>
                <Edit className="w-4 h-4" />
              </GradientButton>
              <GradientButton variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </GradientButton>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-glass-border">
            {[
              { id: 'preview', label: 'Preview', icon: Eye },
              { id: 'metadata', label: 'Metadata', icon: File },
              { id: 'ocr', label: 'OCR Text', icon: FileText },
              { id: 'analysis', label: 'AI Analysis', icon: AlertCircle }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-purple-400 border-b-2 border-purple-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto max-h-[calc(90vh-200px)]">
            {activeTab === 'preview' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <GradientButton variant="ghost" size="sm" onClick={handleZoomOut}>
                      <ZoomOut className="w-4 h-4" />
                    </GradientButton>
                    <span className="text-sm text-gray-400">{zoom}%</span>
                    <GradientButton variant="ghost" size="sm" onClick={handleZoomIn}>
                      <ZoomIn className="w-4 h-4" />
                    </GradientButton>
                    <GradientButton variant="ghost" size="sm" onClick={handleZoomReset}>
                      Reset
                    </GradientButton>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <GradientButton variant="ghost" size="sm" onClick={handleRotate}>
                      <RotateCw className="w-4 h-4" />
                    </GradientButton>
                    <GradientButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAnnotations(!showAnnotations)}
                    >
                      {showAnnotations ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      Annotations
                    </GradientButton>
                  </div>
                </div>

                <div className="bg-white rounded-lg overflow-hidden">
                  {document.document_type === 'image' ? (
                    <img
                      src={previewUrl || ''}
                      alt={document.filename}
                      className="w-full h-auto"
                      style={{
                        transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                        transformOrigin: 'center'
                      }}
                    />
                  ) : document.document_type === 'pdf' ? (
                    <iframe
                      src={previewUrl || ''}
                      className="w-full h-96"
                      title={document.filename}
                    />
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <File className="w-16 h-16 mx-auto mb-4" />
                      <p>Preview not available for this document type</p>
                      <GradientButton onClick={onDownload} className="mt-4">
                        Download to View
                      </GradientButton>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'metadata' && (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <GlassCard className="p-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Filename:</span>
                        <span className="text-white">{document.original_filename}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">File Size:</span>
                        <span className="text-white">{formatFileSize(document.file_size)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">MIME Type:</span>
                        <span className="text-white">{document.mime_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Document Type:</span>
                        <span className="text-white capitalize">{document.document_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Version:</span>
                        <span className="text-white">{document.version}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Created:</span>
                        <span className="text-white">{formatDate(document.created_at)}</span>
                      </div>
                      {document.updated_at && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Updated:</span>
                          <span className="text-white">{formatDate(document.updated_at)}</span>
                        </div>
                      )}
                    </div>
                  </GlassCard>

                  {/* Processing Status */}
                  <GlassCard className="p-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Processing Status</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Status:</span>
                        <div className="flex items-center space-x-2">
                          {getProcessingStatusIcon(document.processing_status)}
                          <span className="text-white capitalize">{document.processing_status}</span>
                        </div>
                      </div>
                      {document.processing_started_at && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Started:</span>
                          <span className="text-white">{formatDate(document.processing_started_at)}</span>
                        </div>
                      )}
                      {document.processing_completed_at && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Completed:</span>
                          <span className="text-white">{formatDate(document.processing_completed_at)}</span>
                        </div>
                      )}
                      {document.processing_error && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Error:</span>
                          <span className="text-red-400 text-sm">{document.processing_error}</span>
                        </div>
                      )}
                    </div>
                  </GlassCard>

                  {/* AI Classification */}
                  {document.classification && (
                    <GlassCard className="p-4">
                      <h3 className="text-lg font-semibold text-white mb-4">AI Classification</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Classification:</span>
                          <span className="text-white capitalize">{document.classification}</span>
                        </div>
                        {document.classification_confidence && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Confidence:</span>
                            <span className="text-white">
                              {Math.round(document.classification_confidence * 100)}%
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-400">Is Invoice:</span>
                          <span className="text-white">{document.is_invoice ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Is Contract:</span>
                          <span className="text-white">{document.is_contract ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Is Receipt:</span>
                          <span className="text-white">{document.is_receipt ? 'Yes' : 'No'}</span>
                        </div>
                      </div>
                    </GlassCard>
                  )}

                  {/* Business Data */}
                  {(document.is_invoice || document.is_contract || document.is_receipt) && (
                    <GlassCard className="p-4">
                      <h3 className="text-lg font-semibold text-white mb-4">Business Data</h3>
                      <div className="space-y-3">
                        {document.invoice_number && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Invoice #:</span>
                            <span className="text-white">{document.invoice_number}</span>
                          </div>
                        )}
                        {document.invoice_date && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Invoice Date:</span>
                            <span className="text-white">{formatDate(document.invoice_date)}</span>
                          </div>
                        )}
                        {document.invoice_amount && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Amount:</span>
                            <span className="text-white">
                              {document.invoice_currency} {document.invoice_amount.toFixed(2)}
                            </span>
                          </div>
                        )}
                        {document.vendor_name && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Vendor:</span>
                            <span className="text-white">{document.vendor_name}</span>
                          </div>
                        )}
                        {document.customer_name && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Customer:</span>
                            <span className="text-white">{document.customer_name}</span>
                          </div>
                        )}
                      </div>
                    </GlassCard>
                  )}
                </div>

                {/* Tags and Keywords */}
                {(document.tags.length > 0 || document.keywords.length > 0) && (
                  <GlassCard className="p-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Tags & Keywords</h3>
                    <div className="space-y-4">
                      {document.tags.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-300 mb-2">Tags</h4>
                          <div className="flex flex-wrap gap-2">
                            {document.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-sm"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {document.keywords.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-300 mb-2">Keywords</h4>
                          <div className="flex flex-wrap gap-2">
                            {document.keywords.map((keyword, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-sm"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </GlassCard>
                )}
              </div>
            )}

            {activeTab === 'ocr' && (
              <div className="p-6">
                <GlassCard className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">OCR Text</h3>
                  {document.ocr_text ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>Confidence: {document.ocr_confidence ? Math.round(document.ocr_confidence * 100) : 'N/A'}%</span>
                        <span>Language: {document.ocr_language || 'Unknown'}</span>
                      </div>
                      <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
                        <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                          {document.ocr_text}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <FileText className="w-12 h-12 mx-auto mb-4" />
                      <p>No OCR text available for this document</p>
                    </div>
                  )}
                </GlassCard>
              </div>
            )}

            {activeTab === 'analysis' && (
              <div className="p-6 space-y-6">
                {/* Vision Analysis */}
                {document.vision_analysis && (
                  <GlassCard className="p-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Vision Analysis</h3>
                    <div className="space-y-3">
                      {document.detected_objects && document.detected_objects.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-300 mb-2">Detected Objects</h4>
                          <div className="flex flex-wrap gap-2">
                            {document.detected_objects.map((obj, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-sm"
                              >
                                {obj}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="text-sm text-gray-400">
                        Confidence: {Math.round((document.vision_analysis.confidence || 0) * 100)}%
                      </div>
                    </div>
                  </GlassCard>
                )}

                {/* Layout Analysis */}
                {document.layout_analysis && Object.keys(document.layout_analysis).length > 0 && (
                  <GlassCard className="p-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Layout Analysis</h3>
                    <div className="bg-gray-900 rounded-lg p-4">
                      <pre className="text-sm text-gray-300 overflow-x-auto">
                        {JSON.stringify(document.layout_analysis, null, 2)}
                      </pre>
                    </div>
                  </GlassCard>
                )}

                {/* Text Regions */}
                {document.text_regions && document.text_regions.length > 0 && (
                  <GlassCard className="p-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Text Regions</h3>
                    <div className="space-y-2">
                      {document.text_regions.map((region, index) => (
                        <div key={index} className="bg-gray-900 rounded p-3">
                          <div className="text-sm text-gray-300 mb-1">{region.text}</div>
                          <div className="text-xs text-gray-500">
                            Confidence: {Math.round((region.confidence || 0) * 100)}% • 
                            BBox: [{region.bbox?.join(', ')}]
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DocumentViewer;
