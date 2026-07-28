import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getReport } from "../lib/registry.js";
import { applyTheme } from "../lib/theme.js";
import {
  persistViewerSettings,
  resolveViewerSettings,
} from "../lib/publication.js";
import { useAppTheme } from "../context/ThemeContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import PublicationRenderer from "../components/PublicationRenderer.jsx";
import PublicationState from "../components/PublicationState.jsx";
import SettingsPanel, {
  REFERENCE_SETTINGS_FEATURES,
} from "../components/SettingsPanel.jsx";
import ShareButton from "../components/ShareButton.jsx";
import {
  getPublicationKind,
  publicationListPath,
} from "../lib/publicationKinds.js";

export default function ReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const guestView = !user;
  const { appTheme } = useAppTheme();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [settings, setSettings] = useState(() => resolveViewerSettings(null, null));

  useEffect(() => {
    let cancelled = false;

    async function loadReport() {
      try {
        setLoading(true);
        setError(null);
        const data = await getReport(id);
        if (cancelled) return;
        setReport(data);
        setSettings(resolveViewerSettings(id, data?.settings, !guestView));

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
      <PublicationState
        eyebrow="Carregando publicação"
        title="Carregando..."
        message="Buscando o conteúdo."
      />
    );
  }

  if (error) {
    return (
      <PublicationState
        eyebrow="Erro ao carregar"
        title="Não foi possível abrir"
        message="A API não respondeu como esperado."
        backTo={user ? "/" : undefined}
        backLabel="Voltar ao início"
      />
    );
  }

  if (!report) {
    return (
      <PublicationState
        eyebrow="Publicação não encontrada"
        title="404"
        message={`Nenhum conteúdo com o id ${id}.`}
        backTo={user ? "/" : undefined}
        backLabel="Voltar ao início"
      />
    );
  }

  const handleChange = (next) => {
    setSettings(persistViewerSettings(id, next, !guestView));
  };
  const listKind = getPublicationKind(report.renderMode);

  return (
    <>
      {!guestView && (
        <nav className={`report-backnav${report.renderMode === "reference" ? " report-backnav--reference" : ""}`}>
          <Link to={publicationListPath(report.renderMode)}>
            <ArrowLeft size={12} aria-hidden="true" /> {listKind.title}
          </Link>
        </nav>
      )}
      {!guestView && (
        <div className="report-topnav">
          <ShareButton reportId={report.id} />
        </div>
      )}
      <PublicationRenderer publication={report} settings={settings} />
      {!guestView && (
        <SettingsPanel
          settings={settings}
          onChange={handleChange}
          title={report.renderMode === "reference" ? "Personalizar referência" : undefined}
          features={report.renderMode === "reference" ? REFERENCE_SETTINGS_FEATURES : undefined}
          variant={report.renderMode === "reference" ? "reference" : undefined}
        />
      )}
    </>
  );
}
