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
  uploaderId?: {
    _id: string;
    nickname: string;
    role: string;
  };
  canEdit?: boolean;
  canDelete?: boolean;
  canShare?: boolean;
  uploader?: {
    nickname: string;
    role: string;
  };
}

interface FileState {
  files: FileItem[];
  currentFolder: string;
  breadcrumbs: string[];
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
  setBreadcrumbs: (breadcrumbs: string[]) => void;
  setLoading: (loading: boolean) => void;
  setPage: (page: number) => void;
  setTotal: (total: number) => void;
  setSortBy: (sortBy: string) => void;
  setSortOrder: (sortOrder: 'asc' | 'desc') => void;
  clearFiles: () => void;
  navigateToFolder: (folderPath: string) => void;
  navigateUp: () => void;
}

export const useFileStore = create<FileState>((set, get) => ({
  files: [],
  currentFolder: '/',
  breadcrumbs: ['/'],
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

  setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),

  setLoading: (loading) => set({ loading }),

  setPage: (page) => set({ page }),

  setTotal: (total) => set({ total }),

  setSortBy: (sortBy) => set({ sortBy }),

  setSortOrder: (sortOrder) => set({ sortOrder }),

  clearFiles: () => set({ files: [], total: 0, page: 1 }),

  navigateToFolder: (folderPath) => {
    // 确保 folderPath 不为空或 undefined
    if (!folderPath || folderPath === null || folderPath === undefined) {
      folderPath = '/';
    }
    
    // 确保 folderPath 是字符串类型
    const safeFolderPath = String(folderPath);
    
    const breadcrumbs = safeFolderPath === '/' ? ['/'] : safeFolderPath.split('/').filter(Boolean);
    if (breadcrumbs[0] !== '/') {
      breadcrumbs.unshift('/');
    }
    set({ 
      currentFolder: safeFolderPath,
      breadcrumbs,
      page: 1
      // 不清空文件列表，让组件负责加载
    });
  },

  navigateUp: () => {
    const { currentFolder } = get();
    if (currentFolder === '/') return;
    
    const parts = currentFolder.split('/').filter(Boolean);
    const parentPath = parts.length <= 1 ? '/' : '/' + parts.slice(0, -1).join('/');
    
    get().navigateToFolder(parentPath);
  },
}));
