import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import { creditApprovalService } from '../../services/creditApprovalService';
import { expenseApprovalService } from '../../services/expenseApprovalService';
import SuccessModal from '../shared/SuccessModal';
import { Check, X, AlertCircle, Clock, ShoppingCart, Receipt } from 'lucide-react';

const Approvals = () => {
  const { user, userRole } = useAuth();
  const [approvalType, setApprovalType] = useState('credits'); // 'credits' or 'expenses'
  const [approvals, setApprovals] = useState([]);
  const [filteredApprovals, setFilteredApprovals] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    title: '',
    message: ''
  });

  // Listener for credit approvals
  useEffect(() => {
    if (approvalType !== 'credits') return;
    
    const approvalsRef = ref(database, 'creditApprovals');
    const unsubscribe = onValue(approvalsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const approvalsArray = Object.keys(data)
          .map(key => ({
            id: key,
            ...data[key]
          }))
          .sort((a, b) => b.createdAt - a.createdAt);
        setApprovals(approvalsArray);
      } else {
        setApprovals([]);
      }
    });

    return () => unsubscribe();
  }, [approvalType]);

  // Listener for expense approvals
  useEffect(() => {
    if (approvalType !== 'expenses') return;
    
    const approvalsRef = ref(database, 'expenseApprovals');
    const unsubscribe = onValue(approvalsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const approvalsArray = Object.keys(data)
          .map(key => ({
            id: key,
            ...data[key]
          }))
          .sort((a, b) => b.createdAt - a.createdAt);
        setApprovals(approvalsArray);
      } else {
        setApprovals([]);
      }
    });

    return () => unsubscribe();
  }, [approvalType]);

  useEffect(() => {
    const filtered = approvals.filter(approval => approval.status === statusFilter);
    setFilteredApprovals(filtered);
  }, [approvals, statusFilter]);

  const handleApprove = async (approvalId) => {
    setProcessing(true);
    try {
      let result;
      if (approvalType === 'credits') {
        result = await creditApprovalService.approveCreditItem(approvalId, user.uid);
      } else {
        result = await expenseApprovalService.approveExpense(approvalId, user.uid);
      }
      
      if (result.success) {
        setSuccessModal({
          isOpen: true,
          title: approvalType === 'credits' ? 'Credit Item Approved' : 'Expense Approved',
          message: approvalType === 'credits'
            ? 'The credit request has been approved and the item has been created and inventory has been updated.'
            : 'The expense has been approved and recorded.'
        });
        setSelectedApproval(null);
      } else {
        setSuccessModal({
          isOpen: true,
          title: 'Error',
          message: result.error || `Failed to approve ${approvalType === 'credits' ? 'credit item' : 'expense'}`
        });
      }
    } catch (error) {
      console.error('Error approving:', error);
      setSuccessModal({
        isOpen: true,
        title: 'Error',
        message: error.message || `Failed to approve ${approvalType === 'credits' ? 'credit item' : 'expense'}`
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (approvalId) => {
    if (!rejectReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setProcessing(true);
    try {
      let result;
      if (approvalType === 'credits') {
        result = await creditApprovalService.rejectCreditItem(approvalId, user.uid, rejectReason);
      } else {
        result = await expenseApprovalService.rejectExpense(approvalId, user.uid, rejectReason);
      }
      
      if (result.success) {
        setSuccessModal({
          isOpen: true,
          title: approvalType === 'credits' ? 'Credit Item Rejected' : 'Expense Rejected',
          message: `The ${approvalType === 'credits' ? 'credit request' : 'expense'} has been rejected. Reason: ${rejectReason}`
        });
        setSelectedApproval(null);
        setRejectReason('');
      } else {
        setSuccessModal({
          isOpen: true,
          title: 'Error',
          message: result.error || `Failed to reject ${approvalType === 'credits' ? 'credit item' : 'expense'}`
        });
      }
    } catch (error) {
      console.error('Error rejecting:', error);
      setSuccessModal({
        isOpen: true,
        title: 'Error',
        message: error.message || `Failed to reject ${approvalType === 'credits' ? 'credit item' : 'expense'}`
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3" /><span>Pending</span></span>;
      case 'approved':
        return <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><Check className="w-3 h-3" /><span>Approved</span></span>;
      case 'rejected':
        return <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"><X className="w-3 h-3" /><span>Rejected</span></span>;
      default:
        return null;
    }
  };

  const pendingCount = approvals.filter(a => a.status === 'pending').length;

  // Check if user is admin or superadmin - do this after all hooks
  if (!user || (userRole !== 'admin' && userRole !== 'superadmin')) {
    return (
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
          <h2 className="text-lg font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only admin and superadmin accounts can approve items.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Approvals Management</h1>

      {/* Approval Type Tabs */}
      <div className="bg-white rounded-lg shadow border-b">
        <div className="flex gap-0 overflow-x-auto">
          <button
            onClick={() => {
              setApprovalType('credits');
              setStatusFilter('pending');
            }}
            className={`flex items-center gap-2 px-4 md:px-6 py-3 font-medium text-sm md:text-base transition border-b-2 whitespace-nowrap ${
              approvalType === 'credits'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Credit Items</span>
          </button>
          <button
            onClick={() => {
              setApprovalType('expenses');
              setStatusFilter('pending');
            }}
            className={`flex items-center gap-2 px-4 md:px-6 py-3 font-medium text-sm md:text-base transition border-b-2 whitespace-nowrap ${
              approvalType === 'expenses'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <Receipt className="w-5 h-5" />
            <span>Expenses</span>
          </button>
        </div>
      </div>

      {/* Header with pending count */}
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-bold text-gray-800">
            {approvalType === 'credits' ? 'Credit Item' : 'Expense'} Approvals
          </h2>
          {pendingCount > 0 && (
            <div className="bg-yellow-100 text-yellow-800 rounded-full px-4 py-2 font-semibold text-sm">
              {pendingCount} Pending
            </div>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex space-x-2 border-b border-gray-200">
          {['pending', 'approved', 'rejected'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Approvals List */}
      <div className="space-y-3">
        {filteredApprovals.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-4 md:p-6 text-center">
            <p className="text-gray-600 text-sm md:text-base">
              {statusFilter === 'pending' 
                ? 'No pending approvals' 
                : `No ${statusFilter} approvals`}
            </p>
          </div>
        ) : (
          filteredApprovals.map(approval => (
            <div key={approval.id} className="bg-white rounded-lg shadow p-4 md:p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
                <div>
                  {approvalType === 'credits' ? (
                    <>
                      <h3 className="font-bold text-gray-800 text-base md:text-lg">
                        {approval.creditItemData.productName}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Customer: <span className="font-medium">{approval.creditItemData.customerName}</span>
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="font-bold text-gray-800 text-base md:text-lg">
                        {approval.expenseData.description}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Type: <span className="font-medium">{approval.expenseData.type === 'expense' ? 'Business Expense' : 'Free Giveaway'}</span>
                      </p>
                    </>
                  )}
                  <p className="text-sm text-gray-600">
                    Date: {new Date(approval.createdAt).toLocaleDateString()} at{' '}
                    {new Date(approval.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                {getStatusBadge(approval.status)}
              </div>

              {/* Details grid */}
              {approvalType === 'credits' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 pb-4 border-b border-gray-200">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Quantity</p>
                    <p className="font-bold text-gray-800">{approval.creditItemData.quantity} units</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Base Value</p>
                    <p className="font-bold text-gray-800">₱{approval.creditItemData.baseValue.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Interest</p>
                    <p className="font-bold text-gray-800">₱{approval.creditItemData.interestAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Total Value</p>
                    <p className="font-bold text-blue-600 text-lg">₱{approval.creditItemData.totalValue.toFixed(2)}</p>
                  </div>
                </div>
              )}

              {approvalType === 'expenses' && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 pb-4 border-b border-gray-200">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Category</p>
                    <p className="font-bold text-gray-800 capitalize">{approval.expenseData.category}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Amount</p>
                    <p className="font-bold text-red-600 text-lg">
                      ₱{(approval.expenseData.amount || approval.expenseData.cost).toFixed(2)}
                    </p>
                  </div>
                  {approval.expenseData.notes && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Notes</p>
                      <p className="font-bold text-gray-800">{approval.expenseData.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Payment schedule - only for credits */}
              {approvalType === 'credits' && (
                <div className="bg-gray-50 rounded p-3 mb-4">
                  <p className="text-xs text-gray-600 mb-2">Payment Schedule</p>
                  <p className="text-sm font-medium text-gray-800">
                    {approval.creditItemData.paymentSchedule === 'weekly' 
                      ? `Weekly on ${approval.creditItemData.weeklyDay}`
                      : `Monthly on day ${approval.creditItemData.monthlyDate}`}
                  </p>
                </div>
              )}

              {/* Rejection reason if rejected */}
              {approval.status === 'rejected' && approval.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                  <p className="text-xs text-red-600 mb-1">Rejection Reason</p>
                  <p className="text-sm text-red-800">{approval.rejectionReason}</p>
                </div>
              )}

              {/* Action buttons - only for pending */}
              {approval.status === 'pending' && (
                <div className="flex flex-col md:flex-row gap-3">
                  <button
                    onClick={() => handleApprove(approval.id)}
                    disabled={processing}
                    className="flex-1 flex items-center justify-center space-x-2 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => {
                      if (selectedApproval === approval.id) {
                        setSelectedApproval(null);
                        setRejectReason('');
                      } else {
                        setSelectedApproval(approval.id);
                        setRejectReason('');
                      }
                    }}
                    disabled={processing}
                    className="flex-1 flex items-center justify-center space-x-2 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    <X className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              )}

              {/* Rejection reason input - shown when reject button is clicked */}
              {selectedApproval === approval.id && approval.status === 'pending' && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                    rows="3"
                    disabled={processing}
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleReject(approval.id)}
                      disabled={processing || !rejectReason.trim()}
                      className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      Confirm Reject
                    </button>
                    <button
                      onClick={() => {
                        setSelectedApproval(null);
                        setRejectReason('');
                      }}
                      disabled={processing}
                      className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-400 transition disabled:opacity-50 text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ ...successModal, isOpen: false })}
        title={successModal.title}
        message={successModal.message}
      />
    </div>
  );
};

export default Approvals;
