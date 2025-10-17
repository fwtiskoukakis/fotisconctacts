import * as FileSystem from 'expo-file-system/legacy';
import { User } from '../models/contract.interface';

const USERS_DIR = `${FileSystem.documentDirectory}users/`;
const USERS_FILE = `${USERS_DIR}users.json`;

/**
 * Service for managing user data storage
 */
export class UserStorageService {
  /**
   * Initialize users directory
   */
  static async initializeUsersDirectory(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(USERS_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(USERS_DIR, { intermediates: true });
      }
    } catch (error) {
      console.error('Error initializing users directory:', error);
      throw error;
    }
  }

  /**
   * Get all users
   */
  static async getAllUsers(): Promise<User[]> {
    try {
      await this.initializeUsersDirectory();
      
      const fileInfo = await FileSystem.getInfoAsync(USERS_FILE);
      if (!fileInfo.exists) {
        // Create default user if no users exist
        const defaultUser: User = {
          id: 'default-user',
          name: 'Διαχειριστής',
          signature: '',
          createdAt: new Date(),
        };
        await this.saveUserDirectly(defaultUser);
        return [defaultUser];
      }

      const fileContent = await FileSystem.readAsStringAsync(USERS_FILE);
      const users = JSON.parse(fileContent);
      
      // Convert date strings back to Date objects
      return users.map((user: any) => ({
        ...user,
        createdAt: new Date(user.createdAt),
      }));
    } catch (error) {
      console.error('Error loading users:', error);
      return [];
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: string): Promise<User | null> {
    try {
      const users = await this.getAllUsers();
      return users.find(user => user.id === id) || null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  /**
   * Save a user directly without loading existing users (to avoid circular dependency)
   */
  static async saveUserDirectly(user: User): Promise<void> {
    try {
      await this.initializeUsersDirectory();
      await FileSystem.writeAsStringAsync(USERS_FILE, JSON.stringify([user], null, 2));
    } catch (error) {
      console.error('Error saving user directly:', error);
      throw error;
    }
  }

  /**
   * Save a user
   */
  static async saveUser(user: User): Promise<void> {
    try {
      await this.initializeUsersDirectory();
      
      const users = await this.getAllUsers();
      const existingIndex = users.findIndex(u => u.id === user.id);
      
      if (existingIndex >= 0) {
        users[existingIndex] = user;
      } else {
        users.push(user);
      }
      
      await FileSystem.writeAsStringAsync(USERS_FILE, JSON.stringify(users, null, 2));
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  }

  /**
   * Delete a user
   */
  static async deleteUser(id: string): Promise<void> {
    try {
      const users = await this.getAllUsers();
      const filteredUsers = users.filter(user => user.id !== id);
      
      await FileSystem.writeAsStringAsync(USERS_FILE, JSON.stringify(filteredUsers, null, 2));
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Create a new user
   */
  static async createUser(name: string, signature: string): Promise<User> {
    const newUser: User = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      signature,
      createdAt: new Date(),
    };
    
    await this.saveUser(newUser);
    return newUser;
  }
}
