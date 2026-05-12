import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { api } from '../../../lib/api';
import type { Document, DocumentFilters, DocumentSearch } from '../types';

export type { Document, DocumentFilters, DocumentSearch };

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
          const state = get();
          const searchParams =
            search ??
            ({
              query: state.searchQuery || undefined,
              document_type: state.filters.document_type || undefined,
              classification: state.filters.classification || undefined,
              tags: state.filters.tags.length > 0 ? state.filters.tags : undefined,
              is_invoice: state.filters.is_invoice ?? undefined,
              is_contract: state.filters.is_contract ?? undefined,
              is_receipt: state.filters.is_receipt ?? undefined,
              processing_status: state.filters.processing_status || undefined,
              created_after: state.filters.created_after || undefined,
              created_before: state.filters.created_before || undefined,
              limit: state.pageSize,
              offset: (state.currentPage - 1) * state.pageSize,
            } satisfies DocumentSearch);

          const params = new URLSearchParams();

          if (searchParams.query) params.append('search', searchParams.query);
          if (searchParams.document_type) params.append('document_type', searchParams.document_type);
          if (searchParams.classification) params.append('classification', searchParams.classification);
          if (searchParams.tags && searchParams.tags.length > 0) {
            params.append('tags', searchParams.tags.join(','));
          }
          if (searchParams.is_invoice !== undefined) params.append('is_invoice', String(searchParams.is_invoice));
          if (searchParams.is_contract !== undefined) params.append('is_contract', String(searchParams.is_contract));
          if (searchParams.is_receipt !== undefined) params.append('is_receipt', String(searchParams.is_receipt));
          if (searchParams.processing_status)
            params.append('processing_status', searchParams.processing_status);
          if (searchParams.created_after) params.append('created_after', searchParams.created_after);
          if (searchParams.created_before) params.append('created_before', searchParams.created_before);

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
          
          const doc = get().documents.find((d) => d.id === documentId);
          if (!doc) return;

          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = window.document.createElement('a');
          link.href = url;
          link.setAttribute('download', doc.original_filename);
          window.document.body.appendChild(link);
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
