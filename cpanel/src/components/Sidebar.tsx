import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, Dumbbell, Layers, Activity,
  Bell, Settings, Zap, LogOut, ClipboardList, PlusCircle, MessageSquare
} from 'lucide-react'
import { setAdminKey } from '../api'

const nav = [
  { label: 'OVERVIEW', items: [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/activity', icon: Activity, label: 'Live Activity' },
  ]},
  { label: 'MANAGEMENT', items: [
    { to: '/users', icon: Users, label: 'Users' },
    { to: '/splits', icon: Layers, label: 'Splits' },
    { to: '/exercises', icon: Dumbbell, label: 'Exercises' },
    { to: '/exercise-requests', icon: MessageSquare, label: 'Exercise Requests' },
    { to: '/create-exercise', icon: PlusCircle, label: 'Create Exercise' },
    { to: '/onboarding', icon: ClipboardList, label: 'Onboarding' },
  ]},
  { label: 'TOOLS', items: [
    { to: '/notifications', icon: Bell, label: 'Notifications' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ]},
]

export default function Sidebar() {
  const handleLogout = () => {
    setAdminKey('')
    window.location.href = '/login'
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Zap size={20} color="white" fill="white" />
        </div>
        <div>
          <div className="sidebar-logo-text">Ryze</div>
          <div className="sidebar-logo-sub">Admin Panel</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {nav.map(section => (
          <div key={section.label}>
            <div className="sidebar-section-label">{section.label}</div>
            {section.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <item.icon size={17} />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
        <button className="nav-item" onClick={handleLogout} style={{ color: 'var(--danger-text)' }}>
          <LogOut size={17} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
