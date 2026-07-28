import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import ReportPage from './pages/ReportPage.jsx'
import SharedReport from './pages/SharedReport.jsx'
import Login from './pages/Login.jsx'
import ComponentCatalogPage from './pages/ComponentCatalogPage.jsx'
import ReportGroups from './pages/admin/ReportGroups.jsx'
import Profiles from './pages/admin/Profiles.jsx'
import Users from './pages/admin/Users.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import RequireAuth from './components/RequireAuth.jsx'
import RequirePermission from './components/RequirePermission.jsx'
import AppMenu from './components/AppMenu.jsx'

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <AppMenu />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/shared/:token" element={<SharedReport />} />
            <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
            <Route
              path="/componentes"
              element={<RequireAuth><ComponentCatalogPage /></RequireAuth>}
            />
            <Route path="/report/:id" element={<ReportPage />} />
            <Route
              path="/admin/report-groups"
              element={
                <RequireAuth>
                  <RequirePermission module="report_groups.manage">
                    <ReportGroups />
                  </RequirePermission>
                </RequireAuth>
              }
            />
            <Route
              path="/admin/profiles"
              element={
                <RequireAuth>
                  <RequirePermission module="profiles.manage">
                    <Profiles />
                  </RequirePermission>
                </RequireAuth>
              }
            />
            <Route
              path="/admin/users"
              element={
                <RequireAuth>
                  <RequirePermission module="users.manage">
                    <Users />
                  </RequirePermission>
                </RequireAuth>
              }
            />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  )
}
