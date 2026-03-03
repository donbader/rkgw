import { useState, useEffect } from 'react'
import { apiFetch, apiPost, apiDelete } from '../lib/api'
import type { KiroStatus, DeviceCodeResponse } from '../lib/api'
import { DeviceCodeDisplay } from './DeviceCodeDisplay'
import { useToast } from './Toast'

export function KiroSetup() {
  const { showToast } = useToast()
  const [status, setStatus] = useState<KiroStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [deviceAuth, setDeviceAuth] = useState<DeviceCodeResponse | null>(null)
  const [starting, setStarting] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [startUrl, setStartUrl] = useState('')
  const [region, setRegion] = useState('us-east-1')

  function loadStatus() {
    apiFetch<KiroStatus>('/kiro/status')
      .then(s => { setStatus(s); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { loadStatus() }, [])

  async function handleStart() {
    setStarting(true)
    try {
      const body: { start_url?: string; region?: string } = {}
      if (startUrl) body.start_url = startUrl
      if (region) body.region = region
      const result = await apiPost<DeviceCodeResponse>('/kiro/setup', body)
      setDeviceAuth(result)
      setShowConfig(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      if (msg.includes('Start URL')) {
        setShowConfig(true)
        showToast('Please provide your AWS SSO Start URL', 'error')
      } else {
        showToast('Failed to start Kiro setup: ' + msg, 'error')
      }
    } finally {
      setStarting(false)
    }
  }

  function handleComplete() {
    setDeviceAuth(null)
    showToast('Kiro token connected successfully', 'success')
    loadStatus()
  }

  function handleError(message: string) {
    showToast(message, 'error')
    setDeviceAuth(null)
  }

  async function handleRemove() {
    try {
      await apiDelete('/kiro/token')
      showToast('Kiro token removed', 'success')
      loadStatus()
    } catch (err) {
      showToast(
        'Failed to remove token: ' + (err instanceof Error ? err.message : 'Unknown error'),
        'error',
      )
    }
  }

  if (loading) {
    return <div className="skeleton skeleton-block" role="status" aria-label="Loading Kiro status" />
  }

  if (deviceAuth) {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-title">{'> '}kiro setup</span>
        </div>
        <DeviceCodeDisplay
          userCode={deviceAuth.user_code}
          verificationUri={deviceAuth.verification_uri}
          verificationUriComplete={deviceAuth.verification_uri_complete}
          deviceCodeId={deviceAuth.device_code_id}
          onComplete={handleComplete}
          onError={handleError}
          onCancel={() => setDeviceAuth(null)}
        />
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">{'> '}kiro connection</span>
        {status?.has_token && !status.expired && (
          <span className="tag-ok">CONNECTED</span>
        )}
        {status?.has_token && status.expired && (
          <span className="tag-warn">EXPIRED</span>
        )}
        {!status?.has_token && (
          <span className="tag-err">NOT CONNECTED</span>
        )}
      </div>
      {showConfig && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            AWS SSO Start URL
            <input
              type="text"
              className="input"
              value={startUrl}
              onChange={e => setStartUrl(e.target.value)}
              placeholder="https://d-xxxxxxxxxx.awsapps.com/start"
              style={{ marginTop: 4, width: '100%' }}
            />
          </label>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Region
            <input
              type="text"
              className="input"
              value={region}
              onChange={e => setRegion(e.target.value)}
              placeholder="us-east-1"
              style={{ marginTop: 4, width: '100%' }}
            />
          </label>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {!showConfig && !status?.has_token && (
          <button
            className="device-code-cancel"
            type="button"
            onClick={() => setShowConfig(true)}
            style={{ flex: 'none' }}
          >
            configure
          </button>
        )}
        <button
          className="btn-save"
          type="button"
          onClick={handleStart}
          disabled={starting}
          style={{ flex: 'none' }}
        >
          {status?.has_token ? '$ reconnect' : '$ setup kiro token'}
        </button>
        {status?.has_token && (
          <button
            className="device-code-cancel"
            type="button"
            onClick={handleRemove}
          >
            remove
          </button>
        )}
      </div>
    </div>
  )
}
