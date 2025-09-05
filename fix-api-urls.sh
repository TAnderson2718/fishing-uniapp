#!/bin/bash

# 批量修复钓鱼平台前端API URL问题
# 将硬编码的localhost:3000替换为正确的API配置

echo "🔧 开始修复钓鱼平台前端API URL问题..."
echo "========================================"

# 定义要修复的目录
TARGET_DIR="apps/miniapp/src"

# 查找所有包含localhost:3000的Vue文件
echo "📋 查找需要修复的文件..."
FILES=$(find "$TARGET_DIR" -name "*.vue" -exec grep -l "localhost:3000" {} \;)

if [ -z "$FILES" ]; then
    echo "✅ 没有找到需要修复的文件"
    exit 0
fi

echo "📄 找到以下需要修复的文件:"
echo "$FILES"
echo ""

# 备份原文件
echo "💾 创建备份..."
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

for file in $FILES; do
    cp "$file" "$BACKUP_DIR/"
    echo "  备份: $file"
done

echo ""
echo "🔄 开始修复文件..."

# 修复每个文件
for file in $FILES; do
    echo "  修复: $file"
    
    # 检查文件是否已经导入了API配置
    if ! grep -q "import.*config/api" "$file"; then
        # 在文件开头添加导入语句（在script标签后）
        sed -i.tmp '/^<script>/a\
import { buildApiUrl } from "../../config/api.js"
' "$file"
    fi
    
    # 替换localhost:3000的URL
    sed -i.tmp 's|http://localhost:3000/|buildApiUrl("/|g' "$file"
    sed -i.tmp 's|http://localhost:3000|buildApiUrl("|g' "$file"
    
    # 清理临时文件
    rm -f "$file.tmp"
done

echo ""
echo "✅ 修复完成！"
echo ""
echo "📊 修复统计:"
echo "  修复文件数: $(echo "$FILES" | wc -l)"
echo "  备份目录: $BACKUP_DIR"
echo ""
echo "🔍 验证修复结果..."

# 验证是否还有localhost:3000
REMAINING=$(find "$TARGET_DIR" -name "*.vue" -exec grep -l "localhost:3000" {} \; 2>/dev/null)

if [ -z "$REMAINING" ]; then
    echo "✅ 所有localhost:3000已成功替换"
else
    echo "⚠️  以下文件仍包含localhost:3000:"
    echo "$REMAINING"
fi

echo ""
echo "🎯 下一步操作建议:"
echo "1. 重新构建前端应用"
echo "2. 测试活动详情页面功能"
echo "3. 验证其他页面的API调用"
echo ""
echo "构建命令:"
echo "  cd apps/miniapp && npm run build:h5"
