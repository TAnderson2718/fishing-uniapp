#!/bin/bash

# 本地配置更新脚本
# 用途：更新本地应用配置以使用远程数据库（通过SSH隧道）
# 作者：数据库迁移工具
# 日期：2025年9月3日

set -e

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONNECTION_INFO_FILE="$SCRIPT_DIR/database-migration/remote_db_connection.env"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐟 钓鱼平台本地配置更新工具${NC}"
echo -e "${BLUE}==============================${NC}"
echo ""

# 检查连接信息文件
if [ ! -f "$CONNECTION_INFO_FILE" ]; then
    echo -e "${RED}❌ 错误：未找到远程数据库连接信息${NC}"
    echo -e "${RED}请先运行数据库迁移脚本${NC}"
    exit 1
fi

# 加载连接信息
source "$CONNECTION_INFO_FILE"

# 构建SSH隧道连接URL
TUNNEL_DATABASE_URL="postgresql://${REMOTE_DB_USER}:${REMOTE_DB_PASSWORD}@localhost:15432/${REMOTE_DB_NAME}"

echo -e "${YELLOW}📋 配置信息：${NC}"
echo -e "${BLUE}项目根目录: ${PROJECT_ROOT}${NC}"
echo -e "${BLUE}远程数据库: ${REMOTE_DB_HOST}:${REMOTE_DB_PORT}/${REMOTE_DB_NAME}${NC}"
echo -e "${BLUE}隧道连接URL: ${TUNNEL_DATABASE_URL}${NC}"
echo ""

# 备份原始配置文件
backup_config_file() {
    local file_path="$1"
    local backup_path="${file_path}.backup.$(date +%Y%m%d_%H%M%S)"
    
    if [ -f "$file_path" ]; then
        cp "$file_path" "$backup_path"
        echo -e "${GREEN}✅ 已备份: ${file_path} → ${backup_path}${NC}"
    fi
}

# 更新API服务配置
echo -e "${YELLOW}🔧 更新API服务配置...${NC}"

API_ENV_FILE="$PROJECT_ROOT/services/api/.env"

if [ -f "$API_ENV_FILE" ]; then
    backup_config_file "$API_ENV_FILE"
    
    # 更新DATABASE_URL
    if grep -q "^DATABASE_URL=" "$API_ENV_FILE"; then
        # 替换现有的DATABASE_URL
        sed -i.tmp "s|^DATABASE_URL=.*|DATABASE_URL=${TUNNEL_DATABASE_URL}|" "$API_ENV_FILE"
        rm -f "${API_ENV_FILE}.tmp"
    else
        # 添加新的DATABASE_URL
        echo "DATABASE_URL=${TUNNEL_DATABASE_URL}" >> "$API_ENV_FILE"
    fi
    
    echo -e "${GREEN}✅ API服务配置已更新${NC}"
else
    echo -e "${YELLOW}⚠️ 未找到API服务配置文件: ${API_ENV_FILE}${NC}"
    
    # 创建新的配置文件
    mkdir -p "$(dirname "$API_ENV_FILE")"
    cat > "$API_ENV_FILE" << EOF
DATABASE_URL=${TUNNEL_DATABASE_URL}
WECHAT_MINI_APPID=wx357a3efa4e493bc0
WECHAT_MINI_SECRET=d9b2d98b0ceba3f90fd743e9d170fca5
EOF
    echo -e "${GREEN}✅ 已创建新的API服务配置文件${NC}"
fi

# 创建开发环境启动脚本
echo -e "${YELLOW}📝 创建开发环境启动脚本...${NC}"

DEV_SCRIPT="$PROJECT_ROOT/start-dev.sh"

cat > "$DEV_SCRIPT" << 'EOF'
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
EOF

chmod +x "$DEV_SCRIPT"
echo -e "${GREEN}✅ 开发环境启动脚本已创建: ${DEV_SCRIPT}${NC}"

# 创建停止脚本
echo -e "${YELLOW}📝 创建环境停止脚本...${NC}"

STOP_SCRIPT="$PROJECT_ROOT/stop-dev.sh"

cat > "$STOP_SCRIPT" << 'EOF'
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
EOF

chmod +x "$STOP_SCRIPT"
echo -e "${GREEN}✅ 环境停止脚本已创建: ${STOP_SCRIPT}${NC}"

# 创建数据库管理快捷脚本
echo -e "${YELLOW}📝 创建数据库管理快捷脚本...${NC}"

# 创建数据库连接快捷方式
DB_SHORTCUT="$PROJECT_ROOT/db.sh"
cat > "$DB_SHORTCUT" << EOF
#!/bin/bash
# 数据库连接快捷方式
exec "$SCRIPT_DIR/scripts/database-migration/db-connect.sh" "\$@"
EOF
chmod +x "$DB_SHORTCUT"

# 创建隧道管理快捷方式
TUNNEL_SHORTCUT="$PROJECT_ROOT/tunnel.sh"
cat > "$TUNNEL_SHORTCUT" << EOF
#!/bin/bash
# SSH隧道管理快捷方式
exec "$SCRIPT_DIR/scripts/database-migration/ssh-tunnel-manager.sh" "\$@"
EOF
chmod +x "$TUNNEL_SHORTCUT"

echo -e "${GREEN}✅ 快捷脚本已创建:${NC}"
echo -e "${BLUE}  - ${DB_SHORTCUT} (数据库连接)${NC}"
echo -e "${BLUE}  - ${TUNNEL_SHORTCUT} (隧道管理)${NC}"

echo ""
echo -e "${GREEN}🎉 配置更新完成！${NC}"
echo -e "${BLUE}==================${NC}"
echo ""
echo -e "${YELLOW}📋 使用指南：${NC}"
echo ""
echo -e "${BLUE}1. 启动开发环境：${NC}"
echo -e "   ${GREEN}./start-dev.sh${NC}"
echo ""
echo -e "${BLUE}2. 连接数据库：${NC}"
echo -e "   ${GREEN}./db.sh${NC}                    # 直接连接"
echo -e "   ${GREEN}./db.sh info${NC}               # 查看连接信息"
echo ""
echo -e "${BLUE}3. 管理SSH隧道：${NC}"
echo -e "   ${GREEN}./tunnel.sh start${NC}          # 启动隧道"
echo -e "   ${GREEN}./tunnel.sh status${NC}         # 查看状态"
echo -e "   ${GREEN}./tunnel.sh stop${NC}           # 停止隧道"
echo ""
echo -e "${BLUE}4. 停止开发环境：${NC}"
echo -e "   ${GREEN}./stop-dev.sh${NC}"
echo ""
echo -e "${YELLOW}💡 重要提示：${NC}"
echo -e "- 数据库现在连接到远程服务器（通过SSH隧道）"
echo -e "- 开发前请确保SSH隧道已启动"
echo -e "- 原始配置文件已备份，可随时恢复"
echo ""
