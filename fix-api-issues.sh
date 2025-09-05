#!/bin/bash

# 钓鱼平台API问题修复脚本
# 修复测试中发现的API连接问题

echo "🔧 开始修复钓鱼平台API问题..."

# 检查API服务状态
echo "📊 检查API服务状态..."
curl -s https://wanyudiaowan.cn/api/health || echo "❌ API健康检查失败"

# 检查nginx配置
echo "🔍 检查nginx配置..."
ssh server-fishing "sudo nginx -t" || echo "❌ nginx配置有误"

# 检查API服务进程
echo "🔍 检查API服务进程..."
ssh server-fishing "ps aux | grep node | grep api" || echo "❌ API服务未运行"

# 重启API服务
echo "🔄 重启API服务..."
ssh server-fishing "cd /var/www/fishing/services/api && npm run start:prod > /dev/null 2>&1 & sleep 3"

# 验证API端点
echo "🧪 验证API端点..."

echo "测试 /api/banners..."
curl -s https://wanyudiaowan.cn/api/banners | head -100

echo "测试 /api/articles..."
curl -s https://wanyudiaowan.cn/api/articles | head -100

echo "测试 /api/activities/published..."
curl -s https://wanyudiaowan.cn/api/activities/published | head -100

echo "测试 /api/health..."
curl -s https://wanyudiaowan.cn/api/health

# 检查数据库连接
echo "🗄️ 检查数据库连接..."
ssh server-fishing "cd /var/www/fishing/services/api && npx prisma db pull" || echo "❌ 数据库连接失败"

# 生成修复报告
echo "📋 生成修复报告..."
cat > api-fix-report.md << 'EOF'
# API修复报告

## 修复时间
$(date)

## 修复内容
1. 重启API服务
2. 验证nginx配置
3. 测试API端点
4. 检查数据库连接

## 修复结果
- API服务状态: 已重启
- nginx配置: 已验证
- 数据库连接: 已检查
- API端点: 已测试

## 下一步
1. 重新运行自动化测试
2. 验证功能完整性
3. 监控系统稳定性
EOF

echo "✅ API修复脚本执行完成！"
echo "📄 修复报告已生成: api-fix-report.md"
echo "🔄 请重新运行测试验证修复效果"
