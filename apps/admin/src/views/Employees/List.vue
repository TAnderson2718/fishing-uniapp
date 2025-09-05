<template>
  <div style="padding: 16px">
    <el-page-header content="员工管理" />

    <!-- 搜索和筛选 -->
    <el-card style="margin: 16px 0">
      <el-form :model="filters" inline>
        <el-form-item label="搜索">
          <el-input
            v-model="filters.keyword"
            placeholder="员工姓名、编号、职位"
            clearable
            style="width: 200px"
            @keyup.enter="loadEmployees"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.active" placeholder="全部" clearable style="width: 120px">
            <el-option label="活跃" :value="true" />
            <el-option label="停用" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item label="职位">
          <el-input
            v-model="filters.title"
            placeholder="职位筛选"
            clearable
            style="width: 150px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadEmployees">搜索</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作按钮 -->
    <div style="margin: 16px 0">
      <el-button type="primary" @click="$router.push('/employees/create')">
        新增员工
      </el-button>
    </div>

    <!-- 员工列表 -->
    <el-table v-loading="loading" :data="employees" style="width: 100%">
      <el-table-column prop="employeeCode" label="员工编号" width="120" />
      <el-table-column prop="nickname" label="姓名" width="120">
        <template #default="{ row }">
          <div style="display: flex; align-items: center">
            <el-avatar :src="row.avatarUrl" :size="32" style="margin-right: 8px">
              {{ row.nickname?.charAt(0) || '员' }}
            </el-avatar>
            {{ row.nickname || '未设置' }}
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="username" label="用户名" width="120" />
      <el-table-column prop="title" label="职位" width="120">
        <template #default="{ row }">
          {{ row.title || '未设置' }}
        </template>
      </el-table-column>
      <el-table-column prop="phone" label="手机号" width="130">
        <template #default="{ row }">
          {{ row.phone || '未设置' }}
        </template>
      </el-table-column>
      <el-table-column prop="active" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.active ? 'success' : 'danger'">
            {{ row.active ? '活跃' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="160">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="$router.push(`/employees/${row.id}/edit`)">
            编辑
          </el-button>
          <el-button size="small" type="warning" @click="resetPassword(row)">
            重置密码
          </el-button>
          <el-button
            size="small"
            :type="row.active ? 'danger' : 'success'"
            @click="toggleStatus(row)"
          >
            {{ row.active ? '停用' : '启用' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.pageSize"
      :total="pagination.total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      style="margin-top: 16px; justify-content: center"
      @size-change="loadEmployees"
      @current-change="loadEmployees"
    />

    <!-- 重置密码对话框 -->
    <el-dialog v-model="resetPasswordVisible" title="重置密码" width="400px">
      <el-form :model="passwordForm" label-width="80px">
        <el-form-item label="员工">
          <span>{{ selectedEmployee?.nickname || selectedEmployee?.username }}</span>
        </el-form-item>
        <el-form-item label="新密码" required>
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="请输入新密码（至少6位）"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetPasswordVisible = false">取消</el-button>
        <el-button type="primary" :loading="resetting" @click="confirmResetPassword">
          确认重置
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 员工管理列表页面
 * 功能：展示员工列表、搜索筛选、状态管理、密码重置等
 */
import { onMounted, reactive, ref } from 'vue'
import api from '../../api/client'
import { ElMessage, ElMessageBox } from 'element-plus'

/**
 * 员工信息接口定义
 * 包含员工的基本信息和状态
 */
interface Employee {
  id: string           // 员工唯一标识
  username: string     // 登录用户名
  nickname: string     // 员工姓名/昵称
  phone: string        // 手机号码
  avatarUrl: string    // 头像URL
  employeeCode: string // 员工编号
  title: string        // 职位/岗位
  active: boolean      // 员工状态：true-活跃，false-停用
  createdAt: string    // 创建时间
  updatedAt: string    // 更新时间
}

// 页面加载状态
const loading = ref(false)
// 员工列表数据
const employees = ref<Employee[]>([])
// 重置密码对话框显示状态
const resetPasswordVisible = ref(false)
// 密码重置操作加载状态
const resetting = ref(false)
// 当前选中的员工（用于重置密码）
const selectedEmployee = ref<Employee | null>(null)

/**
 * 搜索筛选条件
 * 支持关键词、状态、职位等多维度筛选
 */
const filters = reactive({
  keyword: '',                              // 搜索关键词（姓名、编号、职位）
  active: undefined as boolean | undefined, // 员工状态筛选
  title: '',                               // 职位筛选
})

/**
 * 分页配置
 * 控制列表的分页显示
 */
const pagination = reactive({
  page: 1,        // 当前页码
  pageSize: 20,   // 每页显示数量
  total: 0,       // 总记录数
})

/**
 * 密码重置表单数据
 */
const passwordForm = reactive({
  newPassword: '', // 新密码
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
 * 加载员工列表数据
 * 根据当前的筛选条件和分页参数获取员工列表
 * 支持关键词搜索、状态筛选、职位筛选等功能
 */
async function loadEmployees() {
  loading.value = true
  try {
    // 构建请求参数，包含筛选条件和分页信息
    const params = {
      ...filters,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }

    // 清理空值参数，避免发送无效的筛选条件
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === undefined) {
        delete params[key]
      }
    })

    // 调用API获取员工列表
    const { data } = await api.get('/employees', { params })
    employees.value = data.data.items    // 更新员工列表
    pagination.total = data.data.total   // 更新总记录数
  } catch (error) {
    console.error('加载员工列表失败:', error)
    ElMessage.error('加载员工列表失败')
  } finally {
    loading.value = false
  }
}

/**
 * 重置搜索筛选条件
 * 清空所有筛选条件并重新加载第一页数据
 */
function resetFilters() {
  filters.keyword = ''      // 清空关键词
  filters.active = undefined // 清空状态筛选
  filters.title = ''        // 清空职位筛选
  pagination.page = 1       // 重置到第一页
  loadEmployees()           // 重新加载数据
}

/**
 * 打开重置密码对话框
 * @param employee 要重置密码的员工信息
 */
function resetPassword(employee: Employee) {
  selectedEmployee.value = employee    // 设置当前选中的员工
  passwordForm.newPassword = ''        // 清空密码输入框
  resetPasswordVisible.value = true    // 显示重置密码对话框
}

/**
 * 确认重置员工密码
 * 验证新密码格式并调用API进行密码重置
 */
async function confirmResetPassword() {
  // 验证密码长度
  if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
    ElMessage.error('密码至少6个字符')
    return
  }

  resetting.value = true
  try {
    // 调用重置密码API
    await api.post(`/employees/${selectedEmployee.value!.id}/reset-password`, {
      newPassword: passwordForm.newPassword,
    })
    ElMessage.success('密码重置成功')
    resetPasswordVisible.value = false  // 关闭对话框
  } catch (error) {
    console.error('重置密码失败:', error)
    ElMessage.error('重置密码失败')
  } finally {
    resetting.value = false
  }
}

/**
 * 切换员工状态（启用/停用）
 * @param employee 要操作的员工信息
 *
 * 业务逻辑：
 * - 活跃员工可以被停用（软删除）
 * - 停用员工可以被重新启用
 * - 操作前需要用户确认
 */
async function toggleStatus(employee: Employee) {
  const action = employee.active ? '停用' : '启用'
  try {
    // 确认操作
    await ElMessageBox.confirm(`确认${action}员工 ${employee.nickname || employee.username}？`, '确认操作')

    if (employee.active) {
      // 停用员工：使用DELETE请求进行软删除
      await api.delete(`/employees/${employee.id}`)
    } else {
      // 启用员工：使用PATCH请求更新状态
      await api.patch(`/employees/${employee.id}`, { active: true })
    }

    ElMessage.success(`${action}成功`)
    loadEmployees() // 重新加载列表以更新状态显示
  } catch (error) {
    // 用户取消操作时不显示错误信息
    if (error !== 'cancel') {
      console.error(`${action}员工失败:`, error)
      ElMessage.error(`${action}员工失败`)
    }
  }
}

// 组件挂载时自动加载员工列表数据
onMounted(() => {
  loadEmployees()
})
</script>

<style scoped>
.el-pagination {
  display: flex;
}
</style>
