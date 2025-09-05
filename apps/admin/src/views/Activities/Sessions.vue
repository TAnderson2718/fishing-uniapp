<template>
  <div style="padding: 16px">
    <el-page-header :content="`场次管理 - ` + activityTitle" @back="$router.push('/activities')" />

    <div style="margin: 12px 0">
      <el-button type="primary" data-testid="btn-add-session" @click="openDialog()">新增场次</el-button>
    </div>

    <el-table :data="items" border>
      <el-table-column prop="startAt" label="开始时间">
        <template #default="{ row }">{{ format(row.startAt) }}</template>
      </el-table-column>
      <el-table-column prop="endAt" label="结束时间">
        <template #default="{ row }">{{ format(row.endAt) }}</template>
      </el-table-column>
      <el-table-column prop="capacity" label="容量" />
      <el-table-column label="操作" width="240">
        <template #default="{ row }">
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
          <el-popconfirm title="确定删除该场次吗？" @confirm="remove(row)">
            <template #reference>
              <el-button size="small" type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editing ? '编辑场次' : '新增场次'" width="520px">
      <el-form label-width="100px">
        <el-form-item label="开始时间">
          <el-date-picker v-model="form.startAt" type="datetime" value-format="YYYY-MM-DDTHH:mm:ssZ" placeholder="选择时间" />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker v-model="form.endAt" type="datetime" value-format="YYYY-MM-DDTHH:mm:ssZ" placeholder="选择时间" />
        </el-form-item>
        <el-form-item label="容量">
          <el-input-number v-model="form.capacity" :min="1" />
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
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '../../api/client'

const route = useRoute()
const activityId = route.params.id as string

interface SessionItem {
  id?: string
  startAt: string
  endAt: string
  capacity: number
}

const activityTitle = ref('')
const items = ref<SessionItem[]>([])
const dialogVisible = ref(false)
const editing = ref(false)
const saving = ref(false)
const form = reactive<SessionItem>({ startAt: '', endAt: '', capacity: 10 })

function format(iso: string) { return new Date(iso).toLocaleString() }

async function load() {
  const { data: activity } = await api.get(`/activities/${activityId}`)
  activityTitle.value = activity.title
  const { data } = await api.get(`/activities/${activityId}/sessions`)
  items.value = data
}

function openDialog(row?: SessionItem) {
  editing.value = !!row
  dialogVisible.value = true
  if (row) Object.assign(form, row)
  else Object.assign(form, { startAt: '', endAt: '', capacity: 10 })
}

async function save() {
  saving.value = true
  try {
    if (editing.value && form.id) {
      await api.patch(`/activities/sessions/${form.id}`, {
        startAt: form.startAt || undefined,
        endAt: form.endAt || undefined,
        capacity: form.capacity || undefined,
      })
    } else {
      await api.post(`/activities/${activityId}/sessions`, form)
    }
    dialogVisible.value = false
    await load()
  } finally { saving.value = false }
}

async function remove(row: SessionItem) {
  await api.delete(`/activities/sessions/${row.id}`)
  await load()
}

onMounted(load)
</script>

