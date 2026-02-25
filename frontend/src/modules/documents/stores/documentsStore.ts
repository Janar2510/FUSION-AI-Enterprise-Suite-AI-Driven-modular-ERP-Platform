import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { api } from '../../../lib/api';

export interface Document {
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

export interface DocumentFilters {
  document_type: string;
  classification: string;
  tags: string[];
  is_invoice: boolean | null;
  is_contract: boolean | null;
  is_receipt: boolean | null;
  processing_status: string;
  created_after: string;
  created_before: string;
}

export interface DocumentSearch {
  query: string;
  filters: DocumentFilters;
  limit: number;
  offset: number;
}

export interface DocumentsState {
  // Data
  documents: Document[];
  selectedDocument: Document | null;
  searchQuery: string;
  filters: DocumentFilters;
  viewMode: 'grid' | 'list';
  
  // UI State
  loading: boolean;
  error: string | null;
  showUploadModal: boolean;
  showFilters: boolean;
  uploading: boolean;
  uploadProgress: number;
  
  // Pagination
  totalCount: number;
  currentPage: number;
  pageSize: number;
  hasMore: boolean;
  
  // Actions
  fetchDocuments: (search?: DocumentSearch) => Promise<void>;
  uploadDocuments: (files: FileList) => Promise<void>;
  downloadDocument: (documentId: number) => Promise<void>;
  deleteDocument: (documentId: number) => Promise<void>;
  shareDocument: (documentId: number, permissions: any) => Promise<string>;
  processDocument: (documentId: number) => Promise<void>;
  updateDocument: (documentId: number, updates: Partial<Document>) => Promise<void>;
  
  // Search and Filter
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<DocumentFilters>) => void;
  clearFilters: () => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  
  // UI Actions
  setSelectedDocument: (document: Document | null) => void;
  setShowUploadModal: (show: boolean) => void;
  setShowFilters: (show: boolean) => void;
  setUploading: (uploading: boolean) => void;
  setUploadProgress: (progress: number) => void;
  
  // Pagination
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  loadMore: () => Promise<void>;
}

const initialFilters: DocumentFilters = {
  document_type: '',
  classification: '',
  tags: [],
  is_invoice: null,
  is_contract: null,
  is_receipt: null,
  processing_status: '',
  created_after: '',
  created_before: ''
};

export const useDocumentsStore = create<DocumentsState>()(
  devtools(
    (set, get) => ({
      // Initial State
      documents: [],
      selectedDocument: null,
      searchQuery: '',
      filters: initialFilters,
      viewMode: 'grid',
      loading: false,
      error: null,
      showUploadModal: false,
      showFilters: false,
      uploading: false,
      uploadProgress: 0,
      totalCount: 0,
      currentPage: 1,
      pageSize: 50,
      hasMore: false,

      // Data Actions
      fetchDocuments: async (search?: DocumentSearch) => {
        set({ loading: true, error: null });
        
        try {
          const searchParams = search || get();
          const params = new URLSearchParams();
          
          if (searchParams.query) params.append('search', searchParams.query);
          if (searchParams.filters.document_type) params.append('document_type', searchParams.filters.document_type);
          if (searchParams.filters.classification) params.append('classification', searchParams.filters.classification);
          if (searchParams.filters.tags.length > 0) params.append('tags', searchParams.filters.tags.join(','));
          if (searchParams.filters.is_invoice !== null) params.append('is_invoice', searchParams.filters.is_invoice.toString());
          if (searchParams.filters.is_contract !== null) params.append('is_contract', searchParams.filters.is_contract.toString());
          if (searchParams.filters.is_receipt !== null) params.append('is_receipt', searchParams.filters.is_receipt.toString());
          if (searchParams.filters.processing_status) params.append('processing_status', searchParams.filters.processing_status);
          if (searchParams.filters.created_after) params.append('created_after', searchParams.filters.created_after);
          if (searchParams.filters.created_before) params.append('created_before', searchParams.filters.created_before);
          
          params.append('limit', searchParams.limit.toString());
          params.append('offset', searchParams.offset.toString());

          const response = await api.get(`/api/v1/documents?${params.toString()}`);
          
          set({
            documents: response.data,
            loading: false,
            totalCount: response.data.length, // This would come from the API in a real implementation
            hasMore: response.data.length === searchParams.limit
          });
        } catch (error) {
          console.error('Failed to fetch documents:', error);
          set({
            error: 'Failed to load documents',
            loading: false
          });
        }
      },

      uploadDocuments: async (files: FileList) => {
        set({ uploading: true, uploadProgress: 0 });
        
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
                set({ uploadProgress: progress });
              },
            });

            return response.data;
          });

          const uploadedDocuments = await Promise.all(uploadPromises);
          
          set((state) => ({
            documents: [...uploadedDocuments, ...state.documents],
            uploading: false,
            uploadProgress: 0,
            showUploadModal: false
          }));
        } catch (error) {
          console.error('Upload failed:', error);
          set({
            error: 'Upload failed',
            uploading: false,
            uploadProgress: 0
          });
        }
      },

      downloadDocument: async (documentId: number) => {
        try {
          const response = await api.get(`/api/v1/documents/${documentId}/download`, {
            responseType: 'blob'
          });
          
          const document = get().documents.find(doc => doc.id === documentId);
          if (!document) return;
          
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', document.original_filename);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Download failed:', error);
          set({ error: 'Download failed' });
        }
      },

      deleteDocument: async (documentId: number) => {
        try {
          await api.delete(`/api/v1/documents/${documentId}`);
          
          set((state) => ({
            documents: state.documents.filter(doc => doc.id !== documentId),
            selectedDocument: state.selectedDocument?.id === documentId ? null : state.selectedDocument
          }));
        } catch (error) {
          console.error('Delete failed:', error);
          set({ error: 'Delete failed' });
        }
      },

      shareDocument: async (documentId: number, permissions: any) => {
        try {
          const response = await api.post(`/api/v1/documents/${documentId}/share`, {
            can_view: true,
            can_download: true,
            can_comment: true,
            ...permissions
          });
          
          const shareUrl = `${window.location.origin}/documents/shared/${response.data.share_token}`;
          await navigator.clipboard.writeText(shareUrl);
          
          return shareUrl;
        } catch (error) {
          console.error('Share failed:', error);
          set({ error: 'Share failed' });
          throw error;
        }
      },

      processDocument: async (documentId: number) => {
        try {
          await api.post(`/api/v1/documents/${documentId}/process`);
          await get().fetchDocuments();
        } catch (error) {
          console.error('Processing failed:', error);
          set({ error: 'Processing failed' });
        }
      },

      updateDocument: async (documentId: number, updates: Partial<Document>) => {
        try {
          const response = await api.put(`/api/v1/documents/${documentId}`, updates);
          
          set((state) => ({
            documents: state.documents.map(doc =>
              doc.id === documentId ? { ...doc, ...response.data } : doc
            ),
            selectedDocument: state.selectedDocument?.id === documentId 
              ? { ...state.selectedDocument, ...response.data }
              : state.selectedDocument
          }));
        } catch (error) {
          console.error('Update failed:', error);
          set({ error: 'Update failed' });
        }
      },

      // Search and Filter Actions
      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
        get().fetchDocuments();
      },

      setFilters: (filters: Partial<DocumentFilters>) => {
        set((state) => ({
          filters: { ...state.filters, ...filters }
        }));
        get().fetchDocuments();
      },

      clearFilters: () => {
        set({ filters: initialFilters });
        get().fetchDocuments();
      },

      setViewMode: (mode: 'grid' | 'list') => {
        set({ viewMode: mode });
      },

      // UI Actions
      setSelectedDocument: (document: Document | null) => {
        set({ selectedDocument: document });
      },

      setShowUploadModal: (show: boolean) => {
        set({ showUploadModal: show });
      },

      setShowFilters: (show: boolean) => {
        set({ showFilters: show });
      },

      setUploading: (uploading: boolean) => {
        set({ uploading });
      },

      setUploadProgress: (progress: number) => {
        set({ uploadProgress: progress });
      },

      // Pagination Actions
      setCurrentPage: (page: number) => {
        set({ currentPage: page });
        get().fetchDocuments();
      },

      setPageSize: (size: number) => {
        set({ pageSize: size, currentPage: 1 });
        get().fetchDocuments();
      },

      loadMore: async () => {
        const { currentPage, pageSize, hasMore } = get();
        
        if (!hasMore) return;
        
        const nextPage = currentPage + 1;
        const offset = nextPage * pageSize;
        
        try {
          const searchParams = {
            query: get().searchQuery,
            filters: get().filters,
            limit: pageSize,
            offset
          };
          
          const params = new URLSearchParams();
          if (searchParams.query) params.append('search', searchParams.query);
          if (searchParams.filters.document_type) params.append('document_type', searchParams.filters.document_type);
          if (searchParams.filters.classification) params.append('classification', searchParams.filters.classification);
          if (searchParams.filters.tags.length > 0) params.append('tags', searchParams.filters.tags.join(','));
          if (searchParams.filters.is_invoice !== null) params.append('is_invoice', searchParams.filters.is_invoice.toString());
          if (searchParams.filters.is_contract !== null) params.append('is_contract', searchParams.filters.is_contract.toString());
          if (searchParams.filters.is_receipt !== null) params.append('is_receipt', searchParams.filters.is_receipt.toString());
          if (searchParams.filters.processing_status) params.append('processing_status', searchParams.filters.processing_status);
          if (searchParams.filters.created_after) params.append('created_after', searchParams.filters.created_after);
          if (searchParams.filters.created_before) params.append('created_before', searchParams.filters.created_before);
          
          params.append('limit', searchParams.limit.toString());
          params.append('offset', searchParams.offset.toString());

          const response = await api.get(`/api/v1/documents?${params.toString()}`);
          
          set((state) => ({
            documents: [...state.documents, ...response.data],
            currentPage: nextPage,
            hasMore: response.data.length === pageSize
          }));
        } catch (error) {
          console.error('Load more failed:', error);
          set({ error: 'Failed to load more documents' });
        }
      }
    }),
    {
      name: 'documents-store',
    }
  )
);
