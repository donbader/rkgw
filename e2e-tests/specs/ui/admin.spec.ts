import { test, expect } from '@playwright/test'
import { Card, Table } from '../../helpers/selectors.js'
import { navigateTo } from '../../helpers/navigation.js'

test.describe('Admin page', () => {
  test('renders Domain Allowlist and User Management sections', async ({ page }) => {
    await navigateTo(page, '/admin')

    const domainHeader = page.locator('h2.section-header', { hasText: 'DOMAIN ALLOWLIST' })
    await expect(domainHeader).toBeVisible()

    const userHeader = page.locator('h2.section-header', { hasText: 'USER MANAGEMENT' })
    await expect(userHeader).toBeVisible()
  })

  test('domain manager card is visible', async ({ page }) => {
    await navigateTo(page, '/admin')

    const domainCard = page.locator(Card.title, { hasText: 'allowed domains' })
    await expect(domainCard).toBeVisible()
  })

  test('user management section renders', async ({ page }) => {
    await navigateTo(page, '/admin')

    // Users card loads (title visible after API responds)
    const usersTitle = page.locator(Card.title, { hasText: 'users' })
    await expect(usersTitle).toBeVisible({ timeout: 10_000 })
  })
})
