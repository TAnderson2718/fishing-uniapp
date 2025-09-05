import { test, expect } from '@playwright/test'

const ADMIN_USER = process.env.ADMIN_USER || 'admin'
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123'

async function login(page: any, baseURL: string) {
  await page.goto((baseURL || 'http://localhost:5173') + '/login')
  await page.getByLabel('用户名').fill(ADMIN_USER)
  await page.getByLabel('密码').fill(ADMIN_PASS)
  await page.getByRole('button', { name: '登录' }).click()
  await expect(page).toHaveURL(/.*\/dashboard$/)
}

test.describe('Admin Activities CRUD', () => {
  test('create activity and session', async ({ page, baseURL }) => {
    await login(page, baseURL!)

    // goto activities
    await page.goto((baseURL || 'http://localhost:5173') + '/activities')
    await expect(page.getByText('活动管理')).toBeVisible()

    // open dialog and create activity
    await page.getByTestId('btn-add-activity').click()
    await page.getByTestId('input-activity-title').fill('E2E 自动化活动')
    await page.getByTestId('input-activity-normalPrice').fill('100')
    await page.getByTestId('input-activity-memberPrice').fill('80')
    await page.getByTestId('select-activity-status').click()
    await page.getByRole('option', { name: 'PUBLISHED' }).click()
    await page.getByRole('button', { name: '保存' }).click()

    // 点击“管理场次”进入 sessions 页面
    await page.getByTestId('btn-manage-sessions').first().click()
    await expect(page).toHaveURL(/.*\/activities\/.*\/sessions$/)

    // 新增场次
    await page.getByTestId('btn-add-session').click()
    // 选择时间
    const now = new Date()
    const start = new Date(now.getTime() + 60 * 60 * 1000)
    const end = new Date(now.getTime() + 2 * 60 * 60 * 1000)
    await page.getByLabel('开始时间').fill(start.toISOString())
    await page.getByLabel('结束时间').fill(end.toISOString())
    await page.getByLabel('容量').fill('10')
    await page.getByRole('button', { name: '保存' }).click()

    // 断言有行渲染
    await expect(page.getByRole('cell', { name: /容量/i })).toBeVisible()
  })
})

