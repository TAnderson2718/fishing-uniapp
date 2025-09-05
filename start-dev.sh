#!/bin/bash

# 钓鱼平台开发环境启动脚本
# 自动管理SSH隧道并启动开发服务器

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TUNNEL_MANAGER="$SCRIPT_DIR/scripts/database-migration/ssh-tunnel-manager.sh"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🐟 钓鱼平台开发环境启动${NC}"
echo -e "${BLUE}========================${NC}"

# 检查SSH隧道管理器
if [ ! -f "$TUNNEL_MANAGER" ]; then
    echo -e "${RED}❌ 错误：未找到SSH隧道管理器${NC}"
    echo -e "${RED}请确保数据库迁移脚本已正确运行${NC}"
    exit 1
fi

# 启动SSH隧道
echo -e "${YELLOW}🔗 启动数据库SSH隧道...${NC}"
chmod +x "$TUNNEL_MANAGER"
"$TUNNEL_MANAGER" start

# 测试数据库连接
echo -e "${YELLOW}🔍 测试数据库连接...${NC}"
if "$TUNNEL_MANAGER" test; then
    echo -e "${GREEN}✅ 数据库连接正常${NC}"
else
    echo -e "${RED}❌ 数据库连接失败${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🚀 开发环境准备就绪！${NC}"
echo ""
echo -e "${YELLOW}💡 提示：${NC}"
echo -e "1. SSH隧道已启动，数据库连接到远程服务器"
echo -e "2. 使用 ${GREEN}npm run dev${NC} 启动开发服务器"
echo -e "3. 使用 ${GREEN}./scripts/database-migration/ssh-tunnel-manager.sh stop${NC} 停止隧道"
echo -e "4. 使用 ${GREEN}./scripts/database-migration/db-connect.sh${NC} 连接数据库"
echo ""

# 可选：自动启动开发服务器
read -p "是否现在启动开发服务器？(y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🚀 启动开发服务器...${NC}"
    npm run dev
fi
