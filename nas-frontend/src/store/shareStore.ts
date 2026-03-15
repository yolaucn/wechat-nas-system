import { create } from 'zustand';

interface ShareItem {
  _id: string;
  fileId: any;
  shareCode: string;
  shareType: 'public' | 'password' | 'internal';
  expiresAt?: string;
  downloadLimit?: number;
  downloadCount: number;
  accessCount: number;
  status: 'active' | 'expired' | 'revoked';
  createdAt: string;
}

interface ShareState {
  shares: ShareItem[];
  loading: boolean;
  page: number;
  limit: number;
  total: number;

  // Actions
  setShares: (shares: ShareItem[]) => void;
  addShare: (share: ShareItem) => void;
  removeShare: (shareId: string) => void;
  updateShare: (shareId: string, updates: Partial<ShareItem>) => void;
  setLoading: (loading: boolean) => void;
  setPage: (page: number) => void;
  setTotal: (total: number) => void;
  clearShares: () => void;
}

export const useShareStore = create<ShareState>((set) => ({
  shares: [],
  loading: false,
  page: 1,
  limit: 20,
  total: 0,

  setShares: (shares) => set({ shares }),

  addShare: (share) =>
    set((state) => ({
      shares: [share, ...state.shares],
      total: state.total + 1,
    })),

  removeShare: (shareId) =>
    set((state) => ({
      shares: state.shares.filter((s) => s._id !== shareId),
      total: state.total - 1,
    })),

  updateShare: (shareId, updates) =>
    set((state) => ({
      shares: state.shares.map((s) =>
        s._id === shareId ? { ...s, ...updates } : s
      ),
    })),

  setLoading: (loading) => set({ loading }),

  setPage: (page) => set({ page }),

  setTotal: (total) => set({ total }),

  clearShares: () => set({ shares: [], total: 0, page: 1 }),
}));
