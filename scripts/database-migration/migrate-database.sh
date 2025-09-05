#!/bin/bash

# 钓鱼平台数据库迁移主脚本
# 用途：一键完成从本地到远程服务器的数据库迁移
# 作者：数据库迁移工具
# 日期：2025年9月3日

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐟 钓鱼平台数据库迁移工具${NC}"
echo -e "${BLUE}==============================${NC}"
echo -e "${BLUE}版本: v1.0${NC}"
echo -e "${BLUE}日期: $(date -Iseconds)${NC}"
echo ""

# 检查脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 检查必要的工具
echo -e "${YELLOW}🔍 检查系统环境...${NC}"

MISSING_TOOLS=()

if ! command -v psql &> /dev/null; then
    MISSING_TOOLS+=("postgresql-client")
fi

if ! command -v ssh &> /dev/null; then
    MISSING_TOOLS+=("ssh")
fi

if ! command -v scp &> /dev/null; then
    MISSING_TOOLS+=("scp")
fi

if ! command -v jq &> /dev/null; then
    MISSING_TOOLS+=("jq")
fi

if [ ${#MISSING_TOOLS[@]} -gt 0 ]; then
    echo -e "${RED}❌ 错误：缺少必要的工具${NC}"
    echo -e "${RED}请安装以下工具：${NC}"
    for tool in "${MISSING_TOOLS[@]}"; do
        echo -e "${RED}  - $tool${NC}"
    done
    echo ""
    echo -e "${YELLOW}安装命令示例：${NC}"
    echo -e "${YELLOW}macOS: brew install postgresql jq${NC}"
    echo -e "${YELLOW}Ubuntu: sudo apt-get install postgresql-client jq${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 系统环境检查通过${NC}"

# 显示迁移步骤
echo ""
echo -e "${BLUE}📋 迁移步骤：${NC}"
echo -e "1. 🗄️ 备份本地数据库"
echo -e "2. 🖥️ 配置远程服务器"
echo -e "3. 📤 迁移数据到远程"
echo -e "4. ⚙️ 更新本地配置"
echo ""

# 确认开始迁移
read -p "是否开始数据库迁移？(y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}迁移已取消${NC}"
    exit 0
fi

echo ""
echo -e "${GREEN}🚀 开始数据库迁移...${NC}"
echo ""

# 步骤1：备份本地数据库
echo -e "${BLUE}步骤 1/4: 备份本地数据库${NC}"
echo -e "${BLUE}========================${NC}"

if [ -f "./01-backup-local-database.sh" ]; then
    chmod +x "./01-backup-local-database.sh"
    ./01-backup-local-database.sh
else
    echo -e "${RED}❌ 错误：未找到备份脚本${NC}"
    exit 1
fi

echo ""
read -p "备份完成，按回车继续..."
echo ""

# 步骤2：配置远程服务器
echo -e "${BLUE}步骤 2/4: 配置远程服务器${NC}"
echo -e "${BLUE}========================${NC}"

if [ -f "./02-setup-remote-server.sh" ]; then
    chmod +x "./02-setup-remote-server.sh"
    ./02-setup-remote-server.sh
else
    echo -e "${RED}❌ 错误：未找到服务器配置脚本${NC}"
    exit 1
fi

echo ""
read -p "服务器配置完成，按回车继续..."
echo ""

# 步骤3：迁移数据到远程
echo -e "${BLUE}步骤 3/4: 迁移数据到远程${NC}"
echo -e "${BLUE}========================${NC}"

if [ -f "./03-migrate-to-remote.sh" ]; then
    chmod +x "./03-migrate-to-remote.sh"
    ./03-migrate-to-remote.sh
else
    echo -e "${RED}❌ 错误：未找到数据迁移脚本${NC}"
    exit 1
fi

echo ""
read -p "数据迁移完成，按回车继续..."
echo ""

# 步骤4：更新本地配置
echo -e "${BLUE}步骤 4/4: 更新本地配置${NC}"
echo -e "${BLUE}========================${NC}"

if [ -f "./04-update-local-config.sh" ]; then
    chmod +x "./04-update-local-config.sh"
    ./04-update-local-config.sh
else
    echo -e "${RED}❌ 错误：未找到配置更新脚本${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 数据库迁移完成！${NC}"
echo -e "${BLUE}==============================${NC}"
echo ""

# 显示迁移总结
echo -e "${BLUE}📊 迁移总结：${NC}"
echo -e "✅ 本地数据库已备份"
echo -e "✅ 远程服务器已配置"
echo -e "✅ 数据已迁移到远程"
echo -e "✅ 本地配置已更新"
echo ""

# 显示下一步操作
echo -e "${YELLOW}📝 下一步操作：${NC}"
echo ""
echo -e "${BLUE}1. 测试应用连接${NC}"
echo -e "   cd ../../services/api"
echo -e "   npm run start:dev"
echo ""
echo -e "${BLUE}2. 启动前端应用${NC}"
echo -e "   # 管理员端"
echo -e "   cd ../../apps/admin"
echo -e "   npm run dev"
echo ""
echo -e "   # 员工端"
echo -e "   cd ../../apps/staff"
echo -e "   npm run dev"
echo ""
echo -e "${BLUE}3. 查看开发者文档${NC}"
echo -e "   cat ../../docs/developer-database-config.md"
echo ""

# 显示访问信息
if [ -f "./database-migration/remote_db_connection.env" ]; then
    source "./database-migration/remote_db_connection.env"
    echo -e "${BLUE}🔗 远程数据库连接信息：${NC}"
    echo -e "主机: ${REMOTE_DB_HOST}"
    echo -e "端口: ${REMOTE_DB_PORT}"
    echo -e "数据库: ${REMOTE_DB_NAME}"
    echo -e "用户: ${REMOTE_DB_USER}"
    echo ""
fi

echo -e "${BLUE}🌐 应用访问地址：${NC}"
echo -e "管理员端: http://localhost:5175"
echo -e "员工端: http://localhost:5177"
echo ""

echo -e "${GREEN}🎊 迁移成功！现在可以与团队共享数据库了！${NC}"
