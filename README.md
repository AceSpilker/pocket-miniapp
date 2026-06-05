# 🎒 口袋小程序

一款功能丰富的微信小程序，采用现代化的技术栈构建，支持用户管理、动态公告、角色权限等功能。

## 📱 项目简介

口袋小程序是一个功能完善的微信小程序项目，包含前端（微信小程序）和后端（FastAPI）两部分。项目采用深色赛博朋克风格 UI 设计，支持账号密码登录和微信登录两种方式。

### 技术栈

| 层 | 技术 |
|---|------|
| 前端 | 微信小程序原生开发 + Vant Weapp UI |
| 后端 | Python 3.9+ / FastAPI / SQLAlchemy 2.0 (异步) |
| 数据库 | MySQL 8.0 |
| 缓存 | Redis |
| 认证 | JWT + 微信登录 |

## 🚀 功能模块

### 用户端功能

| 功能 | 描述 |
|------|------|
| 👤 用户认证 | 账号密码登录、微信登录、注册 |
| 📝 个人资料 | 查看和编辑个人资料、上传头像 |
| 🔐 密码管理 | 修改密码 |
| 📢 最近动态 | 浏览动态公告、查看详情 |

### 管理端功能

| 功能 | 描述 |
|------|------|
| 👥 用户管理 | 用户列表、搜索、创建、编辑、禁用/启用、删除 |
| 🔑 角色管理 | 角色列表、创建、编辑、删除、权限分配 |
| 📋 菜单管理 | 菜单列表、创建、编辑、删除、树形结构 |
| 📢 动态管理 | 动态列表、富文本编辑、置顶、启用/禁用 |

## 📁 项目结构

```
pocket-miniapp/
├── frontend/                 # 微信小程序前端
│   ├── pages/               # 页面
│   │   ├── index/          # 首页
│   │   ├── mine/           # 我的
│   │   ├── login/          # 登录
│   │   ├── announcements/  # 动态列表
│   │   ├── announcement-detail/  # 动态详情
│   │   └── admin/          # 管理后台
│   ├── components/         # 组件
│   ├── utils/              # 工具函数
│   ├── custom-tab-bar/     # 自定义 TabBar
│   └── assets/             # 静态资源
│
├── backend/                  # FastAPI 后端
│   ├── api/                 # API 路由
│   ├── models/              # 数据库模型
│   ├── schemas/             # Pydantic Schema
│   ├── utils/               # 工具函数
│   └── main.py              # 入口文件
│
└── README.md
```

## 🔧 快速开始

### 0. 确保 MySQL 和 Redis 运行

```bash
# 如果用 Docker（推荐）
docker run -d --name MySQL -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root mysql:8.0
docker run -d --name Redis -p 6379:6379 redis:latest
```

### 1. 后端启动

```bash
cd backend

# 创建虚拟环境
python -m venv .venv
source .venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库和 Redis

# 启动服务
python main.py
```

服务启动后访问：
- API 地址：http://localhost:8000
- 自动文档：http://localhost:8000/docs (Swagger UI)

### 2. 前端启动

1. 使用微信开发者工具打开 `frontend` 目录
2. 修改 `frontend/app.js` 中的 `baseUrl` 为你的后端地址
3. 点击编译运行

## 🗄️ 数据库设计

### 用户表 (users)
- 基本信息：用户名、昵称、头像、手机号、邮箱
- 微信信息：openid、unionid
- 状态字段：is_active、deleted_at

### 角色表 (roles)
- 角色标识、显示名称、描述
- 权限 JSON、是否系统内置

### 菜单表 (menus)
- 树形结构（parent_id 自关联）
- 菜单名称、图标、路径、权限标识

### 动态公告表 (announcements)
- 标题、富文本内容、封面图片
- 发布人、浏览次数、是否置顶

## 📡 API 接口

### 公开接口
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/v1/auth/login | 账号密码登录 |
| POST | /api/v1/auth/wx-login | 微信登录 |
| POST | /api/v1/auth/register | 注册 |
| GET | /api/v1/announcements | 动态列表 |
| GET | /api/v1/announcements/{id} | 动态详情 |

### 管理接口 (需 admin:access 权限)
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/admin/users | 用户列表 |
| POST | /api/v1/admin/users | 创建用户 |
| GET | /api/v1/admin/roles | 角色列表 |
| GET | /api/v1/admin/menus | 菜单列表 |
| GET | /api/v1/admin/announcements | 动态列表 |
| POST | /api/v1/admin/announcements | 创建动态 |

## 📝 更新日志

### 2026-06-05

#### ✨ 新增功能

1. **动态公告模块**
   - 新增动态/公告数据库模型、Schema、API
   - 用户端动态列表页面 (`pages/announcements`)
   - 动态详情页面，支持富文本渲染
   - 管理端动态管理页面，支持 CRUD 操作
   - 富文本编辑器，支持加粗、斜体、标题、图片等
   - 首页显示最新 3 条动态

2. **统一 UI 工具模块** (`utils/ui.js`)
   - 二次确认弹窗封装 (confirm、confirmDelete、confirmDisable、confirmEnable)
   - 顶部提示消息组件 (`components/top-toast`)
   - 支持 success/error/warning/info 四种类型

3. **用户管理增强**
   - 新增禁用/启用用户快捷按钮
   - 列表显示用户头像（无头像时显示默认头像）
   - 搜索框和工具栏固定在顶部，列表可滚动

#### 🐛 Bug 修复

1. **TabBar 白边问题**
   - 统一 TabBar 和页面背景色为 `#0f0f23`
   - 修复 TabBar 高度不够导致图标被截断的问题
   - 恢复 TabBar 底部安全区域适配

2. **`Dialog.confirm is not a function` 报错**
   - 使用统一的 `ui.confirm` 替代 Vant Dialog

3. **WXSS 编译错误**
   - 移除微信小程序不支持的 `>>>` 深度选择器语法

4. **数据库时区问题**
   - 设置数据库连接时区为 `+08:00`（北京时间）

5. **用户管理页面问题**
   - 搜索框 placeholder 移除多余图标
   - 用户头像显示，无头像时使用默认头像

#### 🎨 UI 优化

1. **首页最近动态区域优化**
   - 添加"更多"入口
   - 动态标题单行显示，超出显示省略号
   - 显示发布人和发布时间

2. **系统管理入口优化**
   - 新增"动态管理"入口卡片

---

## 📄 许可证

MIT License

## 👤 作者

- GitHub: [@AceSpilker](https://github.com/AceSpilker)
- Email: linzhongyang515@163.com
