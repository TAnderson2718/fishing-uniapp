-- 移除Article系统的数据库迁移脚本
-- 执行前请确保已备份重要数据

-- 删除ArticleImage表的外键约束
ALTER TABLE "public"."ArticleImage" DROP CONSTRAINT IF EXISTS "ArticleImage_articleId_fkey";

-- 删除ArticleImage表（先删除子表，避免外键约束问题）
DROP TABLE IF EXISTS "public"."ArticleImage";

-- 删除Article表
DROP TABLE IF EXISTS "public"."Article";

-- 删除ArticleStatus枚举类型
DROP TYPE IF EXISTS "public"."ArticleStatus";

-- 清理完成
-- 注意：删除表时相关索引会自动删除

