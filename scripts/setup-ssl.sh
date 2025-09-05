#!/bin/bash

# SSL证书配置脚本
# 使用Let's Encrypt为wanyudiaowan.cn配置免费SSL证书

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
DOMAIN="wanyudiaowan.cn"
WWW_DOMAIN="www.wanyudiaowan.cn"
EMAIL="admin@wanyudiaowan.cn"  # 请替换为实际的邮箱地址

echo -e "${BLUE}🔒 开始SSL证书配置...${NC}"
echo -e "${YELLOW}域名: ${DOMAIN}${NC}"
echo -e "${YELLOW}WWW域名: ${WWW_DOMAIN}${NC}"
echo ""

# 检查是否以root权限运行
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}❌ 此脚本需要root权限运行${NC}"
   echo "请使用: sudo $0"
   exit 1
fi

# 检查域名解析
echo -e "${YELLOW}🔍 检查域名解析...${NC}"

check_domain_resolution() {
    local domain="$1"
    local server_ip=$(curl -s ifconfig.me)
    local resolved_ip=$(dig +short "$domain" @8.8.8.8)
    
    if [ "$resolved_ip" = "$server_ip" ]; then
        echo -e "${GREEN}✅ ${domain} 解析正确 (${resolved_ip})${NC}"
        return 0
    else
        echo -e "${RED}❌ ${domain} 解析错误${NC}"
        echo -e "${YELLOW}   服务器IP: ${server_ip}${NC}"
        echo -e "${YELLOW}   解析IP: ${resolved_ip}${NC}"
        return 1
    fi
}

# 检查主域名和www域名解析
if ! check_domain_resolution "$DOMAIN" || ! check_domain_resolution "$WWW_DOMAIN"; then
    echo -e "${RED}❌ 域名解析检查失败${NC}"
    echo -e "${YELLOW}请确保以下域名正确解析到此服务器:${NC}"
    echo -e "  - ${DOMAIN}"
    echo -e "  - ${WWW_DOMAIN}"
    echo ""
    echo -e "${YELLOW}如果域名刚刚配置，请等待DNS传播完成（通常需要几分钟到几小时）${NC}"
    
    read -p "是否继续配置SSL证书？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}已取消SSL证书配置${NC}"
        exit 0
    fi
fi

# 1. 安装certbot
echo -e "${YELLOW}📦 安装certbot...${NC}"

# 检查系统类型
if command -v apt-get &> /dev/null; then
    # Ubuntu/Debian
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
elif command -v yum &> /dev/null; then
    # CentOS/RHEL
    yum install -y epel-release
    yum install -y certbot python3-certbot-nginx
else
    echo -e "${RED}❌ 不支持的操作系统${NC}"
    exit 1
fi

echo -e "${GREEN}✅ certbot安装完成${NC}"

# 2. 检查nginx配置
echo -e "${YELLOW}🔍 检查nginx配置...${NC}"

if ! nginx -t; then
    echo -e "${RED}❌ Nginx配置有误，请先修复配置文件${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Nginx配置正确${NC}"

# 3. 获取SSL证书
echo -e "${YELLOW}🔒 获取SSL证书...${NC}"

# 使用nginx插件自动配置SSL
if certbot --nginx \
    -d "$DOMAIN" \
    -d "$WWW_DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --redirect; then
    
    echo -e "${GREEN}✅ SSL证书配置成功${NC}"
else
    echo -e "${RED}❌ SSL证书配置失败${NC}"
    echo -e "${YELLOW}可能的原因:${NC}"
    echo -e "  1. 域名解析未生效"
    echo -e "  2. 防火墙阻止了80/443端口"
    echo -e "  3. nginx配置有误"
    echo -e "  4. 服务器无法访问Let's Encrypt服务器"
    exit 1
fi

# 4. 测试SSL证书
echo -e "${YELLOW}🧪 测试SSL证书...${NC}"

if certbot certificates | grep -q "$DOMAIN"; then
    echo -e "${GREEN}✅ SSL证书已成功安装${NC}"
else
    echo -e "${RED}❌ SSL证书安装验证失败${NC}"
    exit 1
fi

# 5. 设置自动续期
echo -e "${YELLOW}⏰ 设置SSL证书自动续期...${NC}"

# 添加cron任务
CRON_JOB="0 12 * * * /usr/bin/certbot renew --quiet"
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo -e "${GREEN}✅ 已设置SSL证书自动续期（每天12:00检查）${NC}"

# 6. 重启nginx
echo -e "${YELLOW}🔄 重启nginx...${NC}"
systemctl restart nginx
echo -e "${GREEN}✅ Nginx已重启${NC}"

# 7. 验证HTTPS访问
echo -e "${YELLOW}🔍 验证HTTPS访问...${NC}"

# 测试HTTPS连接
if curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN" | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✅ HTTPS访问正常${NC}"
else
    echo -e "${YELLOW}⚠️ HTTPS访问可能有问题，请手动检查${NC}"
fi

# 8. 显示证书信息
echo -e "${YELLOW}📋 SSL证书信息:${NC}"
certbot certificates

echo ""
echo -e "${GREEN}🎉 SSL证书配置完成！${NC}"
echo ""
echo -e "${BLUE}测试URL:${NC}"
echo -e "${GREEN}https://${DOMAIN}${NC}"
echo -e "${GREEN}https://${WWW_DOMAIN}${NC}"
echo -e "${GREEN}https://${DOMAIN}/api/health${NC}"
echo -e "${GREEN}https://${DOMAIN}/admin/${NC}"
echo -e "${GREEN}https://${DOMAIN}/staff/${NC}"
echo ""
echo -e "${YELLOW}注意事项:${NC}"
echo -e "1. SSL证书有效期为90天，已设置自动续期"
echo -e "2. 如需手动续期，请运行: sudo certbot renew"
echo -e "3. 证书续期后会自动重新加载nginx配置"
