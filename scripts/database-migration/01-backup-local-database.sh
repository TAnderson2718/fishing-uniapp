#!/bin/bash

# 钓鱼平台数据库备份脚本
# 用途：备份本地PostgreSQL数据库，准备迁移到远程服务器
# 作者：数据库迁移工具
# 日期：2025年9月3日

set -e  # 遇到错误立即退出

# 配置变量
LOCAL_DB_URL="postgresql://daniel@localhost:5432/wanyu_diaowan_dev"
BACKUP_DIR="./database-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="fishing_platform_backup_${TIMESTAMP}.sql"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

# PostgreSQL.app 路径配置
POSTGRES_APP_BIN="/Applications/Postgres.app/Contents/Versions/17/bin"
export PATH="$POSTGRES_APP_BIN:$PATH"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐟 钓鱼平台数据库备份工具${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# 创建备份目录
echo -e "${YELLOW}📁 创建备份目录...${NC}"
mkdir -p "$BACKUP_DIR"

# 检查PostgreSQL连接
echo -e "${YELLOW}🔍 检查数据库连接...${NC}"

# 检查PostgreSQL.app是否安装
if [ ! -d "$POSTGRES_APP_BIN" ]; then
    echo -e "${RED}❌ 错误：未找到 PostgreSQL.app${NC}"
    echo -e "${RED}请确保 PostgreSQL.app 已正确安装${NC}"
    echo -e "${YELLOW}下载地址: https://postgresapp.com/${NC}"
    exit 1
fi

# 检查pg_dump命令
if ! command -v pg_dump &> /dev/null; then
    echo -e "${RED}❌ 错误：未找到 pg_dump 命令${NC}"
    echo -e "${RED}PostgreSQL.app 路径: $POSTGRES_APP_BIN${NC}"
    echo -e "${YELLOW}请确保 PostgreSQL.app 已正确安装并启动${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 找到 PostgreSQL.app 工具${NC}"
echo -e "${BLUE}pg_dump 路径: $(which pg_dump)${NC}"

# 测试数据库连接
echo -e "${YELLOW}🔗 测试数据库连接...${NC}"
if ! psql "$LOCAL_DB_URL" -c "SELECT 1;" &> /dev/null; then
    echo -e "${RED}❌ 错误：无法连接到本地数据库${NC}"
    echo -e "${RED}请确保 PostgreSQL 服务正在运行${NC}"
    echo -e "${RED}数据库URL: $LOCAL_DB_URL${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 数据库连接成功${NC}"

# 获取数据库统计信息
echo -e "${YELLOW}📊 获取数据库统计信息...${NC}"
TABLE_COUNT=$(psql "$LOCAL_DB_URL" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')
TOTAL_RECORDS=$(psql "$LOCAL_DB_URL" -t -c "
    SELECT SUM(n_tup_ins + n_tup_upd) 
    FROM pg_stat_user_tables 
    WHERE schemaname = 'public';
" | tr -d ' ')

echo -e "${BLUE}数据库统计信息：${NC}"
echo -e "  表数量: ${TABLE_COUNT}"
echo -e "  总记录数: ${TOTAL_RECORDS:-0}"
echo ""

# 执行数据库备份
echo -e "${YELLOW}💾 开始备份数据库...${NC}"
echo -e "${BLUE}备份文件: ${BACKUP_PATH}${NC}"

# 使用pg_dump进行完整备份
pg_dump "$LOCAL_DB_URL" \
    --verbose \
    --clean \
    --if-exists \
    --create \
    --format=plain \
    --encoding=UTF8 \
    --no-owner \
    --no-privileges \
    > "$BACKUP_PATH"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 数据库备份成功！${NC}"
else
    echo -e "${RED}❌ 数据库备份失败！${NC}"
    exit 1
fi

# 检查备份文件
BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
echo -e "${BLUE}备份文件大小: ${BACKUP_SIZE}${NC}"

# 验证备份文件
echo -e "${YELLOW}🔍 验证备份文件...${NC}"
if [ -s "$BACKUP_PATH" ]; then
    LINE_COUNT=$(wc -l < "$BACKUP_PATH")
    echo -e "${GREEN}✅ 备份文件验证成功${NC}"
    echo -e "${BLUE}备份文件行数: ${LINE_COUNT}${NC}"
else
    echo -e "${RED}❌ 备份文件为空或不存在${NC}"
    exit 1
fi

# 创建备份信息文件
INFO_FILE="${BACKUP_DIR}/backup_info_${TIMESTAMP}.json"
cat > "$INFO_FILE" << EOF
{
  "backup_timestamp": "${TIMESTAMP}",
  "backup_file": "${BACKUP_FILE}",
  "backup_path": "${BACKUP_PATH}",
  "backup_size": "${BACKUP_SIZE}",
  "source_database": "${LOCAL_DB_URL}",
  "table_count": ${TABLE_COUNT},
  "total_records": ${TOTAL_RECORDS:-0},
  "backup_date": "$(date -Iseconds)",
  "backup_type": "full",
  "compression": false,
  "format": "plain_sql"
}
EOF

echo -e "${GREEN}📋 备份信息已保存到: ${INFO_FILE}${NC}"

# 创建最新备份的符号链接
ln -sf "$BACKUP_FILE" "${BACKUP_DIR}/latest_backup.sql"
ln -sf "backup_info_${TIMESTAMP}.json" "${BACKUP_DIR}/latest_backup_info.json"

echo ""
echo -e "${GREEN}🎉 数据库备份完成！${NC}"
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}备份文件: ${BACKUP_PATH}${NC}"
echo -e "${BLUE}信息文件: ${INFO_FILE}${NC}"
echo -e "${BLUE}最新备份链接: ${BACKUP_DIR}/latest_backup.sql${NC}"
echo ""
echo -e "${YELLOW}📝 下一步：${NC}"
echo -e "1. 运行服务器配置脚本: ./02-setup-remote-server.sh"
echo -e "2. 运行数据迁移脚本: ./03-migrate-to-remote.sh"
echo ""
