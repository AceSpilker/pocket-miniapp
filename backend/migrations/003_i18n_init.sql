-- 国际化数据库迁移脚本
-- 执行前请确保备份数据库

-- ==================== 1. 创建语言表 ====================
CREATE TABLE IF NOT EXISTS `languages` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(10) NOT NULL UNIQUE COMMENT '语言代码',
    `name` VARCHAR(50) NOT NULL COMMENT '语言名称',
    `native_name` VARCHAR(50) COMMENT '本地名称',
    `is_active` BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    `sort_order` INT DEFAULT 0 COMMENT '排序',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='语言表';

-- ==================== 2. 插入语言初始数据 ====================
INSERT INTO `languages` (`code`, `name`, `native_name`, `is_active`, `sort_order`) VALUES
('zh-CN', '简体中文', '简体中文', TRUE, 1),
('en-US', 'English', 'English', TRUE, 2),
('ja-JP', '日本語', '日本語', TRUE, 3);

-- ==================== 3. 用户表添加语言偏好字段 ====================
ALTER TABLE `users` ADD COLUMN `language_id` INT NULL DEFAULT 1 COMMENT '语言偏好ID' AFTER `email`;
ALTER TABLE `users` ADD CONSTRAINT `fk_user_language` FOREIGN KEY (`language_id`) REFERENCES `languages`(`id`) ON DELETE SET NULL;

-- ==================== 4. 创建内容页面翻译表 ====================
CREATE TABLE IF NOT EXISTS `content_page_translations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `content_page_id` INT NOT NULL COMMENT '内容页面ID',
    `language_id` INT NOT NULL COMMENT '语言ID',
    `title` VARCHAR(100) NOT NULL COMMENT '页面标题',
    `content` TEXT NOT NULL COMMENT '页面内容',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_content_page_language` (`content_page_id`, `language_id`),
    CONSTRAINT `fk_cpt_content_page` FOREIGN KEY (`content_page_id`) REFERENCES `content_pages`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_cpt_language` FOREIGN KEY (`language_id`) REFERENCES `languages`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='内容页面翻译表';

-- ==================== 5. 创建国际化文本表 ====================
CREATE TABLE IF NOT EXISTS `i18n_texts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `text_key` VARCHAR(100) NOT NULL COMMENT '文本键',
    `language_id` INT NOT NULL COMMENT '语言ID',
    `text_value` TEXT NOT NULL COMMENT '文本值',
    `module` VARCHAR(50) COMMENT '模块名称',
    `description` VARCHAR(200) COMMENT '文本描述',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_text_key_language` (`text_key`, `language_id`),
    CONSTRAINT `fk_i18n_language` FOREIGN KEY (`language_id`) REFERENCES `languages`(`id`) ON DELETE CASCADE,
    INDEX `idx_text_key` (`text_key`),
    INDEX `idx_module` (`module`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='国际化文本表';

-- ==================== 6. 插入内容页面翻译数据 ====================

-- 获取内容页面ID（假设已存在的页面）
-- 注意：需要根据实际ID调整，这里使用子查询

-- 关于我们 - 英文
INSERT INTO `content_page_translations` (`content_page_id`, `language_id`, `title`, `content`)
SELECT cp.id, 2, 'About Us', '<h1>Pocket Mini App</h1>
<p>Pocket Mini App is a lightweight personal toolbox application dedicated to providing users with convenient and efficient service experience.</p>

<h2>🎯 Our Vision</h2>
<p>To build a simple, practical, and beautiful personal tool platform, allowing every user to enjoy the convenience brought by technology.</p>

<h2>✨ Core Features</h2>
<ul>
<li><strong>Feature Center</strong>: Integrated practical tools for daily needs</li>
<li><strong>Announcements</strong>: Get the latest updates and important information in time</li>
<li><strong>Feedback</strong>: Send us suggestions and feedback anytime</li>
<li><strong>Personal Management</strong>: Complete user system and permission management</li>
</ul>

<h2>🛠️ Technical Architecture</h2>
<p>The frontend is developed with WeChat Mini Program native framework, and the backend is built with FastAPI + MySQL + Redis to ensure system stability and high performance.</p>

<h2>📞 Contact Us</h2>
<p>If you have any questions or suggestions, please contact us through the "Feedback" feature.</p>

<p style="text-align: center; color: #888; margin-top: 32px;">Version: 1.0.0</p>
<p style="text-align: center; color: #888;">© 2026 Pocket Mini App All Rights Reserved</p>'
FROM `content_pages` cp WHERE cp.page_key = 'about';

-- 关于我们 - 日文
INSERT INTO `content_page_translations` (`content_page_id`, `language_id`, `title`, `content`)
SELECT cp.id, 3, '私たちについて', '<h1>ポケットミニアプリ</h1>
<p>ポケットミニアプリは、ユーザーに便利で効率的なサービス体験を提供することに専念する軽量の個人ツールボックスアプリケーションです。</p>

<h2>🎯 私たちのビジョン</h2>
<p>シンプルで実用的で美しい個人ツールプラットフォームを構築し、すべてのユーザーが技術の利便性を享受できるようにします。</p>

<h2>✨ 主な機能</h2>
<ul>
<li><strong>機能センター</strong>：日常のニーズを満たす実用的なツールを統合</li>
<li><strong>お知らせ</strong>：最新の更新と重要な情報をタイムリーに入手</li>
<li><strong>フィードバック</strong>：いつでもご提案やご意見をお送りください</li>
<li><strong>個人管理</strong>：完全なユーザーシステムと権限管理</li>
</ul>

<h2>🛠️ 技術アーキテクチャ</h2>
<p>フロントエンドはWeChatミニプログラムネイティブフレームワークで開発され、バックエンドはFastAPI + MySQL + Redisで構築され、システムの安定性と高性能を確保しています。</p>

<h2>📞 お問い合わせ</h2>
<p>ご質問やご提案がございましたら、「フィードバック」機能からお問い合わせください。</p>

<p style="text-align: center; color: #888; margin-top: 32px;">バージョン：1.0.0</p>
<p style="text-align: center; color: #888;">© 2026 ポケットミニアプリ 全著作権所有</p>'
FROM `content_pages` cp WHERE cp.page_key = 'about';

-- 用户协议 - 英文
INSERT INTO `content_page_translations` (`content_page_id`, `language_id`, `title`, `content`)
SELECT cp.id, 2, 'User Agreement', '<h1>User Service Agreement</h1>
<p>Welcome to use Pocket Mini App! Please read the following service agreement terms carefully before using this application.</p>

<h2>1. Confirmation and Acceptance of Service Terms</h2>
<p>1.1 This agreement is an agreement between you and Pocket Mini App regarding the use of this application services.</p>
<p>1.2 By clicking to confirm or otherwise accepting this agreement through the web page, you have reached an agreement with Pocket Mini App and agree to accept all the terms of this agreement.</p>

<h2>2. User Registration</h2>
<p>2.1 You need to register an account to use some features of this application. When registering, you should provide real, accurate, and complete personal information as prompted on the page.</p>
<p>2.2 You should properly keep your account and password, and you may be responsible for any losses caused by your improper storage.</p>
<p>2.3 You may not transfer, sell, or lend your account to others. All actions under the account are deemed to be your actions.</p>

<h2>3. User Code of Conduct</h2>
<p>3.1 You should comply with national laws and regulations and policies when using this application services.</p>
<p>3.2 You may not use this application to engage in illegal activities that endanger national security, leak state secrets, or undermine national unity.</p>

<h2>4. Service Content</h2>
<p>4.1 The services provided by this application include but are not limited to feature center, announcements, feedback, etc.</p>
<p>4.2 We have the right to change, interrupt, or terminate some or all services at any time without any liability to you or any third party.</p>

<h2>5. Privacy Protection</h2>
<p>5.1 We attach importance to user privacy protection, please refer to the Privacy Policy for details.</p>

<p style="text-align: center; color: #888; margin-top: 32px;">Update Date: June 6, 2026</p>'
FROM `content_pages` cp WHERE cp.page_key = 'user_agreement';

-- 用户协议 - 日文
INSERT INTO `content_page_translations` (`content_page_id`, `language_id`, `title`, `content`)
SELECT cp.id, 3, '利用規約', '<h1>利用規約</h1>
<p>ポケットミニアプリへようこそ！本アプリケーションをご利用になる前に、以下の利用規約をよくお読みください。</p>

<h2>1. サービス条項の確認と承諾</h2>
<p>1.1 本規約は、本アプリケーションのサービスの利用に関する、お客様とポケットミニアプリとの間の契約です。</p>
<p>1.2 お客様がWebページで確認をクリックするか、その他の方法で本規約を受け入れることにより、お客様はポケットミニアプリと契約を締結し、本規約のすべての条項に同意したものとみなされます。</p>

<h2>2. ユーザー登録</h2>
<p>2.1 本アプリケーションの一部の機能を使用するには、アカウントを登録する必要があります。登録時に、ページの指示に従って真実、正確、完全な個人情報を提供してください。</p>
<p>2.2 アカウントとパスワードは適切に管理してください。不適切な管理による損失はお客様の責任となります。</p>
<p>2.3 アカウントを他人に譲渡、販売、または貸与することはできません。アカウント下のすべての行為はお客様自身の行為とみなされます。</p>

<h2>3. ユーザー行動規範</h2>
<p>3.1 本アプリケーションのサービスを使用する際は、国の法律、規制、および政策を遵守してください。</p>
<p>3.2 国家の安全を脅かし、国家機密を漏洩し、または民族の団結を損なう違法行為に本アプリケーションを使用することはできません。</p>

<h2>4. サービス内容</h2>
<p>4.1 本アプリケーションが提供するサービスには、機能センター、お知らせ、フィードバックなどが含まれますが、これらに限定されません。</p>
<p>4.2 当社は、お客様または第三者に責任を負うことなく、いつでも一部またはすべてのサービスを変更、中断、または終了する権利を有します。</p>

<h2>5. プライバシー保護</h2>
<p>5.1 当社はユーザーのプライバシー保護を重視しています。詳細はプライバシーポリシーをご参照ください。</p>

<p style="text-align: center; color: #888; margin-top: 32px;">更新日：2026年6月6日</p>'
FROM `content_pages` cp WHERE cp.page_key = 'user_agreement';

-- 隐私政策 - 英文
INSERT INTO `content_page_translations` (`content_page_id`, `language_id`, `title`, `content`)
SELECT cp.id, 2, 'Privacy Policy', '<h1>Privacy Policy</h1>
<p>Pocket Mini App attaches great importance to user privacy protection. This privacy policy aims to explain how we collect, use, store, and protect your personal information.</p>

<h2>1. Information We Collect</h2>
<p>1.1 Account Information: Username, nickname, phone number, email, etc. provided during registration.</p>
<p>1.2 Usage Information: Operation logs, access records, etc. generated when you use the service.</p>
<p>1.3 Device Information: Your device model, operating system version, unique device identifier, etc.</p>

<h2>2. How We Use the Collected Information</h2>
<p>2.1 To provide, maintain, and improve our services.</p>
<p>2.2 To send you service notifications and marketing information (you can choose to unsubscribe).</p>
<p>2.3 To ensure service security and prevent fraud and illegal activities.</p>

<h2>3. Information Sharing</h2>
<p>3.1 We will not sell your personal information to third parties.</p>
<p>3.2 Except with your explicit consent or as required by law, we will not share your personal information with any third party.</p>

<h2>4. Information Storage and Protection</h2>
<p>4.1 Your personal information is stored on servers located in the People''s Republic of China.</p>
<p>4.2 We adopt industry-standard security measures to protect your personal information.</p>

<h2>5. Your Rights</h2>
<p>5.1 Right of Access: You have the right to access your personal information held by us.</p>
<p>5.2 Right of Correction: You have the right to correct inaccurate personal information.</p>
<p>5.3 Right of Deletion: Under certain circumstances, you have the right to request the deletion of your personal information.</p>

<p style="text-align: center; color: #888; margin-top: 32px;">Update Date: June 6, 2026</p>'
FROM `content_pages` cp WHERE cp.page_key = 'privacy_policy';

-- 隐私政策 - 日文
INSERT INTO `content_page_translations` (`content_page_id`, `language_id`, `title`, `content`)
SELECT cp.id, 3, 'プライバシーポリシー', '<h1>プライバシーポリシー</h1>
<p>ポケットミニアプリは、ユーザーのプライバシー保護を非常に重視しています。本プライバシーポリシーは、当社がどのようにお客様の個人情報を収集、使用、保存、保護するかを説明することを目的としています。</p>

<h2>1. 収集する情報</h2>
<p>1.1 アカウント情報：登録時に提供されたユーザー名、ニックネーム、電話番号、メールアドレスなど。</p>
<p>1.2 使用情報：サービスを使用する際に生成される操作ログ、アクセス記録など。</p>
<p>1.3 デバイス情報：デバイスモデル、オペレーティングシステムバージョン、一意のデバイス識別子など。</p>

<h2>2. 収集した情報の使用方法</h2>
<p>2.1 サービスの提供、維持、改善のため。</p>
<p>2.2 サービス通知やマーケティング情報の送信のため（配信停止を選択できます）。</p>
<p>2.3 サービスのセキュリティを確保し、詐欺や違法行為を防止するため。</p>

<h2>3. 情報の共有</h2>
<p>3.1 当社はお客様の個人情報を第三者に販売しません。</p>
<p>3.2 お客様の明示的な同意がある場合、または法律で義務付けられている場合を除き、当社はお客様の個人情報をいかなる第三者とも共有しません。</p>

<h2>4. 情報の保管と保護</h2>
<p>4.1 お客様の個人情報は、中華人民共和国にあるサーバーに保存されています。</p>
<p>4.2 当社は業界標準のセキュリティ対策を採用して、お客様の個人情報を保護しています。</p>

<h2>5. お客様の権利</h2>
<p>5.1 アクセス権：当社が保有するお客様の個人情報にアクセスする権利があります。</p>
<p>5.2 訂正権：不正確な個人情報を訂正する権利があります。</p>
<p>5.3 削除権：特定の状況下で、お客様の個人情報の削除を要求する権利があります。</p>

<p style="text-align: center; color: #888; margin-top: 32px;">更新日：2026年6月6日</p>'
FROM `content_pages` cp WHERE cp.page_key = 'privacy_policy';

-- ==================== 7. 插入UI文本翻译数据 ====================

-- 通用模块 - 中文（默认已在代码中，这里可选）
INSERT INTO `i18n_texts` (`text_key`, `language_id`, `text_value`, `module`, `description`) VALUES
('common.save', 1, '保存', 'common', '保存按钮'),
('common.cancel', 1, '取消', 'common', '取消按钮'),
('common.confirm', 1, '确认', 'common', '确认按钮'),
('common.delete', 1, '删除', 'common', '删除按钮'),
('common.edit', 1, '编辑', 'common', '编辑按钮'),
('common.create', 1, '创建', 'common', '创建按钮'),
('common.search', 1, '搜索', 'common', '搜索按钮'),
('common.loading', 1, '加载中...', 'common', '加载状态'),
('common.success', 1, '操作成功', 'common', '成功提示'),
('common.error', 1, '操作失败', 'common', '失败提示'),
('common.noData', 1, '暂无数据', 'common', '空状态');

-- 通用模块 - 英文
INSERT INTO `i18n_texts` (`text_key`, `language_id`, `text_value`, `module`, `description`) VALUES
('common.save', 2, 'Save', 'common', 'Save button'),
('common.cancel', 2, 'Cancel', 'common', 'Cancel button'),
('common.confirm', 2, 'Confirm', 'common', 'Confirm button'),
('common.delete', 2, 'Delete', 'common', 'Delete button'),
('common.edit', 2, 'Edit', 'common', 'Edit button'),
('common.create', 2, 'Create', 'common', 'Create button'),
('common.search', 2, 'Search', 'common', 'Search button'),
('common.loading', 2, 'Loading...', 'common', 'Loading status'),
('common.success', 2, 'Success', 'common', 'Success message'),
('common.error', 2, 'Error', 'common', 'Error message'),
('common.noData', 2, 'No Data', 'common', 'Empty state');

-- 通用模块 - 日文
INSERT INTO `i18n_texts` (`text_key`, `language_id`, `text_value`, `module`, `description`) VALUES
('common.save', 3, '保存', 'common', '保存ボタン'),
('common.cancel', 3, 'キャンセル', 'common', 'キャンセルボタン'),
('common.confirm', 3, '確認', 'common', '確認ボタン'),
('common.delete', 3, '削除', 'common', '削除ボタン'),
('common.edit', 3, '編集', 'common', '編集ボタン'),
('common.create', 3, '作成', 'common', '作成ボタン'),
('common.search', 3, '検索', 'common', '検索ボタン'),
('common.loading', 3, '読み込み中...', 'common', '読み込み状態'),
('common.success', 3, '成功', 'common', '成功メッセージ'),
('common.error', 3, 'エラー', 'common', 'エラーメッセージ'),
('common.noData', 3, 'データなし', 'common', '空状態');

-- 登录模块 - 中文
INSERT INTO `i18n_texts` (`text_key`, `language_id`, `text_value`, `module`, `description`) VALUES
('login.title', 1, '口袋小程序', 'login', '应用名称'),
('login.subtitle', 1, '轻量个人工具箱', 'login', '应用副标题'),
('login.accountTab', 1, '账号登录', 'login', '账号登录标签'),
('login.wechatTab', 1, '微信登录', 'login', '微信登录标签'),
('login.usernamePlaceholder', 1, '请输入用户名', 'login', '用户名占位符'),
('login.passwordPlaceholder', 1, '请输入密码', 'login', '密码占位符'),
('login.button', 1, '登录', 'login', '登录按钮'),
('login.wechatButton', 1, '微信一键登录', 'login', '微信登录按钮'),
('login.registerLink', 1, '立即注册', 'login', '注册链接'),
('login.agreement', 1, '登录即代表同意', 'login', '协议提示'),
('login.userAgreement', 1, '用户协议', 'login', '用户协议'),
('login.privacyPolicy', 1, '隐私政策', 'login', '隐私政策'),
('login.language', 1, '语言', 'login', '语言设置');

-- 登录模块 - 英文
INSERT INTO `i18n_texts` (`text_key`, `language_id`, `text_value`, `module`, `description`) VALUES
('login.title', 2, 'Pocket Mini App', 'login', 'App name'),
('login.subtitle', 2, 'Lightweight Personal Toolbox', 'login', 'App subtitle'),
('login.accountTab', 2, 'Account Login', 'login', 'Account login tab'),
('login.wechatTab', 2, 'WeChat Login', 'login', 'WeChat login tab'),
('login.usernamePlaceholder', 2, 'Enter username', 'login', 'Username placeholder'),
('login.passwordPlaceholder', 2, 'Enter password', 'login', 'Password placeholder'),
('login.button', 2, 'Login', 'login', 'Login button'),
('login.wechatButton', 2, 'WeChat Login', 'login', 'WeChat login button'),
('login.registerLink', 2, 'Register Now', 'login', 'Register link'),
('login.agreement', 2, 'By logging in, you agree to', 'login', 'Agreement notice'),
('login.userAgreement', 2, 'User Agreement', 'login', 'User agreement'),
('login.privacyPolicy', 2, 'Privacy Policy', 'login', 'Privacy policy'),
('login.language', 2, 'Language', 'login', 'Language setting');

-- 登录模块 - 日文
INSERT INTO `i18n_texts` (`text_key`, `language_id`, `text_value`, `module`, `description`) VALUES
('login.title', 3, 'ポケットミニアプリ', 'login', 'アプリ名'),
('login.subtitle', 3, '軽量個人ツールボックス', 'login', 'アプリサブタイトル'),
('login.accountTab', 3, 'アカウントログイン', 'login', 'アカウントログインタブ'),
('login.wechatTab', 3, 'WeChatログイン', 'login', 'WeChatログインタブ'),
('login.usernamePlaceholder', 3, 'ユーザー名を入力', 'login', 'ユーザー名プレースホルダー'),
('login.passwordPlaceholder', 3, 'パスワードを入力', 'login', 'パスワードプレースホルダー'),
('login.button', 3, 'ログイン', 'login', 'ログインボタン'),
('login.wechatButton', 3, 'WeChatログイン', 'login', 'WeChatログインボタン'),
('login.registerLink', 3, '今すぐ登録', 'login', '登録リンク'),
('login.agreement', 3, 'ログインすることで、以下に同意したものとみなされます', 'login', '契約通知'),
('login.userAgreement', 3, '利用規約', 'login', '利用規約'),
('login.privacyPolicy', 3, 'プライバシーポリシー', 'login', 'プライバシーポリシー'),
('login.language', 3, '言語', 'login', '言語設定');

-- 我的页面模块 - 中文
INSERT INTO `i18n_texts` (`text_key`, `language_id`, `text_value`, `module`, `description`) VALUES
('mine.title', 1, '我的', 'mine', '页面标题'),
('mine.notLoggedIn', 1, '未登录', 'mine', '未登录状态'),
('mine.clickToLogin', 1, '点击此处登录', 'mine', '登录提示'),
('mine.systemManage', 1, '系统管理', 'mine', '系统管理'),
('mine.profile', 1, '个人资料', 'mine', '个人资料'),
('mine.changePassword', 1, '修改密码', 'mine', '修改密码'),
('mine.about', 1, '关于我们', 'mine', '关于我们'),
('mine.feedback', 1, '意见反馈', 'mine', '意见反馈'),
('mine.language', 1, '语言设置', 'mine', '语言设置'),
('mine.logout', 1, '退出登录', 'mine', '退出登录');

-- 我的页面模块 - 英文
INSERT INTO `i18n_texts` (`text_key`, `language_id`, `text_value`, `module`, `description`) VALUES
('mine.title', 2, 'Me', 'mine', 'Page title'),
('mine.notLoggedIn', 2, 'Not Logged In', 'mine', 'Not logged in status'),
('mine.clickToLogin', 2, 'Click to login', 'mine', 'Login prompt'),
('mine.systemManage', 2, 'System Management', 'mine', 'System management'),
('mine.profile', 2, 'Profile', 'mine', 'Profile'),
('mine.changePassword', 2, 'Change Password', 'mine', 'Change password'),
('mine.about', 2, 'About Us', 'mine', 'About us'),
('mine.feedback', 2, 'Feedback', 'mine', 'Feedback'),
('mine.language', 2, 'Language', 'mine', 'Language setting'),
('mine.logout', 2, 'Logout', 'mine', 'Logout');

-- 我的页面模块 - 日文
INSERT INTO `i18n_texts` (`text_key`, `language_id`, `text_value`, `module`, `description`) VALUES
('mine.title', 3, 'マイページ', 'mine', 'ページタイトル'),
('mine.notLoggedIn', 3, '未ログイン', 'mine', '未ログイン状態'),
('mine.clickToLogin', 3, 'ここをクリックしてログイン', 'mine', 'ログインプロンプト'),
('mine.systemManage', 3, 'システム管理', 'mine', 'システム管理'),
('mine.profile', 3, 'プロフィール', 'mine', 'プロフィール'),
('mine.changePassword', 3, 'パスワード変更', 'mine', 'パスワード変更'),
('mine.about', 3, '私たちについて', 'mine', '私たちについて'),
('mine.feedback', 3, 'フィードバック', 'mine', 'フィードバック'),
('mine.language', 3, '言語設定', 'mine', '言語設定'),
('mine.logout', 3, 'ログアウト', 'mine', 'ログアウト');

-- 首页模块 - 中文
INSERT INTO `i18n_texts` (`text_key`, `language_id`, `text_value`, `module`, `description`) VALUES
('index.welcome', 1, '欢迎', 'index', '欢迎'),
('index.featureCenter', 1, '功能中心', 'index', '功能中心'),
('index.recentNews', 1, '最近动态', 'index', '最近动态'),
('index.tips', 1, '小提示', 'index', '小提示'),
('index.more', 1, '更多', 'index', '更多');

-- 首页模块 - 英文
INSERT INTO `i18n_texts` (`text_key`, `language_id`, `text_value`, `module`, `description`) VALUES
('index.welcome', 2, 'Welcome', 'index', 'Welcome'),
('index.featureCenter', 2, 'Features', 'index', 'Feature center'),
('index.recentNews', 2, 'Recent News', 'index', 'Recent news'),
('index.tips', 2, 'Tips', 'index', 'Tips'),
('index.more', 2, 'More', 'index', 'More');

-- 首页模块 - 日文
INSERT INTO `i18n_texts` (`text_key`, `language_id`, `text_value`, `module`, `description`) VALUES
('index.welcome', 3, 'ようこそ', 'index', 'ようこそ'),
('index.featureCenter', 3, '機能センター', 'index', '機能センター'),
('index.recentNews', 3, '最近のお知らせ', 'index', '最近のお知らせ'),
('index.tips', 3, 'ヒント', 'index', 'ヒント'),
('index.more', 3, 'もっと見る', 'index', 'もっと見る');
