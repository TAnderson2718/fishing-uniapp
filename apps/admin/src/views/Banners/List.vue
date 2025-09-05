<template>
  <div style="padding: 16px">
    <el-page-header content="轮播图管理" />

    <!-- 操作栏 -->
    <el-card style="margin: 16px 0">
      <el-row justify="space-between">
        <el-col :span="12">
          <el-button type="primary" @click="showCreateDialog = true">
            <el-icon><Plus /></el-icon>
            新增轮播图
          </el-button>
        </el-col>
        <el-col :span="12" style="text-align: right">
          <el-button @click="loadBanners">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 轮播图列表 -->
    <el-table :data="bannerList" border v-loading="loading">
      <el-table-column label="预览" width="120">
        <template #default="{ row }">
          <el-image
            :src="row.imageUrl"
            style="width: 80px; height: 45px"
            fit="cover"
            :preview-src-list="[row.imageUrl]"
            preview-teleported
          />
        </template>
      </el-table-column>
      
      <el-table-column prop="title" label="标题" min-width="150" show-overflow-tooltip />
      
      <el-table-column prop="linkUrl" label="链接地址" min-width="200" show-overflow-tooltip />
      
      <el-table-column prop="sortOrder" label="排序" width="80" />
      
      <el-table-column prop="isActive" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.isActive ? 'success' : 'danger'">
            {{ row.isActive ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column prop="createdAt" label="创建时间" width="180">
        <template #default="{ row }">
          {{ formatDateTime(row.createdAt) }}
        </template>
      </el-table-column>
      
      <el-table-column label="操作" width="250" fixed="right">
        <template #default="{ row, $index }">
          <el-button size="small" @click="editBanner(row)">编辑</el-button>
          <el-button 
            size="small" 
            :type="row.isActive ? 'warning' : 'success'"
            @click="toggleStatus(row)"
          >
            {{ row.isActive ? '禁用' : '启用' }}
          </el-button>
          <el-button 
            size="small" 
            :disabled="$index === 0"
            @click="moveUp(row, $index)"
          >
            上移
          </el-button>
          <el-button 
            size="small" 
            :disabled="$index === bannerList.length - 1"
            @click="moveDown(row, $index)"
          >
            下移
          </el-button>
          <el-button size="small" type="danger" @click="deleteBanner(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑轮播图对话框 -->
    <el-dialog 
      v-model="showCreateDialog" 
      :title="editingBanner ? '编辑轮播图' : '新增轮播图'" 
      width="600px"
    >
      <el-form :model="bannerForm" :rules="bannerRules" ref="bannerFormRef" label-width="100px">
        <el-form-item label="轮播图片" prop="imageUrl">
          <el-upload
            :action="uploadUrl"
            :headers="uploadHeaders"
            :show-file-list="false"
            :on-success="handleUploadSuccess"
            :before-upload="beforeUpload"
            accept="image/*"
          >
            <img v-if="bannerForm.imageUrl" :src="bannerForm.imageUrl" style="width: 200px; height: 112px; object-fit: cover; border: 1px solid #ddd" />
            <el-icon v-else style="font-size: 28px; color: #8c939d; width: 200px; height: 112px; border: 1px dashed #d9d9d9; display: flex; align-items: center; justify-content: center">
              <Plus />
            </el-icon>
          </el-upload>
          <div style="color: #999; font-size: 12px; margin-top: 8px">
            建议尺寸：750x420px，支持 JPG、PNG 格式，文件大小不超过 2MB
          </div>
        </el-form-item>

        <el-form-item label="标题" prop="title">
          <el-input v-model="bannerForm.title" placeholder="请输入轮播图标题" maxlength="50" show-word-limit />
        </el-form-item>

        <el-form-item label="链接地址" prop="linkUrl">
          <el-input v-model="bannerForm.linkUrl" placeholder="请输入点击跳转的链接地址（可选）" />
        </el-form-item>

        <el-form-item label="状态" prop="isActive">
          <el-radio-group v-model="bannerForm.isActive">
            <el-radio :label="true">启用</el-radio>
            <el-radio :label="false">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ editingBanner ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import api from '../../api/client'

interface Banner {
  id: string
  title: string
  imageUrl: string
  linkUrl?: string
  sortOrder: number
  isActive: boolean
  createdAt: string
}

const bannerList = ref<Banner[]>([])
const loading = ref(false)
const showCreateDialog = ref(false)
const editingBanner = ref<Banner | null>(null)
const bannerFormRef = ref()
const submitting = ref(false)

const uploadUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/upload/image`
const uploadHeaders = {
  Authorization: `Bearer ${localStorage.getItem('admin_token')}`
}

const bannerForm = reactive({
  title: '',
  imageUrl: '',
  linkUrl: '',
  isActive: true
})

const bannerRules = {
  title: [
    { required: true, message: '请输入轮播图标题', trigger: 'blur' }
  ],
  imageUrl: [
    { required: true, message: '请上传轮播图片', trigger: 'change' }
  ]
}

async function loadBanners() {
  loading.value = true
  try {
    const { data } = await api.get('/banners/admin')
    bannerList.value = data.sort((a: Banner, b: Banner) => a.sortOrder - b.sortOrder)
  } catch (error) {
    ElMessage.error('加载轮播图列表失败')
  } finally {
    loading.value = false
  }
}

function editBanner(banner: Banner) {
  editingBanner.value = banner
  bannerForm.title = banner.title
  bannerForm.imageUrl = banner.imageUrl
  bannerForm.linkUrl = banner.linkUrl || ''
  bannerForm.isActive = banner.isActive
  showCreateDialog.value = true
}

function resetForm() {
  bannerForm.title = ''
  bannerForm.imageUrl = ''
  bannerForm.linkUrl = ''
  bannerForm.isActive = true
  editingBanner.value = null
}

function beforeUpload(file: File) {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}

function handleUploadSuccess(response: any) {
  if (response.url) {
    bannerForm.imageUrl = response.url
    ElMessage.success('图片上传成功')
  } else {
    ElMessage.error('图片上传失败')
  }
}

async function handleSubmit() {
  try {
    await bannerFormRef.value.validate()
    
    submitting.value = true
    
    if (editingBanner.value) {
      await api.patch(`/banners/${editingBanner.value.id}`, bannerForm)
      ElMessage.success('更新成功')
    } else {
      await api.post('/banners', bannerForm)
      ElMessage.success('创建成功')
    }
    
    showCreateDialog.value = false
    resetForm()
    loadBanners()
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

async function toggleStatus(banner: Banner) {
  try {
    await api.patch(`/banners/${banner.id}/toggle`)
    ElMessage.success('状态更新成功')
    loadBanners()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

async function moveUp(banner: Banner, index: number) {
  if (index === 0) return
  
  try {
    const prevBanner = bannerList.value[index - 1]
    await api.patch(`/banners/${banner.id}/sort`, { 
      targetSortOrder: prevBanner.sortOrder 
    })
    loadBanners()
  } catch (error) {
    ElMessage.error('移动失败')
  }
}

async function moveDown(banner: Banner, index: number) {
  if (index === bannerList.value.length - 1) return
  
  try {
    const nextBanner = bannerList.value[index + 1]
    await api.patch(`/banners/${banner.id}/sort`, { 
      targetSortOrder: nextBanner.sortOrder 
    })
    loadBanners()
  } catch (error) {
    ElMessage.error('移动失败')
  }
}

async function deleteBanner(banner: Banner) {
  try {
    await ElMessageBox.confirm('确定要删除这个轮播图吗？', '确认删除', {
      type: 'warning'
    })
    
    await api.delete(`/banners/${banner.id}`)
    ElMessage.success('删除成功')
    loadBanners()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN')
}

onMounted(loadBanners)
</script>
