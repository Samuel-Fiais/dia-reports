import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getReport } from "../lib/registry.js";
import { applyTheme, loadSettings, saveSettings } from "../lib/theme.js";
import { useAppTheme } from "../context/ThemeContext.jsx";
import ReportView from "../components/ReportView.jsx";
import SettingsPanel from "../components/SettingsPanel.jsx";
import ShareButton from "../components/ShareButton.jsx";

export default function ReportPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const shared = searchParams.get("shared") === "1";
  const { appTheme } = useAppTheme();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [settings, setSettings] = useState(() => {
    const reportSettings = {
      colorIndex: report?.settings?.colorIndex ?? 0,
      fontIndex: report?.settings?.fontIndex ?? 0,
      chartStyleIndex: report?.settings?.chartStyleIndex ?? 2,
      widthMode: report?.settings?.widthMode ?? "standard",
      fontScale: report?.settings?.fontScale ?? "default",
    };
    return shared ? reportSettings : loadSettings(id, reportSettings);
  });

  useEffect(() => {
    let cancelled = false;

    async function loadReport() {
      try {
        setLoading(true);
        setError(null);
        const data = await getReport(id, shared);
        if (cancelled) return;
        setReport(data);
        setSettings(
          loadSettings(id, {
            colorIndex: data?.settings?.colorIndex ?? 0,
            fontIndex: data?.settings?.fontIndex ?? 0,
            chartStyleIndex: data?.settings?.chartStyleIndex ?? 2,
            widthMode: data?.settings?.widthMode ?? "standard",
            fontScale: data?.settings?.fontScale ?? "default",
          }),
        );
      } catch (err) {
        if (!cancelled) {
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
  }, [id]);

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
              <Link to="/">Voltar ao dashboard</Link>.
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
              <Link to="/">Voltar ao dashboard</Link>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleChange = (next) => {
    setSettings(next);
    saveSettings(id, next);
  };

  return (
    <>
      {!shared && (
        <nav className="report-backnav">
          <Link to="/">
            <ArrowLeft size={12} aria-hidden="true" /> Relatórios
          </Link>
        </nav>
      )}
      <div className="report-topnav">
        <ShareButton reportId={report.id} />
      </div>
      <ReportView report={report} settings={settings} />
      {!shared && <SettingsPanel settings={settings} onChange={handleChange} />}
    </>
  );
}
