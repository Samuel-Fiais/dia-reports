import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ReportView from "../components/ReportView.jsx";
import { loadSettings, applyTheme } from "../lib/theme.js";
import { useAppTheme } from "../context/ThemeContext.jsx";

export default function SharedReport() {
  const { token } = useParams();
  const { appTheme } = useAppTheme();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [settings, setSettings] = useState({
    colorIndex: 0,
    fontIndex: 0,
    chartStyleIndex: 2,
    widthMode: "standard",
    fontScale: "default",
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/shared/${token}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Falha ao carregar relatorio");
        }
        const data = await res.json();
        if (cancelled) return;
        setReport(data.content ? { ...data.content, id: data.slug, updatedAt: data.updatedAt } : null);
        setSettings({
          colorIndex: data.content?.settings?.colorIndex ?? 0,
          fontIndex: data.content?.settings?.fontIndex ?? 0,
          chartStyleIndex: data.content?.settings?.chartStyleIndex ?? 2,
          widthMode: data.content?.settings?.widthMode ?? "standard",
          fontScale: data.content?.settings?.fontScale ?? "default",
        });
      } catch (err) {
        if (!cancelled) {
          setReport(null);
          setError(err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [token]);

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
              <span className="report-from">Carregando relatorio</span>
            </div>
          </header>
          <h1 className="report-headline">Carregando...</h1>
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
              <span className="report-from">Erro</span>
            </div>
          </header>
          <h1 className="report-headline">Link invalido ou expirado</h1>
          <div className="report-intro">
            <p>Este link de compartilhamento nao foi encontrado. Pode ter sido removido ou o relatorio foi excluido.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <>
      <ReportView report={report} settings={settings} />
      <div className="report-shared-footer">
        <span>The Foreword</span>
      </div>
    </>
  );
}
