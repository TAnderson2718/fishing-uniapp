#!/bin/bash

# 钓鱼平台页面可访问性监控脚本
# 用于定期检查所有重要页面的可访问性

LOG_FILE="/var/log/fishing-page-monitor.log"
ALERT_EMAIL="admin@wanyudiaowan.cn"
DOMAIN="https://wanyudiaowan.cn"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 记录日志函数
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# 检查页面函数
check_page() {
    local name="$1"
    local url="$2"
    local expected_status="$3"
    
    echo -n "检查 $name ... "
    
    # 获取HTTP状态码
    status_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url")
    response_time=$(curl -s -o /dev/null -w "%{time_total}" --max-time 10 "$url")
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ 正常${NC} (${status_code}, ${response_time}s)"
        log_message "SUCCESS: $name - $url - $status_code - ${response_time}s"
        return 0
    else
        echo -e "${RED}❌ 异常${NC} (期望:$expected_status, 实际:$status_code)"
        log_message "ERROR: $name - $url - Expected:$expected_status, Got:$status_code"
        return 1
    fi
}

# 检查重定向函数
check_redirect() {
    local name="$1"
    local url="$2"
    local expected_location="$3"
    
    echo -n "检查重定向 $name ... "
    
    # 获取重定向位置
    location=$(curl -s -I --max-time 10 "$url" | grep -i "location:" | cut -d' ' -f2 | tr -d '\r')
    status_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url")
    
    if [ "$status_code" = "301" ] && [ "$location" = "$expected_location" ]; then
        echo -e "${GREEN}✅ 正常${NC} (301 → $location)"
        log_message "SUCCESS: $name redirect - $url → $location"
        return 0
    else
        echo -e "${RED}❌ 异常${NC} (状态:$status_code, 位置:$location)"
        log_message "ERROR: $name redirect - $url - Status:$status_code, Location:$location"
        return 1
    fi
}

# 主检查函数
main_check() {
    echo "🔍 钓鱼平台页面可访问性监控"
    echo "========================================"
    echo "检查时间: $(date)"
    echo ""
    
    local error_count=0
    
    # 检查主要页面 (期望200状态码)
    echo "📄 检查主要页面:"
    check_page "顾客端首页" "$DOMAIN/customer/" "200" || ((error_count++))
    check_page "管理员端首页" "$DOMAIN/admin/" "200" || ((error_count++))
    check_page "员工端首页" "$DOMAIN/staff/" "200" || ((error_count++))
    echo ""
    
    # 检查API端点 (期望200状态码)
    echo "🔌 检查API端点:"
    check_page "API健康检查" "$DOMAIN/api/health" "200" || ((error_count++))
    check_page "API轮播图" "$DOMAIN/api/banners" "200" || ((error_count++))
    check_page "API文章" "$DOMAIN/api/articles" "200" || ((error_count++))
    check_page "API活动" "$DOMAIN/api/activities/published" "200" || ((error_count++))
    check_page "API社区动态" "$DOMAIN/api/posts" "200" || ((error_count++))
    echo ""
    
    # 检查重定向 (期望301状态码)
    echo "🔄 检查重定向:"
    check_redirect "社区页面" "$DOMAIN/community/posts" "$DOMAIN/customer/#/community" || ((error_count++))
    check_redirect "会员页面" "$DOMAIN/members/plans" "$DOMAIN/customer/#/membership" || ((error_count++))
    check_redirect "动态页面" "$DOMAIN/posts" "$DOMAIN/customer/#/community" || ((error_count++))
    check_redirect "个人中心" "$DOMAIN/profile" "$DOMAIN/customer/#/profile" || ((error_count++))
    echo ""
    
    # 检查根路径重定向
    echo "🏠 检查根路径重定向:"
    check_redirect "根路径" "$DOMAIN/" "$DOMAIN/customer/" || ((error_count++))
    echo ""
    
    # 总结
    echo "========================================"
    if [ $error_count -eq 0 ]; then
        echo -e "${GREEN}🎉 所有检查通过！系统运行正常。${NC}"
        log_message "SUMMARY: All checks passed - 0 errors"
    else
        echo -e "${RED}⚠️  发现 $error_count 个问题，请检查日志。${NC}"
        log_message "SUMMARY: $error_count errors found"
        
        # 发送告警邮件 (如果配置了邮件系统)
        if command -v mail >/dev/null 2>&1; then
            echo "发现 $error_count 个页面访问问题，详情请查看日志：$LOG_FILE" | \
            mail -s "钓鱼平台页面监控告警" "$ALERT_EMAIL"
        fi
    fi
    
    echo "检查完成时间: $(date)"
    echo ""
}

# 创建日志目录
mkdir -p "$(dirname "$LOG_FILE")"

# 执行检查
main_check

# 如果是定时任务模式，保持日志文件大小
if [ "$1" = "--cron" ]; then
    # 保留最近1000行日志
    tail -n 1000 "$LOG_FILE" > "${LOG_FILE}.tmp" && mv "${LOG_FILE}.tmp" "$LOG_FILE"
fi
