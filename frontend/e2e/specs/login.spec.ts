import { test, expect } from '@playwright/test'
import { Login } from '../helpers/selectors.js'

test.describe('Login page', () => {
  test('renders auth card with Google sign-in button', async ({ page }) => {
    await page.goto('./login')
    await page.waitForLoadState('networkidle')

    await expect(page.locator(Login.card)).toBeVisible()
    const submitBtn = page.locator(Login.submit)
    await expect(submitBtn).toBeVisible()
    await expect(submitBtn).toHaveText('$ sign in with google')
  })

  test('shows error for domain_not_allowed', async ({ page }) => {
    await page.goto('./login?error=domain_not_allowed')
    await page.waitForLoadState('networkidle')

    const error = page.locator(Login.error)
    await expect(error).toBeVisible()
    await expect(error).toHaveText('Your email domain is not authorized. Contact your admin.')
  })

  test('shows error for consent_denied', async ({ page }) => {
    await page.goto('./login?error=consent_denied')
    await page.waitForLoadState('networkidle')

    const error = page.locator(Login.error)
    await expect(error).toBeVisible()
    await expect(error).toHaveText('Google sign-in was cancelled.')
  })

  test('shows error for invalid_state', async ({ page }) => {
    await page.goto('./login?error=invalid_state')
    await page.waitForLoadState('networkidle')

    const error = page.locator(Login.error)
    await expect(error).toBeVisible()
    await expect(error).toHaveText('Login session expired. Please try again.')
  })

  test('shows error for auth_failed', async ({ page }) => {
    await page.goto('./login?error=auth_failed')
    await page.waitForLoadState('networkidle')

    const error = page.locator(Login.error)
    await expect(error).toBeVisible()
    await expect(error).toHaveText('Authentication failed. Please try again.')
  })
})
