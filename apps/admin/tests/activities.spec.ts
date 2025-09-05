import { test, expect } from '@playwright/test'

// Smoke: open admin, navigate to activities page and expect UI elements

test.describe('Admin Activities', () => {
  test('open activities page', async ({ page, baseURL }) => {
    await page.goto(baseURL!)
    // TODO: navigate to activities list link if needed
    // await page.getByRole('link', { name: '活动管理' }).click()
    await expect(page).toHaveTitle(/admin/i)
  })
})

