#!/bin/bash

# 域名更新脚本
# 用于将钓鱼平台的域名从 fishing.allpepper.cn 更改为 wanyudiaowan.cn

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
OLD_DOMAIN="fishing.allpepper.cn"
NEW_DOMAIN="wanyudiaowan.cn"
PROJECT_ROOT="/var/www/fishing"
NGINX_SITES_AVAILABLE="/etc/nginx/sites-available"
NGINX_SITES_ENABLED="/etc/nginx/sites-enabled"

echo -e "${BLUE}🔄 开始域名更新流程...${NC}"
echo -e "${YELLOW}旧域名: ${OLD_DOMAIN}${NC}"
echo -e "${YELLOW}新域名: ${NEW_DOMAIN}${NC}"
echo ""

# 检查是否以root权限运行
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}❌ 此脚本需要root权限运行${NC}"
   echo "请使用: sudo $0"
   exit 1
fi

# 备份函数
backup_file() {
    local file_path="$1"
    local backup_path="${file_path}.backup.$(date +%Y%m%d_%H%M%S)"
    
    if [ -f "$file_path" ]; then
        cp "$file_path" "$backup_path"
        echo -e "${GREEN}✅ 已备份: ${file_path} → ${backup_path}${NC}"
    fi
}

# 1. 更新前端环境配置
echo -e "${YELLOW}📝 更新前端环境配置...${NC}"

# 更新管理员端配置
ADMIN_ENV_FILE="$PROJECT_ROOT/apps/admin/.env"
if [ -f "$ADMIN_ENV_FILE" ]; then
    backup_file "$ADMIN_ENV_FILE"
    sed -i "s|http://localhost:3000|https://${NEW_DOMAIN}/api|g" "$ADMIN_ENV_FILE"
    echo -e "${GREEN}✅ 管理员端配置已更新${NC}"
fi

# 更新员工端配置
STAFF_ENV_FILE="$PROJECT_ROOT/apps/staff/.env"
if [ -f "$STAFF_ENV_FILE" ]; then
    backup_file "$STAFF_ENV_FILE"
    sed -i "s|http://localhost:3000|https://${NEW_DOMAIN}/api|g" "$STAFF_ENV_FILE"
    echo -e "${GREEN}✅ 员工端配置已更新${NC}"
fi

# 2. 重新构建前端应用
echo -e "${YELLOW}🔨 重新构建前端应用...${NC}"

cd "$PROJECT_ROOT"

# 构建管理员端
echo "构建管理员端..."
cd apps/admin
npm run build
echo -e "${GREEN}✅ 管理员端构建完成${NC}"

# 构建员工端
echo "构建员工端..."
cd ../staff
npm run build
echo -e "${GREEN}✅ 员工端构建完成${NC}"

cd "$PROJECT_ROOT"

# 3. 更新Nginx配置
echo -e "${YELLOW}🌐 更新Nginx配置...${NC}"

# 检查新的nginx配置文件是否存在
NEW_NGINX_CONFIG="$PROJECT_ROOT/nginx-wanyudiaowan.conf"
if [ ! -f "$NEW_NGINX_CONFIG" ]; then
    echo -e "${RED}❌ 未找到新的nginx配置文件: $NEW_NGINX_CONFIG${NC}"
    echo "请确保nginx-wanyudiaowan.conf文件存在"
    exit 1
fi

# 复制新的nginx配置
cp "$NEW_NGINX_CONFIG" "$NGINX_SITES_AVAILABLE/wanyudiaowan.cn"
echo -e "${GREEN}✅ 已复制nginx配置到sites-available${NC}"

# 创建软链接
if [ ! -L "$NGINX_SITES_ENABLED/wanyudiaowan.cn" ]; then
    ln -s "$NGINX_SITES_AVAILABLE/wanyudiaowan.cn" "$NGINX_SITES_ENABLED/wanyudiaowan.cn"
    echo -e "${GREEN}✅ 已创建nginx配置软链接${NC}"
fi

# 删除旧的nginx配置（如果存在）
OLD_NGINX_CONFIG="$NGINX_SITES_ENABLED/fishing.allpepper.cn"
if [ -L "$OLD_NGINX_CONFIG" ] || [ -f "$OLD_NGINX_CONFIG" ]; then
    rm -f "$OLD_NGINX_CONFIG"
    echo -e "${GREEN}✅ 已删除旧的nginx配置${NC}"
fi

# 测试nginx配置
echo -e "${YELLOW}🧪 测试nginx配置...${NC}"
if nginx -t; then
    echo -e "${GREEN}✅ Nginx配置测试通过${NC}"
else
    echo -e "${RED}❌ Nginx配置测试失败${NC}"
    echo "请检查配置文件并修复错误"
    exit 1
fi

# 4. 重启服务
echo -e "${YELLOW}🔄 重启服务...${NC}"

# 重启nginx
systemctl reload nginx
echo -e "${GREEN}✅ Nginx已重新加载${NC}"

# 重启API服务
cd "$PROJECT_ROOT"
pm2 restart fishing-api
echo -e "${GREEN}✅ API服务已重启${NC}"

# 5. 验证部署
echo -e "${YELLOW}🔍 验证部署...${NC}"

# 检查服务状态
echo "检查PM2服务状态..."
pm2 status

echo "检查Nginx状态..."
systemctl status nginx --no-pager | head -5

# 6. SSL证书提醒
echo ""
echo -e "${YELLOW}⚠️  重要提醒：${NC}"
echo -e "${BLUE}1. 请确保域名 ${NEW_DOMAIN} 已正确解析到此服务器IP${NC}"
echo -e "${BLUE}2. 请为新域名配置SSL证书，推荐使用Let's Encrypt:${NC}"
echo -e "   ${GREEN}certbot --nginx -d ${NEW_DOMAIN} -d www.${NEW_DOMAIN}${NC}"
echo -e "${BLUE}3. 配置完SSL证书后，请重新加载nginx配置:${NC}"
echo -e "   ${GREEN}sudo systemctl reload nginx${NC}"
echo ""

# 7. 测试URL
echo -e "${YELLOW}🌐 测试URL:${NC}"
echo -e "${BLUE}管理员端: https://${NEW_DOMAIN}/admin/${NC}"
echo -e "${BLUE}员工端: https://${NEW_DOMAIN}/staff/${NC}"
echo -e "${BLUE}API: https://${NEW_DOMAIN}/api/health${NC}"
echo ""

echo -e "${GREEN}🎉 域名更新完成！${NC}"
echo -e "${YELLOW}请在配置SSL证书后测试所有功能是否正常工作。${NC}"
