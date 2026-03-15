import { create } from 'zustand';

interface FileItem {
  _id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  folder: string;
  createdAt: string;
  updatedAt: string;
}

interface FileState {
  files: FileItem[];
  currentFolder: string;
  loading: boolean;
  page: number;
  limit: number;
  total: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';

  // Actions
  setFiles: (files: FileItem[]) => void;
  addFile: (file: FileItem) => void;
  removeFile: (fileId: string) => void;
  updateFile: (fileId: string, updates: Partial<FileItem>) => void;
  setCurrentFolder: (folder: string) => void;
  setLoading: (loading: boolean) => void;
  setPage: (page: number) => void;
  setTotal: (total: number) => void;
  setSortBy: (sortBy: string) => void;
  setSortOrder: (sortOrder: 'asc' | 'desc') => void;
  clearFiles: () => void;
}

export const useFileStore = create<FileState>((set) => ({
  files: [],
  currentFolder: '/',
  loading: false,
  page: 1,
  limit: 20,
  total: 0,
  sortBy: 'createdAt',
  sortOrder: 'desc',

  setFiles: (files) => set({ files }),

  addFile: (file) =>
    set((state) => ({
      files: [file, ...state.files],
      total: state.total + 1,
    })),

  removeFile: (fileId) =>
    set((state) => ({
      files: state.files.filter((f) => f._id !== fileId),
      total: state.total - 1,
    })),

  updateFile: (fileId, updates) =>
    set((state) => ({
      files: state.files.map((f) =>
        f._id === fileId ? { ...f, ...updates } : f
      ),
    })),

  setCurrentFolder: (folder) => set({ currentFolder: folder }),

  setLoading: (loading) => set({ loading }),

  setPage: (page) => set({ page }),

  setTotal: (total) => set({ total }),

  setSortBy: (sortBy) => set({ sortBy }),

  setSortOrder: (sortOrder) => set({ sortOrder }),

  clearFiles: () => set({ files: [], total: 0, page: 1 }),
}));
