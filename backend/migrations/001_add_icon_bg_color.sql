-- 添加 icon_bg_color 字段到 features 表
-- 执行时间: 2026-06-06

ALTER TABLE features
ADD COLUMN icon_bg_color VARCHAR(20) NULL COMMENT '图标背景颜色（十六进制）'
AFTER icon;
