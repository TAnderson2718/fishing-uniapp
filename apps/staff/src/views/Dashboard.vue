<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../api/client'

const stats = ref({
  totalActivities: 0,
  totalOrders: 0,
  totalMembers: 0,
  totalNews: 0
})

const loading = ref(false)

async function loadStats() {
  loading.value = true
  try {
    // 这里可以调用API获取统计数据
    // 暂时使用模拟数据
    stats.value = {
      totalActivities: 12,
      totalOrders: 156,
      totalMembers: 89,
      totalNews: 23
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadStats()
})
</script>

<template>
  <div class="dashboard">
    <h1>员工工作台</h1>
    
    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="6">
        <el-card>
          <div class="stat-card">
            <div class="stat-number">{{ stats.totalActivities }}</div>
            <div class="stat-label">活动总数</div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card>
          <div class="stat-card">
            <div class="stat-number">{{ stats.totalOrders }}</div>
            <div class="stat-label">订单总数</div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card>
          <div class="stat-card">
            <div class="stat-number">{{ stats.totalMembers }}</div>
            <div class="stat-label">会员总数</div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card>
          <div class="stat-card">
            <div class="stat-number">{{ stats.totalNews }}</div>
            <div class="stat-label">新闻总数</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <template #header>
        <h3>快速操作</h3>
      </template>
      
      <el-row :gutter="20">
        <el-col :span="8">
          <el-button type="primary" @click="$router.push('/activities')" style="width: 100%">
            管理活动
          </el-button>
        </el-col>
        <el-col :span="8">
          <el-button type="success" @click="$router.push('/orders')" style="width: 100%">
            查看订单
          </el-button>
        </el-col>
        <el-col :span="8">
          <el-button type="warning" @click="$router.push('/ticket-verification')" style="width: 100%">
            票务核销
          </el-button>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 20px;
}

.stat-card {
  text-align: center;
  padding: 20px;
}

.stat-number {
  font-size: 2em;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-label {
  color: #666;
  font-size: 14px;
}
</style>
