"use client";
import { useEffect, useState } from "react";
import { BarChart3, Download } from "lucide-react";

import { useAccountAccess } from "@/components/premium/access-provider";
import { PremiumBanner } from "@/components/premium/premium-banner";
import { PremiumGate } from "@/components/premium/premium-gate";
import { LinkFavicon } from "@/components/link-favicon";
type Totals = {
  visits: number;
  visitors: number;
  clicks: number;
  engaged_visitors?: number;
};
type Report = {
  conversionAvailable?: boolean;
  conversionStartedAt?: string;
  comparisonAvailable: boolean;
  pro: boolean;
  timezone: string;
  start: string;
  end: string;
  live: number | null;
  overview: { current: Totals; previous?: Totals };
  timeline: (Totals & { bucket: string })[];
  links: {
    id: string;
    title: string;
    url: string | null;
    provider: string;
    content_type: string;
    clicks: number;
    plays: number;
    views: number;
  }[];
  dimensions: { dimension: string; label: string; count: number }[];
  campaigns: {
    campaign: string;
    visits: number;
    visitors: number;
    clicks: number;
  }[];
};
const panel = "rounded-2xl border border-white/[.12] bg-card/95 p-5 sm:p-6";
const controls =
  "rounded-xl border border-white/15 bg-card px-3 py-2 text-sm text-white";
const num = (n: number) => n.toLocaleString("es-DO");
const ctr = (t: Totals) => (t.visitors ? (t.clicks / t.visitors) * 100 : 0);

export function AnalyticsDashboard() {
  const { access } = useAccountAccess();
  const [range, setRange] = useState("7");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [metric, setMetric] = useState<"visits" | "visitors" | "clicks">(
    "visits",
  );
  const [timezone, setTimezone] = useState("UTC");
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [query, setQuery] = useState("");
  useEffect(() => {
    if (access && !access.has_premium && ["30", "90", "custom"].includes(range))
      setRange("7");
  }, [access, range]);
  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const now = new Date();
    let end = now;
    let start = new Date(now.getTime() - Number(range) * 86400000);
    if (range === "today" || range === "yesterday") {
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      if (range === "yesterday") {
        end = new Date(start);
        start.setDate(start.getDate() - 1);
      }
    }
    if (range === "custom") {
      if (!customStart || !customEnd) {
        setReport(null);
        setLoading(false);
        return;
      }
      start = new Date(`${customStart}T00:00:00`);
      end = new Date(`${customEnd}T00:00:00`);
      end.setDate(end.getDate() + 1);
      if (end > now) end = now;
    }
    if (!Number.isFinite(start.getTime()) || end <= start) {
      setError(true);
      setLoading(false);
      return;
    }
    // Hourly summaries use explicit hour boundaries; the last hour is partial.
    start.setUTCMinutes(0, 0, 0);
    end = new Date(Math.ceil(end.getTime() / 3600000) * 3600000);
    if (/^\d+$/.test(range))
      start = new Date(end.getTime() - Number(range) * 86400000);
    const params = new URLSearchParams({
      start: start.toISOString(),
      end: end.toISOString(),
      timezone,
    });
    setQuery(params.toString());
    setLoading(true);
    setError(false);
    fetch(`/api/analytics?${params}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        setReport(await response.json());
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [range, customStart, customEnd, retry, timezone, access?.has_premium]);
  const current = report?.overview.current;
  const previous = report?.overview.previous;
  const topLink = report?.links.reduce<Report["links"][number] | null>(
    (best, link) => (!best || link.clicks > best.clicks ? link : best),
    null,
  );
  const maximum = Math.max(
    1,
    ...(report?.timeline.map((t) => t[metric]) ?? []),
  );
  return (
    <section id="analytics" className="min-w-0 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-display text-3xl font-black">
            <BarChart3 className="text-lime" />
            Analytics
          </h1>
          <p className="mt-2 text-sm text-white/45">
            Entiende tu tráfico y descubre qué enlaces generan interés.
          </p>
        </div>
        {report?.pro && (
          <a className={controls} href={`/api/analytics?${query}&format=csv`}>
            <Download size={15} className="mr-2 inline" />
            Exportar CSV
          </a>
        )}
      </div>
      <PremiumBanner access={access} />
      <div className="flex flex-wrap gap-2">
        {[
          ["today", "Hoy"],
          ["yesterday", "Ayer"],
          ["7", "7 días"],
          ["30", "30 días"],
          ["90", "90 días"],
          ["custom", "Personalizado"],
        ].map(([value, label]) => (
          <button
            key={value}
            disabled={
              report !== null &&
              !report.pro &&
              ["30", "90", "custom"].includes(value)
            }
            aria-pressed={range === value}
            onClick={() => setRange(value)}
            className={`${controls} disabled:opacity-30 ${range === value ? "border-lime text-lime" : ""}`}
          >
            {label}
          </button>
        ))}
      </div>
      {range === "custom" && (
        <div className="flex flex-wrap gap-3">
          <label>
            Desde{" "}
            <input
              aria-label="Fecha inicial"
              className={controls}
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
            />
          </label>
          <label>
            Hasta{" "}
            <input
              aria-label="Fecha final"
              className={controls}
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
            />
          </label>
        </div>
      )}
      {range === "custom" && (!customStart || !customEnd) && (
        <p className="text-sm text-white/45">
          Selecciona ambas fechas para consultar el período.
        </p>
      )}
      <p className="text-xs text-white/40">
        Zona horaria: {timezone}. Visitas = sesiones; visitantes =
        identificadores anónimos estimados. Historial Free: 7 días; Premium:
        hasta 90 días por consulta.
      </p>
      {loading ? (
        <div
          aria-label="Cargando estadísticas"
          className="grid animate-pulse gap-4 sm:grid-cols-4"
        >
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`${panel} h-28 bg-white/5`} />
          ))}
        </div>
      ) : error ? (
        <div role="alert" className={panel}>
          <p>
            No pudimos cargar las estadísticas. Comprueba que el rango esté
            dentro de tu historial disponible.
          </p>
          <button
            className={`${controls} mt-4`}
            onClick={() => setRetry(retry + 1)}
          >
            Reintentar
          </button>
        </div>
      ) : (
        report &&
        current && (
          <>
            {!current.visits && !current.clicks && (
              <div className={panel}>
                <h2 className="font-bold">
                  Tus estadísticas aparecerán aquí cuando recibas visitas.
                </h2>
                <p className="mt-2 text-sm text-white/45">
                  Comparte tu página para empezar a medir. Analytics 2.0
                  registra datos desde su activación; tus contadores anteriores
                  siguen en el resumen.
                </p>
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className={panel}>
                <p className="text-sm text-white/65">Enlace líder</p>
                <p className="mt-2 truncate text-xl font-semibold">
                  {topLink?.clicks ? topLink.title : "Aún sin clics"}
                </p>
                <p className="mt-2 text-xs text-white/60">
                  {topLink?.clicks
                    ? `${num(topLink.clicks)} clics · ${current.clicks ? ((topLink.clicks / current.clicks) * 100).toFixed(1) : 0}% de tus clics`
                    : "Comparte tu página para descubrir qué interesa más."}
                </p>
              </div>
              <div className={panel}>
                <p className="text-sm text-white/65">
                  Visitantes que hicieron clic
                </p>
                <p className="mt-2 text-3xl font-semibold">
                  {report.conversionAvailable && current.visitors
                    ? (
                        ((current.engaged_visitors ?? 0) / current.visitors) *
                        100
                      ).toFixed(1) + "%"
                    : "—"}
                </p>
                <p className="mt-2 text-xs text-white/60">
                  {report.conversionAvailable
                    ? `${num(current.engaged_visitors ?? 0)} de ${num(current.visitors)} visitantes. Cada visitante cuenta una vez.`
                    : `Disponible para períodos completos desde ${report.conversionStartedAt ? new Date(report.conversionStartedAt).toLocaleString("es-DO") : "la activación de esta métrica"}.`}
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {(
                [
                  ["visits", "Visitas"],
                  ["visitors", "Visitantes únicos"],
                  ["clicks", "Clics"],
                  ["ctr", "Clics por visitante"],
                ] as const
              ).map(([key, label]) => {
                const value = key === "ctr" ? ctr(current) : current[key];
                const old = previous
                  ? key === "ctr"
                    ? ctr(previous)
                    : previous[key]
                  : 0;
                const valid =
                  report.comparisonAvailable &&
                  previous &&
                  previous.visits >= 10 &&
                  current.visits >= 10 &&
                  old > 0;
                return (
                  <div className={panel} key={key}>
                    <p
                      className="text-sm text-white/50"
                      title={
                        key === "ctr"
                          ? "Promedio de clics por visitante. Una persona puede hacer varios clics."
                          : undefined
                      }
                    >
                      {label}
                      {key === "ctr" ? " ⓘ" : ""}
                    </p>
                    <p className="mt-2 text-3xl font-black">
                      {key === "ctr"
                        ? current.visitors
                          ? (value / 100).toFixed(1)
                          : "—"
                        : num(value)}
                    </p>
                    <p className="mt-2 text-xs text-white/45">
                      {valid
                        ? `${value >= old ? "+" : ""}${(((value - old) / old) * 100).toFixed(1)}% vs. período anterior (${key === "ctr" ? (old / 100).toFixed(1) : num(old)})`
                        : "Datos insuficientes para comparar"}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className={panel}>
              <div className="flex flex-wrap justify-between gap-3">
                <h2 className="font-bold">Tráfico a lo largo del tiempo</h2>
                <select
                  aria-label="Métrica del gráfico"
                  className={controls}
                  value={metric}
                  onChange={(e) =>
                    setMetric(
                      e.target.value as "visits" | "visitors" | "clicks",
                    )
                  }
                >
                  <option value="visits">Visitas</option>
                  <option value="visitors">Visitantes</option>
                  <option value="clicks">Clics</option>
                </select>
              </div>
              <div
                className="mt-6 flex h-44 items-end gap-px"
                role="img"
                aria-label={`Gráfico de ${metric}`}
              >
                {report.timeline.map((t) => (
                  <div
                    key={t.bucket}
                    className="group relative flex h-full min-w-0 flex-1 items-end"
                    title={`${new Date(t.bucket).toLocaleString("es-DO")}: ${num(t[metric])}`}
                  >
                    <div
                      className="w-full rounded-t bg-lime/75"
                      style={{
                        height: `${(t[metric] / maximum) * 100}%`,
                        minHeight: t[metric] ? 2 : 0,
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-between text-xs text-white/40">
                <span>
                  {new Date(report.start).toLocaleDateString("es-DO")}
                </span>
                <span>{new Date(report.end).toLocaleDateString("es-DO")}</span>
              </div>
              <details className="mt-4 text-sm">
                <summary className="cursor-pointer text-white/50">
                  Ver datos del gráfico
                </summary>
                <div className="max-h-60 overflow-y-auto">
                  {report.timeline.map((t) => (
                    <p key={t.bucket} className="flex justify-between py-1">
                      <span>{new Date(t.bucket).toLocaleString("es-DO")}</span>
                      <span>{num(t[metric])}</span>
                    </p>
                  ))}
                </div>
              </details>
            </div>
            <div className={panel}>
              <h2 className="font-bold">Enlaces con más clics</h2>
              {!report.links.length && (
                <p className="mt-3 text-sm text-white/45">
                  Todavía no hay clics en este período.
                </p>
              )}
              {report.links.map((l, i) => (
                <div
                  className="mt-4 flex min-w-0 flex-wrap items-center gap-3 border-b border-white/10 pb-3"
                  key={l.id}
                >
                  <span className="shrink-0">
                    <LinkFavicon url={l.url ?? ""} title={l.title} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">
                      {i + 1}. {l.title}
                    </p>
                    <p className="text-xs text-white/40">
                      {l.provider || "Enlace"} · {l.content_type ?? "Enlace"}
                    </p>
                  </div>
                  <div className="w-full shrink-0 pl-9 text-left sm:w-auto sm:pl-0 sm:text-right">
                    <p>{num(l.clicks)} clics</p>
                    <p className="text-xs text-white/40">
                      {current.clicks
                        ? ((l.clicks / current.clicks) * 100).toFixed(1)
                        : 0}
                      % del total{" "}
                      {report.pro && (
                        <>
                          {" "}
                          ·{" "}
                          {l.views
                            ? ((l.clicks / l.views) * 100).toFixed(1)
                            : "—"}
                          % CTR por vista
                        </>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {report.pro ? (
              <>
                <div className={panel}>
                  <h2 className="font-bold">Smart Media</h2>
                  {report.links
                    .filter(
                      (l) =>
                        [
                          "media",
                          "playlist",
                          "album",
                          "track",
                          "video",
                        ].includes(l.content_type) || l.plays > 0,
                    )
                    .map((l) => (
                      <p
                        className="mt-3 flex flex-wrap justify-between gap-2"
                        key={l.id}
                      >
                        <span>
                          {l.title} · {l.provider} · {l.content_type}
                        </span>
                        <span>
                          {num(l.views)} vistas · {num(l.clicks)} clics ·{" "}
                          {num(l.plays)} reproducciones
                        </span>
                      </p>
                    ))}
                  <p className="mt-3 text-xs text-white/40">
                    Las reproducciones se contabilizan por separado; no se
                    incluyen en CTR.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    ["devices", "Dispositivos"],
                    ["countries", "Países"],
                    ["sources", "Fuentes"],
                    ["browsers", "Navegadores"],
                    ["systems", "Sistemas operativos"],
                    ["hours", "Horas del día"],
                    ["weekdays", "Días de la semana"],
                  ].map(([dimension, label]) => (
                    <div className={panel} key={dimension}>
                      <h2 className="font-bold">{label}</h2>
                      {report.dimensions
                        .filter((d) => d.dimension === dimension)
                        .sort((a, b) => b.count - a.count)
                        .map((d) => (
                          <div className="mt-3" key={d.label}>
                            <p className="flex justify-between text-sm">
                              <span>
                                {dimension === "hours"
                                  ? `${d.label}:00`
                                  : dimension === "weekdays"
                                    ? [
                                        "",
                                        "Lunes",
                                        "Martes",
                                        "Miércoles",
                                        "Jueves",
                                        "Viernes",
                                        "Sábado",
                                        "Domingo",
                                      ][Number(d.label)]
                                    : d.label}
                              </span>
                              <span>
                                {current.visits
                                  ? ((d.count / current.visits) * 100).toFixed(
                                      1,
                                    )
                                  : 0}
                                %
                              </span>
                            </p>
                            <div className="mt-1 h-1 rounded bg-white/10">
                              <div
                                className="h-1 rounded bg-lime/60"
                                style={{
                                  width: `${current.visits ? (d.count / current.visits) * 100 : 0}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      {!current.visits && (
                        <p className="mt-3 text-sm text-white/40">
                          Datos insuficientes.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                <div className={panel}>
                  <h2 className="font-bold">Campañas</h2>
                  {report.campaigns.length ? (
                    report.campaigns.map((c) => (
                      <div
                        key={c.campaign}
                        className="mt-3 flex flex-wrap justify-between gap-2"
                      >
                        <span className="break-all">{c.campaign}</span>
                        <span>
                          {num(c.visits)} visitas · {num(c.clicks)} clics ·{" "}
                          {c.visitors
                            ? ((c.clicks / c.visitors) * 100).toFixed(1)
                            : 0}
                          % CTR
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="mt-3 text-sm text-white/40">
                      Comparte enlaces con utm_campaign para medir campañas.
                      utm_source=qr permite identificar tráfico de QR.
                    </p>
                  )}
                </div>
                <div className={panel}>
                  <h2 className="font-bold">
                    Live · {report.live ?? 0} visitantes activos estimados
                  </h2>
                  <p className="mt-2 text-xs text-white/40">
                    Actividad en los últimos 2 minutos. Actualiza para consultar
                    de nuevo.
                  </p>
                  <button
                    className={`${controls} mt-3`}
                    onClick={() => setRetry(retry + 1)}
                  >
                    Actualizar
                  </button>
                </div>
              </>
            ) : (
              <PremiumGate
                feature="advanced_analytics"
                title="Analytics Premium"
                description="Desbloquea campañas UTM, Smart Media Analytics, fuentes, dispositivos, historial ampliado y exportación CSV."
                access={access}
              />
            )}
          </>
        )
      )}
    </section>
  );
}
