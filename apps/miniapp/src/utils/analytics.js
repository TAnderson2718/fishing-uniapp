/**
 * 监控数据分析工具
 * @description 完善监控数据分析和报告，建立数据驱动的优化机制
 */

/**
 * 分析配置
 */
const ANALYTICS_CONFIG = {
  // 分析周期
  ANALYSIS_PERIODS: {
    REAL_TIME: 5 * 60 * 1000,      // 5分钟
    SHORT_TERM: 60 * 60 * 1000,    // 1小时
    MEDIUM_TERM: 24 * 60 * 60 * 1000, // 1天
    LONG_TERM: 7 * 24 * 60 * 60 * 1000 // 7天
  },
  
  // 性能基准
  PERFORMANCE_BENCHMARKS: {
    API_RESPONSE_TIME: {
      EXCELLENT: 200,    // 优秀: <200ms
      GOOD: 500,         // 良好: 200-500ms
      ACCEPTABLE: 1000,  // 可接受: 500-1000ms
      POOR: 2000         // 差: 1000-2000ms
      // >2000ms 为很差
    },
    CACHE_HIT_RATE: {
      EXCELLENT: 0.9,    // 优秀: >90%
      GOOD: 0.8,         // 良好: 80-90%
      ACCEPTABLE: 0.7,   // 可接受: 70-80%
      POOR: 0.6          // 差: 60-70%
      // <60% 为很差
    },
    ERROR_RATE: {
      EXCELLENT: 0.01,   // 优秀: <1%
      GOOD: 0.02,        // 良好: 1-2%
      ACCEPTABLE: 0.05,  // 可接受: 2-5%
      POOR: 0.1          // 差: 5-10%
      // >10% 为很差
    }
  },
  
  // 趋势分析阈值
  TREND_THRESHOLDS: {
    SIGNIFICANT_CHANGE: 0.2,  // 20%变化视为显著
    ALERT_CHANGE: 0.5,        // 50%变化触发告警
    CRITICAL_CHANGE: 1.0      // 100%变化为严重
  }
}

/**
 * 数据分析器
 */
export class DataAnalyzer {
  constructor() {
    this.analysisHistory = []
    this.trends = new Map()
    this.insights = []
  }

  /**
   * 执行综合分析
   */
  async performAnalysis(monitorData, cacheData, period = ANALYTICS_CONFIG.ANALYSIS_PERIODS.SHORT_TERM) {
    const analysis = {
      timestamp: Date.now(),
      period,
      performance: this.analyzePerformance(monitorData, period),
      cache: this.analyzeCache(cacheData, period),
      errors: this.analyzeErrors(monitorData, period),
      trends: this.analyzeTrends(period),
      insights: this.generateInsights(),
      recommendations: this.generateRecommendations(),
      score: 0
    }

    // 计算综合评分
    analysis.score = this.calculateOverallScore(analysis)
    
    // 保存分析历史
    this.analysisHistory.push(analysis)
    this.cleanupAnalysisHistory()
    
    return analysis
  }

  /**
   * 性能分析
   */
  analyzePerformance(monitorData, period) {
    const stats = monitorData.getStats(period)
    
    return {
      apiPerformance: {
        avgResponseTime: stats.apiCalls.avgResponseTime,
        totalCalls: stats.apiCalls.total,
        successRate: stats.apiCalls.total > 0 ? stats.apiCalls.success / stats.apiCalls.total : 0,
        failureRate: stats.apiCalls.failureRate,
        grade: this.gradeApiPerformance(stats.apiCalls.avgResponseTime, stats.apiCalls.failureRate)
      },
      pagePerformance: {
        avgLoadTime: stats.pageLoads.avgLoadTime,
        totalLoads: stats.pageLoads.total,
        slowLoads: stats.pageLoads.slowLoads,
        slowLoadRate: stats.pageLoads.total > 0 ? stats.pageLoads.slowLoads / stats.pageLoads.total : 0,
        grade: this.gradePagePerformance(stats.pageLoads.avgLoadTime)
      },
      errorAnalysis: {
        totalErrors: stats.errors.total,
        errorsByType: stats.errors.byType,
        consecutiveErrors: stats.errors.consecutive,
        grade: this.gradeErrorRate(stats.errors.total, stats.apiCalls.total)
      }
    }
  }

  /**
   * 缓存分析
   */
  analyzeCache(cacheData, period) {
    const stats = cacheData.getStats()
    const report = cacheData.getOptimizationReport()
    
    return {
      hitRate: stats.overall.hitRate,
      avgResponseTime: stats.overall.avgResponseTime,
      totalAccess: stats.overall.totalAccess,
      uniqueKeys: stats.overall.uniqueKeys,
      optimizedKeys: report.optimizedTTLs,
      grade: this.gradeCachePerformance(stats.overall.hitRate),
      efficiency: this.calculateCacheEfficiency(stats),
      recommendations: report.recommendations
    }
  }

  /**
   * 错误分析
   */
  analyzeErrors(monitorData, period) {
    const stats = monitorData.getStats(period)
    const alerts = monitorData.getAlerts(period)
    
    return {
      errorDistribution: this.analyzeErrorDistribution(stats.errors.byType),
      alertFrequency: this.analyzeAlertFrequency(alerts),
      errorTrends: this.analyzeErrorTrends(period),
      criticalIssues: this.identifyCriticalIssues(stats, alerts)
    }
  }

  /**
   * 趋势分析
   */
  analyzeTrends(period) {
    const recentAnalyses = this.getRecentAnalyses(3) // 最近3次分析
    
    if (recentAnalyses.length < 2) {
      return { message: '数据不足，无法进行趋势分析' }
    }

    return {
      performance: this.calculatePerformanceTrend(recentAnalyses),
      cache: this.calculateCacheTrend(recentAnalyses),
      errors: this.calculateErrorTrend(recentAnalyses),
      overall: this.calculateOverallTrend(recentAnalyses)
    }
  }

  /**
   * 生成洞察
   */
  generateInsights() {
    const insights = []
    const recentAnalysis = this.analysisHistory[this.analysisHistory.length - 1]
    
    if (!recentAnalysis) {
      return insights
    }

    // 性能洞察
    if (recentAnalysis.performance.apiPerformance.avgResponseTime > ANALYTICS_CONFIG.PERFORMANCE_BENCHMARKS.API_RESPONSE_TIME.POOR) {
      insights.push({
        type: 'performance',
        severity: 'high',
        title: 'API响应时间过慢',
        description: `平均响应时间${recentAnalysis.performance.apiPerformance.avgResponseTime}ms，超过可接受范围`,
        impact: 'high',
        actionable: true
      })
    }

    // 缓存洞察
    if (recentAnalysis.cache.hitRate < ANALYTICS_CONFIG.PERFORMANCE_BENCHMARKS.CACHE_HIT_RATE.ACCEPTABLE) {
      insights.push({
        type: 'cache',
        severity: 'medium',
        title: '缓存命中率偏低',
        description: `缓存命中率${(recentAnalysis.cache.hitRate * 100).toFixed(1)}%，建议优化缓存策略`,
        impact: 'medium',
        actionable: true
      })
    }

    // 错误洞察
    if (recentAnalysis.performance.errorAnalysis.grade === 'poor' || recentAnalysis.performance.errorAnalysis.grade === 'very_poor') {
      insights.push({
        type: 'error',
        severity: 'high',
        title: '错误率过高',
        description: '系统错误率超过正常范围，需要立即关注',
        impact: 'high',
        actionable: true
      })
    }

    return insights
  }

  /**
   * 生成优化建议
   */
  generateRecommendations() {
    const recommendations = []
    const recentAnalysis = this.analysisHistory[this.analysisHistory.length - 1]
    
    if (!recentAnalysis) {
      return recommendations
    }

    // 基于性能分析的建议
    if (recentAnalysis.performance.apiPerformance.avgResponseTime > ANALYTICS_CONFIG.PERFORMANCE_BENCHMARKS.API_RESPONSE_TIME.GOOD) {
      recommendations.push({
        category: 'performance',
        priority: 'high',
        title: '优化API响应时间',
        actions: [
          '检查数据库查询性能',
          '优化API接口逻辑',
          '增加缓存层',
          '考虑使用CDN'
        ],
        expectedImpact: '响应时间减少30-50%'
      })
    }

    // 基于缓存分析的建议
    if (recentAnalysis.cache.hitRate < ANALYTICS_CONFIG.PERFORMANCE_BENCHMARKS.CACHE_HIT_RATE.GOOD) {
      recommendations.push({
        category: 'cache',
        priority: 'medium',
        title: '提升缓存效率',
        actions: [
          '调整缓存TTL策略',
          '识别热点数据并预热',
          '清理低效缓存',
          '优化缓存键设计'
        ],
        expectedImpact: '缓存命中率提升15-25%'
      })
    }

    // 基于错误分析的建议
    if (recentAnalysis.performance.errorAnalysis.totalErrors > 10) {
      recommendations.push({
        category: 'reliability',
        priority: 'high',
        title: '降低系统错误率',
        actions: [
          '分析错误根因',
          '完善错误处理机制',
          '增加重试逻辑',
          '提升系统监控'
        ],
        expectedImpact: '错误率降低50-70%'
      })
    }

    return recommendations
  }

  /**
   * 计算综合评分
   */
  calculateOverallScore(analysis) {
    let score = 0
    let weights = 0

    // API性能评分 (权重: 30%)
    const apiGrade = analysis.performance.apiPerformance.grade
    score += this.gradeToScore(apiGrade) * 0.3
    weights += 0.3

    // 缓存性能评分 (权重: 25%)
    const cacheGrade = analysis.cache.grade
    score += this.gradeToScore(cacheGrade) * 0.25
    weights += 0.25

    // 错误率评分 (权重: 25%)
    const errorGrade = analysis.performance.errorAnalysis.grade
    score += this.gradeToScore(errorGrade) * 0.25
    weights += 0.25

    // 页面性能评分 (权重: 20%)
    const pageGrade = analysis.performance.pagePerformance.grade
    score += this.gradeToScore(pageGrade) * 0.2
    weights += 0.2

    return Math.round(score / weights)
  }

  /**
   * 等级转分数
   */
  gradeToScore(grade) {
    const gradeMap = {
      'excellent': 100,
      'good': 80,
      'acceptable': 60,
      'poor': 40,
      'very_poor': 20
    }
    return gradeMap[grade] || 0
  }

  /**
   * API性能评级
   */
  gradeApiPerformance(avgResponseTime, failureRate) {
    const { API_RESPONSE_TIME, ERROR_RATE } = ANALYTICS_CONFIG.PERFORMANCE_BENCHMARKS
    
    if (avgResponseTime <= API_RESPONSE_TIME.EXCELLENT && failureRate <= ERROR_RATE.EXCELLENT) {
      return 'excellent'
    } else if (avgResponseTime <= API_RESPONSE_TIME.GOOD && failureRate <= ERROR_RATE.GOOD) {
      return 'good'
    } else if (avgResponseTime <= API_RESPONSE_TIME.ACCEPTABLE && failureRate <= ERROR_RATE.ACCEPTABLE) {
      return 'acceptable'
    } else if (avgResponseTime <= API_RESPONSE_TIME.POOR && failureRate <= ERROR_RATE.POOR) {
      return 'poor'
    } else {
      return 'very_poor'
    }
  }

  /**
   * 页面性能评级
   */
  gradePagePerformance(avgLoadTime) {
    const thresholds = ANALYTICS_CONFIG.PERFORMANCE_BENCHMARKS.API_RESPONSE_TIME

    if (avgLoadTime <= thresholds.EXCELLENT) return 'excellent'
    if (avgLoadTime <= thresholds.GOOD) return 'good'
    if (avgLoadTime <= thresholds.ACCEPTABLE) return 'acceptable'
    if (avgLoadTime <= thresholds.POOR) return 'poor'
    return 'very_poor'
  }

  /**
   * 缓存性能评级
   */
  gradeCachePerformance(hitRate) {
    const { CACHE_HIT_RATE } = ANALYTICS_CONFIG.PERFORMANCE_BENCHMARKS
    
    if (hitRate >= CACHE_HIT_RATE.EXCELLENT) return 'excellent'
    if (hitRate >= CACHE_HIT_RATE.GOOD) return 'good'
    if (hitRate >= CACHE_HIT_RATE.ACCEPTABLE) return 'acceptable'
    if (hitRate >= CACHE_HIT_RATE.POOR) return 'poor'
    return 'very_poor'
  }

  /**
   * 错误率评级
   */
  gradeErrorRate(totalErrors, totalRequests) {
    if (totalRequests === 0) return 'excellent'
    
    const errorRate = totalErrors / totalRequests
    const { ERROR_RATE } = ANALYTICS_CONFIG.PERFORMANCE_BENCHMARKS
    
    if (errorRate <= ERROR_RATE.EXCELLENT) return 'excellent'
    if (errorRate <= ERROR_RATE.GOOD) return 'good'
    if (errorRate <= ERROR_RATE.ACCEPTABLE) return 'acceptable'
    if (errorRate <= ERROR_RATE.POOR) return 'poor'
    return 'very_poor'
  }

  /**
   * 计算缓存效率
   */
  calculateCacheEfficiency(stats) {
    const hitRate = stats.overall.hitRate
    const avgResponseTime = stats.overall.avgResponseTime
    
    // 综合命中率和响应时间计算效率
    const hitRateScore = hitRate * 100
    const responseTimeScore = Math.max(0, 100 - avgResponseTime / 10) // 响应时间越低分数越高
    
    return Math.round((hitRateScore + responseTimeScore) / 2)
  }

  /**
   * 获取最近的分析结果
   */
  getRecentAnalyses(count) {
    return this.analysisHistory.slice(-count)
  }

  /**
   * 清理分析历史
   */
  cleanupAnalysisHistory() {
    // 保留最近50次分析
    if (this.analysisHistory.length > 50) {
      this.analysisHistory = this.analysisHistory.slice(-50)
    }
  }

  /**
   * 计算性能趋势
   */
  calculatePerformanceTrend(analyses) {
    if (analyses.length < 2) return null
    
    const latest = analyses[analyses.length - 1]
    const previous = analyses[analyses.length - 2]
    
    const responseTimeTrend = this.calculateTrendPercentage(
      previous.performance.apiPerformance.avgResponseTime,
      latest.performance.apiPerformance.avgResponseTime
    )
    
    const successRateTrend = this.calculateTrendPercentage(
      previous.performance.apiPerformance.successRate,
      latest.performance.apiPerformance.successRate
    )
    
    return {
      responseTime: responseTimeTrend,
      successRate: successRateTrend,
      direction: responseTimeTrend.percentage < 0 && successRateTrend.percentage > 0 ? 'improving' : 'declining'
    }
  }

  /**
   * 计算趋势百分比
   */
  calculateTrendPercentage(oldValue, newValue) {
    if (oldValue === 0) return { percentage: 0, direction: 'stable' }
    
    const percentage = ((newValue - oldValue) / oldValue) * 100
    let direction = 'stable'
    
    if (Math.abs(percentage) > ANALYTICS_CONFIG.TREND_THRESHOLDS.SIGNIFICANT_CHANGE * 100) {
      direction = percentage > 0 ? 'increasing' : 'decreasing'
    }
    
    return { percentage: Math.round(percentage * 100) / 100, direction }
  }

  /**
   * 导出分析报告
   */
  exportReport(analysis, format = 'json') {
    const report = {
      title: '钓鱼平台监控数据分析报告',
      timestamp: analysis.timestamp,
      period: analysis.period,
      summary: {
        overallScore: analysis.score,
        grade: this.scoreToGrade(analysis.score),
        keyMetrics: {
          apiResponseTime: analysis.performance.apiPerformance.avgResponseTime,
          cacheHitRate: analysis.cache.hitRate,
          errorRate: analysis.performance.apiPerformance.failureRate,
          pageLoadTime: analysis.performance.pagePerformance.avgLoadTime
        }
      },
      details: analysis,
      insights: analysis.insights,
      recommendations: analysis.recommendations
    }
    
    if (format === 'json') {
      return JSON.stringify(report, null, 2)
    }
    
    // 可以扩展其他格式
    return report
  }

  /**
   * 分数转等级
   */
  scoreToGrade(score) {
    if (score >= 90) return 'A+'
    if (score >= 80) return 'A'
    if (score >= 70) return 'B'
    if (score >= 60) return 'C'
    return 'D'
  }
}

// 创建全局分析器实例
const dataAnalyzer = new DataAnalyzer()

export { dataAnalyzer, ANALYTICS_CONFIG }
export default dataAnalyzer
