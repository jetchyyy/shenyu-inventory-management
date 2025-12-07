import { ref, get, set, push, update } from 'firebase/database';
import { database } from '../config/firebase';

export const expenseApprovalService = {
  // Create approval request for expenses/giveaways
  createApprovalRequest: async (expenseData, staffUserId) => {
    try {
      const approvalRef = push(ref(database, 'expenseApprovals'));
      
      await set(approvalRef, {
        expenseData,
        staffUserId,
        status: 'pending', // pending, approved, rejected
        createdAt: Date.now(),
        approvedBy: null,
        approvedAt: null,
        rejectionReason: null
      });

      return { success: true, approvalId: approvalRef.key };
    } catch (error) {
      console.error('Error creating expense approval request:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all pending approvals
  getPendingApprovals: async () => {
    try {
      const approvalsRef = ref(database, 'expenseApprovals');
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
      const approvalsRef = ref(database, 'expenseApprovals');
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

  // Approve expense
  approveExpense: async (approvalId, adminUserId) => {
    try {
      const approvalRef = ref(database, `expenseApprovals/${approvalId}`);
      const approvalSnapshot = await get(approvalRef);
      
      if (!approvalSnapshot.exists()) {
        return { success: false, error: 'Approval request not found' };
      }

      const approval = approvalSnapshot.val();
      
      if (approval.status !== 'pending') {
        return { success: false, error: 'This request has already been processed' };
      }

      // Create the actual expense record
      const expenseRef = push(ref(database, 'expenses'));
      
      const expenseData = {
        ...approval.expenseData,
        createdAt: Date.now(),
        approvalId: approvalId,
        approvedBy: adminUserId,
        approvedAt: Date.now()
      };

      await set(expenseRef, expenseData);

      // Update approval status
      await update(approvalRef, {
        status: 'approved',
        approvedBy: adminUserId,
        approvedAt: Date.now()
      });

      return { success: true, expenseId: expenseRef.key };
    } catch (error) {
      console.error('Error approving expense:', error);
      return { success: false, error: error.message };
    }
  },

  // Reject expense
  rejectExpense: async (approvalId, adminUserId, rejectionReason = '') => {
    try {
      const approvalRef = ref(database, `expenseApprovals/${approvalId}`);
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
      console.error('Error rejecting expense:', error);
      return { success: false, error: error.message };
    }
  }
};

export default expenseApprovalService;
