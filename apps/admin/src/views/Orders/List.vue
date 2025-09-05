<template>
  <div style="padding: 16px">
    <el-page-header content="订单管理" />

    <!-- 筛选条件 -->
    <el-card style="margin: 16px 0">
      <el-form :model="filters" inline class="filter-form">
        <el-row :gutter="16">
          <el-col :span="6">
            <el-form-item label="订单状态">
              <el-select v-model="filters.status" placeholder="全部状态" clearable style="width: 100%">
                <el-option label="待支付" value="PENDING" />
                <el-option label="已支付" value="PAID" />
                <el-option label="已取消" value="CANCELLED" />
                <el-option label="已退款" value="REFUNDED" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="下单时间">
              <el-date-picker
                v-model="dateRange"
                type="datetimerange"
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>

          <el-col :span="5">
            <el-form-item label="客户信息">
              <el-input v-model="filters.customerInfo" placeholder="客户姓名/手机号" style="width: 100%" />
            </el-form-item>
          </el-col>

          <el-col :span="5">
            <el-form-item label="订单号">
              <el-input v-model="filters.orderNumber" placeholder="订单号" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="24" style="text-align: right; margin-top: 16px;">
            <el-button type="primary" @click="search">搜索</el-button>
            <el-button @click="reset">重置</el-button>
            <el-button type="success" @click="exportOrders">导出</el-button>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 订单列表 -->
    <div class="table-container">
      <el-table :data="orderList" border v-loading="loading" class="orders-table">
      <el-table-column prop="orderNumber" label="订单号" width="180" show-overflow-tooltip />

      <el-table-column label="客户信息" width="140">
        <template #default="{ row }">
          <div class="customer-info">
            <div class="customer-name">{{ row.customerName }}</div>
            <div class="customer-phone">{{ row.customerPhone }}</div>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="activityTitle" label="活动名称" min-width="150" show-overflow-tooltip />

      <el-table-column prop="amount" label="金额" width="80" align="right">
        <template #default="{ row }">
          <span style="color: #f56c6c; font-weight: 500">¥{{ row.amount }}</span>
        </template>
      </el-table-column>

      <el-table-column prop="status" label="状态" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="getStatusTagType(row.status)" size="small">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="倒计时" width="100" align="center">
        <template #default="{ row }">
          <div v-if="isTimedActivity(row)" class="countdown-container">
            <span
              :class="getCountdownClass(row.remainingTime)"
              class="countdown-text"
            >
              {{ formatCountdown(row.remainingTime) }}
            </span>
          </div>
          <span v-else class="text-gray-400">-</span>
        </template>
      </el-table-column>

      <el-table-column label="时间信息" width="180" align="center">
        <template #default="{ row }">
          <div class="time-info">
            <div class="time-row">
              <span class="time-label">下单:</span>
              <span class="time-value">{{ formatDateTime(row.createdAt) }}</span>
            </div>
            <div v-if="row.paidAt" class="time-row">
              <span class="time-label">支付:</span>
              <span class="time-value">{{ formatDateTime(row.paidAt) }}</span>
            </div>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <div class="action-buttons">
            <el-button size="small" @click="viewOrder(row)">详情</el-button>
            <el-dropdown v-if="row.status === 'PAID'" @command="(command) => handleOrderAction(command, row)" trigger="click">
              <el-button size="small" type="primary" class="more-btn">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="refund">申请退款</el-dropdown-item>
                  <el-dropdown-item command="cancel">取消订单</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button
              v-else-if="row.status === 'PENDING'"
              size="small"
              type="warning"
              @click="cancelOrder(row)"
            >
              取消
            </el-button>
          </div>
        </template>
      </el-table-column>
      </el-table>
    </div>

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

    <!-- 订单详情对话框 -->
    <el-dialog v-model="detailVisible" title="订单详情" width="800px">
      <el-descriptions :column="2" border v-if="selectedOrder">
        <el-descriptions-item label="订单号">
          {{ selectedOrder.orderNumber }}
        </el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :type="getStatusTagType(selectedOrder.status)">
            {{ getStatusText(selectedOrder.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="客户姓名">
          {{ selectedOrder.customerName }}
        </el-descriptions-item>
        <el-descriptions-item label="联系电话">
          {{ selectedOrder.customerPhone }}
        </el-descriptions-item>
        <el-descriptions-item label="活动名称" :span="2">
          {{ selectedOrder.activityTitle }}
        </el-descriptions-item>
        <el-descriptions-item label="订单金额">
          <span style="color: #f56c6c; font-weight: 500">¥{{ selectedOrder.amount }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="支付方式">
          {{ selectedOrder.paymentMethod || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="下单时间">
          {{ formatDateTime(selectedOrder.createdAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="支付时间">
          {{ selectedOrder.paidAt ? formatDateTime(selectedOrder.paidAt) : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="备注信息" :span="2">
          {{ selectedOrder.remarks || '-' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import api from '../../api/client'

interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerPhone: string
  activityTitle: string
  amount: number
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'REFUNDED'
  paymentMethod?: string
  remarks?: string
  createdAt: string
  paidAt?: string
  updatedAt: string
  remainingTime?: number // 剩余时间（秒）
  activityType?: string // 活动类型
}

const orderList = ref<Order[]>([])
const loading = ref(false)
const detailVisible = ref(false)
const selectedOrder = ref<Order | null>(null)
const dateRange = ref<[string, string] | null>(null)
const countdownTimer = ref<NodeJS.Timeout | null>(null)

const filters = reactive({
  status: '',
  customerInfo: '',
  orderNumber: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

async function loadOrders() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize,
    }

    if (filters.status) params.status = filters.status
    if (filters.customerInfo) params.customerInfo = filters.customerInfo
    if (filters.orderNumber) params.orderNumber = filters.orderNumber
    if (dateRange.value) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }

    const { data } = await api.get('/orders/admin/list', { params })
    orderList.value = data.items
    pagination.total = data.total
  } catch (error) {
    ElMessage.error('加载订单列表失败')
  } finally {
    loading.value = false
  }
}

function search() {
  pagination.page = 1
  loadOrders()
}

function reset() {
  Object.assign(filters, {
    status: '',
    customerInfo: '',
    orderNumber: '',
  })
  dateRange.value = null
  pagination.page = 1
  loadOrders()
}

function handleSizeChange(size: number) {
  pagination.pageSize = size
  pagination.page = 1
  loadOrders()
}

function handleCurrentChange(page: number) {
  pagination.page = page
  loadOrders()
}

function viewOrder(order: Order) {
  selectedOrder.value = order
  detailVisible.value = true
}

async function handleOrderAction(command: string, order: Order) {
  if (command === 'refund') {
    await refundOrder(order)
  } else if (command === 'cancel') {
    await cancelOrder(order)
  }
}

async function cancelOrder(order: Order) {
  try {
    await ElMessageBox.confirm('确定要取消这个订单吗？', '确认取消', {
      type: 'warning'
    })
    
    await api.patch(`/orders/admin/${order.id}/cancel`)
    ElMessage.success('订单取消成功')
    loadOrders()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('取消订单失败')
    }
  }
}

async function refundOrder(order: Order) {
  try {
    await ElMessageBox.confirm('确定要为这个订单申请退款吗？', '确认退款', {
      type: 'warning'
    })
    
    await api.patch(`/orders/admin/${order.id}/refund`)
    ElMessage.success('退款申请已提交')
    loadOrders()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('退款申请失败')
    }
  }
}

async function exportOrders() {
  try {
    const params: any = { ...filters }
    if (dateRange.value) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    
    const response = await api.get('/orders/export', { 
      params,
      responseType: 'blob'
    })
    
    const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `订单数据_${new Date().toISOString().slice(0, 10)}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

function getStatusText(status: string) {
  const statusMap = {
    'PENDING': '待支付',
    'PAID': '已支付',
    'CANCELLED': '已取消',
    'REFUNDED': '已退款'
  }
  return statusMap[status] || status
}

function getStatusTagType(status: string) {
  const typeMap = {
    'PENDING': 'warning',
    'PAID': 'success',
    'CANCELLED': 'info',
    'REFUNDED': 'danger'
  }
  return typeMap[status] || ''
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN')
}

// 倒计时相关方法
function isTimedActivity(order: Order): boolean {
  // 基于活动类型和剩余时间判断是否显示倒计时
  // 后端已确保只有已核销的限时订单才会有remainingTime
  return (order.activityType === 'TIMED' || order.activityType === 'BOTH') &&
         order.remainingTime !== null &&
         order.remainingTime !== undefined &&
         order.remainingTime > 0
}

function formatCountdown(remainingTime: number): string {
  if (remainingTime <= 0) {
    return '已过期'
  }

  const hours = Math.floor(remainingTime / 3600)
  const minutes = Math.floor((remainingTime % 3600) / 60)
  const seconds = remainingTime % 60

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

function getCountdownClass(remainingTime: number): string {
  if (remainingTime <= 0) {
    return 'countdown-expired'
  } else if (remainingTime <= 300) { // 5分钟内
    return 'countdown-urgent'
  } else if (remainingTime <= 1800) { // 30分钟内
    return 'countdown-warning'
  } else {
    return 'countdown-normal'
  }
}

function updateCountdowns() {
  orderList.value.forEach(order => {
    if (isTimedActivity(order) && order.remainingTime > 0) {
      order.remainingTime -= 1
    }
  })
}

function startCountdownTimer() {
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
  }

  countdownTimer.value = setInterval(updateCountdowns, 1000)
}

function stopCountdownTimer() {
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
    countdownTimer.value = null
  }
}

onMounted(() => {
  loadOrders()
  startCountdownTimer()
})

onUnmounted(() => {
  stopCountdownTimer()
})
</script>

<style scoped>
.countdown-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.countdown-text {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-weight: 600;
  font-size: 13px;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid;
  white-space: nowrap;
  min-width: 70px;
  text-align: center;
}

.countdown-normal {
  color: #67c23a;
  background-color: #f0f9ff;
  border-color: #67c23a;
}

.countdown-warning {
  color: #e6a23c;
  background-color: #fdf6ec;
  border-color: #e6a23c;
}

.countdown-urgent {
  color: #f56c6c;
  background-color: #fef0f0;
  border-color: #f56c6c;
  animation: pulse 1s infinite;
}

.countdown-expired {
  color: #909399;
  background-color: #f4f4f5;
  border-color: #909399;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
  }
}

.text-gray-400 {
  color: #9ca3af;
}

/* 确保表格列不会重叠 */
.el-table {
  table-layout: fixed;
}

.el-table .el-table__cell {
  padding: 8px 4px;
}

/* 确保固定列不会遮挡其他内容 */
.el-table__fixed-right {
  box-shadow: -1px 0 8px rgba(0, 0, 0, 0.1);
}

/* 筛选表单优化 */
.filter-form .el-form-item {
  margin-bottom: 0;
}

.filter-form .el-form-item__label {
  font-size: 14px;
  font-weight: 500;
}

/* 表格容器优化 */
.table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.orders-table {
  width: 100%;
}

/* 客户信息样式 */
.customer-info {
  line-height: 1.4;
}

.customer-name {
  font-weight: 500;
  font-size: 14px;
  color: #303133;
}

.customer-phone {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

/* 时间信息样式 */
.time-info {
  line-height: 1.3;
}

.time-row {
  display: flex;
  align-items: center;
  margin-bottom: 2px;
}

.time-row:last-child {
  margin-bottom: 0;
}

.time-label {
  font-size: 11px;
  color: #909399;
  width: 30px;
  flex-shrink: 0;
}

.time-value {
  font-size: 12px;
  color: #606266;
  flex: 1;
}

/* 操作按钮样式 */
.action-buttons {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.action-buttons .el-button {
  margin: 0;
  padding: 4px 8px;
}

.more-btn {
  font-size: 12px;
}

/* 响应式优化 */
@media (max-width: 1200px) {
  .orders-table .el-table__cell {
    padding: 6px 2px;
  }

  .customer-name,
  .time-value {
    font-size: 12px;
  }

  .customer-phone,
  .time-label {
    font-size: 11px;
  }
}
</style>
