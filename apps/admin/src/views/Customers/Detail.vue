<template>
  <div style="padding: 16px">
    <el-page-header content="顾客详情" @back="$router.push('/customers')" />

    <div v-loading="loading">
      <!-- 基本信息 -->
      <el-row :gutter="16" style="margin-top: 16px">
        <el-col :span="8">
          <el-card>
            <template #header>
              <span>基本信息</span>
              <el-button style="float: right" size="small" @click="editVisible = true">编辑</el-button>
            </template>
            <div v-if="customer" class="customer-info">
              <div class="avatar-section">
                <el-avatar :src="customer.avatarUrl" :size="80">
                  {{ customer.nickname?.charAt(0) || '客' }}
                </el-avatar>
                <div style="margin-left: 16px">
                  <h3>{{ customer.nickname || '未设置昵称' }}</h3>
                  <p style="color: #909399; margin: 4px 0">{{ customer.phone || '未绑定手机' }}</p>
                  <p style="color: #909399; margin: 4px 0">注册时间：{{ formatDate(customer.createdAt) }}</p>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="16">
          <el-card>
            <template #header>
              <span>统计信息</span>
            </template>
            <el-row v-if="customer" :gutter="16">
              <el-col :span="6">
                <div class="stat-item">
                  <div class="stat-value">{{ customer.stats.totalOrders }}</div>
                  <div class="stat-label">总订单数</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-item">
                  <div class="stat-value">¥{{ customer.stats.totalSpent.toLocaleString() }}</div>
                  <div class="stat-label">总消费金额</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-item">
                  <div class="stat-value">{{ customer.stats.totalPosts }}</div>
                  <div class="stat-label">发布动态</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-item">
                  <div class="stat-value">{{ customer.stats.membershipDays }}</div>
                  <div class="stat-label">会员剩余天数</div>
                </div>
              </el-col>
            </el-row>
          </el-card>
        </el-col>
      </el-row>

      <!-- 会员信息 -->
      <el-card style="margin-top: 16px">
        <template #header>
          <span>会员信息</span>
        </template>
        <div v-if="customer">
          <div v-if="customer.activeMembership" class="membership-info">
            <el-tag type="success" size="large">{{ customer.activeMembership.planName }}</el-tag>
            <span style="margin-left: 16px">到期时间：{{ formatDate(customer.activeMembership.endAt) }}</span>
          </div>
          <div v-else>
            <el-tag type="info">非会员用户</el-tag>
          </div>
          
          <!-- 会员历史 -->
          <el-divider content-position="left">会员历史</el-divider>
          <el-table :data="customer.memberships" style="width: 100%">
            <el-table-column prop="planName" label="会员方案" />
            <el-table-column prop="status" label="状态">
              <template #default="{ row }">
                <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'">
                  {{ row.status === 'ACTIVE' ? '活跃' : '已过期' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="startAt" label="开始时间">
              <template #default="{ row }">
                {{ formatDate(row.startAt) }}
              </template>
            </el-table-column>
            <el-table-column prop="endAt" label="结束时间">
              <template #default="{ row }">
                {{ formatDate(row.endAt) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-card>

      <!-- 订单历史 -->
      <el-card style="margin-top: 16px">
        <template #header>
          <span>订单历史</span>
        </template>
        <el-table v-if="customer" :data="customer.orders.slice(0, 10)" style="width: 100%">
          <el-table-column prop="id" label="订单号" width="200" />
          <el-table-column prop="totalAmount" label="金额">
            <template #default="{ row }">
              ¥{{ row.totalAmount }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态">
            <template #default="{ row }">
              <el-tag :type="getOrderStatusType(row.status)">
                {{ getOrderStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="订单项目">
            <template #default="{ row }">
              <div v-for="item in row.items.slice(0, 2)" :key="item.id" style="font-size: 12px">
                {{ item.activityTitle || item.memberPlanName }} × {{ item.quantity }}
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="下单时间">
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 社交动态 -->
      <el-row :gutter="16" style="margin-top: 16px">
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>最近动态</span>
            </template>
            <div v-if="customer && customer.posts.length > 0">
              <div v-for="post in customer.posts.slice(0, 5)" :key="post.id" class="post-item">
                <div class="post-content">{{ post.content.substring(0, 100) }}...</div>
                <div class="post-meta">
                  <el-tag :type="getPostStatusType(post.status)" size="small">
                    {{ getPostStatusText(post.status) }}
                  </el-tag>
                  <span style="margin-left: 8px; font-size: 12px; color: #909399">
                    {{ formatDate(post.createdAt) }}
                  </span>
                  <span style="margin-left: 8px; font-size: 12px; color: #909399">
                    👍 {{ post.likesCount }} 💬 {{ post.commentsCount }}
                  </span>
                </div>
              </div>
            </div>
            <div v-else style="text-align: center; color: #909399; padding: 20px">
              暂无动态
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>最近评论</span>
            </template>
            <div v-if="customer && customer.comments.length > 0">
              <div v-for="comment in customer.comments.slice(0, 5)" :key="comment.id" class="comment-item">
                <div class="comment-content">{{ comment.content }}</div>
                <div class="comment-meta">
                  <span style="font-size: 12px; color: #909399">
                    回复动态：{{ comment.post.content.substring(0, 30) }}...
                  </span>
                  <span style="margin-left: 8px; font-size: 12px; color: #909399">
                    {{ formatDate(comment.createdAt) }}
                  </span>
                </div>
              </div>
            </div>
            <div v-else style="text-align: center; color: #909399; padding: 20px">
              暂无评论
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 编辑对话框 -->
    <el-dialog v-model="editVisible" title="编辑顾客信息" width="500px">
      <el-form v-if="customer" :model="editForm" label-width="80px">
        <el-form-item label="昵称">
          <el-input v-model="editForm.nickname" placeholder="顾客昵称" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="editForm.phone" placeholder="手机号码" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="editForm.notes"
            type="textarea"
            :rows="3"
            placeholder="管理员备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="updating" @click="updateCustomer">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 顾客详情页面
 * 功能：展示顾客的详细信息，包括基本信息、统计数据、会员信息、订单历史、社交动态等
 */
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api/client'
import { ElMessage } from 'element-plus'

/**
 * 顾客详细信息接口定义
 * 包含顾客的完整信息和关联数据
 */
interface Customer {
  id: string           // 顾客唯一标识
  nickname: string     // 顾客昵称
  phone: string        // 手机号码
  avatarUrl: string    // 头像URL
  createdAt: string    // 注册时间
  updatedAt: string    // 最后更新时间
  memberships: Array<{ // 会员历史记录
    id: string         // 会员记录ID
    planName: string   // 会员套餐名称
    status: string     // 会员状态
    startAt: string    // 开始时间
    endAt: string      // 结束时间
    createdAt: string  // 创建时间
  }>
  activeMembership: {  // 当前活跃的会员信息
    planName: string   // 会员套餐名称
    status: string     // 会员状态
    endAt: string      // 到期时间
  } | null
  orders: Array<{      // 订单历史
    id: string         // 订单ID
    totalAmount: number // 订单总金额
    status: string     // 订单状态
    createdAt: string  // 下单时间
    items: Array<{     // 订单项目
      id: string           // 项目ID
      quantity: number     // 数量
      price: number        // 单价
      activityTitle?: string    // 活动标题（如果是活动订单）
      memberPlanName?: string   // 会员套餐名称（如果是会员订单）
    }>
  }>
  posts: Array<{       // 发布的动态
    id: string         // 动态ID
    content: string    // 动态内容
    status: string     // 审核状态
    likesCount: number // 点赞数
    commentsCount: number // 评论数
    createdAt: string  // 发布时间
  }>
  comments: Array<{    // 发布的评论
    id: string         // 评论ID
    content: string    // 评论内容
    status: string     // 审核状态
    createdAt: string  // 评论时间
    post: { id: string; content: string } // 被评论的动态
  }>
  stats: {             // 统计数据
    totalOrders: number    // 总订单数
    totalSpent: number     // 总消费金额
    totalPosts: number     // 发布动态数
    totalComments: number  // 评论数
    membershipDays: number // 会员剩余天数
  }
}

const route = useRoute()
const router = useRouter()
// 页面加载状态
const loading = ref(false)
// 编辑对话框显示状态
const editVisible = ref(false)
// 更新操作加载状态
const updating = ref(false)
// 当前顾客详细信息
const customer = ref<Customer | null>(null)

/**
 * 编辑表单数据
 * 用于修改顾客的基本信息
 */
const editForm = reactive({
  nickname: '', // 顾客昵称
  phone: '',    // 手机号码
  notes: '',    // 管理员备注
})

/**
 * 格式化日期时间显示
 * @param dateString ISO格式的日期字符串
 * @returns 本地化的日期时间字符串
 */
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString()
}

/**
 * 获取订单状态对应的标签类型
 * @param status 订单状态
 * @returns Element Plus标签类型
 */
function getOrderStatusType(status: string) {
  const statusMap = {
    PENDING: 'warning',   // 待支付 - 警告色
    PAID: 'success',      // 已支付 - 成功色
    CANCELLED: 'danger',  // 已取消 - 危险色
    REFUNDED: 'info',     // 已退款 - 信息色
  }
  return statusMap[status] || 'info'
}

/**
 * 获取订单状态的中文显示文本
 * @param status 订单状态
 * @returns 中文状态文本
 */
function getOrderStatusText(status: string) {
  const statusMap = {
    PENDING: '待支付',
    PAID: '已支付',
    CANCELLED: '已取消',
    REFUNDED: '已退款',
  }
  return statusMap[status] || status
}

/**
 * 获取动态状态对应的标签类型
 * @param status 动态审核状态
 * @returns Element Plus标签类型
 */
function getPostStatusType(status: string) {
  const statusMap = {
    PENDING: 'warning',   // 待审核 - 警告色
    APPROVED: 'success',  // 已通过 - 成功色
    REJECTED: 'danger',   // 已拒绝 - 危险色
  }
  return statusMap[status] || 'info'
}

/**
 * 获取动态状态的中文显示文本
 * @param status 动态审核状态
 * @returns 中文状态文本
 */
function getPostStatusText(status: string) {
  const statusMap = {
    PENDING: '待审核',
    APPROVED: '已通过',
    REJECTED: '已拒绝',
  }
  return statusMap[status] || status
}

/**
 * 加载顾客详细信息
 * 从URL参数获取顾客ID，调用API获取顾客详情并填充编辑表单
 *
 * 流程：
 * 1. 验证URL中的顾客ID
 * 2. 调用API获取顾客详情（包含所有关联数据）
 * 3. 将顾客信息填充到编辑表单中
 * 4. 处理加载失败的情况
 */
async function loadCustomer() {
  const customerId = route.params.id as string
  if (!customerId) {
    ElMessage.error('顾客ID无效')
    router.push('/customers')
    return
  }

  loading.value = true
  try {
    const { data } = await api.get(`/customers/${customerId}`)
    customer.value = data.data

    // 将顾客信息填充到编辑表单中
    editForm.nickname = customer.value.nickname || ''
    editForm.phone = customer.value.phone || ''
    editForm.notes = '' // 备注字段暂时为空，可根据需要从API获取
  } catch (error) {
    console.error('加载顾客信息失败:', error)
    ElMessage.error('加载顾客信息失败')
    router.push('/customers') // 加载失败时返回顾客列表页面
  } finally {
    loading.value = false
  }
}

/**
 * 更新顾客信息
 * 调用API更新顾客的基本信息
 *
 * 流程：
 * 1. 调用更新顾客API
 * 2. 成功后关闭编辑对话框
 * 3. 重新加载顾客数据以显示最新信息
 */
async function updateCustomer() {
  if (!customer.value) return

  updating.value = true
  try {
    // 调用更新顾客API
    await api.patch(`/customers/${customer.value.id}`, editForm)
    ElMessage.success('顾客信息更新成功')
    editVisible.value = false // 关闭编辑对话框
    loadCustomer() // 重新加载数据以显示最新信息
  } catch (error: any) {
    console.error('更新顾客信息失败:', error)
    // 显示具体的错误信息
    const message = error.response?.data?.message || '更新顾客信息失败'
    ElMessage.error(message)
  } finally {
    updating.value = false
  }
}

// 组件挂载时自动加载顾客详细信息
onMounted(() => {
  loadCustomer()
})
</script>

<style scoped>
.customer-info {
  padding: 16px 0;
}

.avatar-section {
  display: flex;
  align-items: center;
}

.stat-item {
  text-align: center;
  padding: 16px;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.membership-info {
  padding: 16px 0;
}

.post-item, .comment-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.post-item:last-child, .comment-item:last-child {
  border-bottom: none;
}

.post-content, .comment-content {
  margin-bottom: 8px;
  line-height: 1.4;
}

.post-meta, .comment-meta {
  display: flex;
  align-items: center;
}
</style>
