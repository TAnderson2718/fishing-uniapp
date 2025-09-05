import { test, expect } from '@playwright/test'

const ADMIN_USER = process.env.ADMIN_USER || 'admin'
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123'

test.describe('Admin Login and Activities', () => {
  test('login then open activities', async ({ page, baseURL }) => {
    await page.goto((baseURL || 'http://localhost:5173') + '/login')
    await page.getByLabel('用户名').fill(ADMIN_USER)
    await page.getByLabel('密码').fill(ADMIN_PASS)
    await page.getByRole('button', { name: '登录' }).click()

    // Expect redirect to dashboard
    await expect(page).toHaveURL(/.*\/dashboard$/)
    // Navigate to activities list (if nav exists) or direct url
    await page.goto((baseURL || 'http://localhost:5173') + '/activities')
    await expect(page).toHaveURL(/.*\/activities$/)
  })
})

