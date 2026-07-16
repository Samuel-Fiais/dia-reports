import { useRef, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { FolderKanban, Home, LogOut, Menu, Presentation, Settings, ShieldCheck, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useClickOutside } from '../lib/useClickOutside.js'
import SettingsModal from './SettingsModal.jsx'

// Cada entrada pode ter `type`:
//   'link' (padrão) — item clicável com ícone + label + to
//   'separator' — linha divisória (ignora label, icon, to, permission)
//   'label' — texto de seção não clicável (ignora icon, to, permission)
const MENU_ITEMS = [
  { type: 'link', key: 'home', label: 'Início', icon: Home, to: '/' },
  { type: 'separator' },
  { type: 'label', key: 'admin-label', label: 'Administração' },
  { type: 'link', key: 'report-groups', label: 'Grupos de relatórios', icon: FolderKanban, to: '/admin/report-groups', permission: 'report_groups.manage' },
  { type: 'link', key: 'profiles', label: 'Perfis', icon: ShieldCheck, to: '/admin/profiles', permission: 'profiles.manage' },
  { type: 'link', key: 'users', label: 'Usuários', icon: User, to: '/admin/users', permission: 'users.manage' },
  // Editor visual removido — relatórios são gerenciados via JSON direto no ReportsAdmin
  // { key: 'reports-admin', label: 'Editor de relatórios', icon: FileEdit, to: '/admin/reports', permission: 'reports.manage' },
  { type: 'link', key: 'reports-admin', label: 'Gerenciar relatórios', icon: Settings, to: '/admin/reports', permission: 'reports.manage' },
  { type: 'separator' },
  { type: 'label', key: 'slides-label', label: 'Apresentações' },
  { type: 'link', key: 'slides', label: 'Apresentações', icon: Presentation, to: '/slides' },
]

function hasPermission(user, permission) {
  if (!permission) return true
  const permissions = user?.permissions ?? {}
  return permissions['*'] === true || permissions[permission] === true
}

export default function AppMenu() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [open, setOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const wrapRef = useRef(null)

  useClickOutside(wrapRef, open, () => setOpen(false))

  // Link compartilhado público: sem menu de app, só o conteúdo do relatório.
  if (searchParams.get('shared') === '1') return null
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
