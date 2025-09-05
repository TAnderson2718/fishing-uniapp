<template>
  <div class="activity-sort">
    <div class="header">
      <h2>活动排序管理</h2>
      <p class="description">拖拽活动卡片或修改排序值来调整活动在前端的显示顺序</p>
    </div>

    <div class="sort-container">
      <div class="activity-list">
        <div
          v-for="(activity, index) in activities"
          :key="activity.id"
          class="activity-item"
          :class="{ 'dragging': dragIndex === index }"
          draggable="true"
          @dragstart="handleDragStart(index, $event)"
          @dragover="handleDragOver($event)"
          @drop="handleDrop(index, $event)"
          @dragend="handleDragEnd"
        >
          <div class="drag-handle">
            <i class="el-icon-rank"></i>
          </div>
          
          <div class="activity-info">
            <div class="activity-title">{{ activity.title }}</div>
            <div class="activity-meta">
              <span class="status" :class="activity.status.toLowerCase()">
                {{ activity.status === 'PUBLISHED' ? '已发布' : '草稿' }}
              </span>
              <span class="time-type">
                {{ activity.timeType === 'TIMED' ? `限时${activity.durationHours}小时` : '全天模式' }}
              </span>
              <span class="price">
                会员价: ¥{{ activity.memberPrice }}
              </span>
            </div>
          </div>

          <div class="sort-input">
            <el-input-number
              v-model="activity.sortOrder"
              :min="0"
              :max="999"
              size="small"
              @change="markAsChanged(activity.id)"
            />
          </div>
        </div>
      </div>

      <div class="actions">
        <el-button 
          type="primary" 
          :loading="saving"
          :disabled="!hasChanges"
          @click="saveSortOrder"
        >
          保存排序
        </el-button>
        <el-button @click="resetChanges" :disabled="!hasChanges">
          重置
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../../api/client'

interface Activity {
  id: string
  title: string
  status: string
  timeType: string
  durationHours?: number
  memberPrice: number
  sortOrder: number
}

const activities = ref<Activity[]>([])
const originalActivities = ref<Activity[]>([])
const saving = ref(false)
const dragIndex = ref(-1)
const changedIds = reactive(new Set<string>())

const hasChanges = computed(() => changedIds.size > 0)

// 加载活动列表
const loadActivities = async () => {
  try {
    const response = await api.get('/activities')
    activities.value = response.data || []
    originalActivities.value = JSON.parse(JSON.stringify(activities.value))
    changedIds.clear()
  } catch (error) {
    ElMessage.error('加载活动列表失败')
    console.error(error)
  }
}

// 标记为已修改
const markAsChanged = (id: string) => {
  changedIds.add(id)
}

// 拖拽开始
const handleDragStart = (index: number, event: DragEvent) => {
  dragIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/html', index.toString())
  }
}

// 拖拽悬停
const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

// 拖拽放下
const handleDrop = (dropIndex: number, event: DragEvent) => {
  event.preventDefault()
  if (!event.dataTransfer) return
  
  const draggedIndex = parseInt(event.dataTransfer.getData('text/html'))
  
  if (draggedIndex !== dropIndex) {
    // 重新排列数组
    const draggedItem = activities.value[draggedIndex]
    activities.value.splice(draggedIndex, 1)
    activities.value.splice(dropIndex, 0, draggedItem)
    
    // 重新分配排序值
    activities.value.forEach((activity, index) => {
      const newSortOrder = (index + 1) * 10
      if (activity.sortOrder !== newSortOrder) {
        activity.sortOrder = newSortOrder
        markAsChanged(activity.id)
      }
    })
  }
}

// 拖拽结束
const handleDragEnd = () => {
  dragIndex.value = -1
}

// 保存排序
const saveSortOrder = async () => {
  if (!hasChanges.value) return

  saving.value = true
  try {
    const sortData = activities.value.map(activity => ({
      id: activity.id,
      sortOrder: activity.sortOrder
    }))

    await api.patch('/activities/sort-order', { activities: sortData })
    
    ElMessage.success('排序保存成功')
    changedIds.clear()
    originalActivities.value = JSON.parse(JSON.stringify(activities.value))
  } catch (error) {
    ElMessage.error('保存排序失败')
    console.error(error)
  } finally {
    saving.value = false
  }
}

// 重置修改
const resetChanges = () => {
  activities.value = JSON.parse(JSON.stringify(originalActivities.value))
  changedIds.clear()
}

onMounted(() => {
  loadActivities()
})
</script>

<style scoped>
.activity-sort {
  padding: 20px;
}

.header {
  margin-bottom: 24px;
}

.header h2 {
  margin: 0 0 8px 0;
  color: #303133;
}

.description {
  color: #606266;
  margin: 0;
}

.sort-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.activity-list {
  margin-bottom: 20px;
}

.activity-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  margin-bottom: 12px;
  background: white;
  cursor: move;
  transition: all 0.3s;
}

.activity-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.activity-item.dragging {
  opacity: 0.5;
  transform: rotate(5deg);
}

.drag-handle {
  margin-right: 12px;
  color: #909399;
  font-size: 18px;
}

.activity-info {
  flex: 1;
}

.activity-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
}

.activity-meta {
  display: flex;
  gap: 12px;
  font-size: 14px;
}

.status {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status.published {
  background: #f0f9ff;
  color: #1890ff;
}

.status.draft {
  background: #f6f6f6;
  color: #666;
}

.time-type {
  color: #606266;
}

.price {
  color: #f56c6c;
  font-weight: 500;
}

.sort-input {
  margin-left: 16px;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}
</style>