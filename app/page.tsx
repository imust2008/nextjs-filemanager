'use client';

import { useState } from 'react';
import { Layout, Card, Typography, Space, Button, theme, App } from 'antd';
import {
  FolderOpenOutlined,
  CloudUploadOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import FileList from './components/FileList';
import FileUpload from './components/FileUpload';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function Home() {
  const { message } = App.useApp();
  const [currentPath, setCurrentPath] = useState<string>('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // 处理上传成功后的刷新
  const handleUploadSuccess = () => {
    setIsUploadModalOpen(false);
    message.success('文件上传成功，列表已刷新');
  };

  // 打开上传模态框
  const openUploadModal = () => {
    setIsUploadModalOpen(true);
  };

  // 手动刷新文件列表
  const handleRefresh = (path?: string) => {
    if (path !== undefined) {
      setCurrentPath(path);
    }
    message.info('正在刷新文件列表...');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{
        background: colorBgContainer,
        padding: '0 24px',
        boxShadow: '0 1px 4px rgba(0, 21, 41, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Space align="center">
          <FolderOpenOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          <Title level={3} style={{ margin: 0 }}>
            文件管理器
          </Title>
          <Text type="secondary" style={{ marginLeft: 8 }}>
            Next.js + Ant Design + TypeScript
          </Text>
        </Space>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={() => handleRefresh()}
        >
          刷新
        </Button>
      </Header>

      <Content style={{ padding: '24px', background: '#f0f2f5' }}>
        <div
          style={{
            padding: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            maxWidth: 1400,
            margin: '0 auto',
          }}
        >
          <Space orientation="vertical" size="large" style={{ width: '100%' }}>
            {/* 系统信息卡片 */}
            <Card>
              <Space orientation="vertical" size="small">
                <Title level={4}>文件管理系统</Title>
                <Text type="secondary">
                  这是一个基于 Next.js 服务端渲染的文件管理器，支持文件上传、下载、删除和列表展示。
                  所有文件操作都通过 API 路由进行，文件存储在服务器的 uploads 目录中。
                </Text>
                <Text type="secondary">
                  功能包括：文件列表显示（名称、大小、创建时间、修改时间）、批量上传、下载、删除、排序和搜索。
                </Text>
              </Space>
            </Card>

            {/* 文件列表组件 */}
            <Card
              title={
                <Space>
                  <CloudUploadOutlined />
                  <span>文件列表</span>
                </Space>
              }
              extra={
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => handleRefresh()}
                >
                  刷新列表
                </Button>
              }
            >
              <FileList currentPath={currentPath} onRefresh={handleRefresh} onUploadClick={openUploadModal} />
            </Card>

            {/* 上传模态框 */}
            <FileUpload
              open={isUploadModalOpen}
              onClose={() => setIsUploadModalOpen(false)}
              onUploadSuccess={handleUploadSuccess}
              currentPath={currentPath}
            />

            {/* 使用说明 */}
            <Card title="使用说明">
              <Space orientation="vertical" size="middle">
                <div>
                  <Text strong>上传文件：</Text>
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    在文件列表点击「上传文件」按钮，弹出上传窗口后拖拽或选择文件，点击「开始上传」。
                  </Text>
                </div>
                <div>
                  <Text strong>下载文件：</Text>
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    在文件列表中找到要下载的文件，点击操作列中的下载图标（⬇️）即可下载。
                  </Text>
                </div>
                <div>
                  <Text strong>删除文件：</Text>
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    在文件列表中找到要删除的文件，点击操作列中的删除图标（🗑️）即可删除。
                    支持批量删除：勾选多个文件后点击「批量删除」按钮。
                  </Text>
                </div>
                <div>
                  <Text strong>排序：</Text>
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    点击表格列标题可以进行排序（文件名、大小、创建时间、修改时间）。
                  </Text>
                </div>
              </Space>
            </Card>
          </Space>
        </div>
      </Content>
    </Layout>
  );
}
