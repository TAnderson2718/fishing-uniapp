<template>
  <div style="padding: 16px">
    <el-page-header content="控制台" />

    <!-- 欢迎信息 -->
    <el-card style="margin-top: 16px">
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between">
          <span style="font-weight: 600">欢迎使用渔场管理系统</span>
          <el-tag type="success">系统运行正常</el-tag>
        </div>
      </template>
      <div style="color: #666; line-height: 1.6">
        <p>您好，管理员！欢迎来到渔场管理后台。</p>
        <p>请使用左侧导航菜单访问各项管理功能：</p>
        <ul style="margin: 12px 0; padding-left: 20px">
          <li><strong>会员卡方案</strong> - 管理会员卡类型和价格设置</li>
          <li><strong>活动管理</strong> - 创建和管理渔场活动</li>
          <li><strong>渔友圈管理</strong> - 审核和管理用户发布的内容</li>
          <li><strong>操作日志</strong> - 查看系统操作记录和审计信息</li>
        </ul>
      </div>
    </el-card>

    <!-- 系统概览统计 -->
    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #e3f2fd">
              <el-icon size="24" color="#1976d2">
                <User />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalUsers }}</div>
              <div class="stat-label">总用户数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #e8f5e8">
              <el-icon size="24" color="#388e3c">
                <Calendar />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalActivities }}</div>
              <div class="stat-label">活动总数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #fff3e0">
              <el-icon size="24" color="#f57c00">
                <Document />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalPosts }}</div>
              <div class="stat-label">渔友圈帖子</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #fce4ec">
              <el-icon size="24" color="#c2185b">
                <CreditCard />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalMembers }}</div>
              <div class="stat-label">会员总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最近活动 -->
    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span style="font-weight: 600">最近活动</span>
          </template>
          <div v-if="recentActivities.length === 0" style="text-align: center; color: #999; padding: 20px">
            暂无最近活动
          </div>
          <div v-else>
            <div v-for="activity in recentActivities" :key="activity.id" class="activity-item">
              <div class="activity-title">{{ activity.title }}</div>
              <div class="activity-meta">
                <el-tag size="small" :type="activity.status === 'PUBLISHED' ? 'success' : 'warning'">
                  {{ activity.status === 'PUBLISHED' ? '已发布' : '草稿' }}
                </el-tag>
                <span class="activity-date">{{ formatDate(activity.createdAt) }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<!--
/**
 * 管理员控制台页面
 * @description 管理员后台的首页，展示系统概览和关键统计数据
 * 提供系统状态监控、快速导航和数据统计功能
 * 包含用户数量、活动数量、帖子数量、会员数量等关键指标
 */
-->

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { User, Calendar, Document, CreditCard } from '@element-plus/icons-vue'
import api from '../api/client'

/**
 * 系统统计数据
 * @description 存储系统关键指标的响应式数据
 */
const stats = ref({
  totalUsers: 0,      // 总用户数
  totalActivities: 0, // 总活动数
  totalPosts: 0,      // 总帖子数
  totalMembers: 0     // 总会员数
})

/**
 * 最近活动列表
 * @description 存储系统最近的活动记录
 */
const recentActivities = ref([])

/**
 * 格式化日期显示
 * @description 将日期字符串格式化为中文本地化格式
 * @param dateStr 日期字符串
 * @returns 格式化后的日期字符串
 */
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

/**
 * 加载系统统计数据
 * @description 从API获取系统关键指标数据，用于控制台展示
 * 包含用户数量、活动数量、帖子数量、会员数量等统计信息
 */
async function loadStats() {
  try {
    // TODO: 调用实际的API获取统计数据
    // 当前使用模拟数据进行展示
    stats.value = {
      totalUsers: 156,      // 总用户数
      totalActivities: 23,  // 总活动数
      totalPosts: 89,       // 总帖子数
      totalMembers: 45      // 总会员数
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

// 加载最近活动
async function loadRecentActivities() {
  try {
    // 这里可以调用实际的API获取最近活动
    // 暂时使用模拟数据
    recentActivities.value = [
      {
        id: '1',
        title: '周末钓鱼比赛',
        status: 'PUBLISHED',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        title: '新手钓鱼培训',
        status: 'DRAFT',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ]
  } catch (error) {
    console.error('加载最近活动失败:', error)
  }
}

onMounted(() => {
  loadStats()
  loadRecentActivities()
})
</script>

<style scoped>
.stat-card {
  height: 100px;
}

.stat-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

.activity-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-title {
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.activity-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.activity-date {
  font-size: 12px;
  color: #999;
}


</style>

