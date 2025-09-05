<template>
  <div style="padding: 16px">
    <el-page-header content="操作日志" />

    <!-- 筛选条件 -->
    <el-card style="margin: 16px 0">
      <el-form :model="filters" inline>
        <el-form-item label="用户类型">
          <el-select v-model="filters.userType" placeholder="全部" clearable style="width: 120px">
            <el-option label="顾客" value="CUSTOMER" />
            <el-option label="员工" value="STAFF" />
            <el-option label="管理员" value="ADMIN" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="操作类型">
          <el-select v-model="filters.operationType" placeholder="全部" clearable style="width: 150px">
            <el-option label="用户登录" value="USER_LOGIN" />
            <el-option label="用户登出" value="USER_LOGOUT" />
            <el-option label="创建订单" value="ORDER_CREATE" />
            <el-option label="支付订单" value="ORDER_PAY" />
            <el-option label="取消订单" value="ORDER_CANCEL" />
            <el-option label="创建活动" value="ACTIVITY_CREATE" />
            <el-option label="更新活动" value="ACTIVITY_UPDATE" />
            <el-option label="发布活动" value="ACTIVITY_PUBLISH" />
            <el-option label="核销票务" value="TICKET_VERIFY" />
            <el-option label="审核帖子" value="POST_APPROVE" />
            <el-option label="系统配置" value="SYSTEM_CONFIG" />
          </el-select>
        </el-form-item>

        <el-form-item label="操作结果">
          <el-select v-model="filters.result" placeholder="全部" clearable style="width: 120px">
            <el-option label="成功" value="SUCCESS" />
            <el-option label="失败" value="FAILED" />
            <el-option label="部分成功" value="PARTIAL_SUCCESS" />
          </el-select>
        </el-form-item>

        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 350px"
          />
        </el-form-item>

        <el-form-item label="用户名">
          <el-input v-model="filters.userName" placeholder="搜索用户名" style="width: 150px" />
        </el-form-item>

        <el-form-item label="关键词">
          <el-input v-model="filters.keyword" placeholder="搜索操作内容" style="width: 150px" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="search">搜索</el-button>
          <el-button @click="reset">重置</el-button>
          <el-button type="success" @click="exportLogs">导出</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 日志列表 -->
    <el-table :data="logs" border v-loading="loading">
      <el-table-column prop="createdAt" label="操作时间" width="180" sortable>
        <template #default="{ row }">
          {{ formatDateTime(row.createdAt) }}
        </template>
      </el-table-column>
      
      <el-table-column prop="userName" label="操作用户" width="120">
        <template #default="{ row }">
          <div>
            <div>{{ row.userName || '系统' }}</div>
            <el-tag size="small" :type="getUserTypeTagType(row.userType)">
              {{ getUserTypeText(row.userType) }}
            </el-tag>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="action" label="操作动作" width="150" />

      <el-table-column prop="description" label="操作描述" min-width="200" show-overflow-tooltip />

      <el-table-column prop="targetName" label="操作对象" width="150" show-overflow-tooltip />

      <el-table-column prop="ipAddress" label="IP地址" width="130" />

      <el-table-column prop="result" label="操作结果" width="100">
        <template #default="{ row }">
          <el-tag :type="getResultTagType(row.result)">
            {{ getResultText(row.result) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button size="small" @click="viewDetails(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.pageSize"
      :page-sizes="[10, 20, 50, 100]"
      :total="pagination.total"
      layout="total, sizes, prev, pager, next, jumper"
      style="margin-top: 16px; justify-content: center"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" title="操作日志详情" width="800px">
      <el-descriptions :column="2" border v-if="selectedLog">
        <el-descriptions-item label="操作时间">
          {{ formatDateTime(selectedLog.createdAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="操作用户">
          {{ selectedLog.userName || '系统' }} ({{ getUserTypeText(selectedLog.userType) }})
        </el-descriptions-item>
        <el-descriptions-item label="操作类型">
          {{ getOperationTypeText(selectedLog.operationType) }}
        </el-descriptions-item>
        <el-descriptions-item label="操作动作">
          {{ selectedLog.action }}
        </el-descriptions-item>
        <el-descriptions-item label="操作描述" :span="2">
          {{ selectedLog.description }}
        </el-descriptions-item>
        <el-descriptions-item label="操作对象">
          {{ selectedLog.targetType || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="对象名称">
          {{ selectedLog.targetName || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="IP地址">
          {{ selectedLog.ipAddress || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="用户代理">
          {{ selectedLog.userAgent || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="操作结果">
          <el-tag :type="getResultTagType(selectedLog.result)">
            {{ getResultText(selectedLog.result) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="错误信息" v-if="selectedLog.errorMessage">
          {{ selectedLog.errorMessage }}
        </el-descriptions-item>
        <el-descriptions-item label="详细信息" :span="2" v-if="selectedLog.details">
          <pre style="white-space: pre-wrap; font-size: 12px;">{{ JSON.stringify(selectedLog.details, null, 2) }}</pre>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import api from '../api/client'
import { ElMessage } from 'element-plus'

interface OperationLog {
  id: string
  userId?: string
  userType?: string
  userName?: string
  operationType: string
  action: string
  description: string
  targetType?: string
  targetId?: string
  targetName?: string
  details?: any
  ipAddress?: string
  userAgent?: string
  result: string
  errorMessage?: string
  createdAt: string
  user?: {
    id: string
    nickname: string
    role: string
  }
}

const logs = ref<OperationLog[]>([])
const loading = ref(false)
const detailVisible = ref(false)
const selectedLog = ref<OperationLog | null>(null)
const dateRange = ref<[string, string] | null>(null)

const filters = reactive({
  userType: '',
  operationType: '',
  result: '',
  userName: '',
  keyword: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

async function loadLogs() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize,
    }

    if (filters.userType) params.userType = filters.userType
    if (filters.operationType) params.operationType = filters.operationType
    if (filters.result) params.result = filters.result
    if (filters.userName) params.userName = filters.userName
    if (filters.keyword) params.keyword = filters.keyword
    if (dateRange.value) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }

    const { data } = await api.get('/operation-logs', { params })
    logs.value = data.items
    pagination.total = data.total
  } catch (error) {
    ElMessage.error('加载操作日志失败')
  } finally {
    loading.value = false
  }
}

function search() {
  pagination.page = 1
  loadLogs()
}

function reset() {
  Object.assign(filters, {
    userType: '',
    operationType: '',
    result: '',
    userName: '',
    keyword: '',
  })
  dateRange.value = null
  pagination.page = 1
  loadLogs()
}

function handleSizeChange(size: number) {
  pagination.pageSize = size
  pagination.page = 1
  loadLogs()
}

function handleCurrentChange(page: number) {
  pagination.page = page
  loadLogs()
}

function viewDetails(log: OperationLog) {
  selectedLog.value = log
  detailVisible.value = true
}

async function exportLogs() {
  try {
    const params: any = { ...filters }
    if (dateRange.value) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    
    const response = await api.get('/operation-logs/export', { 
      params,
      responseType: 'blob'
    })
    
    const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `操作日志_${new Date().toISOString().slice(0, 10)}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN')
}

function getUserTypeText(type?: string) {
  const typeMap = {
    'CUSTOMER': '顾客',
    'STAFF': '员工',
    'ADMIN': '管理员'
  }
  return typeMap[type] || '未知'
}

function getUserTypeTagType(type?: string) {
  const typeMap = {
    'CUSTOMER': '',
    'STAFF': 'warning',
    'ADMIN': 'danger'
  }
  return typeMap[type] || ''
}

function getResultText(result: string) {
  const resultMap = {
    'SUCCESS': '成功',
    'FAILED': '失败',
    'PARTIAL_SUCCESS': '部分成功'
  }
  return resultMap[result] || result
}

function getResultTagType(result: string) {
  const typeMap = {
    'SUCCESS': 'success',
    'FAILED': 'danger',
    'PARTIAL_SUCCESS': 'warning'
  }
  return typeMap[result] || ''
}

function getOperationTypeText(type: string) {
  const typeMap = {
    'USER_LOGIN': '用户登录',
    'USER_LOGOUT': '用户登出',
    'USER_REGISTER': '用户注册',
    'USER_UPDATE_PROFILE': '更新个人信息',
    'ORDER_CREATE': '创建订单',
    'ORDER_PAY': '支付订单',
    'ORDER_CANCEL': '取消订单',
    'ORDER_REFUND': '退款订单',
    'ACTIVITY_CREATE': '创建活动',
    'ACTIVITY_UPDATE': '更新活动',
    'ACTIVITY_PUBLISH': '发布活动',
    'TICKET_VERIFY': '核销票务',
    'POST_APPROVE': '审核帖子',
    'SYSTEM_CONFIG': '系统配置'
  }
  return typeMap[type] || type
}

onMounted(loadLogs)
</script>
