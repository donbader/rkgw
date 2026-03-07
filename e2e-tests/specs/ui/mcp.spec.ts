import { test, expect } from '@playwright/test'
import { Card, Form } from '../../helpers/selectors.js'
import { navigateTo } from '../../helpers/navigation.js'

test.describe('MCP Servers page', () => {
  test('MCP SERVERS section header is visible', async ({ page }) => {
    await navigateTo(page, '/mcp')

    const header = page.locator('h2.section-header', { hasText: 'MCP SERVERS' })
    await expect(header).toBeVisible()
  })

  test('clients card renders', async ({ page }) => {
    await navigateTo(page, '/mcp')

    const clientsTitle = page.locator(Card.title, { hasText: 'clients' })
    await expect(clientsTitle).toBeVisible()
  })

  test('new client button is visible', async ({ page }) => {
    await navigateTo(page, '/mcp')

    const newClientBtn = page.locator(Form.save, { hasText: '$ new client' })
    await expect(newClientBtn).toBeVisible()
  })
})
