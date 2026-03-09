import { create } from 'zustand';
import { api } from '@/lib/api';

export type BusinessModule = 'RESTAURANT' | 'MINIMARKET' | 'BOTILLERIA' | 'BOOKSTORE' | 'ALL';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  branchId?: string;
  moduleType?: BusinessModule;
  availableModules?: BusinessModule[];
  branchName?: string | null;
  isDemo?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  activeModule: BusinessModule | null;
  setActiveModule: (module: BusinessModule) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: Record<string, any>) => Promise<void>;
  accessDemo: (moduleType: BusinessModule, role?: string) => Promise<void>;
  logout: () => void;
  initialize: () => void;
}

const persistSession = (user: User, token: string) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('activeModule', user.moduleType || 'ALL');
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isInitialized: false,
  activeModule: null,

  initialize: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const activeModule = localStorage.getItem('activeModule') as BusinessModule | null;

    if (token && user) {
      const parsedUser = JSON.parse(user) as User;
      set({
        token,
        user: parsedUser,
        isAuthenticated: true,
        isInitialized: true,
        activeModule: activeModule || parsedUser.moduleType || 'ALL',
      });
      return;
    }

    set({ isInitialized: true });
  },

  setActiveModule: (module) => {
    localStorage.setItem('activeModule', module);
    set({ activeModule: module });
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { user, accessToken } = response.data;
    const normalizedUser = {
      ...user,
      moduleType: user.moduleType || 'ALL',
      availableModules: user.availableModules || [user.moduleType || 'ALL'],
    } as User;

    persistSession(normalizedUser, accessToken);
    set({
      user: normalizedUser,
      token: accessToken,
      isAuthenticated: true,
      isInitialized: true,
      activeModule: normalizedUser.moduleType || 'ALL',
    });
  },

  register: async (payload) => {
    const response = await api.post('/auth/register', payload);
    const { user, accessToken } = response.data;
    const normalizedUser = {
      ...user,
      moduleType: user.moduleType || payload.moduleType || 'ALL',
      availableModules: user.availableModules || [user.moduleType || payload.moduleType || 'ALL'],
    } as User;

    persistSession(normalizedUser, accessToken);
    set({
      user: normalizedUser,
      token: accessToken,
      isAuthenticated: true,
      isInitialized: true,
      activeModule: normalizedUser.moduleType || payload.moduleType || 'ALL',
    });
  },

  accessDemo: async (moduleType, role) => {
    const response = await api.post('/auth/demo-access', { moduleType, role });
    const { user, accessToken } = response.data;
    const normalizedUser = {
      ...user,
      moduleType: user.moduleType || moduleType,
      availableModules: user.availableModules || [moduleType],
      isDemo: true,
    } as User;

    persistSession(normalizedUser, accessToken);
    set({
      user: normalizedUser,
      token: accessToken,
      isAuthenticated: true,
      isInitialized: true,
      activeModule: moduleType,
    });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeModule');
    set({ user: null, token: null, isAuthenticated: false, isInitialized: true, activeModule: null });
  },
}));
