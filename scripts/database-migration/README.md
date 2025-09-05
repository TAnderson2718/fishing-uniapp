# 🐟 钓鱼平台数据库迁移与SSH隧道管理

本目录包含了完整的数据库迁移工具和SSH隧道自动化管理脚本，让您可以安全地将本地数据库迁移到远程服务器，并通过SSH隧道进行连接。

## 📁 文件结构

```
scripts/database-migration/
├── 01-backup-local-database.sh     # 本地数据库备份脚本
├── 02-setup-remote-server.sh       # 远程服务器配置脚本
├── 03-migrate-to-remote.sh         # 数据迁移脚本
├── 04-update-local-config.sh       # 本地配置更新脚本
├── ssh-tunnel-manager.sh           # SSH隧道管理器 ⭐
├── db-connect.sh                   # 数据库连接工具 ⭐
├── database-backups/               # 备份文件目录
├── database-migration/             # 迁移信息目录
└── README.md                       # 本文档
```

## 🚀 快速开始

### 1. 完整迁移流程（首次使用）

如果您还没有进行数据库迁移，请按顺序执行：

```bash
# 1. 备份本地数据库
./01-backup-local-database.sh

# 2. 配置远程服务器（需要SSH免密登录）
./02-setup-remote-server.sh

# 3. 迁移数据到远程服务器
./03-migrate-to-remote.sh

# 4. 更新本地配置
./04-update-local-config.sh
```

### 2. 日常开发使用（迁移完成后）

迁移完成后，您可以使用以下便捷脚本：

```bash
# 在项目根目录下：

# 启动开发环境（自动启动SSH隧道）
./start-dev.sh

# 管理SSH隧道
./tunnel.sh start    # 启动隧道
./tunnel.sh status   # 查看状态
./tunnel.sh stop     # 停止隧道

# 连接数据库
./db.sh             # 直接连接数据库
./db.sh info        # 查看连接信息

# 停止开发环境
./stop-dev.sh
```

## 🔧 SSH隧道管理器详细说明

### 功能特性

- ✅ **自动化管理**：一键启动/停止SSH隧道
- ✅ **状态监控**：实时检查隧道运行状态
- ✅ **连接测试**：自动验证数据库连接
- ✅ **进程管理**：智能PID管理，避免僵尸进程
- ✅ **错误处理**：完善的错误检测和恢复机制
- ✅ **日志记录**：详细的操作日志

### 使用方法

```bash
# 基本命令
./ssh-tunnel-manager.sh start     # 启动SSH隧道
./ssh-tunnel-manager.sh stop      # 停止SSH隧道
./ssh-tunnel-manager.sh restart   # 重启SSH隧道
./ssh-tunnel-manager.sh status    # 显示隧道状态
./ssh-tunnel-manager.sh test      # 测试数据库连接
./ssh-tunnel-manager.sh help      # 显示帮助信息
```

### 工作原理

```
本地应用 → localhost:15432 → SSH隧道 → 服务器SSH(22端口) → 服务器localhost:5432 → PostgreSQL
```

## 🔗 数据库连接工具

### 功能特性

- ✅ **智能连接**：自动检测并启动SSH隧道
- ✅ **多种方式**：支持直接连接和信息查看
- ✅ **兼容性好**：自动检测PostgreSQL.app
- ✅ **用户友好**：清晰的提示和错误信息

### 使用方法

```bash
# 直接连接数据库（推荐）
./db-connect.sh

# 查看连接信息
./db-connect.sh info

# 管理隧道
./db-connect.sh tunnel start
./db-connect.sh tunnel stop
./db-connect.sh tunnel status
./db-connect.sh tunnel test
```

## 📊 连接信息

### 远程数据库
- **主机**: 1.15.116.152 (腾讯云服务器)
- **端口**: 5432
- **数据库**: fishing_platform_shared
- **用户**: fishing_dev

### 通过SSH隧道连接
- **本地主机**: localhost
- **本地端口**: 15432
- **连接URL**: `postgresql://fishing_dev:FishDev2025#Secure!@localhost:15432/fishing_platform_shared`

## 🛡️ 安全特性

### SSH隧道优势
1. **端口不暴露**：数据库端口5432不对外开放
2. **加密传输**：所有数据通过SSH加密传输
3. **访问控制**：只有SSH权限用户才能连接
4. **审计跟踪**：SSH连接有完整的日志记录

### 最佳实践
- ✅ 使用SSH密钥认证而非密码
- ✅ 定期更新SSH密钥
- ✅ 监控SSH连接日志
- ✅ 使用强密码保护数据库用户

## 🔧 故障排除

### 常见问题

#### 1. SSH隧道启动失败
```bash
# 检查SSH连接
ssh server-fishing "echo 'SSH连接测试'"

# 检查端口占用
lsof -i :15432

# 重启隧道
./tunnel.sh restart
```

#### 2. 数据库连接失败
```bash
# 检查隧道状态
./tunnel.sh status

# 测试连接
./tunnel.sh test

# 查看详细信息
./db.sh info
```

#### 3. 权限问题
```bash
# 确保脚本可执行
chmod +x scripts/database-migration/*.sh
chmod +x *.sh
```

### 日志文件
- SSH隧道日志: `/tmp/fishing_db_tunnel.log`
- 隧道PID文件: `/tmp/fishing_db_tunnel.pid`

## 📝 配置文件

### 自动备份
所有原始配置文件都会自动备份，格式为：
```
原文件.backup.YYYYMMDD_HHMMSS
```

### 恢复配置
如需恢复到原始配置：
```bash
# 找到备份文件
ls services/api/.env.backup.*

# 恢复配置
cp services/api/.env.backup.20250903_185704 services/api/.env
```

## 🎯 开发工作流

### 推荐的日常开发流程

1. **启动开发环境**
   ```bash
   ./start-dev.sh
   ```

2. **开发应用**
   ```bash
   npm run dev
   ```

3. **需要时连接数据库**
   ```bash
   ./db.sh
   ```

4. **结束开发**
   ```bash
   ./stop-dev.sh
   ```

### 团队协作

- 每个开发者都需要配置SSH免密登录到服务器
- 共享相同的数据库连接信息
- 使用相同的SSH隧道端口（15432）

## 📞 技术支持

如果遇到问题，请检查：

1. **SSH连接**: `ssh server-fishing "echo test"`
2. **隧道状态**: `./tunnel.sh status`
3. **数据库连接**: `./tunnel.sh test`
4. **配置文件**: 检查 `services/api/.env`

---

**🎉 恭喜！您已经成功配置了安全的远程数据库连接系统！**
