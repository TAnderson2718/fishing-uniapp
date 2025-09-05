<template>
  <div style="padding: 16px">
    <el-page-header content="新增新闻" @back="$router.back()" />

    <el-card style="margin-top: 16px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="新闻标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入新闻标题" maxlength="100" show-word-limit />
        </el-form-item>

        <el-form-item label="作者" prop="author">
          <el-input v-model="form.author" placeholder="请输入作者姓名" style="width: 200px" />
        </el-form-item>

        <el-form-item label="新闻内容" prop="content">
          <div style="width: 100%">
            <div ref="editorRef" style="height: 400px; border: 1px solid #ddd"></div>
          </div>
        </el-form-item>

        <el-form-item label="发布状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="DRAFT">保存为草稿</el-radio>
            <el-radio label="PUBLISHED">立即发布</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            {{ form.status === 'PUBLISHED' ? '发布新闻' : '保存草稿' }}
          </el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import api from '../../api/client'

const router = useRouter()
const formRef = ref()
const editorRef = ref()
const submitting = ref(false)

// 简单的富文本编辑器实现（可以后续替换为更专业的编辑器）
let editor: any = null

const form = reactive({
  title: '',
  author: '',
  content: '',
  status: 'DRAFT' as 'DRAFT' | 'PUBLISHED'
})

const rules = {
  title: [
    { required: true, message: '请输入新闻标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  author: [
    { required: true, message: '请输入作者姓名', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入新闻内容', trigger: 'blur' }
  ]
}

function initEditor() {
  // 简单的富文本编辑器实现
  const editorElement = editorRef.value
  if (editorElement) {
    editorElement.contentEditable = true
    editorElement.style.padding = '12px'
    editorElement.style.minHeight = '350px'
    editorElement.style.outline = 'none'
    editorElement.innerHTML = '<p>请输入新闻内容...</p>'
    
    // 添加工具栏
    const toolbar = document.createElement('div')
    toolbar.style.borderBottom = '1px solid #ddd'
    toolbar.style.padding = '8px'
    toolbar.style.backgroundColor = '#f5f5f5'
    
    const boldBtn = document.createElement('button')
    boldBtn.innerHTML = '粗体'
    boldBtn.style.marginRight = '8px'
    boldBtn.onclick = () => document.execCommand('bold')
    
    const italicBtn = document.createElement('button')
    italicBtn.innerHTML = '斜体'
    italicBtn.style.marginRight = '8px'
    italicBtn.onclick = () => document.execCommand('italic')
    
    const underlineBtn = document.createElement('button')
    underlineBtn.innerHTML = '下划线'
    underlineBtn.onclick = () => document.execCommand('underline')
    
    toolbar.appendChild(boldBtn)
    toolbar.appendChild(italicBtn)
    toolbar.appendChild(underlineBtn)
    
    editorElement.parentNode?.insertBefore(toolbar, editorElement)
    
    // 监听内容变化
    editorElement.addEventListener('input', () => {
      form.content = editorElement.innerHTML
    })
    
    // 清空初始提示文本
    editorElement.addEventListener('focus', () => {
      if (editorElement.innerHTML === '<p>请输入新闻内容...</p>') {
        editorElement.innerHTML = ''
      }
    })
  }
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
    
    // 获取编辑器内容
    if (editorRef.value) {
      form.content = editorRef.value.innerHTML
    }
    
    if (!form.content || form.content.trim() === '') {
      ElMessage.error('请输入新闻内容')
      return
    }
    
    submitting.value = true
    
    const submitData = {
      ...form,
      publishedAt: form.status === 'PUBLISHED' ? new Date().toISOString() : null
    }
    
    await api.post('/news', submitData)
    
    ElMessage.success(form.status === 'PUBLISHED' ? '新闻发布成功' : '草稿保存成功')
    router.push('/news')
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  initEditor()
})
</script>

<style scoped>
:deep(.el-form-item__content) {
  width: 100%;
}
</style>
