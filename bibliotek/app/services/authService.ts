import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  role?: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  role: string;
}

const authService = {
  register: async (data: RegisterData) => {
    try {
      const response = await api.post('auth/register/', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  login: async (data: LoginData) => {
    try {
      const response = await api.post<AuthResponse>('auth/login/', data);
      
      // Store tokens in AsyncStorage
      await AsyncStorage.setItem('access_token', response.data.access);
      await AsyncStorage.setItem('refresh_token', response.data.refresh);
      await AsyncStorage.setItem('user_role', response.data.role);
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  logout: async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      
      if (refreshToken) {
        await api.post('auth/logout/', { refresh: refreshToken });
      }
      
      // Clear tokens from AsyncStorage
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('refresh_token');
      await AsyncStorage.removeItem('user_role');
      
      return { success: true };
    } catch (error) {
      throw error;
    }
  },
  
  isAuthenticated: async () => {
    const token = await AsyncStorage.getItem('access_token');
    return !!token;
  },
  
  getUserRole: async () => {
    return await AsyncStorage.getItem('user_role');
  }
};

export default authService;