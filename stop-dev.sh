#!/bin/bash

# 钓鱼平台开发环境停止脚本
# 停止SSH隧道和相关服务

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TUNNEL_MANAGER="$SCRIPT_DIR/scripts/database-migration/ssh-tunnel-manager.sh"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🐟 钓鱼平台开发环境停止${NC}"
echo -e "${BLUE}========================${NC}"

# 停止SSH隧道
if [ -f "$TUNNEL_MANAGER" ]; then
    echo -e "${YELLOW}🛑 停止SSH隧道...${NC}"
    chmod +x "$TUNNEL_MANAGER"
    "$TUNNEL_MANAGER" stop
else
    echo -e "${YELLOW}⚠️ 未找到SSH隧道管理器${NC}"
fi

# 停止可能运行的开发服务器
echo -e "${YELLOW}🛑 停止开发服务器进程...${NC}"
pkill -f "npm.*dev" 2>/dev/null || true
pkill -f "node.*dev" 2>/dev/null || true

echo -e "${GREEN}✅ 开发环境已停止${NC}"
