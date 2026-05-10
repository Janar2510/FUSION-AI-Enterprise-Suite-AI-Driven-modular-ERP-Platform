import { create } from 'zustand';
import axios from 'axios';
import { SignatureRequest, SignatureStatus } from '../types';

const API = '/api/sign';

interface SignState {
  signatureRequests: SignatureRequest[];
  selectedRequest: SignatureRequest | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchRequests: (filters?: { status?: string; is_urgent?: boolean }) => Promise<void>;
  addSignatureRequest: (request: Omit<SignatureRequest, 'id' | 'created_at' | 'updated_at'>) => Promise<SignatureRequest>;
  updateSignatureRequest: (id: number, updates: Partial<SignatureRequest>) => Promise<void>;
  selectRequest: (id: number | null) => void;
  updateSignatureStatus: (requestId: number, status: SignatureStatus) => Promise<void>;
  addSignature: (requestId: number, signerId: number, signatureData: string, method?: string) => Promise<void>;
  removeSignatureRequest: (id: number) => Promise<void>;
}

export const useSignStore = create<SignState>((set, get) => ({
  signatureRequests: [],
  selectedRequest: null,
  loading: false,
  error: null,

  fetchRequests: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.is_urgent !== undefined) params.set('is_urgent', String(filters.is_urgent));
      params.set('limit', '100');
      const { data } = await axios.get(`${API}/requests?${params}`);
      set({ signatureRequests: data.data ?? data.records ?? data, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error ?? err.message, loading: false });
    }
  },

  addSignatureRequest: async (request) => {
    set({ loading: true, error: null });
    const payload = {
      document_title: request.document_title,
      document_url: request.document_url,
      due_date: request.due_date,
      is_urgent: request.is_urgent,
      requires_witness: request.requires_witness,
      witness_email: request.witness_email,
      witness_name: request.witness_name,
      message: request.message,
      metadata: request.metadata,
      signers: request.signers.map(s => ({ name: s.name, email: s.email, role: s.role })),
    };
    try {
      const { data } = await axios.post(`${API}/requests`, payload);
      set(state => ({
        signatureRequests: [data, ...state.signatureRequests],
        loading: false,
      }));
      return data;
    } catch (err: any) {
      set({ error: err.response?.data?.error ?? err.message, loading: false });
      throw err;
    }
  },

  updateSignatureRequest: async (id, updates) => {
    const payload: Record<string, any> = {};
    if (updates.document_title !== undefined) payload.document_title = updates.document_title;
    if (updates.document_url !== undefined) payload.document_url = updates.document_url;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.due_date !== undefined) payload.due_date = updates.due_date;
    if (updates.is_urgent !== undefined) payload.is_urgent = updates.is_urgent;
    if (updates.requires_witness !== undefined) payload.requires_witness = updates.requires_witness;
    if (updates.witness_email !== undefined) payload.witness_email = updates.witness_email;
    if (updates.witness_name !== undefined) payload.witness_name = updates.witness_name;
    if (updates.message !== undefined) payload.message = updates.message;
    if (updates.metadata !== undefined) payload.metadata = updates.metadata;

    const { data } = await axios.put(`${API}/requests/${id}`, payload);
    set(state => ({
      signatureRequests: state.signatureRequests.map(r => r.id === id ? data : r),
      selectedRequest: state.selectedRequest?.id === id ? data : state.selectedRequest,
    }));
  },

  selectRequest: (id) =>
    set(state => ({
      selectedRequest: id
        ? state.signatureRequests.find(r => r.id === id) ?? null
        : null,
    })),

  updateSignatureStatus: async (requestId, status) => {
    await get().updateSignatureRequest(requestId, { status });
  },

  addSignature: async (requestId, signerId, signatureData, method = 'draw') => {
    const { data } = await axios.put(`${API}/requests/${requestId}/sign`, {
      signer_id: signerId,
      signature_data: signatureData,
      signature_method: method,
    });
    set(state => ({
      signatureRequests: state.signatureRequests.map(r => r.id === requestId ? data : r),
      selectedRequest: state.selectedRequest?.id === requestId ? data : state.selectedRequest,
    }));
  },

  removeSignatureRequest: async (id) => {
    await axios.delete(`${API}/requests/${id}`);
    set(state => ({
      signatureRequests: state.signatureRequests.filter(r => r.id !== id),
      selectedRequest: state.selectedRequest?.id === id ? null : state.selectedRequest,
    }));
  },
}));
