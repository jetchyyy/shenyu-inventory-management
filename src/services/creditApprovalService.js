import { ref, get, set, push, update, remove } from 'firebase/database';
import { database } from '../config/firebase';

export const creditApprovalService = {
  // Create approval request (called when staff creates credit item)
  createApprovalRequest: async (creditItemData, staffUserId) => {
    try {
      const approvalRef = push(ref(database, 'creditApprovals'));
      
      await set(approvalRef, {
        creditItemData,
        staffUserId,
        status: 'pending', // pending, approved, rejected
        createdAt: Date.now(),
        approvedBy: null,
        approvedAt: null,
        rejectionReason: null
      });

      return { success: true, approvalId: approvalRef.key };
    } catch (error) {
      console.error('Error creating approval request:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all pending approvals
  getPendingApprovals: async () => {
    try {
      const approvalsRef = ref(database, 'creditApprovals');
      const snapshot = await get(approvalsRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.keys(data)
          .map(key => ({
            id: key,
            ...data[key]
          }))
          .filter(approval => approval.status === 'pending')
          .sort((a, b) => b.createdAt - a.createdAt);
      }
      return [];
    } catch (error) {
      console.error('Error getting pending approvals:', error);
      return [];
    }
  },

  // Get all approvals (with filters)
  getAllApprovals: async (statusFilter = null) => {
    try {
      const approvalsRef = ref(database, 'creditApprovals');
      const snapshot = await get(approvalsRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        let approvals = Object.keys(data)
          .map(key => ({
            id: key,
            ...data[key]
          }))
          .sort((a, b) => b.createdAt - a.createdAt);
        
        if (statusFilter) {
          approvals = approvals.filter(approval => approval.status === statusFilter);
        }
        
        return approvals;
      }
      return [];
    } catch (error) {
      console.error('Error getting approvals:', error);
      return [];
    }
  },

  // Approve credit item
  approveCreditItem: async (approvalId, adminUserId) => {
    try {
      const approvalRef = ref(database, `creditApprovals/${approvalId}`);
      const approvalSnapshot = await get(approvalRef);
      
      if (!approvalSnapshot.exists()) {
        return { success: false, error: 'Approval request not found' };
      }

      const approval = approvalSnapshot.val();
      
      if (approval.status !== 'pending') {
        return { success: false, error: 'This request has already been processed' };
      }

      // Create the actual credit item
      const creditItemRef = push(ref(database, 'creditItems'));
      const creditItemId = creditItemRef.key;
      
      const creditItemData = {
        ...approval.creditItemData,
        createdAt: Date.now(),
        approvalId: approvalId,
        approvedBy: adminUserId,
        approvedAt: Date.now()
      };

      await set(creditItemRef, creditItemData);

      // Update inventory - reduce quantity
      const productRef = ref(database, `inventory/${approval.creditItemData.productId}`);
      const productSnapshot = await get(productRef);
      
      if (productSnapshot.exists()) {
        const currentProduct = productSnapshot.val();
        const newQuantity = currentProduct.quantity - approval.creditItemData.quantity;
        
        if (newQuantity < 0) {
          return { success: false, error: 'Insufficient inventory' };
        }

        await update(productRef, {
          quantity: newQuantity,
          updatedAt: Date.now()
        });
      }

      // Update approval status
      await update(approvalRef, {
        status: 'approved',
        approvedBy: adminUserId,
        approvedAt: Date.now()
      });

      return { success: true, creditItemId };
    } catch (error) {
      console.error('Error approving credit item:', error);
      return { success: false, error: error.message };
    }
  },

  // Reject credit item
  rejectCreditItem: async (approvalId, adminUserId, rejectionReason = '') => {
    try {
      const approvalRef = ref(database, `creditApprovals/${approvalId}`);
      const approvalSnapshot = await get(approvalRef);
      
      if (!approvalSnapshot.exists()) {
        return { success: false, error: 'Approval request not found' };
      }

      const approval = approvalSnapshot.val();
      
      if (approval.status !== 'pending') {
        return { success: false, error: 'This request has already been processed' };
      }

      // Update approval status to rejected
      await update(approvalRef, {
        status: 'rejected',
        approvedBy: adminUserId,
        approvedAt: Date.now(),
        rejectionReason: rejectionReason
      });

      return { success: true };
    } catch (error) {
      console.error('Error rejecting credit item:', error);
      return { success: false, error: error.message };
    }
  }
};

export default creditApprovalService;
