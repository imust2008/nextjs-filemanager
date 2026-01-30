'use client';

import React, { useState } from 'react';
import {
  Upload,
  Button,
  Space,
  Progress,
  Typography,
  Card,
  Modal,
  App
} from 'antd';
import {
  UploadOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { uploadFiles } from '../lib/apiClient';

const { Dragger } = Upload;
const { Text } = Typography;

interface FileUploadProps {
  onUploadSuccess?: () => void;
  currentPath?: string;
  open?: boolean;
  onClose?: () => void;
}

interface UploadProgress {
  filename: string;
  percent: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess, currentPath = '', open, onClose }) => {
  const { notification, message } = App.useApp();
  const [uploading, setUploading] = useState<boolean>(false);
  const [progressList, setProgressList] = useState<UploadProgress[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // 判断是否为 Modal 模式
  const isModalMode = open !== undefined && onClose !== undefined;

  // 关闭 Modal 并重置状态
  const handleClose = () => {
    setSelectedFiles([]);
    setProgressList([]);
    onClose?.();
  };

  // 处理文件选择
  const handleFileSelect = (fileList: File[]) => {
    setSelectedFiles(fileList);
  };

  // 处理文件上传
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      message.warning('请选择要上传的文件');
      return;
    }

    setUploading(true);

    // 初始化进度列表
    const initialProgress: UploadProgress[] = selectedFiles.map((file) => ({
      filename: file.name,
      percent: 0,
      status: 'uploading',
    }));
    setProgressList(initialProgress);

    try {
      // 模拟进度更新
      const updateProgress = (index: number, percent: number) => {
        setProgressList((prev) => {
          const newProgress = [...prev];
          newProgress[index] = {
            ...newProgress[index],
            percent,
          };
          return newProgress;
        });
      };

      // 模拟进度
      selectedFiles.forEach((_, index) => {
        let percent = 0;
        const interval = setInterval(() => {
          percent += 10;
          if (percent >= 100) {
            clearInterval(interval);
          }
          updateProgress(index, percent);
        }, 100);
      });

      // 实际执行上传
      const result = await uploadFiles(selectedFiles, currentPath);

      // 处理错误
      if (result.errors && result.errors.length > 0) {
        result.errors.forEach((err) => {
          notification.error({ title: err });
        });
      }

      // 更新进度状态
      const successFiles = result.files;

      // 提取失败的文件名（从错误信息中）
      const failedFilenames = new Set<string>();
      if (result.errors && result.errors.length > 0) {
        result.errors.forEach((err) => {
          // 从错误信息中提取文件名，格式：文件 "filename" 错误描述
          const match = err.match(/文件 "([^"]+)"/);
          if (match && match[1]) {
            failedFilenames.add(match[1]);
          }
        });
      }

      // 如果有通用错误（如网络错误），将所有文件标记为错误
      // 否则，根据错误信息标记失败的文件，其余标记为成功
      setProgressList((prev) =>
        prev.map((item) => ({
          ...item,
          percent: 100,
          status: result.error || failedFilenames.has(item.filename) ? 'error' : 'success',
        }))
      );

      if (successFiles.length > 0) {
        const msg = result.message || `成功上传 ${successFiles.length} 个文件`;
        notification.success({ title: msg });
        setSelectedFiles([]);
        if (onUploadSuccess) {
          onUploadSuccess();
        }
      } else if (result.error) {
        notification.error({ title: result.error });
      }

    } catch (error) {
      console.error('Upload error:', error);
      notification.error({ title: '上传过程中发生错误' });
    } finally {
      setUploading(false);
    }
  };

  // 取消上传
  const handleCancel = () => {
    setSelectedFiles([]);
    setProgressList([]);
    if (isModalMode) {
      handleClose();
    }
  };

  // 拖拽上传配置
  const draggerProps = {
    name: 'files',
    multiple: true,
    showUploadList: false,
    beforeUpload: (file: File) => {
      setSelectedFiles((prev) => [...prev, file]);
      return false; // 阻止自动上传
    },
    onDrop(e: React.DragEvent) {
      const files = Array.from(e.dataTransfer.files);
      setSelectedFiles((prev) => [...prev, ...files]);
    },
  };

  // 文件列表
  const fileList = selectedFiles.map((file, index) => ({
    uid: index,
    name: file.name,
    size: file.size,
    type: file.type,
  }));

  // 上传内容渲染
  const renderUploadContent = () => (
    <div style={{ padding: isModalMode ? 0 : undefined }}>
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        {/* 拖拽上传区域 */}
        <Dragger {...draggerProps}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
          <p className="ant-upload-hint">
            支持单个或批量上传，文件大小无限制
          </p>
        </Dragger>

        {/* 已选择文件列表 */}
        {selectedFiles.length > 0 && (
          <div>
            <Text strong>已选择 {selectedFiles.length} 个文件：</Text>
            <div style={{ marginTop: 8, maxHeight: 200, overflow: 'auto' }}>
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  style={{
                    padding: '8px 12px',
                    marginBottom: 4,
                    backgroundColor: '#f5f5f5',
                    borderRadius: 4,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <Text>{file.name}</Text>
                    <Text type="secondary" style={{ marginLeft: 12 }}>
                      {(file.size / 1024).toFixed(2)} KB
                    </Text>
                  </div>
                  <Button
                    type="text"
                    size="small"
                    onClick={() => {
                      setSelectedFiles((prev) =>
                        prev.filter((_, i) => i !== index)
                      );
                    }}
                  >
                    移除
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 上传进度 */}
        {progressList.length > 0 && (
          <div>
            <Text strong>上传进度：</Text>
            {progressList.map((progress, index) => (
              <div key={index} style={{ marginTop: 12 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 4,
                  }}
                >
                  <Text ellipsis style={{ maxWidth: '60%' }}>
                    {progress.filename}
                  </Text>
                  <div>
                    {progress.status === 'success' && (
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    )}
                    {progress.status === 'error' && (
                      <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                    )}
                    {progress.status === 'uploading' && (
                      <Text type="secondary">{progress.percent}%</Text>
                    )}
                  </div>
                </div>
                <Progress
                  percent={progress.percent}
                  status={
                    progress.status === 'success'
                      ? 'success'
                      : progress.status === 'error'
                      ? 'exception'
                      : 'active'
                  }
                  size="small"
                />
              </div>
            ))}
          </div>
        )}

        {/* 操作按钮 */}
        <Space>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={handleUpload}
            loading={uploading}
            disabled={selectedFiles.length === 0}
          >
            {uploading ? '上传中...' : '开始上传'}
          </Button>
          <Button onClick={handleCancel} disabled={selectedFiles.length === 0}>
            取消
          </Button>
        </Space>
      </Space>
    </div>
  );

  return isModalMode ? (
    <Modal
      title="文件上传"
      open={open}
      onCancel={handleClose}
      footer={null}
      width={600}
    >
      {renderUploadContent()}
    </Modal>
  ) : (
    <Card title="文件上传" style={{ marginBottom: 24 }}>
      {renderUploadContent()}
    </Card>
  );
};

export default FileUpload;
