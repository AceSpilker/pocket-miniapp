# 🎒 口袋小精灵

一款功能丰富的微信小程序，采用现代化的技术栈构建，支持用户管理、动态公告、角色权限等功能。

## 📱 项目简介

口袋小精灵是一个功能完善的微信小程序项目，包含前端（微信小程序）和后端（FastAPI）两部分。项目支持**亮色/暗色双主题切换**，采用现代化的 UI 设计，支持账号密码登录和微信登录两种方式。

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
| 📢 公告通知 | 浏览公告列表、查看详情 |
| 🎮 功能中心 | 功能快捷入口、自定义排序 |
| 💬 意见反馈 | 提交反馈、查看回复历史 |
| 🌓 主题切换 | 亮色/暗色主题自动/手动切换 |

### 管理端功能

| 功能 | 描述 |
|------|------|
| 👥 用户管理 | 用户列表、搜索、创建、编辑、禁用/启用、删除 |
| 🔑 角色管理 | 角色列表、创建、编辑、删除、权限分配 |
| 📋 菜单管理 | 菜单列表、创建、编辑、删除、树形结构 |
| 📢 公告管理 | 公告列表、富文本编辑、置顶、启用/禁用 |
| 🎮 功能管理 | 功能列表、创建、编辑、图标颜色自定义 |
| 💬 反馈管理 | 反馈列表、回复、版本历史追踪 |
| 📄 内容管理 | 关于我们、用户协议、隐私政策 |

## 📁 项目结构

```
pocket-miniapp/
├── frontend/                 # 微信小程序前端
│   ├── pages/               # 页面
│   │   ├── index/          # 首页
│   │   ├── mine/           # 我的
│   │   ├── login/          # 登录
│   │   ├── features/       # 功能中心
│   │   ├── feedback/       # 意见反馈
│   │   ├── content-page/   # 内容页面（协议等）
│   │   └── admin/          # 管理后台
│   ├── components/         # 组件
│   │   └── theme-toggle/   # 主题切换组件
│   ├── utils/              # 工具函数
│   │   ├── theme-manager.js  # 主题管理器
│   │   └── theme-config.js   # 主题配置
│   ├── custom-tab-bar/     # 自定义 TabBar
│   └── assets/             # 静态资源
│
├── backend/                  # FastAPI 后端
│   ├── api/                 # API 路由
│   ├── models/              # 数据库模型
│   ├── schemas/             # Pydantic Schema
│   ├── utils/               # 工具函数
│   ├── migrations/          # 数据库迁移脚本
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

### 公告表 (announcements)
- 标题、富文本内容、封面图片
- 发布人、浏览次数、是否置顶

### 功能表 (features)
- 功能名称、图标、图标背景色、描述
- 跳转路径、所需权限、排序

### 意见反馈表 (feedbacks)
- 标题、内容、状态
- 版本追踪、回复记录

### 内容页面表 (content_pages)
- 页面标识、标题、内容（富文本）

## 📡 API 接口

### 公开接口
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/v1/auth/login | 账号密码登录 |
| POST | /api/v1/auth/wx-login | 微信登录 |
| POST | /api/v1/auth/register | 注册 |
| GET | /api/v1/announcements | 公告列表 |
| GET | /api/v1/announcements/{id} | 公告详情 |
| GET | /api/v1/content-pages/{key} | 内容页面 |

### 用户接口 (需登录)
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/features | 功能列表 |
| GET | /api/v1/features/home | 首页功能 |
| POST | /api/v1/feedbacks | 提交反馈 |
| GET | /api/v1/feedbacks/my | 我的反馈 |

### 管理接口 (需 admin:access 权限)
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/admin/users | 用户列表 |
| POST | /api/v1/admin/users | 创建用户 |
| GET | /api/v1/admin/roles | 角色列表 |
| GET | /api/v1/admin/menus | 菜单列表 |
| GET | /api/v1/admin/announcements | 公告列表 |
| GET | /api/v1/admin/features | 功能列表 |
| GET | /api/v1/admin/feedbacks | 反馈列表 |
| GET | /api/v1/admin/content-pages | 内容页面列表 |

## 📝 更新日志

### 2026-06-07

#### ✨ 新增功能

1. **完整国际化支持（i18n）**
   - 支持三种语言：简体中文（默认）、English、日本語
   - 前端所有页面国际化改造（登录、注册、首页、我的、个人资料等）
   - 导航栏标题动态国际化
   - 自定义 TabBar 语言切换支持
   - 语言设置与用户绑定，登录后自动应用用户偏好
   - 语言选择器组件（Action Sheet），支持亮暗色主题

2. **国际化基础设施**
   - 后端新增语言表 `languages`，国际化文本表 `i18n_texts`
   - 用户表新增 `language_id` 字段，关联用户语言偏好
   - 内容页面翻译表 `content_page_translations`，支持关于/协议多语言
   - 后端 API：`/api/v1/i18n/languages`、`/api/v1/i18n/texts/{language_code}` 等
   - 前端国际化管理器 `utils/i18n.js`，支持文本缓存、监听器
   - 前端 Behavior `utils/i18n-behavior.js`，页面混入即可获得国际化能力

3. **数据库迁移脚本**
   - `003_i18n_init.sql`：初始化语言、翻译数据
   - `004_i18n_supplement.sql`：补充翻译数据

#### 🐛 Bug 修复

1. **语言切换后导航栏未更新**
   - 所有页面 `onShow` 中动态设置导航栏标题

2. **用户语言偏好未同步**
   - 登录后应用用户的语言设置
   - 切换语言时同步到服务器并更新本地 userInfo

3. **语言选择器层级问题**
   - Action Sheet 设置 `z-index: 9999`，避免被 TabBar 遮挡

4. **语言选择器主题适配**
   - 全局 Action Sheet 样式适配亮暗色主题

5. **请求工具初始化问题**
   - `request.js` 延迟获取 app 实例，避免启动阶段报错

6. **i18n 初始化时机问题**
   - 初始化时立即设置默认文本，确保页面有内容显示

#### 🎨 UI 优化

1. **首页功能网格布局优化**
   - 1个功能：单列居中
   - 2个功能：两列平分
   - 3个功能：三列平分
   - 4个及以上：两列布局

2. **全局文本溢出处理**
   - 菜单项名称单行省略
   - 菜单描述两行省略
   - 语言值显示适配

3. **功能中心编辑完成跳转**
   - 保存成功后自动跳转回首页

#### 📦 新增文件

| 文件 | 说明 |
|------|------|
| `backend/api/i18n.py` | 国际化 API 路由 |
| `backend/models/language.py` | 语言模型 |
| `backend/models/i18n_text.py` | 国际化文本模型 |
| `backend/models/content_page_translation.py` | 内容页面翻译模型 |
| `backend/schemas/i18n.py` | 国际化 Schema |
| `backend/schemas/language.py` | 语言 Schema |
| `backend/migrations/003_i18n_init.sql` | 国际化初始化脚本 |
| `backend/migrations/004_i18n_supplement.sql` | 翻译补充脚本 |
| `frontend/utils/i18n.js` | 前端国际化管理器 |
| `frontend/utils/i18n-behavior.js` | 国际化 Behavior |
| `frontend/utils/animations.js` | 动画工具函数 |

---

### 2026-06-06

#### ✨ 新增功能

1. **双主题切换系统**
   - 亮色/暗色双主题支持，亮色模式遵循 Apple Human Interface Guidelines
   - 自动切换：8:00 - 18:30 为亮色，其他时间为暗色
   - 手动切换：用户可手动切换，优先级高于自动
   - 全局切换组件 `theme-toggle`，滑动开关样式
   - 所有页面和组件适配双主题

2. **功能管理模块**
   - 功能数据库模型、Schema、API
   - 用户端功能中心页面，支持自定义排序
   - 首页功能网格，最多显示 4 个
   - 管理端功能管理，支持 CRUD
   - 图标背景色自定义，颜色选择器

3. **意见反馈模块**
   - 反馈数据库模型，支持版本追踪
   - 用户端反馈提交、历史查看
   - 管理端反馈管理、回复功能
   - 版本历史记录，支持多次修改

4. **内容页面模块**
   - 内容页面数据库模型
   - 关于我们、用户协议、隐私政策
   - 登录/注册页面协议链接
   - 我的页面"关于"入口
   - 管理端内容管理 API

#### 🐛 Bug 修复

1. **功能图标背景色**
   - 后端 API 返回 `icon_bg_color` 字段
   - 前端统一使用自定义背景色

2. **内容页面未登录跳转问题**
   - 内容页面接口改为公开，无需登录

3. **亮色主题样式适配**
   - 内容页面添加亮色主题样式

#### 🎨 UI 优化

1. **功能项高度调整**
   - 增加功能项高度，描述支持两行显示
   - 功能中心列表添加描述显示

2. **管理员功能列表**
   - 添加图标背景色显示

---

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
