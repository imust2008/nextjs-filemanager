import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { stat } from 'fs/promises';

// 文件信息接口
interface FileInfo {
  name: string;
  size: number;
  sizeFormatted: string;
  createdTime: string;
  modifiedTime: string;
  isDirectory: boolean;
}

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 安全路径解析函数
function getSafePath(basePath: string, relativePath: string = ''): string {
  // 规范化路径，解析相对路径
  const normalized = path.normalize(relativePath);

  // 确保路径在basePath内
  const fullPath = path.join(basePath, normalized);
  const relative = path.relative(basePath, fullPath);

  // 检查路径遍历攻击
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('非法路径访问');
  }

  return fullPath;
}

// 获取文件/目录列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const relativePath = searchParams.get('path') || '';

    const uploadsDir = path.join(process.cwd(), 'uploads');
    const targetDir = getSafePath(uploadsDir, relativePath);

    // 确保目标目录存在
    if (!fs.existsSync(targetDir)) {
      return NextResponse.json(
        { success: false, error: '目录不存在' },
        { status: 404 }
      );
    }

    // 检查是否为目录
    const stats = fs.statSync(targetDir);
    if (!stats.isDirectory()) {
      return NextResponse.json(
        { success: false, error: '路径不是目录' },
        { status: 400 }
      );
    }

    // 读取目录内容
    const files = fs.readdirSync(targetDir);

    // 添加父目录项（如果不是根目录）
    const fileInfos: FileInfo[] = [];
    if (relativePath !== '') {
      fileInfos.push({
        name: '..',
        size: 0,
        sizeFormatted: '—',
        createdTime: new Date().toISOString(),
        modifiedTime: new Date().toISOString(),
        isDirectory: true,
      });
    }

    // 获取每个文件/目录的详细信息
    const detailedInfos = await Promise.all(
      files.map(async (fileName) => {
        const filePath = path.join(targetDir, fileName);
        const stats = await stat(filePath);

        return {
          name: fileName,
          size: stats.size,
          sizeFormatted: stats.isDirectory() ? '—' : formatFileSize(stats.size),
          createdTime: stats.birthtime.toISOString(),
          modifiedTime: stats.mtime.toISOString(),
          isDirectory: stats.isDirectory(),
        };
      })
    );

    // 合并到结果中
    fileInfos.push(...detailedInfos);

    // 按类型排序：目录在前，文件在后，然后按修改时间倒序
    fileInfos.sort((a, b) => {
      // 特殊处理父目录
      if (a.name === '..') return -1;
      if (b.name === '..') return 1;

      // 目录优先
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;

      // 按修改时间倒序
      return new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime();
    });

    return NextResponse.json({
      success: true,
      data: fileInfos,
      count: fileInfos.length,
      currentPath: relativePath,
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    if (error instanceof Error && error.message === '非法路径访问') {
      return NextResponse.json(
        { success: false, error: '非法路径访问' },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { success: false, error: '获取文件列表失败' },
      { status: 500 }
    );
  }
}

// 安全配置
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/x-rar-compressed',
];

// 处理文件上传和目录创建
export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const relativePath = searchParams.get('path') || '';

    const uploadsDir = path.join(process.cwd(), 'uploads');
    const targetDir = getSafePath(uploadsDir, relativePath);

    // 确保目标目录存在
    if (!fs.existsSync(targetDir)) {
      return NextResponse.json(
        { success: false, error: '目标目录不存在' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const operationType = formData.get('type') as string || 'file';

    // 处理目录创建
    if (operationType === 'directory') {
      const directoryName = formData.get('name') as string;

      if (!directoryName || directoryName.trim() === '') {
        return NextResponse.json(
          { success: false, error: '目录名不能为空' },
          { status: 400 }
        );
      }

      // 清理目录名，防止路径遍历攻击
      const safeDirName = directoryName.replace(/[^a-zA-Z0-9._-]/g, '_');

      // 检查目录名是否合法
      if (safeDirName === '' || safeDirName === '.' || safeDirName === '..') {
        return NextResponse.json(
          { success: false, error: '目录名不合法' },
          { status: 400 }
        );
      }

      const dirPath = path.join(targetDir, safeDirName);

      // 检查目录是否已存在
      if (fs.existsSync(dirPath)) {
        return NextResponse.json(
          { success: false, error: '目录已存在' },
          { status: 400 }
        );
      }

      // 创建目录
      fs.mkdirSync(dirPath, { recursive: true });

      return NextResponse.json({
        success: true,
        message: `目录 "${safeDirName}" 创建成功`,
        directory: safeDirName,
        path: relativePath ? `${relativePath}/${safeDirName}` : safeDirName,
      });
    }

    // 处理文件上传（默认操作）
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: '请选择要上传的文件' },
        { status: 400 }
      );
    }

    // 检查文件数量限制
    if (files.length > 10) {
      return NextResponse.json(
        { success: false, error: '一次最多上传10个文件' },
        { status: 400 }
      );
    }

    const uploadedFiles: string[] = [];
    const errors: string[] = [];

    // 处理每个文件
    for (const file of files) {
      // 验证文件大小
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`文件 "${file.name}" 大小超过限制 (最大100MB)`);
        continue;
      }

      // 验证文件类型
      if (!ALLOWED_FILE_TYPES.includes(file.type) && file.type !== '') {
        errors.push(`文件 "${file.name}" 类型不被支持`);
        continue;
      }

      // 清理文件名，防止路径遍历攻击
      let fileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');

      // 防止文件名冲突，添加时间戳
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const ext = path.extname(fileName);
      const nameWithoutExt = path.basename(fileName, ext);
      fileName = `${nameWithoutExt}_${timestamp}_${randomStr}${ext}`;

      const filePath = path.join(targetDir, fileName);

      try {
        const buffer = Buffer.from(await file.arrayBuffer());

        // 写入文件
        fs.writeFileSync(filePath, buffer);
        uploadedFiles.push(fileName);
      } catch (writeError) {
        console.error(`Error writing file ${fileName}:`, writeError);
        errors.push(`文件 "${file.name}" 保存失败`);
      }
    }

    // 如果有错误，返回错误信息
    if (errors.length > 0) {
      return NextResponse.json({
        success: uploadedFiles.length > 0,
        message: uploadedFiles.length > 0 ?
          `部分文件上传成功，但有 ${errors.length} 个错误` :
          '文件上传失败',
        files: uploadedFiles,
        errors: errors.slice(0, 5), // 最多返回5个错误
      }, { status: uploadedFiles.length > 0 ? 207 : 400 }); // 207 Multi-Status
    }

    return NextResponse.json({
      success: true,
      message: `成功上传 ${uploadedFiles.length} 个文件`,
      files: uploadedFiles,
      path: relativePath,
    });
  } catch (error) {
    console.error('Error in POST operation:', error);
    if (error instanceof Error && error.message === '非法路径访问') {
      return NextResponse.json(
        { success: false, error: '非法路径访问' },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { success: false, error: '操作过程中发生错误' },
      { status: 500 }
    );
  }
}