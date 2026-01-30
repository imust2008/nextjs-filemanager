# 文件管理系统

基于 Next.js + Ant Design + TypeScript 的文件管理系统，使用服务端渲染技术。

## 功能特性

- 📁 文件列表显示（文件名、大小、创建时间、修改时间）
- 📤 文件上传（支持拖拽、批量上传、进度显示）
- 📥 文件下载（直接下载到本地）
- 🗑️ 文件删除（单个删除和批量删除）
- 🔄 实时刷新和排序功能
- 🛡️ 文件安全验证（类型、大小限制）
- 📱 响应式设计，支持移动端

## 技术栈

- **前端框架**: Next.js 16.1.4 (App Router)
- **UI 组件库**: Ant Design 6.2.2
- **编程语言**: TypeScript
- **样式方案**: Tailwind CSS v4 + Ant Design 主题
- **图标库**: @ant-design/icons
- **日期处理**: date-fns
- **开发服务器**: Turbopack

## 项目结构

```
myapp/
├── app/
│   ├── api/files/              # API 路由
│   │   ├── route.ts            # 文件列表和上传
│   │   └── [filename]/route.ts # 文件下载和删除
│   ├── components/             # React 组件
│   │   ├── FileList.tsx        # 文件列表组件
│   │   └── FileUpload.tsx      # 文件上传组件
│   ├── lib/                    # 工具函数
│   │   ├── apiClient.ts        # API 客户端
│   │   └── formatUtils.ts      # 格式化工具
│   ├── layout.tsx              # 根布局（Ant Design 配置）
│   └── page.tsx                # 主页面
├── uploads/                    # 文件存储目录（自动创建）
├── public/                     # 静态资源
└── package.json               # 项目依赖
```

## 快速开始

### 1. 安装依赖

```bash
# 使用 yarn 或 npm
tyarn install
# 或
npm install
```

### 2. 启动开发服务器

```bash
tyarn dev
# 或
npm run dev
```

访问 http://localhost:3000

### 3. 构建生产版本

```bash
tyarn build
tyarn start
```

## API 接口

### GET `/api/files`
获取文件列表

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "name": "example.txt",
      "size": 1024,
      "sizeFormatted": "1 KB",
      "createdTime": "2024-01-01T12:00:00.000Z",
      "modifiedTime": "2024-01-01T12:00:00.000Z",
      "isDirectory": false
    }
  ],
  "count": 1
}
```

### POST `/api/files`
上传文件（multipart/form-data）

**参数**:
- `files`: 文件数组

**响应示例**:
```json
{
  "success": true,
  "message": "成功上传 2 个文件",
  "files": ["file1.txt", "file2.jpg"]
}
```

### GET `/api/files/[filename]`
下载文件

### DELETE `/api/files/[filename]`
删除文件

## 安全特性

1. **文件大小限制**: 最大 100MB
2. **文件类型限制**: 仅允许常见文件类型（图片、文档、压缩包等）
3. **文件名安全**: 自动清理文件名，防止路径遍历攻击
4. **文件名冲突处理**: 自动添加时间戳和随机字符串
5. **批量操作限制**: 一次最多上传 10 个文件

## 配置说明

### Ant Design 主题
在 `app/layout.tsx` 中配置主题颜色、圆角、字体大小等。

### 文件上传限制
在 `app/api/files/route.ts` 中修改：
- `MAX_FILE_SIZE`: 最大文件大小
- `ALLOWED_FILE_TYPES`: 允许的文件类型

### 存储目录
上传的文件存储在 `uploads/` 目录，该目录在首次上传时自动创建。

## 开发说明

### 添加新功能
1. 在 `app/components/` 中添加新组件
2. 在 `app/api/` 中添加新的 API 路由
3. 在 `app/lib/` 中添加工具函数

### 样式自定义
- 使用 Ant Design 主题配置进行全局样式调整
- 使用 Tailwind CSS 进行组件级样式定制
- 使用 CSS Modules 或 styled-components 进行复杂样式

## 常见问题

### Q: 上传文件失败怎么办？
A: 检查控制台错误信息，确认文件类型和大小是否符合限制。

### Q: 文件下载时文件名乱码？
A: 系统会自动对文件名进行编码，支持中文文件名。

### Q: 如何修改页面布局？
A: 编辑 `app/page.tsx` 中的组件结构。

### Q: 如何添加用户认证？
A: 可以在 API 路由中添加 NextAuth.js 或自定义认证中间件。

## 许可证

MIT
