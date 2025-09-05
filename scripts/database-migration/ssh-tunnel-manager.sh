#!/bin/bash

# SSH隧道管理脚本
# 用途：自动化管理到远程数据库的SSH隧道连接
# 作者：数据库迁移工具
# 日期：2025年9月3日

set -e

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONNECTION_INFO_FILE="$SCRIPT_DIR/database-migration/remote_db_connection.env"
SERVER_ALIAS="server-fishing"
LOCAL_PORT=15432
TUNNEL_PID_FILE="/tmp/fishing_db_tunnel.pid"
TUNNEL_LOG_FILE="/tmp/fishing_db_tunnel.log"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 加载数据库连接信息
load_connection_info() {
    if [ ! -f "$CONNECTION_INFO_FILE" ]; then
        echo -e "${RED}❌ 错误：未找到数据库连接信息文件${NC}"
        echo -e "${RED}文件路径: $CONNECTION_INFO_FILE${NC}"
        echo -e "${YELLOW}请先运行数据库迁移脚本${NC}"
        exit 1
    fi
    
    source "$CONNECTION_INFO_FILE"
    
    if [ -z "$REMOTE_DB_HOST" ] || [ -z "$REMOTE_DB_NAME" ] || [ -z "$REMOTE_DB_USER" ] || [ -z "$REMOTE_DB_PASSWORD" ]; then
        echo -e "${RED}❌ 错误：数据库连接信息不完整${NC}"
        exit 1
    fi
}

# 检查隧道状态
check_tunnel_status() {
    if [ -f "$TUNNEL_PID_FILE" ]; then
        local pid=$(cat "$TUNNEL_PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            # 检查端口是否真的在监听
            if lsof -i :$LOCAL_PORT > /dev/null 2>&1; then
                return 0  # 隧道正在运行
            else
                # PID存在但端口未监听，清理PID文件
                rm -f "$TUNNEL_PID_FILE"
                return 1  # 隧道未运行
            fi
        else
            # PID不存在，清理PID文件
            rm -f "$TUNNEL_PID_FILE"
            return 1  # 隧道未运行
        fi
    else
        return 1  # 隧道未运行
    fi
}

# 启动SSH隧道
start_tunnel() {
    echo -e "${BLUE}🔗 钓鱼平台数据库SSH隧道管理器${NC}"
    echo -e "${BLUE}====================================${NC}"
    
    if check_tunnel_status; then
        echo -e "${YELLOW}⚠️ SSH隧道已经在运行中${NC}"
        show_tunnel_info
        return 0
    fi
    
    echo -e "${YELLOW}🚀 启动SSH隧道...${NC}"
    
    # 测试SSH连接
    if ! ssh -o ConnectTimeout=5 "$SERVER_ALIAS" "echo 'SSH连接测试成功'" > /dev/null 2>&1; then
        echo -e "${RED}❌ 错误：无法连接到服务器 $SERVER_ALIAS${NC}"
        echo -e "${RED}请检查SSH配置和网络连接${NC}"
        exit 1
    fi
    
    # 启动SSH隧道
    ssh -f -N -L ${LOCAL_PORT}:localhost:5432 "$SERVER_ALIAS" \
        -o ExitOnForwardFailure=yes \
        -o ServerAliveInterval=60 \
        -o ServerAliveCountMax=3 \
        > "$TUNNEL_LOG_FILE" 2>&1
    
    # 获取SSH进程PID
    local ssh_pid=$(ps aux | grep "ssh.*${LOCAL_PORT}:localhost:5432.*${SERVER_ALIAS}" | grep -v grep | awk '{print $2}')
    
    if [ -z "$ssh_pid" ]; then
        echo -e "${RED}❌ 错误：SSH隧道启动失败${NC}"
        if [ -f "$TUNNEL_LOG_FILE" ]; then
            echo -e "${RED}错误日志：${NC}"
            cat "$TUNNEL_LOG_FILE"
        fi
        exit 1
    fi
    
    # 保存PID
    echo "$ssh_pid" > "$TUNNEL_PID_FILE"
    
    # 等待隧道建立
    sleep 2
    
    # 验证隧道是否正常工作
    if ! lsof -i :$LOCAL_PORT > /dev/null 2>&1; then
        echo -e "${RED}❌ 错误：SSH隧道端口未监听${NC}"
        stop_tunnel
        exit 1
    fi
    
    echo -e "${GREEN}✅ SSH隧道启动成功！${NC}"
    show_tunnel_info
}

# 停止SSH隧道
stop_tunnel() {
    echo -e "${YELLOW}🛑 停止SSH隧道...${NC}"
    
    if [ -f "$TUNNEL_PID_FILE" ]; then
        local pid=$(cat "$TUNNEL_PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            kill "$pid"
            echo -e "${GREEN}✅ SSH隧道已停止${NC}"
        else
            echo -e "${YELLOW}⚠️ SSH隧道进程不存在${NC}"
        fi
        rm -f "$TUNNEL_PID_FILE"
    else
        echo -e "${YELLOW}⚠️ 未找到SSH隧道PID文件${NC}"
    fi
    
    # 清理可能残留的SSH进程
    pkill -f "ssh.*${LOCAL_PORT}:localhost:5432.*${SERVER_ALIAS}" 2>/dev/null || true
    
    # 清理日志文件
    rm -f "$TUNNEL_LOG_FILE"
}

# 重启SSH隧道
restart_tunnel() {
    echo -e "${YELLOW}🔄 重启SSH隧道...${NC}"
    stop_tunnel
    sleep 1
    start_tunnel
}

# 显示隧道信息
show_tunnel_info() {
    if check_tunnel_status; then
        local pid=$(cat "$TUNNEL_PID_FILE")
        echo ""
        echo -e "${GREEN}🔗 SSH隧道状态：运行中${NC}"
        echo -e "${BLUE}进程ID: ${pid}${NC}"
        echo -e "${BLUE}本地端口: ${LOCAL_PORT}${NC}"
        echo -e "${BLUE}远程服务器: ${SERVER_ALIAS}${NC}"
        echo ""
        echo -e "${YELLOW}📋 数据库连接信息：${NC}"
        echo -e "${BLUE}连接URL: postgresql://${REMOTE_DB_USER}:${REMOTE_DB_PASSWORD}@localhost:${LOCAL_PORT}/${REMOTE_DB_NAME}${NC}"
        echo ""
        echo -e "${YELLOW}💡 使用示例：${NC}"
        echo -e "psql \"postgresql://${REMOTE_DB_USER}:${REMOTE_DB_PASSWORD}@localhost:${LOCAL_PORT}/${REMOTE_DB_NAME}\""
        echo ""
    else
        echo -e "${RED}🔗 SSH隧道状态：未运行${NC}"
    fi
}

# 测试数据库连接
test_connection() {
    load_connection_info
    
    if ! check_tunnel_status; then
        echo -e "${RED}❌ SSH隧道未运行，请先启动隧道${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}🔍 测试数据库连接...${NC}"
    
    local tunnel_url="postgresql://${REMOTE_DB_USER}:${REMOTE_DB_PASSWORD}@localhost:${LOCAL_PORT}/${REMOTE_DB_NAME}"
    
    if command -v psql > /dev/null 2>&1; then
        if psql "$tunnel_url" -c "SELECT version();" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ 数据库连接测试成功！${NC}"
            
            # 显示数据库统计信息
            local table_count=$(psql "$tunnel_url" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ' || echo "0")
            local user_count=$(psql "$tunnel_url" -t -c "SELECT count(*) FROM \"User\";" 2>/dev/null | tr -d ' ' || echo "0")
            
            echo -e "${BLUE}数据库统计：${NC}"
            echo -e "  表数量: ${table_count}"
            echo -e "  用户数量: ${user_count}"
        else
            echo -e "${RED}❌ 数据库连接测试失败${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}⚠️ 未找到psql命令，无法测试连接${NC}"
        echo -e "${YELLOW}但SSH隧道正在运行，应用应该可以正常连接${NC}"
    fi
}

# 显示帮助信息
show_help() {
    echo -e "${BLUE}🔗 SSH隧道管理器 - 帮助信息${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
    echo -e "${YELLOW}用法：${NC}"
    echo -e "  $0 [命令]"
    echo ""
    echo -e "${YELLOW}可用命令：${NC}"
    echo -e "  ${GREEN}start${NC}     启动SSH隧道"
    echo -e "  ${GREEN}stop${NC}      停止SSH隧道"
    echo -e "  ${GREEN}restart${NC}   重启SSH隧道"
    echo -e "  ${GREEN}status${NC}    显示隧道状态"
    echo -e "  ${GREEN}test${NC}      测试数据库连接"
    echo -e "  ${GREEN}help${NC}      显示此帮助信息"
    echo ""
    echo -e "${YELLOW}示例：${NC}"
    echo -e "  $0 start     # 启动隧道"
    echo -e "  $0 status    # 查看状态"
    echo -e "  $0 test      # 测试连接"
    echo -e "  $0 stop      # 停止隧道"
    echo ""
}

# 主函数
main() {
    # 加载连接信息（除了help命令）
    if [ "$1" != "help" ] && [ "$1" != "-h" ] && [ "$1" != "--help" ]; then
        load_connection_info
    fi
    
    case "${1:-status}" in
        "start")
            start_tunnel
            ;;
        "stop")
            stop_tunnel
            ;;
        "restart")
            restart_tunnel
            ;;
        "status")
            show_tunnel_info
            ;;
        "test")
            test_connection
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
