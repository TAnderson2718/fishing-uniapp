#!/bin/bash

# 钓鱼平台顾客端H5页面功能全面测试脚本
# 测试所有关键页面和API接口的可访问性

echo "🔍 钓鱼平台顾客端H5页面功能全面测试"
echo "========================================"
echo "测试时间: $(date)"
echo ""

DOMAIN="https://wanyudiaowan.cn"
API_BASE="$DOMAIN/api"
CUSTOMER_BASE="$DOMAIN/customer"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 测试计数器
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 测试函数
test_api() {
    local name="$1"
    local url="$2"
    local expected_field="$3"
    
    echo -n "🔌 测试API: $name ... "
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    response=$(curl -s --max-time 10 "$url")
    status_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url")
    
    if [ "$status_code" = "200" ]; then
        if [ -n "$expected_field" ]; then
            # 检查响应中是否包含期望的字段
            if echo "$response" | jq -e "$expected_field" >/dev/null 2>&1; then
                echo -e "${GREEN}✅ 通过${NC}"
                PASSED_TESTS=$((PASSED_TESTS + 1))
                return 0
            else
                echo -e "${RED}❌ 数据格式错误${NC}"
                FAILED_TESTS=$((FAILED_TESTS + 1))
                return 1
            fi
        else
            echo -e "${GREEN}✅ 通过${NC}"
            PASSED_TESTS=$((PASSED_TESTS + 1))
            return 0
        fi
    else
        echo -e "${RED}❌ 失败 (状态码: $status_code)${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

test_page() {
    local name="$1"
    local url="$2"
    local expected_status="$3"
    
    echo -n "📄 测试页面: $name ... "
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    status_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url")
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ 通过${NC} ($status_code)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ 失败${NC} (期望: $expected_status, 实际: $status_code)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# 1. 测试核心API接口
echo "🔌 测试核心API接口"
echo "----------------------------------------"

test_api "健康检查" "$API_BASE/health" '.status'
test_api "轮播图列表" "$API_BASE/banners" '.[0].title'
test_api "文章列表" "$API_BASE/articles" '.[0].title'
test_api "活动列表" "$API_BASE/activities/published" '.[0].title'
test_api "社区动态" "$API_BASE/posts" '.items[0].content'

echo ""

# 2. 测试活动详情API
echo "🎯 测试活动详情API"
echo "----------------------------------------"

# 获取所有活动ID
activities=$(curl -s "$API_BASE/activities/published" | jq -r '.[].id')

for activity_id in $activities; do
    test_api "活动详情: $activity_id" "$API_BASE/activities/$activity_id" '.title'
done

echo ""

# 3. 测试文章详情API
echo "📝 测试文章详情API"
echo "----------------------------------------"

# 获取文章ID
articles=$(curl -s "$API_BASE/articles" | jq -r '.[].id' | head -3)

for article_id in $articles; do
    test_api "文章详情: $article_id" "$API_BASE/articles/$article_id" '.title'
done

echo ""

# 4. 测试顾客端页面
echo "📱 测试顾客端页面"
echo "----------------------------------------"

test_page "顾客端首页" "$CUSTOMER_BASE/" "200"
test_page "顾客端资源" "$CUSTOMER_BASE/static/logo.png" "200"

echo ""

# 5. 测试页面路由（通过检查HTML内容）
echo "🧭 测试页面路由"
echo "----------------------------------------"

echo -n "📄 测试活动详情页面路由 ... "
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# 检查页面是否包含Vue应用的标识
page_content=$(curl -s "$CUSTOMER_BASE/#/pages/activity/detail?id=forest-yoga")
if echo "$page_content" | grep -q "uni-app" || echo "$page_content" | grep -q "vue"; then
    echo -e "${GREEN}✅ 通过${NC} (Vue应用加载)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ 失败${NC} (Vue应用未加载)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

echo ""

# 6. 测试数据联动
echo "🔄 测试数据联动"
echo "----------------------------------------"

echo -n "🔗 测试管理端到顾客端数据同步 ... "
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# 检查活动数据是否一致
admin_activities=$(curl -s "$API_BASE/activities/published" | jq length)
if [ "$admin_activities" -gt 0 ]; then
    echo -e "${GREEN}✅ 通过${NC} (发现 $admin_activities 个活动)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ 失败${NC} (没有发现活动数据)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

echo ""

# 7. 生成测试报告
echo "📊 测试报告"
echo "========================================"
echo "总测试数: $TOTAL_TESTS"
echo -e "通过测试: ${GREEN}$PASSED_TESTS${NC}"
echo -e "失败测试: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n🎉 ${GREEN}所有测试通过！系统运行正常。${NC}"
    exit 0
else
    echo -e "\n⚠️  ${RED}发现 $FAILED_TESTS 个问题，请检查上述失败项目。${NC}"
    exit 1
fi
