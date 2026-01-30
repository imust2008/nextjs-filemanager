import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 获取路径参数的类型定义
interface Params {
  params: {
    path: string[];
  };
}

// 安全路径解析函数
function getSafePath(basePath: string, pathSegments: string[]): string {
  // 将路径段拼接成相对路径
  const relativePath = pathSegments.join(path.sep);

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

// 递归删除目录
function deleteRecursive(filePath: string) {
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      // 递归删除目录内容
      const items = fs.readdirSync(filePath);
      for (const item of items) {
        deleteRecursive(path.join(filePath, item));
      }
      // 删除空目录
      fs.rmdirSync(filePath);
    } else {
      // 删除文件
      fs.unlinkSync(filePath);
    }
  }
}

// 下载文件
export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path: pathSegments } = await params;
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const targetPath = getSafePath(uploadsDir, pathSegments);

    // 检查文件/目录是否存在
    if (!fs.existsSync(targetPath)) {
      return NextResponse.json(
        { success: false, error: '文件或目录不存在' },
        { status: 404 }
      );
    }

    // 检查是否为目录
    const stats = fs.statSync(targetPath);
    if (stats.isDirectory()) {
      return NextResponse.json(
        { success: false, error: '无法下载目录' },
        { status: 400 }
      );
    }

    // 获取文件名（路径的最后一部分）
    const filename = path.basename(targetPath);

    // 读取文件内容
    const fileBuffer = fs.readFileSync(targetPath);

    // 创建响应头
    const headers = new Headers();
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    headers.set('Content-Type', 'application/octet-stream');
    headers.set('Content-Length', stats.size.toString());

    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    if (error instanceof Error && error.message === '非法路径访问') {
      return NextResponse.json(
        { success: false, error: '非法路径访问' },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { success: false, error: '文件下载失败' },
      { status: 500 }
    );
  }
}

// 删除文件或目录
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path: pathSegments } = await params;
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const targetPath = getSafePath(uploadsDir, pathSegments);

    // 检查文件/目录是否存在
    if (!fs.existsSync(targetPath)) {
      return NextResponse.json(
        { success: false, error: '文件或目录不存在' },
        { status: 404 }
      );
    }

    // 获取文件名/目录名
    const name = path.basename(targetPath);
    const stats = fs.statSync(targetPath);
    const isDirectory = stats.isDirectory();

    // 递归删除
    deleteRecursive(targetPath);

    return NextResponse.json({
      success: true,
      message: `${isDirectory ? '目录' : '文件'} "${name}" 删除成功`,
      isDirectory,
    });
  } catch (error) {
    console.error('Error deleting:', error);
    if (error instanceof Error && error.message === '非法路径访问') {
      return NextResponse.json(
        { success: false, error: '非法路径访问' },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { success: false, error: '删除失败' },
      { status: 500 }
    );
  }
}