import fs from 'node:fs'
import path from 'node:path'

interface StorageState {
  cookies?: Array<{ name: string }>
}

export default function globalSetup() {
  const sessionPath = path.resolve(__dirname, '.auth', 'session.json')

  if (!fs.existsSync(sessionPath)) {
    console.warn(
      '\n⚠  No session file found at e2e-tests/.auth/session.json\n' +
      '   Run "npm run test:e2e:setup" to capture a session interactively.\n' +
      '   Only the "public" project will work without it.\n'
    )
    return
  }

  const raw = fs.readFileSync(sessionPath, 'utf-8')
  let state: StorageState
  try {
    state = JSON.parse(raw) as StorageState
  } catch {
    throw new Error(`e2e-tests/.auth/session.json is not valid JSON`)
  }

  const cookies = state.cookies ?? []
  const hasSession = cookies.some(c => c.name === 'kgw_session')
  const hasCsrf = cookies.some(c => c.name === 'csrf_token')

  if (!hasSession || !hasCsrf) {
    const missing = [
      !hasSession && 'kgw_session',
      !hasCsrf && 'csrf_token',
    ].filter(Boolean).join(', ')
    throw new Error(
      `e2e-tests/.auth/session.json is missing required cookies: ${missing}\n` +
      'Run "npm run test:e2e:setup" to capture a fresh session.'
    )
  }

  console.log('✓ Session file validated (kgw_session + csrf_token present)')
}
