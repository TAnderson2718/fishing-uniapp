#!/bin/bash

# 钓鱼平台数据库迁移脚本
# 用途：将本地数据库备份迁移到远程服务器
# 作者：数据库迁移工具
# 日期：2025年9月3日

set -e  # 遇到错误立即退出

# 配置变量
BACKUP_DIR="./database-backups"
CONNECTION_INFO_FILE="./database-migration/remote_db_connection.env"
SERVER_ALIAS="server-fishing"

# PostgreSQL.app 路径配置
POSTGRES_APP_BIN="/Applications/Postgres.app/Contents/Versions/17/bin"
export PATH="$POSTGRES_APP_BIN:$PATH"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐟 钓鱼平台数据库迁移工具${NC}"
echo -e "${BLUE}==============================${NC}"
echo ""

# 检查连接信息文件
if [ ! -f "$CONNECTION_INFO_FILE" ]; then
    echo -e "${RED}❌ 错误：未找到远程数据库连接信息文件${NC}"
    echo -e "${RED}请先运行: ./02-setup-remote-server.sh${NC}"
    exit 1
fi

# 加载连接信息
echo -e "${YELLOW}📋 加载远程数据库连接信息...${NC}"
source "$CONNECTION_INFO_FILE"

echo -e "${BLUE}远程数据库信息：${NC}"
echo -e "主机: ${REMOTE_DB_HOST}"
echo -e "端口: ${REMOTE_DB_PORT}"
echo -e "数据库: ${REMOTE_DB_NAME}"
echo -e "用户: ${REMOTE_DB_USER}"
echo ""

# 检查备份文件
if [ ! -f "${BACKUP_DIR}/latest_backup.sql" ]; then
    echo -e "${RED}❌ 错误：未找到数据库备份文件${NC}"
    echo -e "${RED}请先运行: ./01-backup-local-database.sh${NC}"
    exit 1
fi

BACKUP_FILE=$(readlink "${BACKUP_DIR}/latest_backup.sql")
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

echo -e "${YELLOW}📁 使用备份文件: ${BACKUP_PATH}${NC}"

# 检查备份信息
if [ -f "${BACKUP_DIR}/latest_backup_info.json" ]; then
    BACKUP_INFO=$(cat "${BACKUP_DIR}/latest_backup_info.json")
    echo -e "${BLUE}备份信息：${NC}"
    echo "$BACKUP_INFO" | jq '.' 2>/dev/null || echo "$BACKUP_INFO"
    echo ""
fi

# 创建SSH隧道进行数据库连接
echo -e "${YELLOW}🔍 创建SSH隧道连接远程数据库...${NC}"
LOCAL_PORT=15432
SSH_TUNNEL_PID=""

# 创建SSH隧道
ssh -f -N -L ${LOCAL_PORT}:localhost:5432 "$SERVER_ALIAS"
SSH_TUNNEL_PID=$!

# 等待隧道建立
sleep 2

# 通过SSH隧道测试连接
TUNNEL_DATABASE_URL="postgresql://${REMOTE_DB_USER}:${REMOTE_DB_PASSWORD}@localhost:${LOCAL_PORT}/${REMOTE_DB_NAME}"

echo -e "${YELLOW}🔍 测试通过SSH隧道的数据库连接...${NC}"
if ! psql "$TUNNEL_DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
    echo -e "${RED}❌ 错误：无法通过SSH隧道连接到远程数据库${NC}"
    echo -e "${RED}请检查SSH配置和数据库状态${NC}"
    # 清理SSH隧道
    if [ ! -z "$SSH_TUNNEL_PID" ]; then
        kill $SSH_TUNNEL_PID 2>/dev/null || true
    fi
    exit 1
fi

echo -e "${GREEN}✅ SSH隧道数据库连接成功${NC}"

# 清理函数
cleanup() {
    if [ ! -z "$SSH_TUNNEL_PID" ]; then
        echo -e "${YELLOW}🧹 清理SSH隧道...${NC}"
        kill $SSH_TUNNEL_PID 2>/dev/null || true
    fi
}

# 设置退出时清理
trap cleanup EXIT

# 检查远程数据库是否为空
echo -e "${YELLOW}🔍 检查远程数据库状态...${NC}"
REMOTE_TABLE_COUNT=$(psql "$TUNNEL_DATABASE_URL" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')

if [ "$REMOTE_TABLE_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}⚠️ 警告：远程数据库不为空（包含 ${REMOTE_TABLE_COUNT} 个表）${NC}"
    echo -e "${YELLOW}继续操作将清空现有数据${NC}"
    
    read -p "是否继续？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}操作已取消${NC}"
        exit 0
    fi
else
    echo -e "${GREEN}✅ 远程数据库为空，可以安全迁移${NC}"
fi

# 创建迁移前备份（如果远程数据库不为空）
if [ "$REMOTE_TABLE_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}💾 创建远程数据库迁移前备份...${NC}"
    REMOTE_BACKUP_FILE="${BACKUP_DIR}/remote_pre_migration_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    pg_dump "$TUNNEL_DATABASE_URL" \
        --verbose \
        --clean \
        --if-exists \
        --create \
        --format=plain \
        --encoding=UTF8 \
        --no-owner \
        --no-privileges \
        > "$REMOTE_BACKUP_FILE"
    
    echo -e "${GREEN}✅ 远程数据库备份完成: ${REMOTE_BACKUP_FILE}${NC}"
fi

# 修复备份文件中的数据库名称
echo -e "${YELLOW}🔧 修复备份文件中的数据库名称...${NC}"
FIXED_BACKUP_PATH="${BACKUP_DIR}/fixed_backup_$(date +%Y%m%d_%H%M%S).sql"

# 替换数据库名称并移除不兼容的命令
sed -e "s/wanyu_diaowan_dev/${REMOTE_DB_NAME}/g" \
    -e '/\\restrict/d' \
    -e '/\\unrestrict/d' \
    -e '/transaction_timeout/d' \
    "$BACKUP_PATH" > "$FIXED_BACKUP_PATH"

echo -e "${GREEN}✅ 备份文件修复完成${NC}"

# 上传修复后的备份文件到服务器
echo -e "${YELLOW}📤 上传修复后的备份文件到服务器...${NC}"
REMOTE_BACKUP_PATH="/tmp/fishing_platform_backup.sql"

scp "$FIXED_BACKUP_PATH" "$SERVER_ALIAS:$REMOTE_BACKUP_PATH"

echo -e "${GREEN}✅ 备份文件上传完成${NC}"

# 在服务器上执行数据恢复
echo -e "${YELLOW}🔄 开始数据库恢复...${NC}"

# 创建远程恢复脚本
REMOTE_RESTORE_SCRIPT="/tmp/restore_database.sh"

cat > "/tmp/local_restore_script.sh" << EOF
#!/bin/bash

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

LOCAL_DATABASE_URL="postgresql://${REMOTE_DB_USER}:${REMOTE_DB_PASSWORD}@localhost:5432/${REMOTE_DB_NAME}"
REMOTE_BACKUP_PATH="$REMOTE_BACKUP_PATH"

echo -e "\${YELLOW}🗄️ 开始恢复数据库...\${NC}"

# 恢复数据库（在服务器上使用本地连接）
psql "\$LOCAL_DATABASE_URL" < "\$REMOTE_BACKUP_PATH"

if [ \$? -eq 0 ]; then
    echo -e "\${GREEN}✅ 数据库恢复成功！\${NC}"
else
    echo -e "\${RED}❌ 数据库恢复失败！\${NC}"
    exit 1
fi

# 验证恢复结果
echo -e "\${YELLOW}🔍 验证恢复结果...\${NC}"

TABLE_COUNT=\$(psql "\$LOCAL_DATABASE_URL" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')
TOTAL_RECORDS=\$(psql "\$LOCAL_DATABASE_URL" -t -c "SELECT SUM(n_tup_ins + n_tup_upd) FROM pg_stat_user_tables WHERE schemaname = 'public';" | tr -d ' ')

echo -e "\${BLUE}恢复后统计信息：\${NC}"
echo -e "  表数量: \${TABLE_COUNT}"
echo -e "  总记录数: \${TOTAL_RECORDS:-0}"

# 清理临时文件
rm -f "\$REMOTE_BACKUP_PATH"

echo -e "\${GREEN}🎉 数据库迁移完成！\${NC}"
EOF

# 上传并执行恢复脚本
scp "/tmp/local_restore_script.sh" "$SERVER_ALIAS:$REMOTE_RESTORE_SCRIPT"
ssh "$SERVER_ALIAS" "chmod +x $REMOTE_RESTORE_SCRIPT && $REMOTE_RESTORE_SCRIPT"

# 验证迁移结果
echo -e "${YELLOW}🔍 验证迁移结果...${NC}"

# 获取本地和远程数据库统计信息进行对比
LOCAL_DB_URL="postgresql://daniel@localhost:5432/wanyu_diaowan_dev"

echo -e "${BLUE}对比本地和远程数据库：${NC}"

LOCAL_TABLE_COUNT=$(psql "$LOCAL_DB_URL" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')
REMOTE_TABLE_COUNT=$(psql "$TUNNEL_DATABASE_URL" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')

LOCAL_USER_COUNT=$(psql "$LOCAL_DB_URL" -t -c "SELECT count(*) FROM \"User\";" | tr -d ' ')
REMOTE_USER_COUNT=$(psql "$TUNNEL_DATABASE_URL" -t -c "SELECT count(*) FROM \"User\";" | tr -d ' ')

echo -e "表数量 - 本地: ${LOCAL_TABLE_COUNT}, 远程: ${REMOTE_TABLE_COUNT}"
echo -e "用户数量 - 本地: ${LOCAL_USER_COUNT}, 远程: ${REMOTE_USER_COUNT}"

if [ "$LOCAL_TABLE_COUNT" -eq "$REMOTE_TABLE_COUNT" ] && [ "$LOCAL_USER_COUNT" -eq "$REMOTE_USER_COUNT" ]; then
    echo -e "${GREEN}✅ 数据验证成功，迁移完整！${NC}"
else
    echo -e "${YELLOW}⚠️ 警告：数据可能不完整，请检查${NC}"
fi

# 创建迁移报告
MIGRATION_REPORT="./database-migration/migration_report_$(date +%Y%m%d_%H%M%S).json"

cat > "$MIGRATION_REPORT" << EOF
{
  "migration_timestamp": "$(date -Iseconds)",
  "source_database": "$LOCAL_DB_URL",
  "target_database": "$REMOTE_DATABASE_URL",
  "backup_file": "$BACKUP_PATH",
  "migration_status": "completed",
  "verification": {
    "local_table_count": $LOCAL_TABLE_COUNT,
    "remote_table_count": $REMOTE_TABLE_COUNT,
    "local_user_count": $LOCAL_USER_COUNT,
    "remote_user_count": $REMOTE_USER_COUNT,
    "data_integrity": $([ "$LOCAL_TABLE_COUNT" -eq "$REMOTE_TABLE_COUNT" ] && [ "$LOCAL_USER_COUNT" -eq "$REMOTE_USER_COUNT" ] && echo "true" || echo "false")
  }
}
EOF

echo -e "${GREEN}📋 迁移报告已保存到: ${MIGRATION_REPORT}${NC}"

echo ""
echo -e "${GREEN}🎉 数据库迁移完成！${NC}"
echo -e "${BLUE}==============================${NC}"
echo -e "${BLUE}远程数据库连接信息：${NC}"
echo -e "URL: ${REMOTE_DATABASE_URL}"
echo ""
echo -e "${YELLOW}📝 下一步：${NC}"
echo -e "1. 运行本地配置更新脚本: ./04-update-local-config.sh"
echo -e "2. 测试应用连接: npm run dev"
echo ""

# 清理临时文件
rm -f "/tmp/local_restore_script.sh"
