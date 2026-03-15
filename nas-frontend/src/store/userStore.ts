import { create } from 'zustand';
import Taro from '@tarojs/taro';

interface User {
  id: string;
  openid: string;
  nickname: string;
  avatar: string;
  role: 'admin' | 'user' | 'guest';
  status: 'active' | 'disabled';
  storageUsed: number;
  storageQuota: number;
}

interface UserState {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  
  // Actions
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateStorageUsed: (storageUsed: number) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  token: Taro.getStorageSync('token') || null,
  isLoggedIn: !!Taro.getStorageSync('token'),

  setUser: (user) => set({ user, isLoggedIn: true }),

  setToken: (token) => {
    Taro.setStorageSync('token', token);
    set({ token, isLoggedIn: true });
  },

  login: (user, token) => {
    Taro.setStorageSync('token', token);
    Taro.setStorageSync('user', JSON.stringify(user));
    set({ user, token, isLoggedIn: true });
  },

  logout: () => {
    Taro.removeStorageSync('token');
    Taro.removeStorageSync('user');
    set({ user: null, token: null, isLoggedIn: false });
  },

  updateStorageUsed: (storageUsed) =>
    set((state) => ({
      user: state.user ? { ...state.user, storageUsed } : null,
    })),
}));
