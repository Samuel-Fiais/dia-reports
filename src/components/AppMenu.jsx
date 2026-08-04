import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileStack, FolderKanban, Home, LayoutGrid, LogOut, Menu, Newspaper, Settings, ShieldCheck, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useClickOutside } from '../lib/useClickOutside.js'
import SettingsModal from './SettingsModal.jsx'

// Cada entrada pode ter `type`:
//   'link' (padrão) — item clicável com ícone + label + to
//   'separator' — linha divisória (ignora label, icon, to, permission)
//   'label' — texto de seção não clicável (ignora icon, to, permission)
const MENU_ITEMS = [
  { type: 'link', key: 'home', label: 'Início', icon: Home, to: '/' },
  { type: 'link', key: 'reports', label: 'Relatórios', icon: FileStack, to: '/relatorios' },
  { type: 'link', key: 'the-foreword', label: 'The Foreword', icon: Newspaper, to: '/the-foreword' },
  { type: 'link', key: 'components', label: 'Componentes', icon: LayoutGrid, to: '/componentes' },
  { type: 'separator' },
  { type: 'label', key: 'admin-label', label: 'Administração' },
  { type: 'link', key: 'report-groups', label: 'Grupos de relatórios', icon: FolderKanban, to: '/admin/report-groups', permission: 'report_groups.manage' },
  { type: 'link', key: 'profiles', label: 'Perfis', icon: ShieldCheck, to: '/admin/profiles', permission: 'profiles.manage' },
  { type: 'link', key: 'users', label: 'Usuários', icon: User, to: '/admin/users', permission: 'users.manage' },
]

function hasPermission(user, permission) {
  if (!permission) return true
  const permissions = user?.permissions ?? {}
  return permissions['*'] === true || permissions[permission] === true
}

export default function AppMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const wrapRef = useRef(null)

  useClickOutside(wrapRef, open, () => setOpen(false))

  if (!user) return null

  const visibleItems = MENU_ITEMS.filter((item) => hasPermission(user, item.permission))

  function renderItem(item, idx) {
    if (item.type === 'separator') {
      return <div key={`sep-${idx}`} className="app-menu-separator" role="separator" />
    }
    if (item.type === 'label') {
      return <div key={item.key} className="app-menu-label">{item.label}</div>
    }
    return (
      <Link
        key={item.key}
        to={item.to}
        className="app-menu-item"
        role="menuitem"
        onClick={() => setOpen(false)}
      >
        <item.icon size={16} aria-hidden="true" />
        {item.label}
      </Link>
    )
  }

  return (
    <>
      <div className="app-menu" ref={wrapRef}>
        {open && (
          <div className="app-menu-list" role="menu">
            <button
              type="button"
              className="app-menu-item"
              role="menuitem"
              onClick={() => {
                setSettingsOpen(true)
                setOpen(false)
              }}
            >
              <Settings size={16} aria-hidden="true" />
              Configurações
            </button>
            {visibleItems.map((item, idx) => renderItem(item, idx))}
            <button
              type="button"
              className="app-menu-item"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                logout()
              }}
            >
              <LogOut size={16} aria-hidden="true" />
              Sair
            </button>
          </div>
        )}
        <button
          type="button"
          className="app-menu-fab"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Menu do app"
          onClick={() => setOpen((v) => !v)}
        >
          <Menu size={20} />
        </button>
      </div>
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </>
  )
}
