import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import ReportPage from './pages/ReportPage.jsx'
import SharedReport from './pages/SharedReport.jsx'
import Login from './pages/Login.jsx'
import ReportGroups from './pages/admin/ReportGroups.jsx'
import Profiles from './pages/admin/Profiles.jsx'
import Users from './pages/admin/Users.jsx'
import ReportsAdmin from './pages/admin/ReportsAdmin.jsx'
// Editor visual removido — gerenciamento de relatórios via JSON direto no ReportsAdmin
// import ReportEditorPage from './components/editor/ReportEditorPage.jsx'
import SlidesHome from './pages/SlidesHome.jsx'
import SlideViewer from './pages/SlideViewer.jsx'
import SlideDetailPage from './pages/SlideDetailPage.jsx'
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
            <Route
              path="/admin/reports"
              element={
                <RequireAuth>
                  <RequirePermission module="reports.manage">
                    <ReportsAdmin />
                  </RequirePermission>
                </RequireAuth>
              }
            />
            {/* Editor visual removido */}
            {/* <Route
              path="/admin/reports/:slug/edit"
              element={
                <RequireAuth>
                  <RequirePermission module="reports.manage">
                    <ReportEditorPage />
                  </RequirePermission>
                </RequireAuth>
              }
            /> */}
            <Route path="/slides" element={<RequireAuth><SlidesHome /></RequireAuth>} />
            <Route path="/slides/:id" element={<RequireAuth><SlideViewer /></RequireAuth>} />
            <Route path="/slides/:id/view" element={<RequireAuth><SlideDetailPage /></RequireAuth>} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  )
}
