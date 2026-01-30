// 文件信息接口
export interface FileInfo {
  name: string;
  size: number;
  sizeFormatted: string;
  createdTime: string;
  modifiedTime: string;
  isDirectory: boolean;
}

// 文件列表响应接口
export interface FileListResponse {
  files: FileInfo[];
  currentPath: string;
  error?: string;
}

// API响应接口
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: string[];
  count?: number;
  currentPath?: string;
}

// 获取文件/目录列表
export async function fetchFiles(path: string = ''): Promise<FileListResponse> {
  try {
    const url = path ? `/api/files?path=${encodeURIComponent(path)}` : '/api/files';
    const response = await fetch(url);
    const result: ApiResponse<FileInfo[]> = await response.json();

    if (!result.success) {
      return { files: [], currentPath: path, error: result.error || '获取文件列表失败' };
    }

    return {
      files: result.data || [],
      currentPath: result.currentPath || path,
    };
  } catch (error) {
    console.error('Error fetching files:', error);
    return { files: [], currentPath: path, error: '网络错误，无法获取文件列表' };
  }
}

// 上传文件响应接口
interface UploadResponse {
  files: string[];
  errors?: string[];
}

// 上传文件
export async function uploadFiles(files: File[], path: string = ''): Promise<{ files: string[], errors?: string[], error?: string, message?: string }> {
  try {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const url = path ? `/api/files?path=${encodeURIComponent(path)}` : '/api/files';
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    const result: ApiResponse<UploadResponse> = await response.json();

    if (!result.success) {
      return { files: [], errors: result.errors, error: result.error || '文件上传失败' };
    }

    return {
      files: result.data?.files || [],
      message: result.message,
    };
  } catch (error) {
    console.error('Error uploading files:', error);
    return { files: [], errors: ['网络错误，无法上传文件'] };
  }
}

// 创建目录
export async function createDirectory(name: string, path: string = ''): Promise<{ success: boolean; message?: string }> {
  try {
    const formData = new FormData();
    formData.append('type', 'directory');
    formData.append('name', name);

    const url = path ? `/api/files?path=${encodeURIComponent(path)}` : '/api/files';
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    const result: ApiResponse<{ directory: string; path: string }> = await response.json();

    if (!result.success) {
      return { success: false, message: result.error || '目录创建失败' };
    }

    return { success: true, message: result.message || '目录创建成功' };
  } catch (error) {
    console.error('Error creating directory:', error);
    return { success: false, message: '网络错误，无法创建目录' };
  }
}

// 编码路径为URL安全格式
function encodePath(path: string): string {
  const segments = path.split('/').filter(segment => segment.length > 0);
  return segments.map(segment => encodeURIComponent(segment)).join('/');
}

// 下载文件
export async function downloadFile(filePath: string): Promise<{ success: boolean; message?: string }> {
  try {
    const encodedPath = encodePath(filePath);
    const response = await fetch(`/api/files/${encodedPath}`);

    if (!response.ok) {
      const error = await response.json();
      return { success: false, message: error.error || '文件下载失败' };
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filePath.split('/').pop() || filePath;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    return { success: true, message: '文件下载开始' };
  } catch (error) {
    console.error('Error downloading file:', error);
    return { success: false, message: '网络错误，无法下载文件' };
  }
}

// 删除文件或目录
export async function deleteFile(filePath: string): Promise<{ success: boolean; message?: string }> {
  try {
    const encodedPath = encodePath(filePath);
    const response = await fetch(`/api/files/${encodedPath}`, {
      method: 'DELETE',
    });

    const result: ApiResponse<{ isDirectory: boolean }> = await response.json();

    if (!result.success) {
      return { success: false, message: result.error || '删除失败' };
    }

    return { success: true, message: result.message || '删除成功' };
  } catch (error) {
    console.error('Error deleting file:', error);
    return { success: false, message: '网络错误，无法删除文件' };
  }
}
