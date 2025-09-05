<template>
  <div style="padding: 16px">
    <el-page-header content="新闻资讯管理" />

    <!-- 操作栏 -->
    <el-card style="margin: 16px 0">
      <el-row justify="space-between">
        <el-col :span="12">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索新闻标题..."
            style="width: 300px"
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="12" style="text-align: right">
          <el-button type="primary" @click="$router.push('/news/create')">
            <el-icon><Plus /></el-icon>
            新增新闻
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 新闻列表 -->
    <el-table :data="newsList" border v-loading="loading">
      <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
      
      <el-table-column prop="author" label="作者" width="120" />
      
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'PUBLISHED' ? 'success' : 'warning'">
            {{ row.status === 'PUBLISHED' ? '已发布' : '草稿' }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column prop="publishedAt" label="发布时间" width="180">
        <template #default="{ row }">
          {{ row.publishedAt ? formatDateTime(row.publishedAt) : '-' }}
        </template>
      </el-table-column>
      
      <el-table-column prop="createdAt" label="创建时间" width="180">
        <template #default="{ row }">
          {{ formatDateTime(row.createdAt) }}
        </template>
      </el-table-column>
      
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="viewNews(row)">查看</el-button>
          <el-button size="small" type="primary" @click="editNews(row)">编辑</el-button>
          <el-button 
            size="small" 
            :type="row.status === 'PUBLISHED' ? 'warning' : 'success'"
            @click="toggleStatus(row)"
          >
            {{ row.status === 'PUBLISHED' ? '下线' : '发布' }}
          </el-button>
          <el-button size="small" type="danger" @click="deleteNews(row)">删除</el-button>
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

    <!-- 查看新闻对话框 -->
    <el-dialog v-model="viewVisible" title="查看新闻" width="800px">
      <div v-if="selectedNews">
        <h3>{{ selectedNews.title }}</h3>
        <div style="margin: 16px 0; color: #666; font-size: 14px">
          作者：{{ selectedNews.author }} | 
          发布时间：{{ selectedNews.publishedAt ? formatDateTime(selectedNews.publishedAt) : '未发布' }}
        </div>
        <div v-html="selectedNews.content" style="line-height: 1.6"></div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import api from '../../api/client'

const router = useRouter()

interface NewsItem {
  id: string
  title: string
  content: string
  author: string
  status: 'DRAFT' | 'PUBLISHED'
  publishedAt?: string
  createdAt: string
  updatedAt: string
}

const newsList = ref<NewsItem[]>([])
const loading = ref(false)
const searchKeyword = ref('')
const viewVisible = ref(false)
const selectedNews = ref<NewsItem | null>(null)

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

async function loadNews() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize,
    }
    
    if (searchKeyword.value) {
      params.search = searchKeyword.value
    }

    const { data } = await api.get('/news', { params })
    newsList.value = data.data.items
    pagination.total = data.data.total
  } catch (error) {
    ElMessage.error('加载新闻列表失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  loadNews()
}

function handleSizeChange(size: number) {
  pagination.pageSize = size
  pagination.page = 1
  loadNews()
}

function handleCurrentChange(page: number) {
  pagination.page = page
  loadNews()
}

function viewNews(news: NewsItem) {
  selectedNews.value = news
  viewVisible.value = true
}

function editNews(news: NewsItem) {
  router.push(`/news/${news.id}/edit`)
}

async function toggleStatus(news: NewsItem) {
  try {
    const newStatus = news.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
    const action = newStatus === 'PUBLISHED' ? '发布' : '下线'
    
    await ElMessageBox.confirm(`确定要${action}这篇新闻吗？`, '确认操作')
    
    await api.patch(`/news/${news.id}/status`, { status: newStatus })
    ElMessage.success(`${action}成功`)
    loadNews()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

async function deleteNews(news: NewsItem) {
  try {
    await ElMessageBox.confirm('确定要删除这篇新闻吗？删除后无法恢复。', '确认删除', {
      type: 'warning'
    })
    
    await api.delete(`/news/${news.id}`)
    ElMessage.success('删除成功')
    loadNews()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN')
}

onMounted(loadNews)
</script>
