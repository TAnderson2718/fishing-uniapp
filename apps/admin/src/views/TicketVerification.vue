<template>
  <div class="verification-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <el-page-header content="票务核销" />
      <div class="header-actions">
        <el-button @click="loadStats" :loading="statsLoading">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧：核销操作区 -->
      <div class="left-panel">
        <el-card class="verification-card">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><Ticket /></el-icon>
              <span class="header-title">票券核销</span>
            </div>
          </template>

          <div class="verification-form">
            <el-form @submit.prevent="handleManualVerify">
              <el-form-item>
                <div class="input-wrapper">
                  <el-input
                    v-model="manualCode"
                    placeholder="请输入或扫描票券码"
                    clearable
                    size="large"
                    @keyup.enter="handleManualVerify"
                    class="verification-input"
                  >
                    <template #prefix>
                      <el-icon><Ticket /></el-icon>
                    </template>
                  </el-input>
                </div>
              </el-form-item>

              <el-form-item>
                <el-button
                  type="primary"
                  @click="handleManualVerify"
                  :loading="verifying"
                  size="large"
                  class="verify-button"
                >
                  <el-icon v-if="!verifying"><CircleCheck /></el-icon>
                  {{ verifying ? '核销中...' : '立即核销' }}
                </el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 快捷操作 -->
          <div class="quick-actions">
            <el-divider content-position="left">快捷操作</el-divider>
            <div class="action-buttons">
              <el-button @click="openScanner" icon="Camera">扫码核销</el-button>
              <el-button @click="showBatchVerify = true" icon="DocumentCopy">批量核销</el-button>
            </div>
          </div>
        </el-card>

        <!-- 操作员信息 -->
        <el-card class="operator-card">
          <div class="operator-info">
            <div class="operator-avatar">
              <el-icon size="24"><User /></el-icon>
            </div>
            <div class="operator-details">
              <div class="operator-name">{{ currentUser?.nickname || '管理员' }}</div>
              <div class="operator-role">当前操作员</div>
              <div class="operator-time">{{ currentTime }}</div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 右侧：统计数据区 -->
      <div class="right-panel">
        <div class="stats-grid">
          <div class="stat-card today-verified">
            <div class="stat-icon">
              <el-icon><Tickets /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ stats.todayVerified }}</div>
              <div class="stat-label">今日核销</div>
              <div class="stat-trend">+{{ todayIncrease }}%</div>
            </div>
          </div>

          <div class="stat-card total-verified">
            <div class="stat-icon">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ stats.totalVerified }}</div>
              <div class="stat-label">总核销数</div>
              <div class="stat-trend">累计</div>
            </div>
          </div>

          <div class="stat-card pending-tickets">
            <div class="stat-icon">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ stats.pendingTickets }}</div>
              <div class="stat-label">待核销</div>
              <div class="stat-trend">实时</div>
            </div>
          </div>

          <div class="stat-card efficiency">
            <div class="stat-icon">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ efficiency }}%</div>
              <div class="stat-label">核销效率</div>
              <div class="stat-trend">今日</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 核销记录表格 -->
    <div class="records-section">
      <el-card class="records-card">
        <template #header>
          <div class="records-header">
            <div class="header-left">
              <el-icon class="header-icon"><DocumentCopy /></el-icon>
              <span class="header-title">核销记录</span>
              <el-tag type="info" size="small">{{ pagination.total }} 条记录</el-tag>
            </div>
            <div class="header-actions">
              <el-button-group>
                <el-button @click="loadVerificationRecords" :loading="recordsLoading">
                  <el-icon><Refresh /></el-icon>
                  刷新
                </el-button>
                <el-button @click="exportRecords">
                  <el-icon><Download /></el-icon>
                  导出
                </el-button>
              </el-button-group>
            </div>
          </div>
        </template>

        <div class="table-container">
          <el-table
            :data="verificationRecords"
            v-loading="recordsLoading"
            class="records-table"
            :row-class-name="getRowClassName"
          >
            <el-table-column prop="ticketCode" label="票券码" width="140">
              <template #default="{ row }">
                <div class="ticket-code">
                  <el-icon><Ticket /></el-icon>
                  <span>{{ row.ticketCode }}</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="客户信息" width="180">
              <template #default="{ row }">
                <div class="customer-info">
                  <div class="customer-name">{{ row.customerName }}</div>
                  <div class="customer-phone">{{ row.customerPhone }}</div>
                </div>
              </template>
            </el-table-column>

            <el-table-column prop="activityTitle" label="活动名称" min-width="200" show-overflow-tooltip />

            <el-table-column prop="verifiedAt" label="核销时间" width="160">
              <template #default="{ row }">
                <div class="verify-time">
                  <el-icon><Clock /></el-icon>
                  <span>{{ formatDateTime(row.verifiedAt) }}</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column prop="verifiedBy" label="核销员" width="120">
              <template #default="{ row }">
                <div class="verifier">
                  <el-icon><User /></el-icon>
                  <span>{{ row.verifiedBy }}</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag type="success" size="small">
                  <el-icon><CircleCheck /></el-icon>
                  已核销
                </el-tag>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="pagination.page"
              v-model:page-size="pagination.pageSize"
              :page-sizes="[10, 20, 50]"
              :total="pagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </div>
      </el-card>
    </div>

    <!-- 核销结果对话框 -->
    <el-dialog v-model="showResultDialog" title="核销结果" width="500px" class="result-dialog">
      <div v-if="verificationResult">
        <el-result
          :icon="verificationResult.success ? 'success' : 'error'"
          :title="verificationResult.success ? '核销成功' : '核销失败'"
          :sub-title="verificationResult.message"
        >
          <template #extra v-if="verificationResult.success && verificationResult.ticket">
            <div class="ticket-details">
              <div class="detail-item">
                <span class="label">票券码：</span>
                <span class="value">{{ verificationResult.ticket.code }}</span>
              </div>
              <div class="detail-item">
                <span class="label">客户姓名：</span>
                <span class="value">{{ verificationResult.ticket.customerName }}</span>
              </div>
              <div class="detail-item">
                <span class="label">联系电话：</span>
                <span class="value">{{ verificationResult.ticket.customerPhone }}</span>
              </div>
              <div class="detail-item">
                <span class="label">活动名称：</span>
                <span class="value">{{ verificationResult.ticket.activityTitle }}</span>
              </div>
            </div>
          </template>
        </el-result>
      </div>

      <template #footer>
        <el-button type="primary" @click="showResultDialog = false">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量核销对话框 -->
    <el-dialog v-model="showBatchVerify" title="批量核销" width="600px" class="batch-dialog">
      <div class="batch-content">
        <el-form>
          <el-form-item label="票券码列表">
            <el-input
              v-model="batchCodes"
              type="textarea"
              :rows="6"
              placeholder="请输入票券码，每行一个"
            />
          </el-form-item>
        </el-form>

        <div v-if="batchResults.length > 0" class="batch-results">
          <el-divider content-position="left">处理结果</el-divider>
          <div class="result-list">
            <div
              v-for="result in batchResults"
              :key="result.code"
              :class="['result-item', result.success ? 'success' : 'error']"
            >
              <el-icon>
                <CircleCheck v-if="result.success" />
                <CircleClose v-else />
              </el-icon>
              <span class="code">{{ result.code }}</span>
              <span class="message">{{ result.message }}</span>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="showBatchVerify = false">取消</el-button>
        <el-button type="primary" @click="handleBatchVerify" :loading="batchVerifying">
          开始批量核销
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, computed, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Tickets, CircleCheck, Clock, User, Refresh, Ticket,
  DocumentCopy, Download, Camera, TrendCharts, CircleClose
} from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import api from '../api/client'

const auth = useAuthStore()
const currentUser = auth.user

// 基础状态
const manualCode = ref('')
const verifying = ref(false)
const showResultDialog = ref(false)
const recordsLoading = ref(false)
const statsLoading = ref(false)

// 批量核销相关
const showBatchVerify = ref(false)
const batchCodes = ref('')
const batchVerifying = ref(false)
const batchResults = ref<any[]>([])

// 统计数据
const stats = reactive({
  todayVerified: 15,
  totalVerified: 128,
  pendingTickets: 45
})

// 计算属性
const todayIncrease = computed(() => Math.round(Math.random() * 20 + 5))
const efficiency = computed(() => Math.round((stats.todayVerified / (stats.todayVerified + stats.pendingTickets)) * 100))

// 当前时间
const currentTime = ref('')
let timeInterval: any = null

const verificationRecords = ref([])
const verificationResult = ref<any>(null)

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})



async function handleManualVerify() {
  if (!manualCode.value.trim()) {
    ElMessage.error('请输入票券码')
    return
  }
  
  verifying.value = true
  try {
    const { data } = await api.post('/verify/' + manualCode.value.trim())
    
    verificationResult.value = {
      success: true,
      message: '票券核销成功',
      ticket: data
    }
    
    showResultDialog.value = true
    manualCode.value = ''
    
    // 刷新统计和记录
    loadStats()
    loadVerificationRecords()
  } catch (error: any) {
    verificationResult.value = {
      success: false,
      message: error.response?.data?.message || '核销失败，请检查票券码是否正确'
    }
    showResultDialog.value = true
  } finally {
    verifying.value = false
  }
}

async function loadStats() {
  statsLoading.value = true
  try {
    // 这里应该调用实际的统计API
    stats.todayVerified = 15
    stats.totalVerified = 128
    stats.pendingTickets = 45
  } catch (error) {
    console.error('加载统计数据失败:', error)
    ElMessage.error('加载统计数据失败')
  } finally {
    statsLoading.value = false
  }
}

// 更新当前时间
function updateCurrentTime() {
  currentTime.value = new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 扫码核销
function openScanner() {
  ElMessage.info('扫码功能开发中...')
}

// 批量核销
async function handleBatchVerify() {
  if (!batchCodes.value.trim()) {
    ElMessage.error('请输入票券码')
    return
  }

  const codes = batchCodes.value.split('\n').filter(code => code.trim())
  if (codes.length === 0) {
    ElMessage.error('请输入有效的票券码')
    return
  }

  batchVerifying.value = true
  batchResults.value = []

  try {
    for (const code of codes) {
      try {
        await api.post('/verify/' + code.trim())
        batchResults.value.push({
          code: code.trim(),
          success: true,
          message: '核销成功'
        })
      } catch (error: any) {
        batchResults.value.push({
          code: code.trim(),
          success: false,
          message: error.response?.data?.message || '核销失败'
        })
      }
    }

    const successCount = batchResults.value.filter(r => r.success).length
    ElMessage.success(`批量核销完成，成功 ${successCount}/${codes.length} 个`)

    // 刷新数据
    loadStats()
    loadVerificationRecords()
  } finally {
    batchVerifying.value = false
  }
}

// 导出记录
function exportRecords() {
  ElMessage.info('导出功能开发中...')
}

// 表格行样式
function getRowClassName({ rowIndex }: { rowIndex: number }) {
  return rowIndex % 2 === 0 ? 'even-row' : 'odd-row'
}

async function loadVerificationRecords() {
  recordsLoading.value = true
  try {
    // 这里应该调用实际的核销记录API
    // 暂时使用模拟数据
    verificationRecords.value = [
      {
        id: '1',
        ticketCode: 'T20250902001',
        customerName: '张三',
        customerPhone: '13800138000',
        activityTitle: '周末钓鱼比赛',
        verifiedAt: new Date().toISOString(),
        verifiedBy: currentUser?.nickname || '管理员'
      }
    ]
    pagination.total = 1
  } catch (error) {
    ElMessage.error('加载核销记录失败')
  } finally {
    recordsLoading.value = false
  }
}

function handleSizeChange(size: number) {
  pagination.pageSize = size
  pagination.page = 1
  loadVerificationRecords()
}

function handleCurrentChange(page: number) {
  pagination.page = page
  loadVerificationRecords()
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN')
}

onMounted(() => {
  loadStats()
  loadVerificationRecords()
  updateCurrentTime()

  // 每秒更新时间
  timeInterval = setInterval(updateCurrentTime, 1000)
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<style scoped>
/* 容器样式 */
.verification-container {
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: calc(100vh - 60px);
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background: white;
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 主要内容区域 */
.main-content {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

/* 左侧面板 */
.left-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 核销卡片 */
.verification-card {
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: none;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.header-icon {
  color: #3498db;
}

.verification-form {
  padding: 20px 0;
}

.input-wrapper {
  margin-bottom: 16px;
}

.verification-input {
  border-radius: 12px;
}

.verification-input :deep(.el-input__inner) {
  border-radius: 12px;
  border: 2px solid #e1e8ed;
  transition: all 0.3s ease;
}

.verification-input :deep(.el-input__inner:focus) {
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.verify-button {
  width: 100%;
  height: 48px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  transition: all 0.3s ease;
}

.verify-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

/* 快捷操作 */
.quick-actions {
  margin-top: 20px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-buttons .el-button {
  flex: 1;
  border-radius: 8px;
}

/* 操作员卡片 */
.operator-card {
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: none;
}

.operator-info {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
}

.operator-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.operator-details {
  flex: 1;
}

.operator-name {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.operator-role {
  font-size: 12px;
  color: #7f8c8d;
  margin-bottom: 2px;
}

.operator-time {
  font-size: 11px;
  color: #95a5a6;
}

/* 右侧面板 */
.right-panel {
  display: flex;
  flex-direction: column;
}

/* 统计网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  height: fit-content;
}

/* 统计卡片 */
.stat-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: none;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
}

.today-verified::before {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}

.total-verified::before {
  background: linear-gradient(90deg, #f093fb 0%, #f5576c 100%);
}

.pending-tickets::before {
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
}

.efficiency::before {
  background: linear-gradient(90deg, #43e97b 0%, #38f9d7 100%);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  font-size: 24px;
}

.today-verified .stat-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.total-verified .stat-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.pending-tickets .stat-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.efficiency .stat-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #7f8c8d;
  margin-bottom: 4px;
}

.stat-trend {
  font-size: 12px;
  color: #27ae60;
  font-weight: 500;
}

/* 记录表格区域 */
.records-section {
  grid-column: 1 / -1;
}

.records-card {
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: none;
}

.records-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.header-actions .el-button-group .el-button {
  border-radius: 8px;
}

/* 表格容器 */
.table-container {
  margin-top: 16px;
}

.records-table {
  border-radius: 12px;
  overflow: hidden;
}

.records-table :deep(.el-table__header) {
  background: #f8f9fa;
}

.records-table :deep(.el-table__row.even-row) {
  background: #fafbfc;
}

.records-table :deep(.el-table__row:hover) {
  background: #e3f2fd !important;
}

/* 表格内容样式 */
.ticket-code {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-weight: 500;
}

.customer-info {
  line-height: 1.4;
}

.customer-name {
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 2px;
}

.customer-phone {
  font-size: 12px;
  color: #7f8c8d;
}

.verify-time {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #5a6c7d;
}

.verifier {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #5a6c7d;
}

/* 分页样式 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

/* 对话框样式 */
.result-dialog :deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
}

.ticket-details {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
  border-radius: 12px;
  margin-top: 16px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
}

.detail-item:last-child {
  margin-bottom: 0;
  border-bottom: none;
}

.detail-item .label {
  font-weight: 500;
  color: #5a6c7d;
}

.detail-item .value {
  font-weight: 600;
  color: #2c3e50;
}

/* 批量核销对话框 */
.batch-dialog :deep(.el-dialog) {
  border-radius: 16px;
}

.batch-content {
  padding: 16px 0;
}

.batch-results {
  margin-top: 20px;
}

.result-list {
  max-height: 200px;
  overflow-y: auto;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  font-size: 14px;
}

.result-item.success {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  color: #0369a1;
}

.result-item.error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
}

.result-item .code {
  font-family: 'Monaco', 'Menlo', monospace;
  font-weight: 600;
  min-width: 120px;
}

.result-item .message {
  flex: 1;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 768px) {
  .verification-container {
    padding: 12px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .page-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
}
</style>
