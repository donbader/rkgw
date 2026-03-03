import { test, expect } from '@playwright/test'
import { Card } from '../helpers/selectors.js'
import { navigateTo } from '../helpers/navigation.js'

test.describe('Dashboard page', () => {
  test('renders section headers', async ({ page }) => {
    await navigateTo(page, '/')

    const headers = page.locator('h2.section-header')
    await expect(headers.first()).toBeVisible()

    // Dashboard has 5 section headers: SYSTEM (or YOUR USAGE), TRAFFIC, MODELS, ERRORS, LOGS
    const headerTexts = await headers.allTextContents()
    expect(headerTexts.length).toBeGreaterThanOrEqual(5)
    expect(headerTexts.some(t => t.includes('TRAFFIC'))).toBe(true)
    expect(headerTexts.some(t => t.includes('MODELS'))).toBe(true)
    expect(headerTexts.some(t => t.includes('LOGS'))).toBe(true)
  })

  test('metrics grid shows metric cards', async ({ page }) => {
    await navigateTo(page, '/')

    const metricsGrid = page.locator('div.metrics-grid')
    await expect(metricsGrid).toBeVisible()

    // MetricCard uses 'metric-card' class, not 'card'
    const cards = metricsGrid.locator('div.metric-card')
    await expect(cards).toHaveCount(3)
  })

  test('models section is visible', async ({ page }) => {
    await navigateTo(page, '/')

    const modelsHeader = page.locator('h2.section-header', { hasText: 'MODELS' })
    await expect(modelsHeader).toBeVisible()

    // Model stats card follows the MODELS header
    const modelCard = page.locator(Card.title, { hasText: 'model stats' })
    await expect(modelCard).toBeVisible()
  })

  test('logs section is visible', async ({ page }) => {
    await navigateTo(page, '/')

    const logsHeader = page.locator('h2.section-header', { hasText: 'LOGS' })
    await expect(logsHeader).toBeVisible()

    const logCard = page.locator(Card.title, { hasText: 'live logs' })
    await expect(logCard).toBeVisible()
  })
})
