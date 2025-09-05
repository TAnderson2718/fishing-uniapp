import request from '@/utils/request'

export const activitiesApi = {
  // 获取活动列表
  list() {
    return request({
      url: '/activities',
      method: 'get'
    })
  },

  // 获取已发布的活动列表
  getPublished() {
    return request({
      url: '/activities/published',
      method: 'get'
    })
  },

  // 获取单个活动
  get(id) {
    return request({
      url: `/activities/${id}`,
      method: 'get'
    })
  },

  // 创建活动
  create(data) {
    return request({
      url: '/activities',
      method: 'post',
      data
    })
  },

  // 更新活动
  update(id, data) {
    return request({
      url: `/activities/${id}`,
      method: 'patch',
      data
    })
  },

  // 删除活动
  delete(id) {
    return request({
      url: `/activities/${id}`,
      method: 'delete'
    })
  },

  // 更新活动排序
  updateSortOrder(activities) {
    return request({
      url: '/activities/sort',
      method: 'put',
      data: { activities }
    })
  },

  // 活动场次相关
  sessions: {
    // 获取活动场次列表
    list(activityId) {
      return request({
        url: `/activities/${activityId}/sessions`,
        method: 'get'
      })
    },

    // 创建活动场次
    create(activityId, data) {
      return request({
        url: `/activities/${activityId}/sessions`,
        method: 'post',
        data
      })
    },

    // 更新活动场次
    update(sessionId, data) {
      return request({
        url: `/activities/sessions/${sessionId}`,
        method: 'patch',
        data
      })
    },

    // 删除活动场次
    delete(sessionId) {
      return request({
        url: `/activities/sessions/${sessionId}`,
        method: 'delete'
      })
    }
  }
}

export default activitiesApi
