import { ref, get, set, remove } from 'firebase/database';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { database, auth } from '../config/firebase';

export const userService = {
  // Get all users
  getAllUsers: async () => {
    try {
      const usersRef = ref(database, 'users');
      const snapshot = await get(usersRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
      }
      return [];
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  },

  // Get user by ID
  getUserById: async (userId) => {
    try {
      const userRef = ref(database, `users/${userId}`);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        return { id: userId, ...snapshot.val() };
      }
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
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

      return { success: true, userId: userCredential.user.uid };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete user
  deleteUser: async (userId) => {
    try {
      const userRef = ref(database, `users/${userId}`);
      await remove(userRef);
      return { success: true };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, error: error.message };
    }
  },

  // Check if system is initialized
  isSystemInitialized: async () => {
    try {
      const configRef = ref(database, 'systemConfig/initialized');
      const snapshot = await get(configRef);
      return snapshot.val() === true;
    } catch (error) {
      console.error('Error checking system initialization:', error);
      return false;
    }
  },

  // Initialize system
  initializeSystem: async () => {
    try {
      await set(ref(database, 'systemConfig'), {
        initialized: true,
        superAdminCreated: true,
        setupDate: Date.now()
      });
      return { success: true };
    } catch (error) {
      console.error('Error initializing system:', error);
      return { success: false, error: error.message };
    }
  }
};

export default userService;