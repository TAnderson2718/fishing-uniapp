<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../api/client'

const ticketCode = ref('')
const ticketInfo = ref<any>(null)
const loading = ref(false)

// 查询票据
async function queryTicket() {
  if (!ticketCode.value) {
    ElMessage.error('请输入票据代码')
    return
  }

  loading.value = true
  try {
    const response = await api.get(`/tickets/${ticketCode.value}`)
    ticketInfo.value = response.data
    ElMessage.success('查询成功')
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '票据不存在或已失效')
    ticketInfo.value = null
  } finally {
    loading.value = false
  }
}

// 核销票据
async function verifyTicket() {
  if (!ticketCode.value) {
    ElMessage.error('请输入票据代码')
    return
  }

  try {
    await api.post(`/verify/${ticketCode.value}`)
    ElMessage.success('核销成功')
    queryTicket() // 重新查询状态
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '核销失败')
  }
}

// 清空表单
function clearForm() {
  ticketCode.value = ''
  ticketInfo.value = null
}
</script>

<template>
  <div style="padding: 20px">
    <el-page-header content="票务核销" />
    
    <el-card style="margin-top: 20px">
      <template #header>
        <h3>票据查询与核销</h3>
      </template>
      
      <el-form label-width="100px">
        <el-form-item label="票据代码">
          <el-input 
            v-model="ticketCode" 
            placeholder="请输入票据代码"
            style="width: 300px"
            @keyup.enter="queryTicket"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="queryTicket" :loading="loading">
            查询票据
          </el-button>
          <el-button @click="clearForm">清空</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 票据信息显示 -->
    <el-card v-if="ticketInfo" style="margin-top: 20px">
      <template #header>
        <h3>票据信息</h3>
      </template>
      
      <el-descriptions :column="2" border>
        <el-descriptions-item label="票据代码">{{ ticketInfo.code }}</el-descriptions-item>
        <el-descriptions-item label="活动名称">{{ ticketInfo.activity?.title || '未知活动' }}</el-descriptions-item>
        <el-descriptions-item label="用户昵称">{{ ticketInfo.user?.nickname || '未知用户' }}</el-descriptions-item>
        <el-descriptions-item label="订单号">{{ ticketInfo.order?.id || '无' }}</el-descriptions-item>
        <el-descriptions-item label="票据状态">
          <el-tag :type="ticketInfo.status === 'VERIFIED' ? 'success' : 'primary'">
            {{ ticketInfo.status === 'VERIFIED' ? '已核销' : '未核销' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ new Date(ticketInfo.createdAt).toLocaleString() }}
        </el-descriptions-item>
        <el-descriptions-item v-if="ticketInfo.verifiedAt" label="核销时间">
          {{ new Date(ticketInfo.verifiedAt).toLocaleString() }}
        </el-descriptions-item>
        <el-descriptions-item v-if="ticketInfo.verifiedBy" label="核销员工">
          {{ ticketInfo.verifiedBy.nickname }}
        </el-descriptions-item>
      </el-descriptions>
      
      <div style="margin-top: 20px; text-align: center">
        <el-button 
          v-if="ticketInfo.status !== 'VERIFIED'" 
          type="success" 
          size="large"
          @click="verifyTicket"
        >
          确认核销
        </el-button>
        <el-tag v-else type="success" size="large">
          该票据已核销
        </el-tag>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
</style>
