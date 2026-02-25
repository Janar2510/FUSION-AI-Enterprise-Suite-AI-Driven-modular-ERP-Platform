import { useEffect, useState, useCallback } from 'react';
import { useSignStore } from '../stores/signStore';
import { SignatureRequest, Signer, SignatureStatus } from '../types';
// import { fetchSignatureRequests, createSignatureRequest, updateSignatureRequest, deleteSignatureRequest } from '../api';

export const useSign = (userId?: string) => {
  const { 
    signatureRequests, 
    selectedRequest, 
    addSignatureRequest,
    updateSignatureRequest,
    selectRequest,
    updateSignatureStatus,
    addSignature,
    updateSignerStatus,
    removeSignatureRequest
  } = useSignStore();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSignatureRequests = async () => {
      if (!userId) return;
      
      setLoading(true);
      setError(null);
      try {
        // const requests = await fetchSignatureRequests(userId);
        // useSignStore.setState({ signatureRequests: requests });
        // For now, using sample data from store
      } catch (err) {
        setError('Failed to load signature requests.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadSignatureRequests();
  }, [userId]);

  const handleCreateSignatureRequest = useCallback(async (requestData: Omit<SignatureRequest, 'id' | 'created_at' | 'updated_at'>) => {
    setLoading(true);
    try {
      // const newRequest = await createSignatureRequest(requestData);
      // addSignatureRequest(newRequest);
      
      // For now, create a mock request
      const newRequest: SignatureRequest = {
        ...requestData,
        id: Date.now(),
        created_at: new Date().toISOString(),
        updated_at: null
      };
      addSignatureRequest(newRequest);
    } catch (err) {
      setError('Failed to create signature request.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [addSignatureRequest]);

  const handleUpdateSignatureRequest = useCallback(async (id: number, updates: Partial<SignatureRequest>) => {
    setLoading(true);
    try {
      // await updateSignatureRequest(id, updates);
      updateSignatureRequest(id, updates);
    } catch (err) {
      setError('Failed to update signature request.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [updateSignatureRequest]);

  const handleDeleteSignatureRequest = useCallback(async (id: number) => {
    setLoading(true);
    try {
      // await deleteSignatureRequest(id);
      removeSignatureRequest(id);
    } catch (err) {
      setError('Failed to delete signature request.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [removeSignatureRequest]);

  const handleSignDocument = useCallback(async (requestId: number, signerId: number, signatureData: string) => {
    setLoading(true);
    try {
      // await signDocument(requestId, signerId, signatureData);
      addSignature(requestId, signerId, signatureData);
    } catch (err) {
      setError('Failed to sign document.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [addSignature]);

  const handleRejectSignature = useCallback(async (requestId: number, signerId: number) => {
    setLoading(true);
    try {
      // await rejectSignature(requestId, signerId);
      updateSignerStatus(requestId, signerId, 'rejected');
    } catch (err) {
      setError('Failed to reject signature.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [updateSignerStatus]);

  const handleApproveRequest = useCallback(async (requestId: number) => {
    setLoading(true);
    try {
      // await approveRequest(requestId);
      updateSignatureStatus(requestId, 'approved');
    } catch (err) {
      setError('Failed to approve request.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [updateSignatureStatus]);

  const handleRejectRequest = useCallback(async (requestId: number) => {
    setLoading(true);
    try {
      // await rejectRequest(requestId);
      updateSignatureStatus(requestId, 'rejected');
    } catch (err) {
      setError('Failed to reject request.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [updateSignatureStatus]);

  const handleExtendDeadline = useCallback(async (requestId: number, newDueDate: string) => {
    setLoading(true);
    try {
      // await extendDeadline(requestId, newDueDate);
      updateSignatureRequest(requestId, { due_date: newDueDate });
    } catch (err) {
      setError('Failed to extend deadline.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [updateSignatureRequest]);

  const handleSendReminder = useCallback(async (requestId: number, signerId: number) => {
    setLoading(true);
    try {
      // await sendReminder(requestId, signerId);
      console.log('Reminder sent to signer', signerId, 'for request', requestId);
    } catch (err) {
      setError('Failed to send reminder.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBulkAction = useCallback(async (requestIds: number[], action: string, parameters?: any) => {
    setLoading(true);
    try {
      // await bulkAction(requestIds, action, parameters);
      console.log('Bulk action', action, 'on requests', requestIds, 'with parameters', parameters);
    } catch (err) {
      setError('Failed to perform bulk action.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getRequestStats = useCallback(() => {
    const total = signatureRequests.length;
    const pending = signatureRequests.filter(req => req.status === 'pending').length;
    const inProgress = signatureRequests.filter(req => req.status === 'in_progress').length;
    const completed = signatureRequests.filter(req => req.status === 'signed').length;
    const rejected = signatureRequests.filter(req => req.status === 'rejected').length;
    const expired = signatureRequests.filter(req => req.status === 'expired').length;
    const urgent = signatureRequests.filter(req => req.is_urgent).length;

    return {
      total,
      pending,
      inProgress,
      completed,
      rejected,
      expired,
      urgent,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
      rejectionRate: total > 0 ? (rejected / total) * 100 : 0
    };
  }, [signatureRequests]);

  const getSignerStats = useCallback(() => {
    const allSigners = signatureRequests.flatMap(req => req.signers);
    const totalSigners = allSigners.length;
    const signedSigners = allSigners.filter(signer => signer.status === 'signed').length;
    const pendingSigners = allSigners.filter(signer => signer.status === 'pending').length;
    const rejectedSigners = allSigners.filter(signer => signer.status === 'rejected').length;

    return {
      total: totalSigners,
      signed: signedSigners,
      pending: pendingSigners,
      rejected: rejectedSigners,
      completionRate: totalSigners > 0 ? (signedSigners / totalSigners) * 100 : 0
    };
  }, [signatureRequests]);

  const getOverdueRequests = useCallback(() => {
    const now = new Date();
    return signatureRequests.filter(req => {
      const dueDate = new Date(req.due_date);
      return dueDate < now && !['signed', 'approved', 'rejected'].includes(req.status);
    });
  }, [signatureRequests]);

  const getUpcomingDeadlines = useCallback(() => {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    
    return signatureRequests.filter(req => {
      const dueDate = new Date(req.due_date);
      return dueDate > now && dueDate <= threeDaysFromNow && !['signed', 'approved', 'rejected'].includes(req.status);
    });
  }, [signatureRequests]);

  const searchRequests = useCallback((query: string) => {
    if (!query.trim()) return signatureRequests;
    
    const lowercaseQuery = query.toLowerCase();
    return signatureRequests.filter(req => 
      req.document_title.toLowerCase().includes(lowercaseQuery) ||
      req.message.toLowerCase().includes(lowercaseQuery) ||
      req.signers.some(signer => 
        signer.name.toLowerCase().includes(lowercaseQuery) ||
        signer.email.toLowerCase().includes(lowercaseQuery)
      )
    );
  }, [signatureRequests]);

  const filterRequestsByStatus = useCallback((status: SignatureStatus[]) => {
    return signatureRequests.filter(req => status.includes(req.status));
  }, [signatureRequests]);

  const filterRequestsBySigner = useCallback((signerEmail: string) => {
    return signatureRequests.filter(req => 
      req.signers.some(signer => signer.email.toLowerCase().includes(signerEmail.toLowerCase()))
    );
  }, [signatureRequests]);

  const filterRequestsByDateRange = useCallback((startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return signatureRequests.filter(req => {
      const createdDate = new Date(req.created_at);
      return createdDate >= start && createdDate <= end;
    });
  }, [signatureRequests]);

  const getRequestById = useCallback((id: number) => {
    return signatureRequests.find(req => req.id === id);
  }, [signatureRequests]);

  const getSignerById = useCallback((requestId: number, signerId: number) => {
    const request = getRequestById(requestId);
    return request?.signers.find(signer => signer.id === signerId);
  }, [getRequestById]);

  const isRequestComplete = useCallback((requestId: number) => {
    const request = getRequestById(requestId);
    if (!request) return false;
    
    return request.signers.every(signer => signer.status === 'signed');
  }, [getRequestById]);

  const isRequestOverdue = useCallback((requestId: number) => {
    const request = getRequestById(requestId);
    if (!request) return false;
    
    const dueDate = new Date(request.due_date);
    const now = new Date();
    return dueDate < now && !['signed', 'approved', 'rejected'].includes(request.status);
  }, [getRequestById]);

  const getRequestProgress = useCallback((requestId: number) => {
    const request = getRequestById(requestId);
    if (!request) return 0;
    
    const signedCount = request.signers.filter(signer => signer.status === 'signed').length;
    return (signedCount / request.signers.length) * 100;
  }, [getRequestById]);

  return {
    // Data
    signatureRequests,
    selectedRequest,
    loading,
    error,
    
    // Actions
    createSignatureRequest: handleCreateSignatureRequest,
    updateSignatureRequest: handleUpdateSignatureRequest,
    deleteSignatureRequest: handleDeleteSignatureRequest,
    selectRequest,
    signDocument: handleSignDocument,
    rejectSignature: handleRejectSignature,
    approveRequest: handleApproveRequest,
    rejectRequest: handleRejectRequest,
    extendDeadline: handleExtendDeadline,
    sendReminder: handleSendReminder,
    bulkAction: handleBulkAction,
    
    // Computed values
    requestStats: getRequestStats(),
    signerStats: getSignerStats(),
    overdueRequests: getOverdueRequests(),
    upcomingDeadlines: getUpcomingDeadlines(),
    
    // Search and filter
    searchRequests,
    filterRequestsByStatus,
    filterRequestsBySigner,
    filterRequestsByDateRange,
    getRequestById,
    getSignerById,
    isRequestComplete,
    isRequestOverdue,
    getRequestProgress
  };
};




