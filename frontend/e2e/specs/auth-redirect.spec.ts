import { test, expect } from '@playwright/test'

const BASE = 'https://localhost/_ui'

test.describe('Unauthenticated redirects', () => {
  test('/ redirects to /login', async ({ browser }) => {
    const context = await browser.newContext({ ignoreHTTPSErrors: true })
    const page = await context.newPage()

    await page.goto(`${BASE}/`)
    await page.waitForLoadState('networkidle')
    expect(page.url()).toContain('/login')

    await context.close()
  })

  test('/profile redirects to /login', async ({ browser }) => {
    const context = await browser.newContext({ ignoreHTTPSErrors: true })
    const page = await context.newPage()

    await page.goto(`${BASE}/profile`)
    await page.waitForLoadState('networkidle')
    expect(page.url()).toContain('/login')

    await context.close()
  })

  test('/config redirects to /login', async ({ browser }) => {
    const context = await browser.newContext({ ignoreHTTPSErrors: true })
    const page = await context.newPage()

    await page.goto(`${BASE}/config`)
    await page.waitForLoadState('networkidle')
    expect(page.url()).toContain('/login')

    await context.close()
  })

  test('/admin redirects to /login', async ({ browser }) => {
    const context = await browser.newContext({ ignoreHTTPSErrors: true })
    const page = await context.newPage()

    await page.goto(`${BASE}/admin`)
    await page.waitForLoadState('networkidle')
    expect(page.url()).toContain('/login')

    await context.close()
  })
})
