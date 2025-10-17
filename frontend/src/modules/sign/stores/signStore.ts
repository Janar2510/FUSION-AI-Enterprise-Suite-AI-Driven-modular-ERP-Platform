import { create } from 'zustand';
import { SignatureRequest, Signer, SignatureStatus } from '../types';

interface SignState {
  signatureRequests: SignatureRequest[];
  selectedRequest: SignatureRequest | null;
  signatures: Array<{
    id: string;
    requestId: number;
    signerId: number;
    signatureData: string;
    signedAt: string;
    method: 'draw' | 'type' | 'upload';
  }>;
  
  // Actions
  addSignatureRequest: (request: SignatureRequest) => void;
  updateSignatureRequest: (id: number, updates: Partial<SignatureRequest>) => void;
  selectRequest: (id: number | null) => void;
  updateSignatureStatus: (requestId: number, status: SignatureStatus) => void;
  addSignature: (requestId: number, signerId: number, signatureData: string) => void;
  updateSignerStatus: (requestId: number, signerId: number, status: SignatureStatus) => void;
  removeSignatureRequest: (id: number) => void;
  clearSignatures: () => void;
}

export const useSignStore = create<SignState>((set, get) => ({
  signatureRequests: [
    // Sample data
    {
      id: 1,
      document_title: 'Service Agreement Contract',
      document_url: '/documents/service-agreement.pdf',
      status: 'in_progress',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T14:30:00Z',
      due_date: '2024-01-20T17:00:00Z',
      signers: [
        {
          id: 1,
          name: 'John Doe',
          email: 'john.doe@example.com',
          role: 'client',
          status: 'signed',
          signed_at: '2024-01-15T11:30:00Z',
          signature_data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          signature_method: 'draw',
          ip_address: '192.168.1.100',
          verification_status: 'verified'
        },
        {
          id: 2,
          name: 'Jane Smith',
          email: 'jane.smith@company.com',
          role: 'service_provider',
          status: 'pending',
          signed_at: null,
          signature_data: null,
          signature_method: null,
          ip_address: null,
          verification_status: null
        }
      ],
      created_by: 1,
      is_urgent: false,
      requires_witness: false,
      witness_email: null,
      witness_name: null,
      witness_signed_at: null,
      witness_signature_data: null,
      witness_ip_address: null,
      message: 'Please review and sign the service agreement contract.',
      metadata: {
        contract_type: 'service',
        value: 5000,
        currency: 'USD',
        duration: '12 months'
      }
    },
    {
      id: 2,
      document_title: 'NDA - Confidentiality Agreement',
      document_url: '/documents/nda.pdf',
      status: 'pending',
      created_at: '2024-01-16T09:00:00Z',
      updated_at: null,
      due_date: '2024-01-22T17:00:00Z',
      signers: [
        {
          id: 3,
          name: 'Alice Johnson',
          email: 'alice.johnson@partner.com',
          role: 'other',
          status: 'pending',
          signed_at: null,
          signature_data: null,
          signature_method: null,
          ip_address: null,
          verification_status: null
        }
      ],
      created_by: 1,
      is_urgent: true,
      requires_witness: false,
      witness_email: null,
      witness_name: null,
      witness_signed_at: null,
      witness_signature_data: null,
      witness_ip_address: null,
      message: 'This is an urgent NDA that needs to be signed before our meeting tomorrow.',
      metadata: {
        agreement_type: 'nda',
        confidentiality_level: 'high',
        duration: '5 years'
      }
    },
    {
      id: 3,
      document_title: 'Employment Contract',
      document_url: '/documents/employment-contract.pdf',
      status: 'signed',
      created_at: '2024-01-10T14:00:00Z',
      updated_at: '2024-01-12T16:45:00Z',
      due_date: '2024-01-15T17:00:00Z',
      signers: [
        {
          id: 4,
          name: 'Bob Wilson',
          email: 'bob.wilson@company.com',
          role: 'employee',
          status: 'signed',
          signed_at: '2024-01-12T16:30:00Z',
          signature_data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          signature_method: 'type',
          ip_address: '192.168.1.101',
          verification_status: 'verified'
        },
        {
          id: 5,
          name: 'HR Manager',
          email: 'hr@company.com',
          role: 'hr_manager',
          status: 'signed',
          signed_at: '2024-01-12T16:45:00Z',
          signature_data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          signature_method: 'draw',
          ip_address: '192.168.1.102',
          verification_status: 'verified'
        }
      ],
      created_by: 1,
      is_urgent: false,
      requires_witness: true,
      witness_email: 'witness@company.com',
      witness_name: 'Legal Witness',
      witness_signed_at: '2024-01-12T16:50:00Z',
      witness_signature_data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      witness_ip_address: '192.168.1.103',
      message: 'Employment contract for new hire - requires witness signature.',
      metadata: {
        position: 'Software Engineer',
        salary: 75000,
        currency: 'USD',
        start_date: '2024-02-01',
        department: 'Engineering'
      }
    }
  ],
  selectedRequest: null,
  signatures: [],

  addSignatureRequest: (request) => 
    set((state) => ({ 
      signatureRequests: [...state.signatureRequests, request] 
    })),

  updateSignatureRequest: (id, updates) =>
    set((state) => ({
      signatureRequests: state.signatureRequests.map((request) =>
        request.id === id ? { ...request, ...updates, updated_at: new Date().toISOString() } : request
      ),
      selectedRequest: state.selectedRequest?.id === id 
        ? { ...state.selectedRequest, ...updates, updated_at: new Date().toISOString() }
        : state.selectedRequest
    })),

  selectRequest: (id) =>
    set((state) => ({
      selectedRequest: id 
        ? state.signatureRequests.find((request) => request.id === id) || null
        : null
    })),

  updateSignatureStatus: (requestId, status) =>
    set((state) => ({
      signatureRequests: state.signatureRequests.map((request) =>
        request.id === requestId 
          ? { ...request, status, updated_at: new Date().toISOString() }
          : request
      ),
      selectedRequest: state.selectedRequest?.id === requestId
        ? { ...state.selectedRequest, status, updated_at: new Date().toISOString() }
        : state.selectedRequest
    })),

  addSignature: (requestId, signerId, signatureData) => {
    const newSignature = {
      id: `sig-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      requestId,
      signerId,
      signatureData,
      signedAt: new Date().toISOString(),
      method: 'draw' as const
    };

    set((state) => ({
      signatures: [...state.signatures, newSignature],
      signatureRequests: state.signatureRequests.map((request) =>
        request.id === requestId
          ? {
              ...request,
              signers: request.signers.map((signer) =>
                signer.id === signerId
                  ? {
                      ...signer,
                      status: 'signed',
                      signed_at: newSignature.signedAt,
                      signature_data: signatureData,
                      signature_method: 'draw',
                      ip_address: '192.168.1.100', // This would come from the actual request
                      verification_status: 'verified'
                    }
                  : signer
              ),
              updated_at: new Date().toISOString()
            }
          : request
      ),
      selectedRequest: state.selectedRequest?.id === requestId
        ? {
            ...state.selectedRequest,
            signers: state.selectedRequest.signers.map((signer) =>
              signer.id === signerId
                ? {
                    ...signer,
                    status: 'signed',
                    signed_at: newSignature.signedAt,
                    signature_data: signatureData,
                    signature_method: 'draw',
                    ip_address: '192.168.1.100',
                    verification_status: 'verified'
                  }
                : signer
            ),
            updated_at: new Date().toISOString()
          }
        : state.selectedRequest
    }));
  },

  updateSignerStatus: (requestId, signerId, status) =>
    set((state) => ({
      signatureRequests: state.signatureRequests.map((request) =>
        request.id === requestId
          ? {
              ...request,
              signers: request.signers.map((signer) =>
                signer.id === signerId ? { ...signer, status } : signer
              ),
              updated_at: new Date().toISOString()
            }
          : request
      ),
      selectedRequest: state.selectedRequest?.id === requestId
        ? {
            ...state.selectedRequest,
            signers: state.selectedRequest.signers.map((signer) =>
              signer.id === signerId ? { ...signer, status } : signer
            ),
            updated_at: new Date().toISOString()
          }
        : state.selectedRequest
    })),

  removeSignatureRequest: (id) =>
    set((state) => ({
      signatureRequests: state.signatureRequests.filter((request) => request.id !== id),
      selectedRequest: state.selectedRequest?.id === id ? null : state.selectedRequest,
      signatures: state.signatures.filter((signature) => signature.requestId !== id)
    })),

  clearSignatures: () =>
    set(() => ({
      signatureRequests: [],
      selectedRequest: null,
      signatures: []
    }))
}));
