<template>
  <div style="padding: 16px">
    <el-page-header content="编辑员工" @back="$router.push('/employees')" />

    <el-card v-loading="loading" style="margin-top: 16px; max-width: 600px">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        @submit.prevent="handleSubmit"
      >
        <el-form-item label="用户名">
          <el-input :value="employee?.username" disabled />
          <div class="form-tip">用户名创建后不可修改</div>
        </el-form-item>

        <el-divider content-position="left">基本信息</el-divider>

        <el-form-item label="姓名" prop="nickname">
          <el-input
            v-model="form.nickname"
            placeholder="员工真实姓名"
            maxlength="20"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <el-input
            v-model="form.phone"
            placeholder="11位手机号码"
            maxlength="11"
          />
        </el-form-item>

        <el-form-item label="员工编号" prop="employeeCode">
          <el-input
            v-model="form.employeeCode"
            placeholder="可选，用于内部管理"
            maxlength="20"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="职位" prop="title">
          <el-input
            v-model="form.title"
            placeholder="如：前台接待、票务员等"
            maxlength="30"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="状态" prop="active">
          <el-radio-group v-model="form.active">
            <el-radio :label="true">活跃</el-radio>
            <el-radio :label="false">停用</el-radio>
          </el-radio-group>
          <div class="form-tip">停用状态的员工无法登录系统</div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            保存修改
          </el-button>
          <el-button @click="$router.push('/employees')">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 员工信息卡片 -->
    <el-card v-if="employee" style="margin-top: 16px; max-width: 600px">
      <template #header>
        <span>员工信息</span>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="创建时间">
          {{ formatDate(employee.createdAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="最后更新">
          {{ formatDate(employee.updatedAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="员工ID">
          {{ employee.id }}
        </el-descriptions-item>
        <el-descriptions-item label="角色">
          <el-tag type="info">员工</el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script setup lang="ts">
/**
 * 员工编辑页面
 * 功能：编辑现有员工的基本信息（不包括用户名和密码）
 */
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api/client'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

/**
 * 员工信息接口定义
 * 与列表页面保持一致的数据结构
 */
interface Employee {
  id: string           // 员工唯一标识
  username: string     // 登录用户名（不可编辑）
  nickname: string     // 员工姓名/昵称
  phone: string        // 手机号码
  avatarUrl: string    // 头像URL
  employeeCode: string // 员工编号
  title: string        // 职位/岗位
  active: boolean      // 员工状态
  createdAt: string    // 创建时间
  updatedAt: string    // 更新时间
}

const route = useRoute()
const router = useRouter()
// 表单引用，用于表单验证
const formRef = ref<FormInstance>()
// 页面加载状态
const loading = ref(false)
// 提交状态，防止重复提交
const submitting = ref(false)
// 当前编辑的员工信息
const employee = ref<Employee | null>(null)

/**
 * 员工编辑表单数据
 * 只包含可编辑的字段，用户名不可修改
 */
const form = reactive({
  nickname: '',        // 员工姓名
  phone: '',          // 手机号码
  employeeCode: '',   // 员工编号
  title: '',          // 职位
  active: true,       // 员工状态
})

/**
 * 手机号码验证器
 * 验证手机号码格式（11位，1开头）
 */
const validatePhone = (rule: any, value: any, callback: any) => {
  if (value && !/^1[3-9]\d{9}$/.test(value)) {
    callback(new Error('请输入正确的手机号码'))
  } else {
    callback()
  }
}

/**
 * 表单验证规则配置
 * 定义可编辑字段的验证规则
 */
const rules: FormRules = {
  nickname: [
    { max: 20, message: '姓名不能超过20个字符', trigger: 'blur' },
  ],
  phone: [
    { validator: validatePhone, trigger: 'blur' },
  ],
  employeeCode: [
    { max: 20, message: '员工编号不能超过20个字符', trigger: 'blur' },
  ],
  title: [
    { max: 30, message: '职位不能超过30个字符', trigger: 'blur' },
  ],
}

/**
 * 格式化日期时间显示
 * @param dateString ISO格式的日期字符串
 * @returns 本地化的日期时间字符串
 */
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString()
}

/**
 * 加载员工详细信息
 * 从URL参数获取员工ID，调用API获取员工详情并填充表单
 *
 * 流程：
 * 1. 验证URL中的员工ID
 * 2. 调用API获取员工详情
 * 3. 将员工信息填充到编辑表单中
 * 4. 处理加载失败的情况
 */
async function loadEmployee() {
  const employeeId = route.params.id as string
  if (!employeeId) {
    ElMessage.error('员工ID无效')
    router.push('/employees')
    return
  }

  loading.value = true
  try {
    const { data } = await api.get(`/employees/${employeeId}`)
    employee.value = data.data

    // 将员工信息填充到表单中，处理空值情况
    form.nickname = employee.value.nickname || ''
    form.phone = employee.value.phone || ''
    form.employeeCode = employee.value.employeeCode || ''
    form.title = employee.value.title || ''
    form.active = employee.value.active
  } catch (error) {
    console.error('加载员工信息失败:', error)
    ElMessage.error('加载员工信息失败')
    router.push('/employees') // 加载失败时返回列表页面
  } finally {
    loading.value = false
  }
}

/**
 * 处理表单提交
 * 验证表单数据并调用API更新员工信息
 *
 * 流程：
 * 1. 验证表单数据
 * 2. 调用更新员工API
 * 3. 成功后跳转到员工列表页面
 */
async function handleSubmit() {
  if (!formRef.value || !employee.value) return

  // 验证表单数据
  try {
    await formRef.value.validate()
  } catch (error) {
    return // 验证失败，停止提交
  }

  submitting.value = true
  try {
    // 调用更新员工API，只提交可编辑的字段
    const { data } = await api.patch(`/employees/${employee.value.id}`, form)

    ElMessage.success('员工信息更新成功')
    router.push('/employees') // 跳转到员工列表页面
  } catch (error: any) {
    console.error('更新员工信息失败:', error)
    // 显示具体的错误信息
    const message = error.response?.data?.message || '更新员工信息失败'
    ElMessage.error(message)
  } finally {
    submitting.value = false
  }
}

// 组件挂载时自动加载员工信息
onMounted(() => {
  loadEmployee()
})
</script>

<style scoped>
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.el-divider {
  margin: 24px 0 16px 0;
}
</style>
