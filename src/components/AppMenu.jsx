import { useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FileEdit, FolderKanban, LogOut, Menu, Settings, ShieldCheck, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useClickOutside } from '../lib/useClickOutside.js'
import SettingsModal from './SettingsModal.jsx'

// Itens declarativos: cada plano (grupos, perfis, usuários, editor de relatórios)
// acrescenta uma entrada aqui em vez de mexer na lógica do menu. `permission`
// ausente = sempre visível pra qualquer logado; presente = só aparece se
// user.permissions['*'] ou user.permissions[permission] for true.
const MENU_ITEMS = [
  { key: 'report-groups', label: 'Grupos de relatórios', icon: FolderKanban, to: '/admin/report-groups', permission: 'report_groups.manage' },
  { key: 'profiles', label: 'Perfis', icon: ShieldCheck, to: '/admin/profiles', permission: 'profiles.manage' },
  { key: 'users', label: 'Usuários', icon: User, to: '/admin/users', permission: 'users.manage' },
  { key: 'reports-admin', label: 'Editor de relatórios', icon: FileEdit, to: '/admin/reports', permission: 'reports.manage' },
]

function hasPermission(user, permission) {
  if (!permission) return true
  const permissions = user?.permissions ?? {}
  return permissions['*'] === true || permissions[permission] === true
}

export default function AppMenu() {
  const { user, logout } = useAuth()
  const [searchParams] = useSearchParams()
  const [open, setOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const wrapRef = useRef(null)

  useClickOutside(wrapRef, open, () => setOpen(false))

  // Link compartilhado público: sem menu de app, só o conteúdo do relatório.
  if (searchParams.get('shared') === '1') return null
  if (!user) return null

  const visibleItems = MENU_ITEMS.filter((item) => hasPermission(user, item.permission))

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
            {visibleItems.map((item) => (
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
            ))}
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
