import React, { useState, useEffect } from 'react';
import { ref, onValue, get, set, remove, update } from 'firebase/database';
import { database, auth } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import SuccessModal from '../shared/SuccessModal';
import { CheckCircle, XCircle, AlertCircle, Lock } from 'lucide-react';

const ApprovalsDashboard = () => {
  const { userRole } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    title: '',
    message: ''
  });

  const isSuperAdmin = userRole === 'superadmin';

  useEffect(() => {
    const approvalsRef = ref(database, 'pendingApprovals');
    const unsubscribe = onValue(approvalsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const approvalsArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        // Sort by newest first
        approvalsArray.sort((a, b) => b.createdAt - a.createdAt);
        setApprovals(approvalsArray);
      } else {
        setApprovals([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleApprove = async (approval) => {
    if (!isSuperAdmin) {
      setSuccessModal({
        isOpen: true,
        title: 'Access Denied',
        message: 'Only superadmin can approve custom sales.',
        autoClose: false
      });
      return;
    }

    setProcessing(true);
    try {
      // Create the actual sale record
      const saleRef = ref(database, `sales/${approval.id}`);
      await set(saleRef, {
        items: approval.items,
        total: approval.total,
        totalProfit: approval.totalProfit,
        customerName: approval.customerName,
        saleType: 'custom',
        status: 'approved',
        requestedBy: approval.requestedBy,
        approvedBy: auth.currentUser.uid,
        timestamp: Date.now()
      });

      // Update inventory for each item
      for (const item of approval.items) {
        const productRef = ref(database, `inventory/${item.productId}`);
        const snapshot = await get(productRef);
        const currentQuantity = snapshot.val().quantity;
        
        await set(productRef, {
          ...snapshot.val(),
          quantity: currentQuantity - item.quantity,
          updatedAt: Date.now()
        });
      }

      // Remove from pending approvals
      await remove(ref(database, `pendingApprovals/${approval.id}`));

      setSuccessModal({
        isOpen: true,
        title: 'Sale Approved',
        message: `Custom sale for ${approval.customerName} (₱${approval.total.toFixed(2)}) has been approved and inventory updated.`
      });
    } catch (error) {
      console.error('Error approving sale:', error);
      setSuccessModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to approve sale. Please try again.',
        autoClose: false
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (approval) => {
    if (!isSuperAdmin) {
      setSuccessModal({
        isOpen: true,
        title: 'Access Denied',
        message: 'Only superadmin can reject custom sales.',
        autoClose: false
      });
      return;
    }

    setProcessing(true);
    try {
      // Remove from pending approvals
      await remove(ref(database, `pendingApprovals/${approval.id}`));

      setSuccessModal({
        isOpen: true,
        title: 'Sale Rejected',
        message: `Custom sale for ${approval.customerName} has been rejected and removed.`
      });
    } catch (error) {
      console.error('Error rejecting sale:', error);
      setSuccessModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to reject sale. Please try again.',
        autoClose: false
      });
    } finally {
      setProcessing(false);
    }
  };

  // If not superadmin, show locked message
  if (!isSuperAdmin) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-2 mb-4">
          <AlertCircle className="w-6 h-6 text-orange-600" />
          <h2 className="text-xl font-bold text-gray-800">Pending Approvals</h2>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
          <Lock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
          <p className="text-orange-800 font-semibold">Superadmin Only</p>
          <p className="text-orange-700 text-sm mt-1">Only superadmins can approve custom sales.</p>
        </div>
      </div>
    );
  }

  if (approvals.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-2 mb-4">
          <AlertCircle className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-800">Pending Approvals</h2>
        </div>
        <p className="text-gray-500 text-center py-8">No pending approvals</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center space-x-2 mb-6">
        <AlertCircle className="w-6 h-6 text-orange-600" />
        <h2 className="text-xl font-bold text-gray-800">Pending Approvals</h2>
        <span className="ml-auto bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold">
          {approvals.length}
        </span>
      </div>

      <div className="space-y-4">
        {approvals.map(approval => (
          <div key={approval.id} className="border-2 border-orange-200 rounded-lg p-4 bg-orange-50">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-gray-800">{approval.customerName}</h3>
                <p className="text-sm text-gray-600">
                  {new Date(approval.createdAt).toLocaleDateString()} - {new Date(approval.createdAt).toLocaleTimeString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-orange-600">₱{approval.total.toFixed(2)}</p>
                <p className="text-sm text-green-600 font-semibold">
                  Profit: ₱{approval.totalProfit.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="bg-white rounded p-3 mb-3 max-h-32 overflow-y-auto">
              <p className="text-xs font-semibold text-gray-700 mb-2">Items:</p>
              <div className="space-y-1">
                {approval.items.map((item, idx) => (
                  <div key={idx} className="text-xs text-gray-600 flex justify-between">
                    <span>{item.quantity}x {item.name} @ ₱{item.customPrice.toFixed(2)}</span>
                    <span className="font-semibold">₱{item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => handleApprove(approval)}
                disabled={processing}
                className="flex-1 flex items-center justify-center space-x-2 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition disabled:bg-gray-300 font-semibold"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Approve</span>
              </button>
              <button
                onClick={() => handleReject(approval)}
                disabled={processing}
                className="flex-1 flex items-center justify-center space-x-2 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition disabled:bg-gray-300 font-semibold"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ ...successModal, isOpen: false })}
        title={successModal.title}
        message={successModal.message}
        autoClose={successModal.autoClose !== false}
      />
    </div>
  );
};

export default ApprovalsDashboard;
