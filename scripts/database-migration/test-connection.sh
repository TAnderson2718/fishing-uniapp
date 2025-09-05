#!/bin/bash

# 钓鱼平台数据库连接测试脚本
# 用途：测试本地和远程数据库连接
# 作者：数据库迁移工具
# 日期：2025年9月3日

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐟 钓鱼平台数据库连接测试${NC}"
echo -e "${BLUE}=============================${NC}"
echo ""

# 测试本地数据库连接
echo -e "${YELLOW}🔍 测试本地数据库连接...${NC}"
LOCAL_DB_URL="postgresql://daniel@localhost:5432/wanyu_diaowan_dev"

if psql "$LOCAL_DB_URL" -c "SELECT 1;" &> /dev/null; then
    echo -e "${GREEN}✅ 本地数据库连接成功${NC}"
    
    # 获取本地数据库统计
    LOCAL_TABLE_COUNT=$(psql "$LOCAL_DB_URL" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')
    LOCAL_USER_COUNT=$(psql "$LOCAL_DB_URL" -t -c "SELECT count(*) FROM \"User\";" | tr -d ' ')
    
    echo -e "${BLUE}本地数据库统计：${NC}"
    echo -e "  表数量: ${LOCAL_TABLE_COUNT}"
    echo -e "  用户数量: ${LOCAL_USER_COUNT}"
else
    echo -e "${RED}❌ 本地数据库连接失败${NC}"
    echo -e "${YELLOW}这是正常的，如果已经迁移到远程数据库${NC}"
fi

echo ""

# 测试远程数据库连接
CONNECTION_INFO_FILE="./database-migration/remote_db_connection.env"

if [ -f "$CONNECTION_INFO_FILE" ]; then
    echo -e "${YELLOW}🔍 测试远程数据库连接...${NC}"
    
    # 加载连接信息
    source "$CONNECTION_INFO_FILE"
    
    echo -e "${BLUE}远程数据库信息：${NC}"
    echo -e "主机: ${REMOTE_DB_HOST}"
    echo -e "端口: ${REMOTE_DB_PORT}"
    echo -e "数据库: ${REMOTE_DB_NAME}"
    echo -e "用户: ${REMOTE_DB_USER}"
    echo ""
    
    if psql "$REMOTE_DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
        echo -e "${GREEN}✅ 远程数据库连接成功${NC}"
        
        # 获取远程数据库统计
        REMOTE_TABLE_COUNT=$(psql "$REMOTE_DATABASE_URL" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')
        REMOTE_USER_COUNT=$(psql "$REMOTE_DATABASE_URL" -t -c "SELECT count(*) FROM \"User\";" | tr -d ' ')
        
        echo -e "${BLUE}远程数据库统计：${NC}"
        echo -e "  表数量: ${REMOTE_TABLE_COUNT}"
        echo -e "  用户数量: ${REMOTE_USER_COUNT}"
        
        # 测试Prisma连接
        echo ""
        echo -e "${YELLOW}🔍 测试Prisma连接...${NC}"
        cd ../../services/api
        
        if npx prisma db pull --print > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Prisma连接成功${NC}"
        else
            echo -e "${RED}❌ Prisma连接失败${NC}"
        fi
        
        cd ../../scripts/database-migration
        
    else
        echo -e "${RED}❌ 远程数据库连接失败${NC}"
        echo -e "${RED}请检查网络连接和数据库配置${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ 未找到远程数据库连接信息${NC}"
    echo -e "${YELLOW}请先运行数据库迁移脚本${NC}"
fi

echo ""

# 测试SSH连接
echo -e "${YELLOW}🔍 测试SSH连接...${NC}"
SERVER_ALIAS="server-fishing"

if ssh -o ConnectTimeout=10 "$SERVER_ALIAS" "echo 'SSH连接成功'" 2>/dev/null; then
    echo -e "${GREEN}✅ SSH连接成功${NC}"
    
    # 获取服务器信息
    SERVER_OS=$(ssh "$SERVER_ALIAS" "cat /etc/os-release | grep '^ID=' | cut -d'=' -f2 | tr -d '\"'" 2>/dev/null || echo "未知")
    SERVER_IP=$(ssh "$SERVER_ALIAS" "hostname -I | awk '{print \$1}'" 2>/dev/null || echo "未知")
    
    echo -e "${BLUE}服务器信息：${NC}"
    echo -e "  系统: ${SERVER_OS}"
    echo -e "  IP地址: ${SERVER_IP}"
else
    echo -e "${RED}❌ SSH连接失败${NC}"
    echo -e "${RED}请检查SSH配置和服务器状态${NC}"
fi

echo ""
echo -e "${BLUE}🎯 连接测试完成${NC}"
echo ""
