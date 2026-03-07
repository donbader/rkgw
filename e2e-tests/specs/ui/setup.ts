import { test } from '@playwright/test'
import path from 'node:path'

const authFile = path.resolve(__dirname, '..', '..', '.auth', 'session.json')

/**
 * Interactive session capture.
 *
 * This test opens the login page and pauses so you can:
 * 1. Complete Google SSO login in the browser
 * 2. Verify you land on the dashboard
 * 3. Resume the test (click "Resume" in the Playwright inspector)
 *
 * The browser state (cookies) is then saved to e2e-tests/.auth/session.json
 * for use by authenticated and admin test projects.
 */
test('capture authenticated session', async ({ page }) => {
  await page.goto('./login')

  // Pause here — complete Google SSO login manually
  await page.pause()

  // After resuming, save the browser storage state
  await page.context().storageState({ path: authFile })

  // eslint-disable-next-line no-console
  console.log(`\n✓ Session saved to ${authFile}\n`)
})
