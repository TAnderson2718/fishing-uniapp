<template>
  <div style="padding: 16px">
    <el-page-header content="新增员工" @back="$router.push('/employees')" />

    <el-card style="margin-top: 16px; max-width: 600px">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        @submit.prevent="handleSubmit"
      >
        <el-form-item label="用户名" prop="username" required>
          <el-input
            v-model="form.username"
            placeholder="用于登录的用户名"
            maxlength="20"
            show-word-limit
          />
          <div class="form-tip">用于员工登录系统，创建后不可修改</div>
        </el-form-item>

        <el-form-item label="密码" prop="password" required>
          <el-input
            v-model="form.password"
            type="password"
            placeholder="至少6个字符"
            show-password
            maxlength="50"
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword" required>
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="再次输入密码"
            show-password
            maxlength="50"
          />
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
            创建员工
          </el-button>
          <el-button @click="$router.push('/employees')">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
/**
 * 员工创建页面
 * 功能：创建新员工账号，包含登录信息和基本信息设置
 */
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../api/client'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

const router = useRouter()
// 表单引用，用于表单验证
const formRef = ref<FormInstance>()
// 提交状态，防止重复提交
const submitting = ref(false)

/**
 * 员工创建表单数据
 * 包含登录信息和基本信息
 */
const form = reactive({
  username: '',        // 登录用户名（必填，创建后不可修改）
  password: '',        // 登录密码（必填，至少6位）
  confirmPassword: '', // 确认密码（必填，用于验证）
  nickname: '',        // 员工姓名（可选）
  phone: '',          // 手机号码（可选，需符合格式）
  employeeCode: '',   // 员工编号（可选，用于内部管理）
  title: '',          // 职位/岗位（可选）
  active: true,       // 员工状态（默认活跃）
})

/**
 * 确认密码验证器
 * 确保两次输入的密码一致
 */
const validateConfirmPassword = (rule: any, value: any, callback: any) => {
  if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

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
 * 定义各字段的验证规则和错误提示
 */
const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度为2-20个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 50, message: '密码长度为6-50个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
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
 * 处理表单提交
 * 验证表单数据并调用API创建员工
 *
 * 流程：
 * 1. 验证表单数据
 * 2. 移除确认密码字段（不需要提交到后端）
 * 3. 调用创建员工API
 * 4. 成功后跳转到员工列表页面
 */
async function handleSubmit() {
  if (!formRef.value) return

  // 验证表单数据
  try {
    await formRef.value.validate()
  } catch (error) {
    return // 验证失败，停止提交
  }

  submitting.value = true
  try {
    // 移除确认密码字段，准备提交数据
    const { confirmPassword, ...submitData } = form
    const { data } = await api.post('/employees', submitData)

    ElMessage.success('员工创建成功')
    router.push('/employees') // 跳转到员工列表页面
  } catch (error: any) {
    console.error('创建员工失败:', error)
    // 显示具体的错误信息，如用户名重复等
    const message = error.response?.data?.message || '创建员工失败'
    ElMessage.error(message)
  } finally {
    submitting.value = false
  }
}
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
