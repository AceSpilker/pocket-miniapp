-- ============================================
-- 国际化补充翻译数据
-- 补充 profile、content 等模块的翻译
-- ============================================

-- ============================================
-- Profile 模块翻译
-- ============================================

-- Profile 模块 - 中文 (language_id = 1)
INSERT INTO `i18n_texts` (`text_key`, `language_id`, `text_value`, `module`, `description`) VALUES
('profile.title', 1, '个人资料', 'profile', '页面标题'),
('profile.basicInfo', 1, '基本信息', 'profile', '基本信息标题'),
('profile.nickname', 1, '昵称', 'profile', '昵称标签'),
('profile.phone', 1, '手机号', 'profile', '手机号标签'),
('profile.email', 1, '邮箱', 'profile', '邮箱标签'),
('profile.save', 1, '保存资料', 'profile', '保存按钮'),
('profile.noNickname', 1, '未设置昵称', 'profile', '未设置昵称提示'),
('profile.nicknamePlaceholder', 1, '请输入昵称', 'profile', '昵称占位符'),
('profile.optional', 1, '选填', 'profile', '选填提示'),
('profile.saveSuccess', 1, '保存成功', 'profile', '保存成功提示'),
('profile.saveFailed', 1, '保存失败', 'profile', '保存失败提示'),
('profile.avatarUploadSuccess', 1, '头像上传成功', 'profile', '头像上传成功'),
('profile.uploadFailed', 1, '上传失败', 'profile', '上传失败'),
('profile.imageTooLarge', 1, '图片超过2MB，请压缩后重试', 'profile', '图片过大提示'),
('profile.selectImageFailed', 1, '选择图片失败', 'profile', '选择图片失败'),
('profile.readImageFailed', 1, '读取图片失败', 'profile', '读取图片失败'),
('profile.invalidNickname', 1, '昵称格式不正确', 'profile', '昵称格式错误'),
('profile.invalidPhone', 1, '手机号格式不正确', 'profile', '手机号格式错误'),
('profile.invalidEmail', 1, '邮箱格式不正确', 'profile', '邮箱格式错误')
ON DUPLICATE KEY UPDATE `text_value` = VALUES(`text_value`);

-- Profile 模块 - 英文 (language_id = 2)
INSERT INTO `i18n_texts` (`text_key`, `language_id`, `text_value`, `module`, `description`) VALUES
('profile.title', 2, 'Profile', 'profile', 'Page title'),
('profile.basicInfo', 2, 'Basic Info', 'profile', 'Basic info title'),
('profile.nickname', 2, 'Nickname', 'profile', 'Nickname label'),
('profile.phone', 2, 'Phone', 'profile', 'Phone label'),
('profile.email', 2, 'Email', 'profile', 'Email label'),
('profile.save', 2, 'Save', 'profile', 'Save button'),
('profile.noNickname', 2, 'No nickname', 'profile', 'No nickname hint'),
('profile.nicknamePlaceholder', 2, 'Enter nickname', 'profile', 'Nickname placeholder'),
('profile.optional', 2, 'Optional', 'profile', 'Optional hint'),
('profile.saveSuccess', 2, 'Saved successfully', 'profile', 'Save success'),
('profile.saveFailed', 2, 'Save failed', 'profile', 'Save failed'),
('profile.avatarUploadSuccess', 2, 'Avatar uploaded', 'profile', 'Avatar upload success'),
('profile.uploadFailed', 2, 'Upload failed', 'profile', 'Upload failed'),
('profile.imageTooLarge', 2, 'Image exceeds 2MB, please compress', 'profile', 'Image too large'),
('profile.selectImageFailed', 2, 'Failed to select image', 'profile', 'Select image failed'),
('profile.readImageFailed', 2, 'Failed to read image', 'profile', 'Read image failed'),
('profile.invalidNickname', 2, 'Invalid nickname format', 'profile', 'Invalid nickname'),
('profile.invalidPhone', 2, 'Invalid phone format', 'profile', 'Invalid phone'),
('profile.invalidEmail', 2, 'Invalid email format', 'profile', 'Invalid email')
ON DUPLICATE KEY UPDATE `text_value` = VALUES(`text_value`);

-- Profile 模块 - 日文 (language_id = 3)
INSERT INTO `i18n_texts` (`text_key`, `language_id`, `text_value`, `module`, `description`) VALUES
('profile.title', 3, 'プロフィール', 'profile', 'ページタイトル'),
('profile.basicInfo', 3, '基本情報', 'profile', '基本情報タイトル'),
('profile.nickname', 3, 'ニックネーム', 'profile', 'ニックネームラベル'),
('profile.phone', 3, '電話番号', 'profile', '電話番号ラベル'),
('profile.email', 3, 'メール', 'profile', 'メールラベル'),
('profile.save', 3, '保存', 'profile', '保存ボタン'),
('profile.noNickname', 3, 'ニックネーム未設定', 'profile', 'ニックネーム未設定'),
('profile.nicknamePlaceholder', 3, 'ニックネームを入力', 'profile', 'ニックネームプレースホルダー'),
('profile.optional', 3, '任意', 'profile', '任意ヒント'),
('profile.saveSuccess', 3, '保存成功', 'profile', '保存成功'),
('profile.saveFailed', 3, '保存失敗', 'profile', '保存失敗'),
('profile.avatarUploadSuccess', 3, 'アバターがアップロードされました', 'profile', 'アバターアップロード成功'),
('profile.uploadFailed', 3, 'アップロード失敗', 'profile', 'アップロード失敗'),
('profile.imageTooLarge', 3, '画像が2MBを超えています', 'profile', '画像が大きすぎます'),
('profile.selectImageFailed', 3, '画像の選択に失敗しました', 'profile', '画像選択失敗'),
('profile.readImageFailed', 3, '画像の読み取りに失敗しました', 'profile', '画像読み取り失敗'),
('profile.invalidNickname', 3, 'ニックネームの形式が正しくありません', 'profile', '無効なニックネーム'),
('profile.invalidPhone', 3, '電話番号の形式が正しくありません', 'profile', '無効な電話番号'),
('profile.invalidEmail', 3, 'メールの形式が正しくありません', 'profile', '無効なメール')
ON DUPLICATE KEY UPDATE `text_value` = VALUES(`text_value`);

-- ============================================
-- Content 模块翻译
-- ============================================

-- Content 模块 - 中文 (language_id = 1)
INSERT INTO `i18n_texts` (`text_key`, `language_id`, `text_value`, `module`, `description`) VALUES
('content.loadFailed', 1, '内容加载失败，请稍后重试', 'content', '内容加载失败'),
('content.about', 1, '关于我们', 'content', '关于我们'),
('content.userAgreement', 1, '用户协议', 'content', '用户协议'),
('content.privacyPolicy', 1, '隐私政策', 'content', '隐私政策')
ON DUPLICATE KEY UPDATE `text_value` = VALUES(`text_value`);

-- Content 模块 - 英文 (language_id = 2)
INSERT INTO `i18n_texts` (`text_key`, `language_id`, `text_value`, `module`, `description`) VALUES
('content.loadFailed', 2, 'Failed to load content, please try again later', 'content', 'Content load failed'),
('content.about', 2, 'About Us', 'content', 'About us'),
('content.userAgreement', 2, 'User Agreement', 'content', 'User agreement'),
('content.privacyPolicy', 2, 'Privacy Policy', 'content', 'Privacy policy')
ON DUPLICATE KEY UPDATE `text_value` = VALUES(`text_value`);

-- Content 模块 - 日文 (language_id = 3)
INSERT INTO `i18n_texts` (`text_key`, `language_id`, `text_value`, `module`, `description`) VALUES
('content.loadFailed', 3, 'コンテンツの読み込みに失敗しました', 'content', 'コンテンツ読み込み失敗'),
('content.about', 3, '私たちについて', 'content', '私たちについて'),
('content.userAgreement', 3, '利用規約', 'content', '利用規約'),
('content.privacyPolicy', 3, 'プライバシーポリシー', 'content', 'プライバシーポリシー')
ON DUPLICATE KEY UPDATE `text_value` = VALUES(`text_value`);

-- ============================================
-- 补充 Mine 模块缺失的翻译
-- ============================================

-- Mine 模块 - 中文 (language_id = 1)
INSERT INTO `i18n_texts` (`text_key`, `language_id`, `text_value`, `module`, `description`) VALUES
('mine.systemManageDesc', 1, '用户、角色、菜单管理', 'mine', '系统管理描述'),
('mine.logoutTitle', 1, '退出确认', 'mine', '退出确认标题'),
('mine.logouted', 1, '已退出', 'mine', '已退出提示'),
('mine.personalManage', 1, '个人管理', 'mine', '个人管理'),
('mine.settingsFeedback', 1, '设置与反馈', 'mine', '设置与反馈'),
('mine.systemSettings', 1, '系统设置', 'mine', '系统设置'),
('mine.developing', 1, '功能开发中', 'mine', '功能开发中'),
('mine.defaultUser', 1, '用户', 'mine', '默认用户'),
('mine.phone', 1, '手机号', 'mine', '手机号'),
('mine.email', 1, '邮箱', 'mine', '邮箱')
ON DUPLICATE KEY UPDATE `text_value` = VALUES(`text_value`);

-- Mine 模块 - 英文 (language_id = 2)
INSERT INTO `i18n_texts` (`text_key`, `language_id`, `text_value`, `module`, `description`) VALUES
('mine.systemManageDesc', 2, 'Users, roles, menus', 'mine', 'System management description'),
('mine.logoutTitle', 2, 'Confirm Logout', 'mine', 'Logout confirm title'),
('mine.logouted', 2, 'Logged out', 'mine', 'Logged out'),
('mine.personalManage', 2, 'Personal', 'mine', 'Personal management'),
('mine.settingsFeedback', 2, 'Settings & Feedback', 'mine', 'Settings and feedback'),
('mine.systemSettings', 2, 'System Settings', 'mine', 'System settings'),
('mine.developing', 2, 'Coming soon', 'mine', 'Developing'),
('mine.defaultUser', 2, 'User', 'mine', 'Default user'),
('mine.phone', 2, 'Phone', 'mine', 'Phone'),
('mine.email', 2, 'Email', 'mine', 'Email')
ON DUPLICATE KEY UPDATE `text_value` = VALUES(`text_value`);

-- Mine 模块 - 日文 (language_id = 3)
INSERT INTO `i18n_texts` (`text_key`, `language_id`, `text_value`, `module`, `description`) VALUES
('mine.systemManageDesc', 3, 'ユーザー、ロール、メニュー管理', 'mine', 'システム管理説明'),
('mine.logoutTitle', 3, 'ログアウト確認', 'mine', 'ログアウト確認タイトル'),
('mine.logouted', 3, 'ログアウトしました', 'mine', 'ログアウトしました'),
('mine.personalManage', 3, '個人管理', 'mine', '個人管理'),
('mine.settingsFeedback', 3, '設定とフィードバック', 'mine', '設定とフィードバック'),
('mine.systemSettings', 3, 'システム設定', 'mine', 'システム設定'),
('mine.developing', 3, '開発中', 'mine', '開発中'),
('mine.defaultUser', 3, 'ユーザー', 'mine', 'デフォルトユーザー'),
('mine.phone', 3, '電話番号', 'mine', '電話番号'),
('mine.email', 3, 'メール', 'mine', 'メール')
ON DUPLICATE KEY UPDATE `text_value` = VALUES(`text_value`);

-- ============================================
-- 补充 Login 模块缺失的翻译
-- ============================================

-- Login 模块 - 中文 (language_id = 1)
INSERT INTO `i18n_texts` (`text_key`, `language_id`, `text_value`, `module`, `description`) VALUES
('login.noAccount', 1, '还没有账号？', 'login', '没有账号提示'),
('login.and', 1, '和', 'login', '和'),
('login.wechatTip', 1, '点击下方按钮，使用微信一键登录', 'login', '微信登录提示'),
('login.pendingNotice', 1, '待处理通知', 'login', '待处理通知'),
('login.pendingContent', 1, '您有', 'login', '您有'),
('login.pendingFeedback', 1, '条意见反馈待处理', 'login', '条意见反馈待处理'),
('login.loginFailed', 1, '登录失败', 'login', '登录失败'),
('login.wxLoginFailed', 1, '微信登录失败', 'login', '微信登录失败')
ON DUPLICATE KEY UPDATE `text_value` = VALUES(`text_value`);

-- Login 模块 - 英文 (language_id = 2)
INSERT INTO `i18n_texts` (`text_key`, `language_id`, `text_value`, `module`, `description`) VALUES
('login.noAccount', 2, "Don't have an account?", 'login', 'No account hint'),
('login.and', 2, 'and', 'login', 'and'),
('login.wechatTip', 2, 'Click the button below to login with WeChat', 'login', 'WeChat login tip'),
('login.pendingNotice', 2, 'Pending Notice', 'login', 'Pending notice'),
('login.pendingContent', 2, 'You have', 'login', 'You have'),
('login.pendingFeedback', 2, 'feedback items pending', 'login', 'Feedback items pending'),
('login.loginFailed', 2, 'Login failed', 'login', 'Login failed'),
('login.wxLoginFailed', 2, 'WeChat login failed', 'login', 'WeChat login failed')
ON DUPLICATE KEY UPDATE `text_value` = VALUES(`text_value`);

-- Login 模块 - 日文 (language_id = 3)
INSERT INTO `i18n_texts` (`text_key`, `language_id`, `text_value`, `module`, `description`) VALUES
('login.noAccount', 3, 'アカウントをお持ちでないですか？', 'login', 'アカウントをお持ちでないですか'),
('login.and', 3, 'と', 'login', 'と'),
('login.wechatTip', 3, '下のボタンをクリックしてWeChatでログイン', 'login', 'WeChatログインヒント'),
('login.pendingNotice', 3, '保留中の通知', 'login', '保留中の通知'),
('login.pendingContent', 3, '', 'login', ''),
('login.pendingFeedback', 3, '件のフィードバックが保留中です', 'login', '件のフィードバックが保留中です'),
('login.loginFailed', 3, 'ログイン失敗', 'login', 'ログイン失敗'),
('login.wxLoginFailed', 3, 'WeChatログイン失敗', 'login', 'WeChatログイン失敗')
ON DUPLICATE KEY UPDATE `text_value` = VALUES(`text_value`);
