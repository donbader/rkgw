import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { Loading, Toast } from './selectors.js'

/** Navigate to a path under the base URL and wait for the page to settle. */
export async function navigateTo(page: Page, path: string) {
  // Convert absolute paths to relative so Playwright resolves against baseURL
  // e.g. '/profile' → './profile', '/' → './'
  const relativePath = path.startsWith('/') ? '.' + path : path
  await page.goto(relativePath)
  await waitForPageLoad(page)
}

/** Wait until loading skeletons and status indicators are gone. */
export async function waitForPageLoad(page: Page, timeout = 10_000) {
  // Wait for any skeleton loaders to disappear
  await page.waitForFunction(
    (sel) => document.querySelectorAll(sel).length === 0,
    Loading.skeleton,
    { timeout }
  )
}

/** Assert a toast message appears with the expected text (substring match). */
export async function expectToastMessage(page: Page, text: string, type: 'success' | 'error' = 'success') {
  const selector = type === 'success' ? Toast.success : Toast.error
  const toast = page.locator(selector).filter({ hasText: text })
  await expect(toast).toBeVisible({ timeout: 5_000 })
}
