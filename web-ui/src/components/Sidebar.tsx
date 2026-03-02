import { NavLink } from 'react-router-dom'
import { setApiKey } from '../lib/auth'

interface SidebarProps {
  connected: boolean
  open?: boolean
  onClose?: () => void
}

export function Sidebar({ connected, open, onClose }: SidebarProps) {
  function handleLogout() {
    setApiKey('')
    sessionStorage.clear()
    window.location.reload()
  }

  return (
    <nav className={`sidebar${open ? ' open' : ''}`} onClick={e => e.stopPropagation()}>
      <div className="sidebar-brand">
        <h1>{'  _  ___\n | |/ (_)_ _ ___\n | \' <| | \'_/ _ \\\n |_|\\_\\_|_| \\___/'}</h1>
        <div className="version">gateway v1.0.8</div>
      </div>
      <div className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={onClose}>
          <span className="nav-cursor">{'>'}</span> dashboard
        </NavLink>
        <NavLink to="/config" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={onClose}>
          <span className="nav-cursor">{'>'}</span> config
        </NavLink>
      </div>
      <div className="sidebar-footer">
        {connected
          ? <span className="tag-ok">STREAM</span>
          : <span className="tag-err">STREAM</span>
        }
        <button className="btn-logout" onClick={handleLogout} title="Disconnect and clear API key">
          $ logout
        </button>
      </div>
    </nav>
  )
}
