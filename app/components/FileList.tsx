'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Popconfirm,
  Tooltip,
  Modal,
  Input,
  Breadcrumb,
  App
} from 'antd';
import {
  DownloadOutlined,
  DeleteOutlined,
  FileOutlined,
  FolderOutlined,
  ReloadOutlined,
  FolderAddOutlined,
  HomeOutlined,
  CloudUploadOutlined
} from '@ant-design/icons';
import {
  FileInfo,
  FileListResponse,
  fetchFiles,
  deleteFile,
  downloadFile,
  createDirectory
} from '../lib/apiClient';
import { formatDateTime } from '../lib/formatUtils';

interface FileListProps {
  onRefresh?: (currentPath?: string) => void;
  onUploadClick?: () => void;
  currentPath?: string;
}

const FileList: React.FC<FileListProps> = ({ onRefresh, onUploadClick, currentPath = '' }) => {
  const { notification, message } = App.useApp();
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [createDirVisible, setCreateDirVisible] = useState<boolean>(false);
  const [newDirName, setNewDirName] = useState<string>('');

  // 加载文件列表
  const loadFiles = async (path: string = '') => {
    setLoading(true);
    const result: FileListResponse & { error?: string } = await fetchFiles(path);
    if (result.error) {
      notification.error({ title: result.error });
    }
    setFiles(result.files);
    setLoading(false);
  };

  // 初始加载和路径变化时加载文件
  useEffect(() => {
    loadFiles(currentPath);
  }, [currentPath]);

  // 刷新文件列表
  const handleRefresh = () => {
    loadFiles(currentPath);
    if (onRefresh) {
      onRefresh(currentPath);
    }
  };

  // 处理目录点击
  const handleDirectoryClick = (directoryName: string) => {
    let newPath: string;
    if (directoryName === '..') {
      const pathSegments = currentPath.split('/').filter(Boolean);
      pathSegments.pop();
      newPath = pathSegments.join('/');
    } else {
      newPath = currentPath ? `${currentPath}/${directoryName}` : directoryName;
    }
    if (onRefresh) {
      onRefresh(newPath);
    } else {
      loadFiles(newPath);
    }
  };

  // 处理文件下载
  const handleDownload = async (filename: string) => {
    const filePath = currentPath ? `${currentPath}/${filename}` : filename;
    const result = await downloadFile(filePath);
    if (!result.success && result.message) {
      notification.error({ title: result.message });
    } else if (result.success && result.message) {
      notification.success({ title: result.message });
    }
  };

  // 处理文件/目录删除
  const handleDelete = async (name: string, isDirectory: boolean) => {
    const filePath = currentPath ? `${currentPath}/${name}` : name;
    const result = await deleteFile(filePath);
    if (result.success) {
      notification.success({ title: result.message });
      loadFiles(currentPath);
    } else if (result.message) {
      notification.error({ title: result.message });
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的文件');
      return;
    }

    const deletePromises = selectedRowKeys.map((key) => {
      const name = key as string;
      const filePath = currentPath ? `${currentPath}/${name}` : name;
      return deleteFile(filePath);
    });

    const results = await Promise.all(deletePromises);
    const successCount = results.filter((r) => r.success).length;

    if (successCount > 0) {
      notification.success({ title: `成功删除 ${successCount} 个文件` });
      setSelectedRowKeys([]);
      loadFiles(currentPath);
    }
  };

  // 处理创建目录
  const handleCreateDirectory = async () => {
    if (!newDirName.trim()) {
      message.warning('目录名不能为空');
      return;
    }

    const result = await createDirectory(newDirName, currentPath);
    if (result.success) {
      notification.success({ title: result.message });
      setCreateDirVisible(false);
      setNewDirName('');
      loadFiles(currentPath);
    } else if (result.message) {
      notification.error({ title: result.message });
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 300,
      render: (text: string, record: FileInfo) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {record.isDirectory ? (
            <FolderOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
          ) : (
            <FileOutlined style={{ color: '#666', fontSize: '16px' }} />
          )}
          {record.isDirectory ? (
            <Button
              type="link"
              onClick={() => handleDirectoryClick(text)}
              style={{ padding: 0, height: 'auto', fontWeight: 500 }}
            >
              {text}
            </Button>
          ) : (
            <span>{text}</span>
          )}
          {record.isDirectory && (
            <Tag color="blue" style={{ marginLeft: '8px' }}>
              文件夹
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: '大小',
      dataIndex: 'sizeFormatted',
      key: 'size',
      width: 120,
      sorter: (a: FileInfo, b: FileInfo) => a.size - b.size,
    },
    {
      title: '创建时间',
      dataIndex: 'createdTime',
      key: 'createdTime',
      width: 180,
      render: (text: string) => formatDateTime(text),
      sorter: (a: FileInfo, b: FileInfo) =>
        new Date(a.createdTime).getTime() - new Date(b.createdTime).getTime(),
    },
    {
      title: '修改时间',
      dataIndex: 'modifiedTime',
      key: 'modifiedTime',
      width: 180,
      render: (text: string) => formatDateTime(text),
      sorter: (a: FileInfo, b: FileInfo) =>
        new Date(a.modifiedTime).getTime() - new Date(b.modifiedTime).getTime(),
      defaultSortOrder: 'descend' as const,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: FileInfo) => (
        <Space size="small">
          {!record.isDirectory && (
            <Tooltip title="下载">
              <Button
                type="text"
                icon={<DownloadOutlined />}
                onClick={() => handleDownload(record.name)}
                size="small"
              />
            </Tooltip>
          )}
          <Tooltip title="删除">
            <Popconfirm
              title={`确定要删除 "${record.name}" 吗？${
                record.isDirectory ? '（此操作将递归删除目录内所有内容）' : ''
              }`}
              onConfirm={() => handleDelete(record.name, record.isDirectory)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                size="small"
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => {
      setSelectedRowKeys(keys);
    },
    getCheckboxProps: (record: FileInfo) => ({
      disabled: record.isDirectory,
    }),
  };

  // 面包屑项
  const breadcrumbItems = [
    {
      title: (
        <Button
          type="link"
          icon={<HomeOutlined />}
          onClick={() => {
            if (onRefresh) {
              onRefresh('');
            } else {
              loadFiles('');
            }
          }}
          style={{ padding: 0 }}
        >
          根目录
        </Button>
      ),
    },
    ...currentPath.split('/').filter(Boolean).map((segment, index) => {
      const path = currentPath.split('/').slice(0, index + 1).join('/');
      return {
        title: (
          <Button
            type="link"
            onClick={() => {
              if (onRefresh) {
                onRefresh(path);
              } else {
                loadFiles(path);
              }
            }}
            style={{ padding: 0 }}
          >
            {segment}
          </Button>
        ),
      };
    }),
  ];

  return (
    <div>
      {/* 面包屑导航 */}
      <div style={{ marginBottom: 16 }}>
        <Breadcrumb items={breadcrumbItems} />
      </div>

      {/* 操作按钮 */}
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button
            type="primary"
            icon={<CloudUploadOutlined />}
            onClick={onUploadClick}
          >
            上传文件
          </Button>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={loading}
          >
            刷新
          </Button>
          <Button
            type="default"
            icon={<FolderAddOutlined />}
            onClick={() => setCreateDirVisible(true)}
          >
            新建文件夹
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={handleBatchDelete}
            disabled={selectedRowKeys.length === 0}
          >
            批量删除 ({selectedRowKeys.length})
          </Button>
        </Space>
      </div>

      {/* 文件列表表格 */}
      <Table
        rowKey="name"
        columns={columns}
        dataSource={files}
        loading={loading}
        rowSelection={rowSelection}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 个项目`,
        }}
        scroll={{ x: 'max-content' }}
      />

      {/* 创建目录模态框 */}
      <Modal
        title="新建文件夹"
        open={createDirVisible}
        onOk={handleCreateDirectory}
        onCancel={() => {
          setCreateDirVisible(false);
          setNewDirName('');
        }}
        okText="创建"
        cancelText="取消"
      >
        <Input
          placeholder="请输入文件夹名称"
          value={newDirName}
          onChange={(e) => setNewDirName(e.target.value)}
          onPressEnter={handleCreateDirectory}
        />
      </Modal>
    </div>
  );
};

export default FileList;
