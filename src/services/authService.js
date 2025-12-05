import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { auth, database } from '../config/firebase';

export const authService = {
  // Sign in user
  signIn: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Sign out user
  signOut: async () => {
    try {
      await firebaseSignOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Create new user
  createUser: async (email, password, role = 'staff') => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      await set(ref(database, `users/${userCredential.user.uid}`), {
        email,
        role,
        createdAt: Date.now(),
        createdBy: auth.currentUser?.uid || 'system'
      });

      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get user role
  getUserRole: async (userId) => {
    try {
      const roleRef = ref(database, `users/${userId}/role`);
      const snapshot = await get(roleRef);
      return snapshot.val();
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  },

  // Get current user
  getCurrentUser: () => {
    return auth.currentUser;
  }
};

export default authService;