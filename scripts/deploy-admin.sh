#!/bin/bash

# 管理员端部署脚本
# 将本地构建的管理员端文件部署到生产服务器

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ADMIN_DIR="$PROJECT_ROOT/apps/admin"
DIST_DIR="$ADMIN_DIR/dist"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# 服务器配置
SERVER_HOST="server-fishing"
SERVER_USER=""  # 使用SSH配置中的默认用户
REMOTE_PATH="/var/www/fishing/apps/admin"
BACKUP_PATH="/var/www/backup/admin_${TIMESTAMP}"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
check_dependencies() {
    log_info "检查依赖..."
    
    # 检查rsync
    if ! command -v rsync &> /dev/null; then
        log_error "rsync 未安装，请先安装 rsync"
        exit 1
    fi
    
    # 检查ssh
    if ! command -v ssh &> /dev/null; then
        log_error "ssh 未安装，请先安装 ssh"
        exit 1
    fi
    
    log_success "依赖检查通过"
}

# 检查构建文件
check_build() {
    log_info "检查构建文件..."
    
    if [ ! -d "$DIST_DIR" ]; then
        log_error "构建目录不存在: $DIST_DIR"
        log_info "请先运行: cd $ADMIN_DIR && npm run build"
        exit 1
    fi
    
    if [ ! -f "$DIST_DIR/index.html" ]; then
        log_error "构建文件不完整，缺少 index.html"
        log_info "请先运行: cd $ADMIN_DIR && npm run build"
        exit 1
    fi
    
    log_success "构建文件检查通过"
}

# 构建应用
build_app() {
    log_info "构建管理员端应用..."
    
    cd "$ADMIN_DIR"
    
    # 安装依赖
    if [ -f "package-lock.json" ]; then
        npm ci
    elif [ -f "yarn.lock" ]; then
        yarn install --frozen-lockfile
    else
        npm install
    fi
    
    # 构建应用
    npm run build
    
    log_success "构建完成"
}

# 创建服务器备份
create_backup() {
    log_info "创建服务器备份..."
    
    ssh "${SERVER_HOST}" "
        sudo mkdir -p $BACKUP_PATH
        if [ -d $REMOTE_PATH/dist ]; then
            sudo cp -r $REMOTE_PATH/dist/* $BACKUP_PATH/ 2>/dev/null || true
            echo '备份创建完成: $BACKUP_PATH'
        else
            echo '远程目录不存在，跳过备份'
        fi
    "
    
    log_success "备份创建完成"
}

# 部署文件
deploy_files() {
    log_info "部署文件到服务器..."
    
    # 确保远程目录存在
    ssh "${SERVER_HOST}" "sudo mkdir -p $REMOTE_PATH/dist"

    # 同步文件
    rsync -avz --delete \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='*.log' \
        "$DIST_DIR/" \
        "${SERVER_HOST}:$REMOTE_PATH/dist/"

    # 设置权限
    ssh "${SERVER_HOST}" "
        sudo chown -R www-data:www-data $REMOTE_PATH/dist
        sudo chmod -R 755 $REMOTE_PATH/dist
    "
    
    log_success "文件部署完成"
}

# 重启服务
restart_services() {
    log_info "重启相关服务..."
    
    ssh "${SERVER_HOST}" "
        sudo nginx -t && sudo systemctl reload nginx
    "
    
    log_success "服务重启完成"
}

# 验证部署
verify_deployment() {
    log_info "验证部署..."
    
    # 等待服务启动
    sleep 5
    
    # 检查管理员端页面
    if curl -f -s https://wanyudiaowan.cn/admin/ > /dev/null; then
        log_success "管理员端页面访问正常"
    else
        log_error "管理员端页面访问异常"
        return 1
    fi
    
    log_success "部署验证完成"
}

# 显示帮助信息
show_help() {
    echo "管理员端部署脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --build-only     仅构建，不部署"
    echo "  --deploy-only    仅部署，不构建"
    echo "  --skip-backup    跳过备份"
    echo "  -h, --help       显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0               # 构建并部署"
    echo "  $0 --build-only  # 仅构建"
    echo "  $0 --deploy-only # 仅部署"
}

# 主函数
main() {
    local build_only=false
    local deploy_only=false
    local skip_backup=false
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --build-only)
                build_only=true
                shift
                ;;
            --deploy-only)
                deploy_only=true
                shift
                ;;
            --skip-backup)
                skip_backup=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    echo "🚀 管理员端部署脚本"
    echo "========================================"
    echo "部署时间: $(date)"
    echo "========================================"
    echo ""
    
    check_dependencies
    
    if [ "$deploy_only" = false ]; then
        build_app
    fi
    
    if [ "$build_only" = false ]; then
        check_build
        
        if [ "$skip_backup" = false ]; then
            create_backup
        fi
        
        deploy_files
        restart_services
        verify_deployment
    fi
    
    echo ""
    echo "🎉 部署完成！"
    echo "========================================"
    echo "🔗 管理员端: https://wanyudiaowan.cn/admin/"
    echo "📊 部署时间: $(date)"
    echo "========================================"
}

# 执行主函数
main "$@"
