import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PublicationRenderer from "../components/PublicationRenderer.jsx";
import PublicationState from "../components/PublicationState.jsx";
import { applyTheme } from "../lib/theme.js";
import {
  normalizePublication,
  resolveViewerSettings,
} from "../lib/publication.js";
import { useAppTheme } from "../context/ThemeContext.jsx";

export default function SharedReport() {
  const { token } = useParams();
  const { appTheme } = useAppTheme();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [settings, setSettings] = useState(() => resolveViewerSettings(null, null));

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
        setReport(data.content
          ? normalizePublication(data.content, {
              id: data.slug,
              updatedAt: data.updatedAt,
              _sourceAccessToken: token,
            })
          : null);
        setSettings(resolveViewerSettings(null, data.content?.settings));
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
    return <PublicationState eyebrow="Carregando publicação" title="Carregando..." />;
  }

  if (error) {
    return (
      <PublicationState
        eyebrow="Erro"
        title="Link inválido ou expirado"
        message="Este link não foi encontrado. Pode ter sido removido ou o conteúdo foi excluído."
      />
    );
  }

  if (!report) return null;

  return <PublicationRenderer publication={report} settings={settings} />;
}
