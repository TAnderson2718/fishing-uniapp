# 万鱼钓玩 - 钓鱼平台

一个基于 UniApp + NestJS 的现代化钓鱼平台，提供活动管理、会员系统、内容发布等功能。

## 🌐 域名信息

- **生产域名**: https://wanyudiaowan.cn
- **管理员端**: https://wanyudiaowan.cn/admin/
- **员工端**: https://wanyudiaowan.cn/staff/
- **API接口**: https://wanyudiaowan.cn/api/

## 🏗️ 项目结构

```
fishing-uniapp/
├── apps/
│   ├── admin/          # 管理员端 (Vue 3 + Vite)
│   ├── staff/          # 员工端 (Vue 3 + Vite)
│   └── miniapp/        # 微信小程序 (UniApp)
├── services/
│   └── api/            # 后端API服务 (NestJS)
├── scripts/
│   ├── update-domain.sh    # 域名更新脚本
│   ├── setup-ssl.sh       # SSL证书配置脚本
│   └── database-migration/ # 数据库迁移脚本
├── docs/
│   ├── 域名更改指南.md     # 域名更改详细指南
│   └── 项目交接文档.md     # 项目交接文档
├── nginx-wanyudiaowan.conf # Nginx配置文件
└── README.md
```

## 🚀 快速开始

### 环境要求
- Node.js 18+
- PostgreSQL 12+
- PM2 (生产环境)
- Nginx (生产环境)

### 本地开发

1. **克隆项目**
```bash
git clone <repository-url>
cd fishing-uniapp
```

2. **安装依赖**
```bash
# API服务
cd services/api
npm install

# 管理员端
cd ../../apps/admin
npm install

# 员工端
cd ../staff
npm install

# 小程序
cd ../miniapp
npm install
```

3. **配置环境变量**
```bash
# services/api/.env
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
WECHAT_MINI_APPID=your_wechat_appid
WECHAT_MINI_SECRET=your_wechat_secret

# apps/admin/.env
VITE_API_BASE_URL=http://localhost:3000

# apps/staff/.env
VITE_API_BASE_URL=http://localhost:3000
```

4. **启动服务**
```bash
# API服务 (端口3000)
cd services/api
npm run start:dev

# 管理员端 (端口5173)
cd apps/admin
npm run dev

# 员工端 (端口5174)
cd apps/staff
npm run dev

# 小程序 (端口5175)
cd apps/miniapp
npm run dev:mp-weixin
```

## 🌐 生产部署

### 域名更改

如需更改域名，请参考 [域名更改指南](docs/域名更改指南.md)。

### 自动化部署

1. **更新域名配置**
```bash
sudo ./scripts/update-domain.sh
```

2. **配置SSL证书**
```bash
sudo ./scripts/setup-ssl.sh
```

### 手动部署

1. **构建前端应用**
```bash
cd apps/admin && npm run build
cd ../staff && npm run build
```

2. **构建API服务**
```bash
cd services/api && npm run build
```

3. **配置Nginx**
```bash
sudo cp nginx-wanyudiaowan.conf /etc/nginx/sites-available/wanyudiaowan.cn
sudo ln -s /etc/nginx/sites-available/wanyudiaowan.cn /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

4. **启动API服务**
```bash
pm2 start ecosystem.config.js
```

## 📱 小程序配置

### 微信公众平台配置
在微信公众平台配置以下域名：
- **request合法域名**: `https://wanyudiaowan.cn`
- **uploadFile合法域名**: `https://wanyudiaowan.cn`
- **downloadFile合法域名**: `https://wanyudiaowan.cn`

### 开发工具
- 微信开发者工具
- HBuilderX (可选)

## 🔧 技术栈

### 前端
- **框架**: Vue 3, UniApp
- **构建工具**: Vite
- **UI库**: Element Plus (管理端), uni-ui (小程序)
- **状态管理**: Pinia

### 后端
- **框架**: NestJS
- **数据库**: PostgreSQL
- **ORM**: Prisma
- **认证**: JWT
- **文件上传**: Multer

### 部署
- **Web服务器**: Nginx
- **进程管理**: PM2
- **SSL证书**: Let's Encrypt
- **容器化**: Docker (可选)

## 📚 文档

- [域名更改指南](docs/域名更改指南.md)
- [项目交接文档](docs/项目交接文档.md)
- [数据库迁移指南](scripts/database-migration/README.md)

## 🛠️ 开发工具

### 推荐的VSCode扩展
- Vue Language Features (Volar)
- TypeScript Vue Plugin (Volar)
- Prisma
- ESLint
- Prettier

### 代码规范
- ESLint + Prettier
- Husky + lint-staged (Git hooks)
- Conventional Commits

## 🔍 故障排除

### 常见问题

1. **API连接失败**
   - 检查API服务是否启动
   - 确认端口配置正确
   - 查看防火墙设置

2. **数据库连接失败**
   - 检查数据库服务状态
   - 确认连接字符串正确
   - 检查数据库权限

3. **小程序API调用失败**
   - 确认域名已在微信公众平台配置
   - 检查SSL证书是否有效
   - 查看小程序控制台错误信息

### 日志查看
```bash
# API服务日志
pm2 logs fishing-api

# Nginx日志
sudo tail -f /var/log/nginx/wanyudiaowan_error.log

# 系统日志
sudo journalctl -u nginx -f
```

## 🤝 贡献

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系方式

- 项目维护者: [联系信息]
- 技术支持: [支持邮箱]
- 项目地址: [仓库地址]
