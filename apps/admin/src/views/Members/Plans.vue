<template>
  <div style="padding: 16px">
    <el-page-header content="会员卡方案" />

    <div style="margin: 12px 0">
      <el-button type="primary" @click="openDialog()">新增方案</el-button>
    </div>

    <el-table :data="plans" border>
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="price" label="价格(元)" />
      <el-table-column prop="durationDays" label="有效天数" />
      <el-table-column prop="isActive" label="启用">
        <template #default="{ row }">
          <el-tag :type="row.isActive ? 'success' : 'info'">{{ row.isActive ? '是' : '否' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editing ? '编辑方案' : '新增方案'" width="480px">
      <el-form label-width="100px">
        <el-form-item label="名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="价格(元)">
          <el-input-number v-model="form.price" :min="0" :step="1" />
        </el-form-item>
        <el-form-item label="有效天数">
          <el-input-number v-model="form.durationDays" :min="1" :step="1" />
        </el-form-item>
        <el-form-item label="权益">
          <el-input v-model="form.benefits" type="textarea" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.isActive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" @click="savePlan" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import api from '../../api/client'

interface Plan {
  id?: string
  name: string
  price: number
  durationDays: number
  benefits?: string
  isActive: boolean
}

const plans = ref<Plan[]>([])
const dialogVisible = ref(false)
const editing = ref(false)
const saving = ref(false)
const form = reactive<Plan>({ name: '', price: 0, durationDays: 30, benefits: '', isActive: true })

async function load() {
  const { data } = await api.get('/members/plans')
  plans.value = data
}

function openDialog(row?: Plan) {
  editing.value = !!row
  dialogVisible.value = true
  if (row) Object.assign(form, row)
  else Object.assign(form, { name: '', price: 0, durationDays: 30, benefits: '', isActive: true })
}

async function savePlan() {
  saving.value = true
  try {
    if (editing.value && form.id) {
      await api.patch(`/members/plans/${form.id}`, form)
    } else {
      await api.post('/members/plans', form)
    }
    dialogVisible.value = false
    await load()
  } finally { saving.value = false }
}

onMounted(load)
</script>

