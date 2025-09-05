#!/bin/bash

# 钓鱼平台自动化部署脚本
# 支持测试环境和生产环境部署

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
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# 默认配置
ENVIRONMENT="staging"
BUILD_TARGET="h5"
SKIP_TESTS=false
SKIP_BUILD=false
DRY_RUN=false

# 显示帮助信息
show_help() {
    echo "钓鱼平台自动化部署脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -e, --env ENVIRONMENT     部署环境 (staging|production) [默认: staging]"
    echo "  -t, --target TARGET       构建目标 (h5|mp-weixin) [默认: h5]"
    echo "  --skip-tests             跳过测试"
    echo "  --skip-build             跳过构建"
    echo "  --dry-run                模拟运行，不执行实际部署"
    echo "  -h, --help               显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 -e production -t h5    # 部署H5应用到生产环境"
    echo "  $0 -e staging --dry-run   # 模拟部署到测试环境"
}

# 解析命令行参数
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--env)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -t|--target)
                BUILD_TARGET="$2"
                shift 2
                ;;
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                echo -e "${RED}错误: 未知参数 $1${NC}"
                show_help
                exit 1
                ;;
        esac
    done
}

# 验证参数
validate_args() {
    if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
        echo -e "${RED}错误: 环境必须是 staging 或 production${NC}"
        exit 1
    fi
    
    if [[ "$BUILD_TARGET" != "h5" && "$BUILD_TARGET" != "mp-weixin" ]]; then
        echo -e "${RED}错误: 构建目标必须是 h5 或 mp-weixin${NC}"
        exit 1
    fi
}

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

# 执行命令（支持dry-run）
execute_cmd() {
    local cmd="$1"
    local description="$2"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY-RUN] $description"
        log_info "[DRY-RUN] 命令: $cmd"
    else
        log_info "$description"
        eval "$cmd"
    fi
}

# 检查依赖
check_dependencies() {
    log_info "检查依赖..."
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        exit 1
    fi
    
    # 检查pnpm
    if ! command -v pnpm &> /dev/null; then
        log_error "pnpm 未安装"
        exit 1
    fi
    
    log_success "依赖检查通过"
}

# 运行测试
run_tests() {
    if [[ "$SKIP_TESTS" == "true" ]]; then
        log_warning "跳过测试"
        return
    fi
    
    log_info "运行测试..."
    
    cd "$PROJECT_ROOT"
    
    # 运行单元测试
    execute_cmd "chmod +x run-tests.sh && ./run-tests.sh" "运行单元测试"
    
    # 运行性能测试
    execute_cmd "chmod +x test-optimizations.sh && ./test-optimizations.sh" "运行性能测试"
    
    log_success "测试完成"
}

# 构建应用
build_app() {
    if [[ "$SKIP_BUILD" == "true" ]]; then
        log_warning "跳过构建"
        return
    fi
    
    log_info "构建应用 ($BUILD_TARGET)..."
    
    cd "$PROJECT_ROOT/apps/miniapp"
    
    # 安装依赖
    execute_cmd "pnpm install --frozen-lockfile" "安装依赖"
    
    # 构建应用
    if [[ "$BUILD_TARGET" == "h5" ]]; then
        execute_cmd "pnpm run build:h5" "构建H5应用"
    else
        execute_cmd "pnpm run build:mp-weixin" "构建微信小程序"
    fi
    
    log_success "构建完成"
}

# 部署到服务器
deploy_to_server() {
    log_info "部署到 $ENVIRONMENT 环境..."
    
    local dist_path="$PROJECT_ROOT/apps/miniapp/dist"
    local backup_path="/var/www/backup/fishing_${TIMESTAMP}"
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        local deploy_path="/var/www/fishing"
        local server_host="server-fishing"
    else
        local deploy_path="/var/www/fishing-staging"
        local server_host="server-fishing-staging"
    fi
    
    # 创建备份
    execute_cmd "ssh $server_host 'sudo mkdir -p $backup_path && sudo cp -r $deploy_path/* $backup_path/ 2>/dev/null || true'" "创建备份"
    
    # 上传文件
    execute_cmd "rsync -avz --delete $dist_path/ $server_host:$deploy_path/" "上传文件"
    
    # 设置权限
    execute_cmd "ssh $server_host 'sudo chown -R www-data:www-data $deploy_path && sudo chmod -R 755 $deploy_path'" "设置权限"
    
    # 重启服务
    execute_cmd "ssh $server_host 'sudo systemctl reload nginx'" "重启Nginx"
    
    log_success "部署完成"
}

# 部署后验证
post_deploy_verification() {
    log_info "执行部署后验证..."
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        local base_url="https://wanyudiaowan.cn"
    else
        local base_url="https://staging.wanyudiaowan.cn"
    fi
    
    # 等待服务启动
    sleep 10
    
    # 检查主页
    if curl -f -s "$base_url" > /dev/null; then
        log_success "主页访问正常"
    else
        log_error "主页访问异常"
        return 1
    fi
    
    # 检查API
    if curl -f -s "$base_url/api/health" > /dev/null; then
        log_success "API服务正常"
    else
        log_error "API服务异常"
        return 1
    fi
    
    # 检查关键页面
    local test_urls=(
        "$base_url/customer/"
        "$base_url/admin/"
        "$base_url/staff/"
    )
    
    for url in "${test_urls[@]}"; do
        if curl -f -s "$url" > /dev/null; then
            log_success "页面 $url 访问正常"
        else
            log_warning "页面 $url 访问异常"
        fi
    done
    
    log_success "部署验证完成"
}

# 发送通知
send_notification() {
    log_info "发送部署通知..."
    
    local status="$1"
    local message="钓鱼平台部署到 $ENVIRONMENT 环境"
    
    if [[ "$status" == "success" ]]; then
        message="$message 成功"
        if [[ "$ENVIRONMENT" == "production" ]]; then
            message="$message\n🔗 访问地址: https://wanyudiaowan.cn"
        else
            message="$message\n🔗 访问地址: https://staging.wanyudiaowan.cn"
        fi
    else
        message="$message 失败"
    fi
    
    message="$message\n📊 部署时间: $(date)\n🏗️ 构建目标: $BUILD_TARGET"
    
    # 这里可以集成实际的通知服务（如钉钉、企业微信等）
    log_info "通知内容: $message"
    
    log_success "通知发送完成"
}

# 回滚函数
rollback() {
    log_warning "执行回滚..."
    
    local backup_path="/var/www/backup/fishing_${TIMESTAMP}"
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        local deploy_path="/var/www/fishing"
        local server_host="server-fishing"
    else
        local deploy_path="/var/www/fishing-staging"
        local server_host="server-fishing-staging"
    fi
    
    execute_cmd "ssh $server_host 'sudo cp -r $backup_path/* $deploy_path/'" "恢复备份"
    execute_cmd "ssh $server_host 'sudo systemctl reload nginx'" "重启Nginx"
    
    log_success "回滚完成"
}

# 主函数
main() {
    echo "🚀 钓鱼平台自动化部署"
    echo "========================================"
    echo "部署时间: $(date)"
    echo "部署环境: $ENVIRONMENT"
    echo "构建目标: $BUILD_TARGET"
    echo "========================================"
    echo ""
    
    # 设置错误处理
    trap 'log_error "部署失败，正在执行回滚..."; rollback; send_notification "failed"; exit 1' ERR
    
    # 执行部署流程
    check_dependencies
    run_tests
    build_app
    deploy_to_server
    post_deploy_verification
    
    # 发送成功通知
    send_notification "success"
    
    echo ""
    echo "🎉 部署成功完成！"
    echo "========================================"
    if [[ "$ENVIRONMENT" == "production" ]]; then
        echo "🔗 生产环境: https://wanyudiaowan.cn"
    else
        echo "🔗 测试环境: https://staging.wanyudiaowan.cn"
    fi
    echo "📊 部署时间: $(date)"
    echo "🏗️ 构建目标: $BUILD_TARGET"
    echo "========================================"
}

# 解析参数并执行
parse_args "$@"
validate_args
main
