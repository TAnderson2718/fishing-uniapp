#!/bin/bash

# 钓鱼平台远程服务器PostgreSQL配置脚本
# 用途：在远程服务器上安装和配置PostgreSQL数据库
# 作者：数据库迁移工具
# 日期：2025年9月3日

set -e  # 遇到错误立即退出

# 配置变量
SERVER_ALIAS="server-fishing"
DB_NAME="fishing_platform_shared"
DB_USER="fishing_dev"
DB_PASSWORD="FishDev2025#Secure!"
POSTGRES_VERSION="15"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐟 钓鱼平台远程服务器配置工具${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# 检查SSH连接
echo -e "${YELLOW}🔍 检查SSH连接...${NC}"
if ! ssh -o ConnectTimeout=10 "$SERVER_ALIAS" "echo 'SSH连接成功'" 2>/dev/null; then
    echo -e "${RED}❌ 错误：无法连接到服务器 ${SERVER_ALIAS}${NC}"
    echo -e "${RED}请确保SSH配置正确且服务器可访问${NC}"
    exit 1
fi

echo -e "${GREEN}✅ SSH连接成功${NC}"

# 检查服务器系统信息
echo -e "${YELLOW}📋 获取服务器信息...${NC}"
SERVER_OS=$(ssh "$SERVER_ALIAS" "cat /etc/os-release | grep '^ID=' | cut -d'=' -f2 | tr -d '\"'")
SERVER_VERSION=$(ssh "$SERVER_ALIAS" "cat /etc/os-release | grep '^VERSION_ID=' | cut -d'=' -f2 | tr -d '\"'")

echo -e "${BLUE}服务器系统: ${SERVER_OS} ${SERVER_VERSION}${NC}"

# 创建远程配置脚本
REMOTE_SCRIPT="/tmp/setup_postgresql.sh"

echo -e "${YELLOW}📝 创建远程配置脚本...${NC}"

# 生成远程执行脚本
cat > "/tmp/local_setup_script.sh" << 'EOF'
#!/bin/bash

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DB_NAME="fishing_platform_shared"
DB_USER="fishing_dev"
DB_PASSWORD="FishDev2025#Secure!"

echo -e "${BLUE}🔧 开始配置PostgreSQL...${NC}"

# 检测系统类型
if [ -f /etc/debian_version ]; then
    SYSTEM="debian"
elif [ -f /etc/redhat-release ]; then
    SYSTEM="redhat"
else
    echo -e "${RED}❌ 不支持的系统类型${NC}"
    exit 1
fi

# 更新系统包
echo -e "${YELLOW}📦 更新系统包...${NC}"
if [ "$SYSTEM" = "debian" ]; then
    sudo apt-get update -y
    sudo apt-get upgrade -y
elif [ "$SYSTEM" = "redhat" ]; then
    sudo yum update -y
fi

# 安装PostgreSQL
echo -e "${YELLOW}🗄️ 安装PostgreSQL...${NC}"
if [ "$SYSTEM" = "debian" ]; then
    sudo apt-get install -y postgresql postgresql-contrib postgresql-client
elif [ "$SYSTEM" = "redhat" ]; then
    sudo yum install -y postgresql-server postgresql-contrib postgresql
    sudo postgresql-setup initdb
fi

# 启动PostgreSQL服务
echo -e "${YELLOW}🚀 启动PostgreSQL服务...${NC}"
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 检查PostgreSQL状态
echo -e "${YELLOW}🔍 检查PostgreSQL状态...${NC}"
sudo systemctl status postgresql --no-pager

# 创建数据库和用户
echo -e "${YELLOW}👤 创建数据库用户和数据库...${NC}"

# 切换到postgres用户并执行SQL命令
sudo -u postgres psql << EOSQL
-- 创建数据库用户
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';

-- 创建数据库
CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};

-- 授予权限
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};

-- 授予创建数据库权限（用于测试）
ALTER USER ${DB_USER} CREATEDB;

-- 显示创建结果
\l
\du
EOSQL

echo -e "${GREEN}✅ 数据库用户和数据库创建成功${NC}"

# 配置PostgreSQL允许远程连接
echo -e "${YELLOW}🌐 配置远程连接...${NC}"

# 查找PostgreSQL配置文件
PG_VERSION=$(sudo -u postgres psql -t -c "SELECT version();" | grep -oP '\d+\.\d+' | head -1)
PG_CONFIG_DIR="/etc/postgresql/${PG_VERSION}/main"

if [ ! -d "$PG_CONFIG_DIR" ]; then
    # 尝试其他可能的路径
    PG_CONFIG_DIR=$(sudo find /etc -name "postgresql.conf" -type f 2>/dev/null | head -1 | xargs dirname)
fi

if [ -z "$PG_CONFIG_DIR" ]; then
    echo -e "${RED}❌ 无法找到PostgreSQL配置目录${NC}"
    exit 1
fi

echo -e "${BLUE}PostgreSQL配置目录: ${PG_CONFIG_DIR}${NC}"

# 备份原始配置文件
sudo cp "${PG_CONFIG_DIR}/postgresql.conf" "${PG_CONFIG_DIR}/postgresql.conf.backup"
sudo cp "${PG_CONFIG_DIR}/pg_hba.conf" "${PG_CONFIG_DIR}/pg_hba.conf.backup"

# 修改postgresql.conf
echo -e "${YELLOW}📝 修改postgresql.conf...${NC}"
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" "${PG_CONFIG_DIR}/postgresql.conf"
sudo sed -i "s/#port = 5432/port = 5432/" "${PG_CONFIG_DIR}/postgresql.conf"

# 修改pg_hba.conf允许远程连接
echo -e "${YELLOW}📝 修改pg_hba.conf...${NC}"
echo "# Allow connections from development machines" | sudo tee -a "${PG_CONFIG_DIR}/pg_hba.conf"
echo "host    ${DB_NAME}    ${DB_USER}    0.0.0.0/0    md5" | sudo tee -a "${PG_CONFIG_DIR}/pg_hba.conf"

# 重启PostgreSQL服务
echo -e "${YELLOW}🔄 重启PostgreSQL服务...${NC}"
sudo systemctl restart postgresql

# 检查服务状态
echo -e "${YELLOW}🔍 检查服务状态...${NC}"
sudo systemctl status postgresql --no-pager

# 检查端口监听
echo -e "${YELLOW}🔍 检查端口监听...${NC}"
sudo netstat -tlnp | grep :5432 || sudo ss -tlnp | grep :5432

# 配置防火墙（如果存在）
echo -e "${YELLOW}🔥 配置防火墙...${NC}"
if command -v ufw &> /dev/null; then
    sudo ufw allow 5432/tcp
    echo -e "${GREEN}✅ UFW防火墙规则已添加${NC}"
elif command -v firewall-cmd &> /dev/null; then
    sudo firewall-cmd --permanent --add-port=5432/tcp
    sudo firewall-cmd --reload
    echo -e "${GREEN}✅ firewalld防火墙规则已添加${NC}"
else
    echo -e "${YELLOW}⚠️ 未检测到防火墙，请手动配置端口5432${NC}"
fi

echo -e "${GREEN}🎉 PostgreSQL配置完成！${NC}"
echo ""
echo -e "${BLUE}数据库连接信息：${NC}"
echo -e "主机: $(hostname -I | awk '{print $1}')"
echo -e "端口: 5432"
echo -e "数据库: ${DB_NAME}"
echo -e "用户: ${DB_USER}"
echo -e "密码: ${DB_PASSWORD}"
echo ""

EOF

# 上传并执行远程脚本
echo -e "${YELLOW}📤 上传配置脚本到服务器...${NC}"
scp "/tmp/local_setup_script.sh" "$SERVER_ALIAS:$REMOTE_SCRIPT"

echo -e "${YELLOW}🚀 在服务器上执行配置脚本...${NC}"
ssh "$SERVER_ALIAS" "chmod +x $REMOTE_SCRIPT && $REMOTE_SCRIPT"

# 获取服务器IP地址
SERVER_IP=$(ssh "$SERVER_ALIAS" "hostname -I | awk '{print \$1}'")

echo ""
echo -e "${GREEN}🎉 远程服务器配置完成！${NC}"
echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}数据库连接信息：${NC}"
echo -e "主机: ${SERVER_IP}"
echo -e "端口: 5432"
echo -e "数据库: ${DB_NAME}"
echo -e "用户: ${DB_USER}"
echo -e "密码: ${DB_PASSWORD}"
echo ""

# 保存连接信息到文件
CONNECTION_INFO_FILE="./database-migration/remote_db_connection.env"
mkdir -p "./database-migration"

cat > "$CONNECTION_INFO_FILE" << EOF
# 远程数据库连接信息
# 生成时间: $(date -Iseconds)
REMOTE_DB_HOST=${SERVER_IP}
REMOTE_DB_PORT=5432
REMOTE_DB_NAME=${DB_NAME}
REMOTE_DB_USER=${DB_USER}
REMOTE_DB_PASSWORD=${DB_PASSWORD}
REMOTE_DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${SERVER_IP}:5432/${DB_NAME}
EOF

echo -e "${GREEN}📋 连接信息已保存到: ${CONNECTION_INFO_FILE}${NC}"
echo ""
echo -e "${YELLOW}📝 下一步：${NC}"
echo -e "1. 测试远程连接: psql postgresql://${DB_USER}:${DB_PASSWORD}@${SERVER_IP}:5432/${DB_NAME}"
echo -e "2. 运行数据迁移脚本: ./03-migrate-to-remote.sh"
echo ""

# 清理临时文件
rm -f "/tmp/local_setup_script.sh"
