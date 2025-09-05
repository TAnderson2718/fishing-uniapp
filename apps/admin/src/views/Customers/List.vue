<template>
  <div style="padding: 16px">
    <el-page-header content="顾客管理" />

    <!-- 统计卡片 -->
    <el-row :gutter="16" style="margin: 16px 0">
      <el-col :span="6">
        <el-card>
          <div class="stat-card">
            <div class="stat-number">{{ stats.totalCustomers }}</div>
            <div class="stat-label">总顾客数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-card">
            <div class="stat-number">{{ stats.activeMembers }}</div>
            <div class="stat-label">活跃会员</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-card">
            <div class="stat-number">{{ stats.newCustomersThisMonth }}</div>
            <div class="stat-label">本月新增</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-card">
            <div class="stat-number">¥{{ stats.totalRevenue.toLocaleString() }}</div>
            <div class="stat-label">总收入</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索和筛选 -->
    <el-card style="margin: 16px 0">
      <el-form :model="filters" inline>
        <el-form-item label="搜索">
          <el-input
            v-model="filters.keyword"
            placeholder="顾客昵称、手机号"
            clearable
            style="width: 200px"
            @keyup.enter="loadCustomers"
          />
        </el-form-item>
        <el-form-item label="会员状态">
          <el-select v-model="filters.membershipStatus" placeholder="全部" clearable style="width: 120px">
            <el-option label="活跃会员" value="ACTIVE" />
            <el-option label="过期会员" value="EXPIRED" />
          </el-select>
        </el-form-item>
        <el-form-item label="注册时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadCustomers">搜索</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 顾客列表 -->
    <el-table v-loading="loading" :data="customers" style="width: 100%">
      <el-table-column prop="nickname" label="顾客" width="150">
        <template #default="{ row }">
          <div style="display: flex; align-items: center">
            <el-avatar :src="row.avatarUrl" :size="32" style="margin-right: 8px">
              {{ row.nickname?.charAt(0) || '客' }}
            </el-avatar>
            <div>
              <div>{{ row.nickname || '未设置昵称' }}</div>
              <div style="font-size: 12px; color: #909399">{{ row.phone || '未绑定手机' }}</div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="membership" label="会员状态" width="120">
        <template #default="{ row }">
          <el-tag v-if="row.membership" type="success">
            {{ row.membership.planName }}
          </el-tag>
          <el-tag v-else type="info">非会员</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="stats.totalOrders" label="订单数" width="80" />
      <el-table-column prop="stats.totalSpent" label="消费金额" width="100">
        <template #default="{ row }">
          ¥{{ row.stats.totalSpent.toLocaleString() }}
        </template>
      </el-table-column>
      <el-table-column prop="stats.totalPosts" label="动态数" width="80" />
      <el-table-column prop="createdAt" label="注册时间" width="160">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="最近订单" width="200">
        <template #default="{ row }">
          <div v-if="row.recentOrders.length > 0">
            <div v-for="order in row.recentOrders.slice(0, 2)" :key="order.id" style="font-size: 12px; margin: 2px 0">
              <el-tag :type="order.status === 'PAID' ? 'success' : 'warning'" size="small">
                ¥{{ order.totalAmount }} - {{ order.status }}
              </el-tag>
            </div>
          </div>
          <span v-else style="color: #909399; font-size: 12px">暂无订单</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="$router.push(`/customers/${row.id}`)">
            查看详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.pageSize"
      :total="pagination.total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      style="margin-top: 16px; justify-content: center"
      @size-change="loadCustomers"
      @current-change="loadCustomers"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * 顾客管理列表页面
 * 功能：展示顾客列表、统计数据、搜索筛选、查看详情等
 */
import { onMounted, reactive, ref, watch } from 'vue'
import api from '../../api/client'
import { ElMessage } from 'element-plus'

/**
 * 顾客信息接口定义
 * 包含顾客基本信息、会员状态、统计数据和最近订单
 */
interface Customer {
  id: string           // 顾客唯一标识
  nickname: string     // 顾客昵称
  phone: string        // 手机号码
  avatarUrl: string    // 头像URL
  createdAt: string    // 注册时间
  membership: {        // 会员信息（可能为空）
    planName: string   // 会员套餐名称
    status: string     // 会员状态
    endAt: string      // 会员到期时间
  } | null
  stats: {             // 顾客统计数据
    totalOrders: number    // 总订单数
    totalSpent: number     // 总消费金额
    totalPosts: number     // 发布动态数
    totalComments: number  // 评论数
  }
  recentOrders: Array<{  // 最近订单列表
    id: string           // 订单ID
    totalAmount: number  // 订单金额
    status: string       // 订单状态
    createdAt: string    // 订单创建时间
  }>
}

// 页面加载状态
const loading = ref(false)
// 顾客列表数据
const customers = ref<Customer[]>([])
// 日期范围选择器的值
const dateRange = ref<[string, string] | null>(null)

/**
 * 统计数据
 * 显示在页面顶部的统计卡片中
 */
const stats = reactive({
  totalCustomers: 0,        // 总顾客数
  activeMembers: 0,         // 活跃会员数
  newCustomersThisMonth: 0, // 本月新增顾客数
  totalRevenue: 0,          // 总收入
})

/**
 * 搜索筛选条件
 * 支持关键词、会员状态、注册时间等多维度筛选
 */
const filters = reactive({
  keyword: '',              // 搜索关键词（昵称、手机号）
  membershipStatus: '',     // 会员状态筛选
  registeredAfter: '',      // 注册开始时间
  registeredBefore: '',     // 注册结束时间
})

/**
 * 分页配置
 * 控制列表的分页显示
 */
const pagination = reactive({
  page: 1,        // 当前页码
  pageSize: 20,   // 每页显示数量
  total: 0,       // 总记录数
})

/**
 * 格式化日期显示
 * @param dateString ISO格式的日期字符串
 * @returns 本地化的日期字符串（不包含时间）
 */
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString()
}

/**
 * 加载统计数据
 * 获取顾客相关的统计信息，显示在页面顶部的统计卡片中
 * 包括总顾客数、活跃会员数、本月新增顾客数、总收入等
 */
async function loadStats() {
  try {
    const { data } = await api.get('/customers/stats/overview')
    Object.assign(stats, data.data) // 更新统计数据
  } catch (error) {
    console.error('加载统计数据失败:', error)
    // 统计数据加载失败不影响主要功能，只记录错误
  }
}

/**
 * 加载顾客列表数据
 * 根据当前的筛选条件和分页参数获取顾客列表
 * 支持关键词搜索、会员状态筛选、注册时间筛选等功能
 */
async function loadCustomers() {
  loading.value = true
  try {
    // 构建请求参数，包含筛选条件和分页信息
    const params = {
      ...filters,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }

    // 清理空值参数，避免发送无效的筛选条件
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === undefined) {
        delete params[key]
      }
    })

    // 调用API获取顾客列表
    const { data } = await api.get('/customers', { params })
    customers.value = data.data.items    // 更新顾客列表
    pagination.total = data.data.total   // 更新总记录数
  } catch (error) {
    console.error('加载顾客列表失败:', error)
    ElMessage.error('加载顾客列表失败')
  } finally {
    loading.value = false
  }
}

/**
 * 重置搜索筛选条件
 * 清空所有筛选条件并重新加载第一页数据
 */
function resetFilters() {
  filters.keyword = ''              // 清空关键词
  filters.membershipStatus = ''     // 清空会员状态筛选
  filters.registeredAfter = ''      // 清空注册开始时间
  filters.registeredBefore = ''     // 清空注册结束时间
  dateRange.value = null            // 清空日期范围选择器
  pagination.page = 1               // 重置到第一页
  loadCustomers()                   // 重新加载数据
}

/**
 * 监听日期范围变化
 * 当用户选择日期范围时，自动更新筛选条件中的时间参数
 */
watch(dateRange, (newRange) => {
  if (newRange) {
    // 设置注册时间筛选范围
    filters.registeredAfter = newRange[0]
    filters.registeredBefore = newRange[1]
  } else {
    // 清空时间筛选
    filters.registeredAfter = ''
    filters.registeredBefore = ''
  }
})

// 组件挂载时自动加载统计数据和顾客列表
onMounted(() => {
  loadStats()      // 加载统计数据
  loadCustomers()  // 加载顾客列表
})
</script>

<style scoped>
.stat-card {
  text-align: center;
  padding: 16px;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.el-pagination {
  display: flex;
}
</style>
