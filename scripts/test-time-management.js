#!/usr/bin/env node

/**
 * 活动时间管理系统测试脚本
 * 用于验证整个系统的核心功能
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';

// 测试配置
const TEST_CONFIG = {
  // 测试用户token（需要先登录获取）
  authToken: 'your-test-token-here',
  
  // 测试活动ID（来自种子数据）
  activities: {
    lure: 'lure-fishing',      // 路亚钓鱼（4小时限时）
    family: 'family-fishing',   // 亲子钓鱼（全天）
    yoga: 'forest-yoga'        // 森林瑜伽（2小时限时）
  }
};

// HTTP客户端配置
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${TEST_CONFIG.authToken}`,
    'Content-Type': 'application/json'
  }
});

// 测试结果收集
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// 工具函数
function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = {
    info: '📋',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  }[type] || '📋';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function assert(condition, message) {
  if (condition) {
    testResults.passed++;
    log(`PASS: ${message}`, 'success');
  } else {
    testResults.failed++;
    testResults.errors.push(message);
    log(`FAIL: ${message}`, 'error');
  }
}

// 测试函数
async function testActivityTypes() {
  log('测试活动类型配置...', 'info');
  
  try {
    // 测试获取活动列表
    const response = await apiClient.get('/activities');
    const activities = response.data;
    
    assert(Array.isArray(activities), '活动列表应该是数组');
    assert(activities.length >= 3, '应该至少有3个测试活动');
    
    // 检查限时活动
    const lureActivity = activities.find(a => a.id === TEST_CONFIG.activities.lure);
    assert(lureActivity, '路亚钓鱼活动应该存在');
    assert(lureActivity.timeType === 'TIMED', '路亚钓鱼应该是限时模式');
    assert(lureActivity.durationHours === 3, '路亚钓鱼应该是3小时');
    assert(lureActivity.overtimePrice > 0, '路亚钓鱼应该有续费价格');
    
    // 检查全天活动
    const familyActivity = activities.find(a => a.id === TEST_CONFIG.activities.family);
    assert(familyActivity, '亲子钓鱼活动应该存在');
    assert(familyActivity.timeType === 'FULL_DAY', '亲子钓鱼应该是全天模式');
    assert(!familyActivity.durationHours, '全天活动不应该有时长限制');
    
    log('活动类型配置测试完成', 'success');
  } catch (error) {
    log(`活动类型测试失败: ${error.message}`, 'error');
    testResults.failed++;
  }
}

async function testTimedOrderCreation() {
  log('测试限时订单创建...', 'info');
  
  try {
    // 模拟票据ID（实际应该从订单系统获取）
    const mockTicketId = 'test-ticket-' + Date.now();
    
    // 创建限时订单
    const response = await apiClient.post(`/timed-orders/create/${mockTicketId}`);
    
    assert(response.status === 200 || response.status === 201, '限时订单创建应该成功');
    
    const timedOrder = response.data;
    assert(timedOrder.ticketId === mockTicketId, '票据ID应该匹配');
    assert(timedOrder.status === 'ACTIVE', '新创建的订单应该是活跃状态');
    assert(timedOrder.startTime, '应该有开始时间');
    assert(timedOrder.endTime, '应该有结束时间');
    
    log('限时订单创建测试完成', 'success');
    return timedOrder;
  } catch (error) {
    log(`限时订单创建测试失败: ${error.message}`, 'error');
    testResults.failed++;
    return null;
  }
}

async function testCountdownAPI(ticketId) {
  log('测试倒计时API...', 'info');
  
  try {
    const response = await apiClient.get(`/timed-orders/countdown/${ticketId}`);
    const countdown = response.data;
    
    assert(countdown.ticketId === ticketId, '票据ID应该匹配');
    assert(typeof countdown.remainingMinutes === 'number', '剩余分钟应该是数字');
    assert(countdown.remainingTimeText, '应该有格式化的时间文本');
    assert(countdown.activity, '应该包含活动信息');
    
    log(`剩余时间: ${countdown.remainingTimeText}`, 'info');
    log('倒计时API测试完成', 'success');
    return countdown;
  } catch (error) {
    log(`倒计时API测试失败: ${error.message}`, 'error');
    testResults.failed++;
    return null;
  }
}

async function testOrderExtension(ticketId) {
  log('测试订单续费...', 'info');
  
  try {
    // 测试按小时续费
    const extendResponse = await apiClient.post(`/timed-orders/extend/${ticketId}`, {
      extensionType: 'ADD_TIME',
      addedHours: 1
    });
    
    assert(extendResponse.status === 200, '续费请求应该成功');
    
    const extension = extendResponse.data;
    assert(extension.extensionType === 'ADD_TIME', '续费类型应该匹配');
    assert(extension.addedHours === 1, '增加时长应该匹配');
    assert(extension.paidAmount > 0, '应该有支付金额');
    
    log('订单续费测试完成', 'success');
    return extension;
  } catch (error) {
    log(`订单续费测试失败: ${error.message}`, 'error');
    testResults.failed++;
    return null;
  }
}

async function testActiveOrdersList() {
  log('测试活跃订单列表...', 'info');
  
  try {
    const response = await apiClient.get('/timed-orders/active');
    const activeOrders = response.data;
    
    assert(Array.isArray(activeOrders), '活跃订单应该是数组');
    
    if (activeOrders.length > 0) {
      const order = activeOrders[0];
      assert(order.ticket, '订单应该包含票据信息');
      assert(order.activity, '订单应该包含活动信息');
      assert(typeof order.remainingMinutes === 'number', '应该有剩余分钟数');
    }
    
    log(`找到 ${activeOrders.length} 个活跃订单`, 'info');
    log('活跃订单列表测试完成', 'success');
  } catch (error) {
    log(`活跃订单列表测试失败: ${error.message}`, 'error');
    testResults.failed++;
  }
}

async function testExpiredOrdersCheck() {
  log('测试过期订单检查...', 'info');
  
  try {
    const response = await apiClient.post('/timed-orders/check-expired');
    const result = response.data;
    
    assert(typeof result.expiredCount === 'number', '过期数量应该是数字');
    
    log(`检查到 ${result.expiredCount} 个过期订单`, 'info');
    log('过期订单检查测试完成', 'success');
  } catch (error) {
    log(`过期订单检查测试失败: ${error.message}`, 'error');
    testResults.failed++;
  }
}

// 主测试流程
async function runTests() {
  log('🚀 开始活动时间管理系统测试', 'info');
  log('='.repeat(50), 'info');
  
  // 检查API连接
  try {
    await apiClient.get('/health');
    log('API服务连接正常', 'success');
  } catch (error) {
    log('API服务连接失败，请确保服务已启动', 'error');
    return;
  }
  
  // 运行测试套件
  await testActivityTypes();
  
  // 注意：以下测试需要有效的认证token
  if (TEST_CONFIG.authToken !== 'your-test-token-here') {
    const timedOrder = await testTimedOrderCreation();
    
    if (timedOrder) {
      await testCountdownAPI(timedOrder.ticketId);
      await testOrderExtension(timedOrder.ticketId);
    }
    
    await testActiveOrdersList();
    await testExpiredOrdersCheck();
  } else {
    log('跳过需要认证的测试（请配置有效的authToken）', 'warning');
  }
  
  // 输出测试结果
  log('='.repeat(50), 'info');
  log('📊 测试结果统计', 'info');
  log(`✅ 通过: ${testResults.passed}`, 'success');
  log(`❌ 失败: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'success');
  
  if (testResults.errors.length > 0) {
    log('❌ 失败详情:', 'error');
    testResults.errors.forEach(error => {
      log(`  - ${error}`, 'error');
    });
  }
  
  const successRate = (testResults.passed / (testResults.passed + testResults.failed) * 100).toFixed(1);
  log(`📈 成功率: ${successRate}%`, successRate >= 80 ? 'success' : 'warning');
  
  log('🏁 测试完成', 'info');
}

// 运行测试
if (require.main === module) {
  runTests().catch(error => {
    log(`测试运行失败: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = {
  runTests,
  testResults
};
