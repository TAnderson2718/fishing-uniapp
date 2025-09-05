#!/bin/bash

# 数据库连接脚本
# 用途：快速连接到远程数据库（自动管理SSH隧道）
# 作者：数据库迁移工具
# 日期：2025年9月3日

set -e

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TUNNEL_MANAGER="$SCRIPT_DIR/ssh-tunnel-manager.sh"
CONNECTION_INFO_FILE="$SCRIPT_DIR/database-migration/remote_db_connection.env"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查依赖
check_dependencies() {
    if [ ! -f "$TUNNEL_MANAGER" ]; then
        echo -e "${RED}❌ 错误：未找到SSH隧道管理器${NC}"
        echo -e "${RED}文件路径: $TUNNEL_MANAGER${NC}"
        exit 1
    fi
    
    if [ ! -f "$CONNECTION_INFO_FILE" ]; then
        echo -e "${RED}❌ 错误：未找到数据库连接信息${NC}"
        echo -e "${RED}请先运行数据库迁移脚本${NC}"
        exit 1
    fi
    
    # 确保隧道管理器可执行
    chmod +x "$TUNNEL_MANAGER"
}

# 加载连接信息
load_connection_info() {
    source "$CONNECTION_INFO_FILE"
}

# 自动启动隧道并连接数据库
connect_database() {
    echo -e "${BLUE}🐟 钓鱼平台数据库连接工具${NC}"
    echo -e "${BLUE}=========================${NC}"
    
    # 检查并启动SSH隧道
    echo -e "${YELLOW}🔍 检查SSH隧道状态...${NC}"
    
    if ! "$TUNNEL_MANAGER" status | grep -q "运行中"; then
        echo -e "${YELLOW}🚀 启动SSH隧道...${NC}"
        "$TUNNEL_MANAGER" start
    else
        echo -e "${GREEN}✅ SSH隧道已运行${NC}"
    fi
    
    # 构建连接URL
    local tunnel_url="postgresql://${REMOTE_DB_USER}:${REMOTE_DB_PASSWORD}@localhost:15432/${REMOTE_DB_NAME}"
    
    echo ""
    echo -e "${YELLOW}🔗 连接到远程数据库...${NC}"
    echo -e "${BLUE}数据库: ${REMOTE_DB_NAME}${NC}"
    echo -e "${BLUE}用户: ${REMOTE_DB_USER}${NC}"
    echo ""
    
    # 检查psql是否可用
    if command -v psql > /dev/null 2>&1; then
        # 直接连接
        psql "$tunnel_url"
    elif [ -f "/Applications/Postgres.app/Contents/Versions/17/bin/psql" ]; then
        # 使用PostgreSQL.app的psql
        /Applications/Postgres.app/Contents/Versions/17/bin/psql "$tunnel_url"
    else
        echo -e "${RED}❌ 错误：未找到psql命令${NC}"
        echo -e "${YELLOW}💡 连接信息：${NC}"
        echo -e "${BLUE}URL: ${tunnel_url}${NC}"
        echo ""
        echo -e "${YELLOW}您可以使用其他数据库客户端连接到：${NC}"
        echo -e "${BLUE}主机: localhost${NC}"
        echo -e "${BLUE}端口: 15432${NC}"
        echo -e "${BLUE}数据库: ${REMOTE_DB_NAME}${NC}"
        echo -e "${BLUE}用户: ${REMOTE_DB_USER}${NC}"
        echo -e "${BLUE}密码: ${REMOTE_DB_PASSWORD}${NC}"
    fi
}

# 显示连接信息
show_connection_info() {
    echo -e "${BLUE}🔗 数据库连接信息${NC}"
    echo -e "${BLUE}=================${NC}"
    echo ""
    echo -e "${YELLOW}远程数据库：${NC}"
    echo -e "${BLUE}主机: ${REMOTE_DB_HOST}${NC}"
    echo -e "${BLUE}端口: ${REMOTE_DB_PORT}${NC}"
    echo -e "${BLUE}数据库: ${REMOTE_DB_NAME}${NC}"
    echo -e "${BLUE}用户: ${REMOTE_DB_USER}${NC}"
    echo ""
    echo -e "${YELLOW}通过SSH隧道连接：${NC}"
    echo -e "${BLUE}本地主机: localhost${NC}"
    echo -e "${BLUE}本地端口: 15432${NC}"
    echo -e "${BLUE}隧道URL: postgresql://${REMOTE_DB_USER}:${REMOTE_DB_PASSWORD}@localhost:15432/${REMOTE_DB_NAME}${NC}"
    echo ""
    echo -e "${YELLOW}💡 使用方法：${NC}"
    echo -e "1. 运行 ${GREEN}$0${NC} 直接连接"
    echo -e "2. 运行 ${GREEN}$0 info${NC} 查看连接信息"
    echo -e "3. 运行 ${GREEN}$0 tunnel start${NC} 只启动隧道"
    echo -e "4. 运行 ${GREEN}$0 tunnel stop${NC} 停止隧道"
}

# 隧道管理
manage_tunnel() {
    "$TUNNEL_MANAGER" "$@"
}

# 显示帮助
show_help() {
    echo -e "${BLUE}🐟 数据库连接工具 - 帮助${NC}"
    echo -e "${BLUE}========================${NC}"
    echo ""
    echo -e "${YELLOW}用法：${NC}"
    echo -e "  $0 [命令]"
    echo ""
    echo -e "${YELLOW}命令：${NC}"
    echo -e "  ${GREEN}(无参数)${NC}    直接连接数据库"
    echo -e "  ${GREEN}info${NC}        显示连接信息"
    echo -e "  ${GREEN}tunnel${NC}      管理SSH隧道"
    echo -e "    ${GREEN}start${NC}     启动隧道"
    echo -e "    ${GREEN}stop${NC}      停止隧道"
    echo -e "    ${GREEN}status${NC}    查看隧道状态"
    echo -e "    ${GREEN}test${NC}      测试连接"
    echo -e "  ${GREEN}help${NC}        显示帮助"
    echo ""
    echo -e "${YELLOW}示例：${NC}"
    echo -e "  $0              # 连接数据库"
    echo -e "  $0 info         # 查看连接信息"
    echo -e "  $0 tunnel start # 启动隧道"
    echo -e "  $0 tunnel test  # 测试连接"
}

# 主函数
main() {
    check_dependencies
    load_connection_info
    
    case "${1:-connect}" in
        "connect"|"")
            connect_database
            ;;
        "info")
            show_connection_info
            ;;
        "tunnel")
            shift
            manage_tunnel "$@"
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            echo -e "${RED}❌ 未知命令: $1${NC}"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
