<template>
  <div style="padding: 16px">
    <el-page-header content="活动管理" />

    <div style="margin: 12px 0">
      <el-button type="primary" data-testid="btn-add-activity" @click="openDialog()">新增活动</el-button>
    </div>

    <el-table :data="items" border>
      <el-table-column prop="title" label="标题" />
      <el-table-column prop="normalPrice" label="原价(元)" />
      <el-table-column prop="memberPrice" label="会员价(元)" />
      <el-table-column label="状态">
        <template #default="{ row }">
          {{ getStatusText(row.status) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editing ? '编辑活动' : '新增活动'" width="600px">
      <el-form label-width="100px">
        <el-form-item label="标题">
          <el-input v-model="form.title" data-testid="input-activity-title" />
        </el-form-item>
        <el-form-item label="活动详情">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="5"
            maxlength="2000"
            show-word-limit
            placeholder="请输入活动详情描述..."
            data-testid="textarea-activity-description"
          />
        </el-form-item>
        <el-form-item label="封面图片">
          <div>
            <el-upload
              ref="uploadRef"
              action="/api/upload/image"
              :headers="uploadHeaders"
              :before-upload="beforeUpload"
              :on-success="handleUploadSuccess"
              :on-error="handleUploadError"
              :show-file-list="false"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              data-testid="upload-activity-cover"
            >
              <el-button type="primary" :loading="uploading">
                {{ uploading ? '上传中...' : '选择图片' }}
              </el-button>
            </el-upload>
            <div v-if="form.coverImageUrl" style="margin-top: 10px;">
              <img :src="form.coverImageUrl" style="width: 200px; height: 120px; object-fit: cover; border-radius: 4px;" />
              <div style="margin-top: 5px;">
                <el-button size="small" type="danger" @click="removeCoverImage">移除图片</el-button>
              </div>
            </div>
            <div style="font-size: 12px; color: #999; margin-top: 5px;">
              支持 JPG、PNG、WebP 格式，文件大小不超过 5MB
            </div>
          </div>
        </el-form-item>
        <el-form-item label="原价(元)">
          <el-input-number v-model="form.normalPrice" :min="0" data-testid="input-activity-normalPrice" />
        </el-form-item>
        <el-form-item label="会员价(元)">
          <el-input-number v-model="form.memberPrice" :min="0" data-testid="input-activity-memberPrice" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 200px" data-testid="select-activity-status">
            <el-option label="草稿" value="DRAFT" />
            <el-option label="已发布" value="PUBLISHED" />
          </el-select>
        </el-form-item>
        <el-form-item label="活动类型">
          <el-select v-model="form.timeType" style="width: 200px" data-testid="select-activity-timeType">
            <el-option label="全天模式" value="FULL_DAY" />
            <el-option label="限时模式" value="TIMED" />
            <el-option label="支持两种模式" value="BOTH" />
          </el-select>
        </el-form-item>
        <el-form-item label="限时时长(小时)" v-if="form.timeType === 'TIMED' || form.timeType === 'BOTH'">
          <el-input-number v-model="form.durationHours" :min="1" :max="24" data-testid="input-activity-durationHours" />
        </el-form-item>
        <el-form-item label="升级差价(元)" v-if="form.timeType === 'BOTH'">
          <el-input-number v-model="form.upgradePrice" :min="0" data-testid="input-activity-upgradePrice" />
          <div style="font-size: 12px; color: #999; margin-top: 4px;">
            从限时模式升级到全天模式需要补的差价
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" @click="save" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../../api/client'

interface Activity {
  id?: string
  title: string
  description?: string
  coverImageUrl?: string
  normalPrice: number
  memberPrice: number
  status: 'DRAFT'|'PUBLISHED'
  timeType: 'FULL_DAY'|'TIMED'|'BOTH'
  durationHours?: number
  upgradePrice?: number
}

const items = ref<Activity[]>([])
const dialogVisible = ref(false)
const editing = ref(false)
const saving = ref(false)
const uploading = ref(false)
const uploadRef = ref()

// 上传配置 - 使用员工端的token
const uploadHeaders = computed(() => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return { 'Authorization': `Bearer ${localStorage.getItem('staff_token') || ''}` }
  }
  return {}
})

const form = reactive<Activity>({
  title: '',
  description: '',
  coverImageUrl: '',
  normalPrice: 0,
  memberPrice: 0,
  status: 'DRAFT',
  timeType: 'FULL_DAY',
  durationHours: 3,
  upgradePrice: 0
})

async function load() {
  const { data } = await api.get('/activities')
  items.value = data
}

function openDialog(row?: Activity) {
  editing.value = !!row
  dialogVisible.value = true
  if (row) {
    // 确保数字字段是正确的类型
    Object.assign(form, {
      ...row,
      description: row.description || '',
      coverImageUrl: row.coverImageUrl || '',
      normalPrice: Number(row.normalPrice) || 0,
      memberPrice: Number(row.memberPrice) || 0,
      durationHours: Number(row.durationHours) || 3,
      upgradePrice: Number(row.upgradePrice) || 0,
      timeType: row.timeType || 'FULL_DAY'
    })
  } else {
    Object.assign(form, {
      title: '',
      description: '',
      coverImageUrl: '',
      normalPrice: 0,
      memberPrice: 0,
      status: 'DRAFT',
      timeType: 'FULL_DAY',
      durationHours: 3,
      upgradePrice: 0
    })
  }
}

// 上传相关函数
function beforeUpload(file: File) {
  const isValidType = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isValidType) {
    ElMessage.error('只能上传 JPG、PNG、WebP 格式的图片!')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB!')
    return false
  }

  uploading.value = true
  return true
}

function handleUploadSuccess(response: any) {
  uploading.value = false
  if (response.success && response.data?.url) {
    form.coverImageUrl = response.data.url
    ElMessage.success('图片上传成功!')
  } else {
    ElMessage.error('图片上传失败!')
  }
}

function handleUploadError() {
  uploading.value = false
  ElMessage.error('图片上传失败!')
}

function removeCoverImage() {
  form.coverImageUrl = ''
}

async function save() {
  saving.value = true
  try {
    if (editing.value && form.id) {
      await api.patch(`/activities/${form.id}`, form)
    } else {
      await api.post('/activities', form)
    }
    dialogVisible.value = false
    await load()
  } finally { saving.value = false }
}

function getStatusText(status: string) {
  const statusMap = {
    'DRAFT': '草稿',
    'PUBLISHED': '已发布'
  }
  return statusMap[status] || status
}

onMounted(load)
</script>