#!/usr/bin/env node

/**
 * 微信支付配置助手
 * 帮助开发者快速配置微信支付相关参数
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class WechatPaySetup {
  constructor() {
    this.config = {};
    this.envPath = path.join(__dirname, '../services/api/.env');
  }

  async run() {
    console.log('🎣 钓鱼平台微信支付配置助手');
    console.log('=====================================\n');

    try {
      await this.collectBasicInfo();
      await this.collectWechatConfig();
      await this.collectPaymentConfig();
      await this.generateConfig();
      await this.validateConfig();
      
      console.log('\n✅ 微信支付配置完成！');
      console.log('📝 请查看生成的配置文件和说明');
      
    } catch (error) {
      console.error('\n❌ 配置过程中出现错误:', error.message);
    } finally {
      rl.close();
    }
  }

  async collectBasicInfo() {
    console.log('📋 基本信息配置');
    console.log('-------------------');
    
    this.config.environment = await this.question('请选择环境 (development/production): ');
    this.config.domain = await this.question('请输入域名 (如: https://api.yourdomain.com): ');
    
    console.log('');
  }

  async collectWechatConfig() {
    console.log('🔧 微信平台配置');
    console.log('-------------------');
    
    this.config.appid = await this.question('请输入小程序AppID: ');
    this.config.mchid = await this.question('请输入商户号: ');
    this.config.serialNo = await this.question('请输入证书序列号: ');
    
    console.log('\n📄 私钥配置');
    console.log('请将商户私钥内容粘贴到下方（以-----BEGIN PRIVATE KEY-----开头）:');
    this.config.privateKey = await this.question('私钥内容: ');
    
    this.config.apiV3Key = await this.question('请输入APIv3密钥: ');
    
    console.log('');
  }

  async collectPaymentConfig() {
    console.log('💳 支付配置');
    console.log('-------------------');
    
    const defaultNotifyUrl = `${this.config.domain}/payments/wechat/notify`;
    this.config.notifyUrl = await this.question(`支付回调URL (默认: ${defaultNotifyUrl}): `) || defaultNotifyUrl;
    
    const enableH5 = await this.question('是否启用H5支付? (y/n): ');
    this.config.enableH5 = enableH5.toLowerCase() === 'y';
    
    if (this.config.enableH5) {
      this.config.h5Domain = await this.question('H5支付域名: ');
    }
    
    console.log('');
  }

  async generateConfig() {
    console.log('📝 生成配置文件...');
    
    // 生成.env文件内容
    const envContent = this.generateEnvContent();
    
    // 备份现有配置
    if (fs.existsSync(this.envPath)) {
      const backupPath = `${this.envPath}.backup.${Date.now()}`;
      fs.copyFileSync(this.envPath, backupPath);
      console.log(`📦 已备份现有配置到: ${backupPath}`);
    }
    
    // 写入新配置
    fs.writeFileSync(this.envPath, envContent);
    console.log(`✅ 配置已写入: ${this.envPath}`);
    
    // 生成配置说明文档
    const docContent = this.generateDocumentation();
    const docPath = path.join(__dirname, '../docs/wechat-pay-config.md');
    fs.writeFileSync(docPath, docContent);
    console.log(`📚 配置说明已生成: ${docPath}`);
    
    // 生成测试脚本
    const testScript = this.generateTestScript();
    const testPath = path.join(__dirname, 'test-wechat-pay.js');
    fs.writeFileSync(testPath, testScript);
    fs.chmodSync(testPath, '755');
    console.log(`🧪 测试脚本已生成: ${testPath}`);
  }

  generateEnvContent() {
    return `# 微信支付配置 - 由配置助手生成于 ${new Date().toISOString()}
# 环境: ${this.config.environment}

# 微信小程序配置
WECHAT_MINI_APPID=${this.config.appid}

# 微信商户配置
WECHAT_MCH_ID=${this.config.mchid}
WECHAT_MCH_CERT_SERIAL=${this.config.serialNo}

# 微信支付密钥
WECHAT_MCH_PRIVATE_KEY="${this.config.privateKey}"
WECHAT_API_V3_KEY=${this.config.apiV3Key}

# 支付回调配置
WECHAT_PAY_NOTIFY_URL=${this.config.notifyUrl}
PUBLIC_BASE_URL=${this.config.domain}

${this.config.enableH5 ? `# H5支付配置
WECHAT_H5_DOMAIN=${this.config.h5Domain}` : '# H5支付未启用'}

# 其他配置
NODE_ENV=${this.config.environment}
`;
  }

  generateDocumentation() {
    return `# 微信支付配置说明

## 配置概览

- **环境**: ${this.config.environment}
- **小程序AppID**: ${this.config.appid}
- **商户号**: ${this.config.mchid}
- **回调URL**: ${this.config.notifyUrl}
- **H5支付**: ${this.config.enableH5 ? '已启用' : '未启用'}

## 下一步操作

### 1. 微信商户平台配置
- 登录微信商户平台: https://pay.weixin.qq.com
- 配置支付回调URL: \`${this.config.notifyUrl}\`
${this.config.enableH5 ? `- 配置H5支付域名: \`${this.config.h5Domain}\`` : ''}

### 2. 小程序后台配置
- 登录微信公众平台: https://mp.weixin.qq.com
- 在"开发管理 > 开发设置 > 服务器域名"中添加:
  - request合法域名: \`${this.config.domain}\`

### 3. 测试验证
运行测试脚本验证配置:
\`\`\`bash
node scripts/test-wechat-pay.js
\`\`\`

### 4. 安全提醒
- ⚠️ 私钥信息已写入.env文件，请确保该文件不会被提交到版本控制系统
- ⚠️ 生产环境建议使用密钥管理服务存储敏感信息
- ⚠️ 定期更新APIv3密钥和证书

## 常见问题

### Q: 支付时提示"签名验证失败"
A: 检查私钥格式和证书序列号是否正确

### Q: 回调接口收不到通知
A: 确认回调URL可以从外网访问，且使用HTTPS

### Q: 小程序支付失败
A: 检查小程序AppID和商户号是否已关联

## 技术支持
- 微信支付文档: https://pay.weixin.qq.com/wiki/doc/apiv3/index.shtml
- 项目文档: docs/WECHAT_PAY_INTEGRATION_GUIDE.md
`;
  }

  generateTestScript() {
    return `#!/usr/bin/env node

/**
 * 微信支付配置测试脚本
 */

require('dotenv').config({ path: require('path').join(__dirname, '../services/api/.env') });

async function testWechatPayConfig() {
  console.log('🧪 微信支付配置测试');
  console.log('===================\\n');

  const tests = [
    { name: '环境变量检查', test: testEnvironmentVariables },
    { name: '私钥格式验证', test: testPrivateKeyFormat },
    { name: '证书序列号验证', test: testSerialNumber },
    { name: '回调URL验证', test: testNotifyUrl },
    { name: '网络连接测试', test: testNetworkConnection }
  ];

  let passed = 0;
  let failed = 0;

  for (const { name, test } of tests) {
    try {
      console.log(\`🔍 \${name}...\`);
      await test();
      console.log(\`✅ \${name} - 通过\\n\`);
      passed++;
    } catch (error) {
      console.log(\`❌ \${name} - 失败: \${error.message}\\n\`);
      failed++;
    }
  }

  console.log(\`📊 测试结果: \${passed} 通过, \${failed} 失败\`);
  
  if (failed === 0) {
    console.log('🎉 所有测试通过！微信支付配置正确。');
  } else {
    console.log('⚠️ 部分测试失败，请检查配置。');
    process.exit(1);
  }
}

function testEnvironmentVariables() {
  const required = [
    'WECHAT_MINI_APPID',
    'WECHAT_MCH_ID',
    'WECHAT_MCH_CERT_SERIAL',
    'WECHAT_MCH_PRIVATE_KEY',
    'WECHAT_API_V3_KEY',
    'WECHAT_PAY_NOTIFY_URL'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(\`缺少环境变量: \${missing.join(', ')}\`);
  }
}

function testPrivateKeyFormat() {
  const privateKey = process.env.WECHAT_MCH_PRIVATE_KEY;
  
  if (!privateKey.includes('BEGIN PRIVATE KEY')) {
    throw new Error('私钥格式不正确，应包含 BEGIN PRIVATE KEY');
  }
  
  if (!privateKey.includes('END PRIVATE KEY')) {
    throw new Error('私钥格式不正确，应包含 END PRIVATE KEY');
  }
}

function testSerialNumber() {
  const serialNo = process.env.WECHAT_MCH_CERT_SERIAL;
  
  if (!/^[A-F0-9]{40}$/i.test(serialNo)) {
    throw new Error('证书序列号格式不正确，应为40位十六进制字符');
  }
}

function testNotifyUrl() {
  const notifyUrl = process.env.WECHAT_PAY_NOTIFY_URL;
  
  if (!notifyUrl.startsWith('https://')) {
    throw new Error('回调URL必须使用HTTPS协议');
  }
  
  try {
    new URL(notifyUrl);
  } catch {
    throw new Error('回调URL格式不正确');
  }
}

async function testNetworkConnection() {
  const https = require('https');
  
  return new Promise((resolve, reject) => {
    const req = https.request('https://api.mch.weixin.qq.com', { method: 'HEAD' }, (res) => {
      if (res.statusCode === 200 || res.statusCode === 404) {
        resolve();
      } else {
        reject(new Error(\`网络连接失败，状态码: \${res.statusCode}\`));
      }
    });
    
    req.on('error', (error) => {
      reject(new Error(\`网络连接失败: \${error.message}\`));
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('网络连接超时'));
    });
    
    req.end();
  });
}

testWechatPayConfig().catch(console.error);
`;
  }

  async validateConfig() {
    console.log('🔍 配置验证...');
    
    // 基本验证
    if (!this.config.appid || !this.config.appid.startsWith('wx')) {
      throw new Error('小程序AppID格式不正确');
    }
    
    if (!this.config.mchid || !/^\d{10}$/.test(this.config.mchid)) {
      throw new Error('商户号格式不正确');
    }
    
    if (!this.config.serialNo || !/^[A-F0-9]{40}$/i.test(this.config.serialNo)) {
      throw new Error('证书序列号格式不正确');
    }
    
    if (!this.config.privateKey || !this.config.privateKey.includes('BEGIN PRIVATE KEY')) {
      throw new Error('私钥格式不正确');
    }
    
    if (!this.config.apiV3Key || this.config.apiV3Key.length !== 32) {
      throw new Error('APIv3密钥长度应为32位');
    }
    
    if (!this.config.notifyUrl || !this.config.notifyUrl.startsWith('https://')) {
      throw new Error('回调URL必须使用HTTPS协议');
    }
    
    console.log('✅ 配置验证通过');
  }

  question(prompt) {
    return new Promise((resolve) => {
      rl.question(prompt, resolve);
    });
  }
}

// 运行配置助手
if (require.main === module) {
  const setup = new WechatPaySetup();
  setup.run();
}

module.exports = WechatPaySetup;
