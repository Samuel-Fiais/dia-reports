import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getReport } from "../lib/registry.js";
import { applyTheme, loadSettings, saveSettings } from "../lib/theme.js";
import { useAppTheme } from "../context/ThemeContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import ReportView from "../components/ReportView.jsx";
import SettingsPanel from "../components/SettingsPanel.jsx";
import ShareButton from "../components/ShareButton.jsx";

function defaultSettings(report) {
  return {
    colorIndex: report?.settings?.colorIndex ?? 0,
    fontIndex: report?.settings?.fontIndex ?? 0,
    chartStyleIndex: report?.settings?.chartStyleIndex ?? 2,
    widthMode: report?.settings?.widthMode ?? "standard",
    fontScale: report?.settings?.fontScale ?? "default",
  };
}

export default function ReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const guestView = !user;
  const { appTheme } = useAppTheme();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [settings, setSettings] = useState(() => defaultSettings(null));

  useEffect(() => {
    let cancelled = false;

    async function loadReport() {
      try {
        setLoading(true);
        setError(null);
        const data = await getReport(id);
        if (cancelled) return;
        setReport(data);
        const base = defaultSettings(data);
        setSettings(guestView ? base : loadSettings(id, base));
      } catch (err) {
        if (!cancelled) {
          if (err?.code === "UNAUTHENTICATED") {
            navigate("/login", { replace: true, state: { from: { pathname: `/report/${id}` } } });
            return;
          }
          setReport(null);
          setError(err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadReport();

    return () => {
      cancelled = true;
    };
  }, [id, guestView, navigate]);

  useEffect(() => {
    applyTheme(settings, appTheme);
  }, [settings, appTheme]);

  useEffect(() => {
    if (report?.title) document.title = report.title;
  }, [report]);

  if (loading) {
    return (
      <div className="report ready">
        <div className="report-wrap">
          <header className="report-header">
            <div className="report-header-left">
              <span className="report-from">Carregando relatório</span>
            </div>
          </header>
          <h1 className="report-headline">Carregando...</h1>
          <div className="report-intro">
            <p>Buscando os dados do relatório.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="report ready">
        <div className="report-wrap">
          <header className="report-header">
            <div className="report-header-left">
              <span className="report-from">Erro ao carregar</span>
            </div>
          </header>
          <h1 className="report-headline">Não foi possível abrir</h1>
          <div className="report-intro">
            <p>
              A API não respondeu como esperado.{" "}
              {user ? <Link to="/">Voltar ao dashboard</Link> : null}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="report ready">
        <div className="report-wrap">
          <header className="report-header">
            <div className="report-header-left">
              <span className="report-from">Relatório não encontrado</span>
            </div>
          </header>
          <h1 className="report-headline">404</h1>
          <div className="report-intro">
            <p>
              Nenhum relatório com o id <code>{id}</code>.{" "}
              {user ? <Link to="/">Voltar ao dashboard</Link> : null}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleChange = (next) => {
    setSettings(next);
    if (!guestView) saveSettings(id, next);
  };

  return (
    <>
      {!guestView && (
        <nav className="report-backnav">
          <Link to="/">
            <ArrowLeft size={12} aria-hidden="true" /> Relatórios
          </Link>
        </nav>
      )}
      {!guestView && (
        <div className="report-topnav">
          <ShareButton reportId={report.id} />
        </div>
      )}
      <ReportView report={report} settings={settings} />
      {!guestView && <SettingsPanel settings={settings} onChange={handleChange} />}
    </>
  );
}
