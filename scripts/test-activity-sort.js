#!/usr/bin/env node

/**
 * 活动排序功能测试脚本
 * 测试管理员后台活动排序功能和顾客端时间类型选择功能
 */

const assert = require('assert');

const API_BASE = 'http://localhost:3000';

// 测试配置
const TEST_CONFIG = {
  activities: {
    lure: 'lure-fishing',
    family: 'family-fishing', 
    yoga: 'forest-yoga'
  }
};

async function makeRequest(url, options = {}) {
  const fetch = (await import('node-fetch')).default;
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

async function testActivitySorting() {
  console.log('\n🔄 测试活动排序功能...');
  
  try {
    // 1. 获取活动列表
    console.log('  📋 获取活动列表...');
    const activities = await makeRequest('/activities');
    assert(Array.isArray(activities), '活动列表应该是数组');
    assert(activities.length >= 3, '应该至少有3个活动');
    
    // 2. 检查排序字段
    console.log('  🔢 检查排序字段...');
    activities.forEach(activity => {
      assert(typeof activity.sortOrder === 'number', '每个活动都应该有sortOrder字段');
    });
    
    // 3. 验证排序顺序
    console.log('  📊 验证排序顺序...');
    for (let i = 1; i < activities.length; i++) {
      assert(
        activities[i-1].sortOrder <= activities[i].sortOrder,
        '活动应该按sortOrder升序排列'
      );
    }
    
    // 4. 测试排序更新API
    console.log('  🔄 测试排序更新...');
    const sortData = activities.map((activity, index) => ({
      id: activity.id,
      sortOrder: (index + 1) * 10
    }));
    
    const updateResult = await makeRequest('/activities/sort', {
      method: 'PUT',
      body: JSON.stringify({ activities: sortData })
    });
    
    assert(updateResult, '排序更新应该返回结果');
    
    // 5. 验证更新后的排序
    console.log('  ✅ 验证更新后的排序...');
    const updatedActivities = await makeRequest('/activities');
    updatedActivities.forEach((activity, index) => {
      const expectedSortOrder = (index + 1) * 10;
      assert(
        activity.sortOrder === expectedSortOrder,
        `活动 ${activity.title} 的排序值应该是 ${expectedSortOrder}`
      );
    });
    
    console.log('  ✅ 活动排序功能测试通过');
    
  } catch (error) {
    console.error('  ❌ 活动排序功能测试失败:', error.message);
    throw error;
  }
}

async function testPublishedActivities() {
  console.log('\n📱 测试已发布活动API...');
  
  try {
    // 1. 获取已发布的活动
    console.log('  📋 获取已发布活动列表...');
    const publishedActivities = await makeRequest('/activities/published');
    assert(Array.isArray(publishedActivities), '已发布活动列表应该是数组');
    
    // 2. 验证所有活动都是已发布状态
    console.log('  📊 验证发布状态...');
    publishedActivities.forEach(activity => {
      assert(activity.status === 'PUBLISHED', '所有活动都应该是已发布状态');
    });
    
    // 3. 验证排序
    console.log('  🔢 验证排序...');
    for (let i = 1; i < publishedActivities.length; i++) {
      assert(
        publishedActivities[i-1].sortOrder <= publishedActivities[i].sortOrder,
        '已发布活动应该按sortOrder升序排列'
      );
    }
    
    // 4. 验证包含场次信息
    console.log('  📅 验证场次信息...');
    publishedActivities.forEach(activity => {
      assert(Array.isArray(activity.sessions), '每个活动都应该包含场次信息');
    });
    
    console.log('  ✅ 已发布活动API测试通过');
    
  } catch (error) {
    console.error('  ❌ 已发布活动API测试失败:', error.message);
    throw error;
  }
}

async function testTimeTypeConfiguration() {
  console.log('\n⏰ 测试时间类型配置...');
  
  try {
    // 1. 获取路亚钓鱼活动详情
    console.log('  🎣 检查路亚钓鱼活动配置...');
    const lureActivity = await makeRequest(`/activities/${TEST_CONFIG.activities.lure}`);
    
    assert(lureActivity.timeType === 'TIMED', '路亚钓鱼应该是限时模式');
    assert(lureActivity.durationHours === 3, '路亚钓鱼应该是3小时');
    assert(parseFloat(lureActivity.overtimePrice) === 40, '路亚钓鱼续费应该是40元/小时');
    assert(parseFloat(lureActivity.memberPrice) === 120, '路亚钓鱼会员价应该是120元');
    
    // 2. 获取亲子钓鱼活动详情
    console.log('  👨‍👩‍👧‍👦 检查亲子钓鱼活动配置...');
    const familyActivity = await makeRequest(`/activities/${TEST_CONFIG.activities.family}`);
    
    assert(familyActivity.timeType === 'FULL_DAY', '亲子钓鱼应该是全天模式');
    assert(familyActivity.durationHours === null, '亲子钓鱼不应该有时长限制');
    assert(familyActivity.overtimePrice === null, '亲子钓鱼不应该有续费价格');
    assert(parseFloat(familyActivity.memberPrice) === 280, '亲子钓鱼会员价应该是280元');
    
    // 3. 获取森林瑜伽活动详情
    console.log('  🧘‍♀️ 检查森林瑜伽活动配置...');
    const yogaActivity = await makeRequest(`/activities/${TEST_CONFIG.activities.yoga}`);
    
    assert(yogaActivity.timeType === 'TIMED', '森林瑜伽应该是限时模式');
    assert(yogaActivity.durationHours === 2, '森林瑜伽应该是2小时');
    assert(parseFloat(yogaActivity.overtimePrice) === 30, '森林瑜伽续费应该是30元/小时');
    assert(parseFloat(yogaActivity.memberPrice) === 90, '森林瑜伽会员价应该是90元');
    
    console.log('  ✅ 时间类型配置测试通过');
    
  } catch (error) {
    console.error('  ❌ 时间类型配置测试失败:', error.message);
    throw error;
  }
}

async function testSortOrderPersistence() {
  console.log('\n💾 测试排序持久化...');
  
  try {
    // 1. 设置特定的排序
    console.log('  🔄 设置测试排序...');
    const testSortOrder = [
      { id: TEST_CONFIG.activities.lure, sortOrder: 1 },
      { id: TEST_CONFIG.activities.family, sortOrder: 2 },
      { id: TEST_CONFIG.activities.yoga, sortOrder: 3 }
    ];
    
    await makeRequest('/activities/sort', {
      method: 'PUT',
      body: JSON.stringify({ activities: testSortOrder })
    });
    
    // 2. 验证排序持久化
    console.log('  📊 验证排序持久化...');
    const activities = await makeRequest('/activities/published');
    
    // 验证路亚钓鱼排第一
    assert(activities[0].id === TEST_CONFIG.activities.lure, '路亚钓鱼应该排在第一位');
    assert(activities[0].sortOrder === 1, '路亚钓鱼的排序值应该是1');
    
    // 验证亲子钓鱼排第二
    assert(activities[1].id === TEST_CONFIG.activities.family, '亲子钓鱼应该排在第二位');
    assert(activities[1].sortOrder === 2, '亲子钓鱼的排序值应该是2');
    
    // 验证森林瑜伽排第三
    assert(activities[2].id === TEST_CONFIG.activities.yoga, '森林瑜伽应该排在第三位');
    assert(activities[2].sortOrder === 3, '森林瑜伽的排序值应该是3');
    
    console.log('  ✅ 排序持久化测试通过');
    
  } catch (error) {
    console.error('  ❌ 排序持久化测试失败:', error.message);
    throw error;
  }
}

async function runAllTests() {
  console.log('🧪 开始活动排序功能测试...\n');
  
  try {
    await testActivitySorting();
    await testPublishedActivities();
    await testTimeTypeConfiguration();
    await testSortOrderPersistence();
    
    console.log('\n🎉 所有测试通过！');
    console.log('\n📋 测试总结:');
    console.log('  ✅ 活动排序功能正常');
    console.log('  ✅ 已发布活动API正常');
    console.log('  ✅ 时间类型配置正确');
    console.log('  ✅ 排序持久化正常');
    console.log('  ✅ 路亚钓鱼活动排在第一位');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testActivitySorting,
  testPublishedActivities,
  testTimeTypeConfiguration,
  testSortOrderPersistence
};
