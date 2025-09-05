<template>
  <div>
    <el-page-header content="渔友圈管理" />
    
    <!-- 统计卡片 -->
    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="6">
        <el-card>
          <div class="stat-card">
            <div class="stat-number">{{ stats.pending }}</div>
            <div class="stat-label">待审核</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-card">
            <div class="stat-number">{{ stats.approved }}</div>
            <div class="stat-label">已通过</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-card">
            <div class="stat-number">{{ stats.rejected }}</div>
            <div class="stat-label">已拒绝</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-card">
            <div class="stat-number">{{ stats.total }}</div>
            <div class="stat-label">总动态</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 筛选和操作栏 -->
    <el-card style="margin-top: 16px">
      <div style="display: flex; justify-content: space-between; align-items: center">
        <div style="display: flex; gap: 16px; align-items: center">
          <el-select v-model="filters.status" placeholder="选择状态" style="width: 120px" @change="loadPosts">
            <el-option label="全部" value="" />
            <el-option label="待审核" value="PENDING" />
            <el-option label="已通过" value="APPROVED" />
            <el-option label="已拒绝" value="REJECTED" />
          </el-select>
          <el-input 
            v-model="filters.search" 
            placeholder="搜索内容..." 
            style="width: 200px"
            @keyup.enter="loadPosts"
          />
          <el-button @click="loadPosts">搜索</el-button>
        </div>
        <el-button @click="loadPosts" :loading="loading">刷新</el-button>
      </div>
    </el-card>

    <!-- 动态列表 -->
    <el-card style="margin-top: 16px">
      <el-table :data="posts" v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="用户" width="120">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; gap: 8px">
              <el-avatar :size="32" :src="row.user?.avatarUrl" />
              <span>{{ row.user?.nickname || '钓友' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="内容" min-width="300">
          <template #default="{ row }">
            <div class="post-content">
              <p>{{ row.content }}</p>
              <div v-if="row.images && row.images.length > 0" class="post-images">
                <el-image 
                  v-for="image in row.images.slice(0, 3)" 
                  :key="image.id"
                  :src="image.url" 
                  style="width: 60px; height: 60px; margin-right: 8px; border-radius: 4px"
                  fit="cover"
                  :preview-src-list="row.images.map(img => img.url)"
                />
                <span v-if="row.images.length > 3" class="more-images">
                  +{{ row.images.length - 3 }}
                </span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="互动" width="100">
          <template #default="{ row }">
            <div class="interaction-stats">
              <div>❤️ {{ row._count?.likes || 0 }}</div>
              <div>💬 {{ row._count?.comments || 0 }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag 
              :type="getStatusType(row.status)"
              size="small"
            >
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发布时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <div style="display: flex; gap: 8px">
              <el-button 
                v-if="row.status === 'PENDING'" 
                type="success" 
                size="small"
                @click="approvePost(row)"
                :loading="row.approving"
              >
                通过
              </el-button>
              <el-button 
                v-if="row.status === 'PENDING'" 
                type="danger" 
                size="small"
                @click="rejectPost(row)"
                :loading="row.rejecting"
              >
                拒绝
              </el-button>
              <el-button 
                size="small"
                @click="viewPost(row)"
              >
                查看
              </el-button>
              <el-popconfirm
                title="确定要删除这条动态吗？"
                @confirm="deletePost(row)"
              >
                <template #reference>
                  <el-button 
                    type="danger" 
                    size="small"
                    :loading="row.deleting"
                  >
                    删除
                  </el-button>
                </template>
              </el-popconfirm>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div style="margin-top: 16px; display: flex; justify-content: center">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadPosts"
          @current-change="loadPosts"
        />
      </div>
    </el-card>

    <!-- 动态详情弹窗 -->
    <el-dialog v-model="detailVisible" title="动态详情" width="600px">
      <div v-if="selectedPost">
        <div class="detail-header">
          <el-avatar :size="40" :src="selectedPost.user?.avatarUrl" />
          <div style="margin-left: 12px">
            <div style="font-weight: 600">{{ selectedPost.user?.nickname || '钓友' }}</div>
            <div style="color: #999; font-size: 12px">{{ formatTime(selectedPost.createdAt) }}</div>
          </div>
        </div>
        <div style="margin-top: 16px">
          <p style="line-height: 1.6">{{ selectedPost.content }}</p>
          <div v-if="selectedPost.images && selectedPost.images.length > 0" style="margin-top: 12px">
            <el-image 
              v-for="image in selectedPost.images" 
              :key="image.id"
              :src="image.url" 
              style="width: 100px; height: 100px; margin-right: 8px; margin-bottom: 8px; border-radius: 4px"
              fit="cover"
              :preview-src-list="selectedPost.images.map(img => img.url)"
            />
          </div>
        </div>
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #eee">
          <div style="display: flex; gap: 16px; color: #666">
            <span>❤️ {{ selectedPost._count?.likes || 0 }} 点赞</span>
            <span>💬 {{ selectedPost._count?.comments || 0 }} 评论</span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../../api/client'

// 数据状态
const loading = ref(false)
const posts = ref([])
const stats = reactive({
  pending: 0,
  approved: 0,
  rejected: 0,
  total: 0
})

// 筛选条件
const filters = reactive({
  status: '',
  search: ''
})

// 分页
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

// 详情弹窗
const detailVisible = ref(false)
const selectedPost = ref(null)

// 加载动态列表
async function loadPosts() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      limit: pagination.limit
    }
    
    if (filters.status) {
      params.status = filters.status
    }
    
    if (filters.search) {
      params.search = filters.search
    }

    const { data } = await api.get('/posts/admin', { params })
    posts.value = data.items || []
    pagination.total = data.total || 0
    
    // 加载统计数据
    await loadStats()
  } catch (error) {
    console.error('加载动态失败:', error)
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

// 加载统计数据
async function loadStats() {
  try {
    const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
      api.get('/posts/admin', { params: { status: 'PENDING', limit: 1 } }),
      api.get('/posts/admin', { params: { status: 'APPROVED', limit: 1 } }),
      api.get('/posts/admin', { params: { status: 'REJECTED', limit: 1 } })
    ])

    stats.pending = pendingRes.data.total || 0
    stats.approved = approvedRes.data.total || 0
    stats.rejected = rejectedRes.data.total || 0
    stats.total = stats.pending + stats.approved + stats.rejected
  } catch (error) {
    console.error('加载统计失败:', error)
  }
}

// 审核通过
async function approvePost(post: any) {
  post.approving = true
  try {
    await api.patch(`/posts/${post.id}/status`, { status: 'APPROVED' })
    ElMessage.success('审核通过')
    post.status = 'APPROVED'
    await loadStats()
  } catch (error) {
    console.error('审核失败:', error)
    ElMessage.error('操作失败')
  } finally {
    post.approving = false
  }
}

// 审核拒绝
async function rejectPost(post: any) {
  try {
    await ElMessageBox.prompt('请输入拒绝理由', '审核拒绝', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPlaceholder: '请输入拒绝理由...'
    })

    post.rejecting = true
    await api.patch(`/posts/${post.id}/status`, { status: 'REJECTED' })
    ElMessage.success('已拒绝')
    post.status = 'REJECTED'
    await loadStats()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('拒绝失败:', error)
      ElMessage.error('操作失败')
    }
  } finally {
    post.rejecting = false
  }
}

// 删除动态
async function deletePost(post: any) {
  post.deleting = true
  try {
    await api.delete(`/posts/${post.id}`)
    ElMessage.success('删除成功')
    await loadPosts()
  } catch (error) {
    console.error('删除失败:', error)
    ElMessage.error('删除失败')
  } finally {
    post.deleting = false
  }
}

// 查看动态详情
function viewPost(post: any) {
  selectedPost.value = post
  detailVisible.value = true
}

// 获取状态类型
function getStatusType(status: string) {
  const typeMap = {
    'PENDING': 'warning',
    'APPROVED': 'success',
    'REJECTED': 'danger'
  }
  return typeMap[status] || 'info'
}

// 获取状态文本
function getStatusText(status: string) {
  const textMap = {
    'PENDING': '待审核',
    'APPROVED': '已通过',
    'REJECTED': '已拒绝'
  }
  return textMap[status] || '未知'
}

// 格式化时间
function formatTime(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

onMounted(() => {
  loadPosts()
})
</script>

<style scoped>
.stat-card {
  text-align: center;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #409eff;
}

.stat-label {
  margin-top: 4px;
  color: #666;
  font-size: 14px;
}

.post-content p {
  margin: 0;
  line-height: 1.6;
  max-height: 60px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.post-images {
  margin-top: 8px;
  display: flex;
  align-items: center;
}

.more-images {
  color: #999;
  font-size: 12px;
}

.interaction-stats {
  font-size: 12px;
  color: #666;
}

.interaction-stats div {
  margin-bottom: 4px;
}

.detail-header {
  display: flex;
  align-items: center;
}
</style>