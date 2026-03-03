import { test, expect } from '@playwright/test'
import { Card, Form } from '../helpers/selectors.js'
import { navigateTo } from '../helpers/navigation.js'

test.describe('Guardrails page', () => {
  test('renders three sections: PROFILES, RULES, TEST GUARDRAIL', async ({ page }) => {
    await navigateTo(page, '/guardrails')

    const profilesHeader = page.locator('h2.section-header', { hasText: 'PROFILES' })
    await expect(profilesHeader).toBeVisible()

    const rulesHeader = page.locator('h2.section-header', { hasText: 'RULES' })
    await expect(rulesHeader).toBeVisible()

    const testHeader = page.locator('h2.section-header', { hasText: 'TEST GUARDRAIL' })
    await expect(testHeader).toBeVisible()
  })

  test('new profile button is visible', async ({ page }) => {
    await navigateTo(page, '/guardrails')

    const newProfileBtn = page.locator(Form.save, { hasText: '$ new profile' })
    await expect(newProfileBtn).toBeVisible()
  })

  test('new rule button is visible', async ({ page }) => {
    await navigateTo(page, '/guardrails')

    const newRuleBtn = page.locator(Form.save, { hasText: '$ new rule' })
    await expect(newRuleBtn).toBeVisible()
  })

  test('profiles card renders', async ({ page }) => {
    await navigateTo(page, '/guardrails')

    const profilesTitle = page.locator(Card.title, { hasText: 'profiles' })
    await expect(profilesTitle).toBeVisible()
  })

  test('rules card renders', async ({ page }) => {
    await navigateTo(page, '/guardrails')

    const rulesTitle = page.locator(Card.title, { hasText: 'rules' })
    await expect(rulesTitle).toBeVisible()
  })

  test('test card renders', async ({ page }) => {
    await navigateTo(page, '/guardrails')

    const testTitle = page.locator(Card.title, { hasText: 'test' })
    await expect(testTitle).toBeVisible()
  })
})
