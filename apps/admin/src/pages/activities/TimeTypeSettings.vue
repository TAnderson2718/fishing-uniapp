<template>
  <div class="time-type-settings">
    <div class="page-header">
      <h2>活动时间类型设置</h2>
      <p class="page-description">配置活动的时间模式和价格策略</p>
    </div>

    <div class="settings-form">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="活动名称" prop="title">
          <el-input v-model="form.title" placeholder="请输入活动名称" />
        </el-form-item>

        <el-form-item label="活动描述" prop="description">
          <el-input 
            v-model="form.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入活动描述" 
          />
        </el-form-item>

        <el-form-item label="时间类型" prop="timeType">
          <el-radio-group v-model="form.timeType" @change="handleTimeTypeChange">
            <el-radio label="FULL_DAY">
              <div class="radio-content">
                <div class="radio-title">全天模式</div>
                <div class="radio-desc">固定价格，无时间限制</div>
              </div>
            </el-radio>
            <el-radio label="TIMED">
              <div class="radio-content">
                <div class="radio-title">限时模式</div>
                <div class="radio-desc">按小时计费，可设置具体时长</div>
              </div>
            </el-radio>
            <el-radio label="BOTH">
              <div class="radio-content">
                <div class="radio-title">混合模式</div>
                <div class="radio-desc">支持限时和全天两种模式，用户可升级</div>
              </div>
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item 
          label="活动时长" 
          prop="durationHours" 
          v-if="form.timeType === 'TIMED'"
        >
          <el-input-number 
            v-model="form.durationHours" 
            :min="1" 
            :max="24" 
            placeholder="请输入小时数"
          />
          <span class="input-suffix">小时</span>
        </el-form-item>

        <el-form-item label="普通价格" prop="normalPrice">
          <el-input-number 
            v-model="form.normalPrice" 
            :min="0" 
            :precision="2"
            placeholder="请输入普通价格"
          />
          <span class="input-suffix">元</span>
        </el-form-item>

        <el-form-item label="会员价格" prop="memberPrice">
          <el-input-number 
            v-model="form.memberPrice" 
            :min="0" 
            :precision="2"
            placeholder="请输入会员价格"
          />
          <span class="input-suffix">元</span>
        </el-form-item>

        <el-form-item
          label="升级差价"
          prop="upgradePrice"
          v-if="form.timeType === 'TIMED' || form.timeType === 'BOTH'"
        >
          <el-input-number
            v-model="form.upgradePrice"
            :min="0"
            :precision="2"
            placeholder="请输入升级差价"
          />
          <span class="input-suffix">元</span>
          <div class="form-tip">
            用户从限时模式升级到全天模式需要补的差价。
            如不设置，系统将自动计算差价（全天价格 - 限时价格）
          </div>
        </el-form-item>

        <el-form-item label="活动地址" prop="address">
          <el-input v-model="form.address" placeholder="请输入活动地址" />
        </el-form-item>

        <el-form-item label="活动状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="DRAFT">草稿</el-radio>
            <el-radio label="PUBLISHED">已发布</el-radio>
            <el-radio label="ARCHIVED">已归档</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="loading">
            {{ isEdit ? '更新活动' : '创建活动' }}
          </el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button @click="$router.go(-1)">返回</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 价格预览 -->
    <div class="price-preview" v-if="form.timeType">
      <h3>价格预览</h3>
      <div class="preview-content">
        <div class="price-item">
          <span class="label">模式：</span>
          <span class="value">{{ form.timeType === 'FULL_DAY' ? '全天模式' : '限时模式' }}</span>
        </div>
        <div class="price-item" v-if="form.timeType === 'TIMED'">
          <span class="label">时长：</span>
          <span class="value">{{ form.durationHours }}小时</span>
        </div>
        <div class="price-item">
          <span class="label">普通价格：</span>
          <span class="value price">¥{{ form.normalPrice }}</span>
        </div>
        <div class="price-item">
          <span class="label">会员价格：</span>
          <span class="value price member">¥{{ form.memberPrice }}</span>
        </div>
        <div class="price-item" v-if="form.timeType === 'TIMED' && form.overtimePrice">
          <span class="label">续时价格：</span>
          <span class="value price overtime">¥{{ form.overtimePrice }}/小时</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TimeTypeSettings',
  data() {
    return {
      loading: false,
      isEdit: false,
      activityId: null,
      form: {
        title: '',
        description: '',
        timeType: 'FULL_DAY',
        durationHours: 3,
        normalPrice: 0,
        memberPrice: 0,
        overtimePrice: 0,
        address: '',
        status: 'DRAFT'
      },
      rules: {
        title: [
          { required: true, message: '请输入活动名称', trigger: 'blur' }
        ],
        timeType: [
          { required: true, message: '请选择时间类型', trigger: 'change' }
        ],
        durationHours: [
          { required: true, message: '请输入活动时长', trigger: 'blur' }
        ],
        normalPrice: [
          { required: true, message: '请输入普通价格', trigger: 'blur' }
        ],
        memberPrice: [
          { required: true, message: '请输入会员价格', trigger: 'blur' }
        ]
      }
    }
  },
  mounted() {
    this.activityId = this.$route.params.id
    if (this.activityId) {
      this.isEdit = true
      this.loadActivity()
    }
  },
  methods: {
    async loadActivity() {
      try {
        this.loading = true
        const response = await this.$http.get(`/activities/${this.activityId}`)
        
        if (response.data) {
          const activity = response.data
          this.form = {
            title: activity.title || '',
            description: activity.description || '',
            timeType: activity.timeType || 'FULL_DAY',
            durationHours: activity.durationHours || 3,
            normalPrice: parseFloat(activity.normalPrice) || 0,
            memberPrice: parseFloat(activity.memberPrice) || 0,
            overtimePrice: parseFloat(activity.overtimePrice) || 0,
            address: activity.address || '',
            status: activity.status || 'DRAFT'
          }
        }
      } catch (error) {
        this.$message.error('加载活动信息失败')
        console.error('加载活动失败:', error)
      } finally {
        this.loading = false
      }
    },

    handleTimeTypeChange(value) {
      if (value === 'FULL_DAY') {
        this.form.durationHours = null
        this.form.overtimePrice = 0
      } else {
        this.form.durationHours = this.form.durationHours || 3
      }
    },

    async handleSubmit() {
      try {
        await this.$refs.formRef.validate()
        this.loading = true

        const data = { ...this.form }
        if (data.timeType === 'FULL_DAY') {
          data.durationHours = null
          data.overtimePrice = null
        }

        let response
        if (this.isEdit) {
          response = await this.$http.put(`/activities/${this.activityId}`, data)
        } else {
          response = await this.$http.post('/activities', data)
        }

        this.$message.success(this.isEdit ? '活动更新成功' : '活动创建成功')
        this.$router.push('/activities')
      } catch (error) {
        if (error.message) {
          return // 表单验证错误
        }
        this.$message.error(this.isEdit ? '活动更新失败' : '活动创建失败')
        console.error('提交失败:', error)
      } finally {
        this.loading = false
      }
    },

    handleReset() {
      this.$refs.formRef.resetFields()
    }
  }
}
</script>

<style scoped>
.time-type-settings {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  color: #1f2937;
  font-size: 24px;
  font-weight: 600;
}

.page-description {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.settings-form {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.radio-content {
  margin-left: 8px;
}

.radio-title {
  font-weight: 500;
  color: #1f2937;
}

.radio-desc {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

.input-suffix {
  margin-left: 8px;
  color: #6b7280;
  font-size: 14px;
}

.form-tip {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.price-preview {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.price-preview h3 {
  margin: 0 0 16px 0;
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
}

.preview-content {
  display: grid;
  gap: 12px;
}

.price-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}

.price-item:last-child {
  border-bottom: none;
}

.label {
  color: #6b7280;
  font-size: 14px;
}

.value {
  font-weight: 500;
  color: #1f2937;
}

.value.price {
  font-size: 16px;
  font-weight: 600;
}

.value.price.member {
  color: #059669;
}

.value.price.overtime {
  color: #dc2626;
}

:deep(.el-radio) {
  display: block;
  margin-bottom: 16px;
  margin-right: 0;
}

:deep(.el-radio__label) {
  padding-left: 8px;
}
</style>
