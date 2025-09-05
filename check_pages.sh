#!/bin/bash

echo "�� 钓鱼平台页面可访问性检查报告"
echo "========================================"
echo ""

# 定义要检查的页面
declare -A pages=(
    ["顾客端首页"]="https://wanyudiaowan.cn/customer/"
    ["顾客端社区"]="https://wanyudiaowan.cn/customer/#/community"
    ["顾客端个人中心"]="https://wanyudiaowan.cn/customer/#/profile"
    ["管理员端首页"]="https://wanyudiaowan.cn/admin/"
    ["管理员端社区管理"]="https://wanyudiaowan.cn/admin/posts"
    ["管理员端渔友圈管理"]="https://wanyudiaowan.cn/admin/community"
    ["员工端首页"]="https://wanyudiaowan.cn/staff/"
    ["API健康检查"]="https://wanyudiaowan.cn/api/health"
    ["API轮播图"]="https://wanyudiaowan.cn/api/banners"
    ["API文章"]="https://wanyudiaowan.cn/api/articles"
    ["API活动"]="https://wanyudiaowan.cn/api/activities/published"
    ["API社区动态"]="https://wanyudiaowan.cn/api/posts"
    ["社区页面直接访问"]="https://wanyudiaowan.cn/community/posts"
    ["会员计划页面"]="https://wanyudiaowan.cn/members/plans"
)

# 检查每个页面
for name in "${!pages[@]}"; do
    url="${pages[$name]}"
    echo "📄 检查: $name"
    echo "   URL: $url"
    
    # 获取HTTP状态码
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$status_code" = "200" ]; then
        echo "   状态: ✅ 正常 ($status_code)"
    elif [ "$status_code" = "301" ] || [ "$status_code" = "302" ]; then
        echo "   状态: 🔄 重定向 ($status_code)"
    elif [ "$status_code" = "404" ]; then
        echo "   状态: ❌ 未找到 ($status_code)"
    else
        echo "   状态: ⚠️  异常 ($status_code)"
    fi
    echo ""
done

echo "========================================"
echo "检查完成"
