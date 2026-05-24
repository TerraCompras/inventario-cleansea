import { useState, useEffect, useRef } from "react";
import { supabase } from "./lib/supabase";

const PORTAL_URL = "https://clean-sea-portal.vercel.app";

const ESTADOS_COLOR = {
  "Disponible":          { bg: "#D1FAE5", color: "#065F46", border: "#A7F3D0" },
  "En uso":              { bg: "#DBEAFE", color: "#1E40AF", border: "#BFDBFE" },
  "Fuera de servicio":   { bg: "#FEE2E2", color: "#991B1B", border: "#FECACA" },
  "Falta mantenimiento": { bg: "#FEF3C7", color: "#92400E", border: "#FDE68A" },
};

const CATEGORIAS_COLOR = {
  "Barreras":       "#1A7A6E",
  "Bombas":         "#235C96",
  "Absorbente":     "#7C3AED",
  "Almacenamiento": "#854F0B",
  "Skimmers":       "#0E7490",
  "Mangueras":      "#C05621",
  "Otros":          "#4B5563",
};

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --navy: #213363; --blue: #235C96; --green: #1A7A6E;
  --mid: #6381A7; --light: #A5B5CC;
  --bg: #EEF2F7; --surface: #FFFFFF; --border: #D6E0ED;
  --text: #213363; --muted: #6381A7;
  --sans: 'Montserrat', sans-serif; --mono: 'DM Mono', monospace;
}
body { font-family: var(--sans); background: var(--bg); color: var(--text); min-height: 100vh; }

.header {
  background: var(--navy); padding: 0 40px; display: flex; align-items: center;
  justify-content: space-between; height: 64px;
  box-shadow: 0 2px 12px rgba(33,51,99,.2); position: sticky; top: 0; z-index: 10;
}
.header-brand { display: flex; align-items: center; gap: 12px; }
.header-logo { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(255,255,255,.2); }
.header-main { font-size: 13px; font-weight: 700; color: #fff; letter-spacing: 1.5px; text-transform: uppercase; }
.header-sub { font-size: 9px; color: rgba(255,255,255,.45); letter-spacing: .5px; font-family: var(--mono); margin-top: 1px; }
.back-btn {
  background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.2);
  color: rgba(255,255,255,.7); font-family: var(--sans); font-size: 10px; font-weight: 600;
  padding: 5px 12px; border-radius: 6px; cursor: pointer; transition: all .15s;
}
.back-btn:hover { background: rgba(255,255,255,.2); color: #fff; }

.hero {
  background: linear-gradient(135deg, var(--navy) 0%, #1a2a5e 50%, #0f3d38 100%);
  padding: 40px 40px 36px; position: relative; overflow: hidden;
}
.hero::before { content: ''; position: absolute; top: -60px; right: -60px; width: 300px; height: 300px; border-radius: 50%; background: rgba(26,122,110,.2); pointer-events: none; }
.hero-content { position: relative; z-index: 1; }
.hero-eyebrow { font-family: var(--mono); font-size: 10px; letter-spacing: 3px; color: rgba(255,255,255,.4); text-transform: uppercase; margin-bottom: 8px; }
.hero-title { font-size: 28px; font-weight: 800; color: #fff; margin-bottom: 24px; }
.hero-title span { color: #6EE7DE; }

.kpis { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; }
@media (max-width: 1100px) { .kpis { grid-template-columns: repeat(3, 1fr); } }
.kpi { background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.12); border-radius: 12px; padding: 16px 20px; }
.kpi-label { font-family: var(--mono); font-size: 9px; letter-spacing: 1.5px; color: rgba(255,255,255,.45); text-transform: uppercase; margin-bottom: 8px; }
.kpi-value { font-family: var(--mono); font-size: 28px; font-weight: 700; color: #fff; }
.kpi-sub { font-size: 10px; color: rgba(255,255,255,.35); margin-top: 4px; }
.kpi.green .kpi-value { color: #6EE7DE; }
.kpi.red   .kpi-value { color: #FCA5A5; }
.kpi.yellow .kpi-value { color: #FCD34D; }
.kpi.blue  .kpi-value { color: #93C5FD; }

.content-top { padding: 32px 40px 20px; }
.section-label {
  font-family: var(--mono); font-size: 9px; letter-spacing: 2.5px; color: var(--muted);
  text-transform: uppercase; margin-bottom: 16px; display: flex; align-items: center; gap: 10px;
}
.section-label::after { content: ''; flex: 1; height: 1px; background: var(--border); }

.toolbar {
  background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
  padding: 16px 20px; display: flex; gap: 12px; flex-wrap: wrap; align-items: center;
}
.search-box {
  flex: 1; min-width: 220px; padding: 8px 14px; border: 1px solid var(--border);
  border-radius: 8px; font-family: var(--sans); font-size: 12px; color: var(--text);
  outline: none; transition: border-color .15s;
}
.search-box:focus { border-color: var(--blue); }
.filter-select {
  padding: 8px 12px; border: 1px solid var(--border); border-radius: 8px;
  font-family: var(--sans); font-size: 12px; color: var(--text);
  background: #fff; outline: none; cursor: pointer; min-width: 150px;
}
.filter-select:focus { border-color: var(--blue); }
.toolbar-right { display: flex; align-items: center; gap: 10px; margin-left: auto; }
.count-badge {
  font-family: var(--mono); font-size: 10px; color: var(--muted);
  background: #F0F4F8; border: 1px solid var(--border); padding: 4px 10px; border-radius: 6px;
}
.clear-btn {
  font-family: var(--sans); font-size: 11px; font-weight: 600;
  color: var(--blue); background: none; border: 1px solid var(--border);
  padding: 6px 12px; border-radius: 6px; cursor: pointer; transition: all .15s;
}
.clear-btn:hover { background: #F0F4F8; }

.scroll-top-bar { overflow-x: auto; width: 100%; background: var(--surface); border-top: 1px solid var(--border); }
.scroll-top-bar-inner { height: 12px; }
.table-outer { overflow-x: auto; width: 100%; background: var(--surface); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
table { min-width: 1300px; width: 100%; border-collapse: collapse; }
thead { background: #F8FAFC; }
th {
  font-family: var(--mono); font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase;
  color: var(--muted); padding: 12px 16px; text-align: left; border-bottom: 1px solid var(--border);
  white-space: nowrap;
}
td { padding: 11px 16px; border-bottom: 1px solid #F0F4F8; font-size: 12px; color: var(--text); vertical-align: middle; }
tr:last-child td { border-bottom: none; }
tr:hover td { background: #F8FAFC; }

.badge-estado {
  display: inline-block; font-family: var(--mono); font-size: 9px; font-weight: 700;
  padding: 3px 8px; border-radius: 4px; letter-spacing: .3px; white-space: nowrap;
}
.badge-cat {
  display: inline-block; font-family: var(--mono); font-size: 9px; font-weight: 600;
  padding: 2px 8px; border-radius: 4px; white-space: nowrap;
}
.foto-link { color: var(--blue); text-decoration: none; font-size: 11px; }
.foto-link:hover { text-decoration: underline; }
.cell-modelo { max-width: 200px; }
.cell-comentarios { max-width: 200px; color: var(--muted); font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cell-num { font-family: var(--mono); font-size: 11px; color: var(--muted); }

.pagination {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 40px; border-top: 1px solid var(--border); background: #F8FAFC;
  margin-bottom: 40px;
}
.page-info { font-family: var(--mono); font-size: 10px; color: var(--muted); }
.page-btns { display: flex; gap: 6px; align-items: center; }
.page-btn {
  font-family: var(--sans); font-size: 11px; font-weight: 600;
  padding: 5px 12px; border-radius: 6px; cursor: pointer; transition: all .15s;
  border: 1px solid var(--border); background: #fff; color: var(--navy);
}
.page-btn:hover:not(:disabled) { background: var(--navy); color: #fff; border-color: var(--navy); }
.page-btn:disabled { opacity: .4; cursor: not-allowed; }
.page-btn.active { background: var(--navy); color: #fff; border-color: var(--navy); }

.loading { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--navy); }
.loading-text { font-family: var(--mono); font-size: 11px; color: rgba(255,255,255,.4); letter-spacing: 2px; text-transform: uppercase; }
.empty { padding: 60px 20px; text-align: center; color: var(--muted); font-size: 13px; }
`;

export default function App() {
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch]       = useState("");
  const [filtCat, setFiltCat]     = useState("");
  const [filtBase, setFiltBase]   = useState("");
  const [filtEst, setFiltEst]     = useState("");
  const [page, setPage]           = useState(1);
  const [pageSize, setPageSize]   = useState(50);

  const scrollTopRef    = useRef(null);
  const scrollBottomRef = useRef(null);
  const syncingRef      = useRef(false);

  // Sincronizar scroll superior e inferior
  useEffect(() => {
    const top = scrollTopRef.current;
    const bot = scrollBottomRef.current;
    if (!top || !bot) return;

    // Ajustar ancho del div fantasma al ancho real de la tabla
    const table = bot.querySelector("table");
    if (table) {
      const inner = top.querySelector(".scroll-top-bar-inner");
      if (inner) inner.style.width = table.scrollWidth + "px";
    }

    const onTopScroll = () => {
      if (syncingRef.current) return;
      syncingRef.current = true;
      bot.scrollLeft = top.scrollLeft;
      syncingRef.current = false;
    };
    const onBotScroll = () => {
      if (syncingRef.current) return;
      syncingRef.current = true;
      top.scrollLeft = bot.scrollLeft;
      syncingRef.current = false;
    };

    top.addEventListener("scroll", onTopScroll);
    bot.addEventListener("scroll", onBotScroll);
    return () => {
      top.removeEventListener("scroll", onTopScroll);
      bot.removeEventListener("scroll", onBotScroll);
    };
  }, [pageItems]);

  const loadItems = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const { data, error } = await supabase
        .from("inventario_items")
        .select("*")
        .order("item_numero", { ascending: true });
      if (error) throw error;
      setItems(data || []);
    } catch (e) {
      setLoadError("Error al cargar el inventario: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadItems(); }, []);
  useEffect(() => { setPage(1); }, [search, filtCat, filtBase, filtEst, pageSize]);

  const filtered = items.filter(it => {
    const q = search.toLowerCase();
    const matchSearch = !q || [it.modelo, it.fabricante, it.comentarios, it.terminal]
      .some(f => f && f.toLowerCase().includes(q));
    const matchCat  = !filtCat  || it.categoria === filtCat;
    const matchBase = !filtBase || it.ubicacion === filtBase;
    const matchEst  = !filtEst  || it.estado === filtEst;
    return matchSearch && matchCat && matchBase && matchEst;
  });

  const total       = items.length;
  const disponibles = items.filter(i => i.estado === "Disponible").length;
  const enUso       = items.filter(i => i.estado === "En uso").length;
  const fueraServ   = items.filter(i => i.estado === "Fuera de servicio").length;
  const faltaMant   = items.filter(i => i.estado === "Falta mantenimiento").length;

  const categorias  = [...new Set(items.map(i => i.categoria).filter(Boolean))].sort();
  const bases       = [...new Set(items.map(i => i.ubicacion).filter(Boolean))].sort();
  const estados     = [...new Set(items.map(i => i.estado).filter(Boolean))].sort();

  const totalPages  = Math.ceil(filtered.length / pageSize);
  const pageItems   = filtered.slice((page - 1) * pageSize, page * pageSize);

  const clearFilters = () => {
    setSearch(""); setFiltCat(""); setFiltBase(""); setFiltEst(""); setPage(1);
  };



  if (loading) return (
    <div className="loading">
      <style>{CSS}</style>
      <div className="loading-text">Cargando inventario...</div>
    </div>
  );

  if (loadError) return (
    <div className="loading">
      <style>{CSS}</style>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#FCA5A5", letterSpacing: 1, marginBottom: 16 }}>{loadError}</div>
        <button onClick={loadItems} style={{ fontFamily: "var(--sans)", fontSize: 12, padding: "8px 20px", borderRadius: 8, border: "1px solid rgba(255,255,255,.2)", background: "rgba(255,255,255,.1)", color: "#fff", cursor: "pointer" }}>Reintentar</button>
      </div>
    </div>
  );

  return (
    <>
      <style>{CSS}</style>

      <header className="header">
        <div className="header-brand">
          <img src="/CS.png" alt="Clean Sea" className="header-logo" />
          <div>
            <div className="header-main">Clean Sea · Inventario</div>
            <div className="header-sub">Equipamiento de respuesta a derrames</div>
          </div>
        </div>
        <button className="back-btn" onClick={() => window.open(PORTAL_URL, "_self")}>
          ← Volver al portal
        </button>
      </header>

      <div className="hero">
        <div className="hero-content">
          <div className="hero-eyebrow">Sistema de inventario</div>
          <h1 className="hero-title">Equipamiento <span>operativo</span></h1>
          <div className="kpis">
            <div className="kpi">
              <div className="kpi-label">Total ítems</div>
              <div className="kpi-value">{total}</div>
              <div className="kpi-sub">registros activos</div>
            </div>
            <div className="kpi green">
              <div className="kpi-label">Disponibles</div>
              <div className="kpi-value">{disponibles}</div>
              <div className="kpi-sub">{total ? Math.round(disponibles / total * 100) : 0}% del total</div>
            </div>
            <div className="kpi blue">
              <div className="kpi-label">En uso</div>
              <div className="kpi-value">{enUso}</div>
              <div className="kpi-sub">desplegados</div>
            </div>
            <div className="kpi yellow">
              <div className="kpi-label">Falta mant.</div>
              <div className="kpi-value">{faltaMant}</div>
              <div className="kpi-sub">requieren atención</div>
            </div>
            <div className="kpi red">
              <div className="kpi-label">Fuera servicio</div>
              <div className="kpi-value">{fueraServ}</div>
              <div className="kpi-sub">no operativos</div>
            </div>
          </div>
        </div>
      </div>

      <div className="content-top">
        <div className="section-label">Inventario completo</div>
        <div className="toolbar">
          <input
            className="search-box"
            placeholder="Buscar por modelo, fabricante, terminal, comentarios..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="filter-select" value={filtBase} onChange={e => setFiltBase(e.target.value)}>
            <option value="">Todas las bases</option>
            {bases.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select className="filter-select" value={filtCat} onChange={e => setFiltCat(e.target.value)}>
            <option value="">Todas las categorías</option>
            {categorias.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="filter-select" value={filtEst} onChange={e => setFiltEst(e.target.value)}>
            <option value="">Todos los estados</option>
            {estados.map(est => <option key={est} value={est}>{est}</option>)}
          </select>
          <div className="toolbar-right">
            <span className="count-badge">{filtered.length} resultados</span>
            <select className="filter-select" style={{ minWidth: 120 }} value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
              {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n} por página</option>)}
            </select>
            {(search || filtCat || filtBase || filtEst) &&
              <button className="clear-btn" onClick={clearFilters}>Limpiar filtros</button>
            }
          </div>
        </div>
      </div>

      {/* Barra de scroll superior sincronizada */}
      <div className="scroll-top-bar" ref={scrollTopRef}>
        <div className="scroll-top-bar-inner" style={{ minWidth: 1300 }} />
      </div>

      <div className="table-outer" ref={scrollBottomRef}>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Categoría</th>
              <th>Base</th>
              <th>Fabricante</th>
              <th>Modelo / Descripción</th>
              <th>Cant.</th>
              <th>Metros</th>
              <th>Condición</th>
              <th>Estado</th>
              <th>Terminal</th>
              <th>Comentarios</th>
              <th>Foto</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 && (
              <tr><td colSpan={12} className="empty">No se encontraron resultados</td></tr>
            )}
            {pageItems.map(it => {
              const estCol = ESTADOS_COLOR[it.estado] || { bg: "#F3F4F6", color: "#6B7280", border: "#E5E7EB" };
              const catCol = CATEGORIAS_COLOR[it.categoria] || "#4B5563";
              return (
                <tr key={it.id}>
                  <td className="cell-num">{it.item_numero ?? "—"}</td>
                  <td>
                    <span className="badge-cat" style={{ background: `${catCol}18`, color: catCol, border: `1px solid ${catCol}30` }}>
                      {it.categoria || "—"}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{it.ubicacion || "—"}</td>
                  <td style={{ color: "var(--muted)" }}>{it.fabricante || "—"}</td>
                  <td className="cell-modelo">{it.modelo || "—"}</td>
                  <td className="cell-num" style={{ textAlign: "center" }}>{it.cantidad ?? "—"}</td>
                  <td className="cell-num" style={{ textAlign: "center" }}>{it.metros != null ? `${it.metros}m` : "—"}</td>
                  <td style={{ color: "var(--muted)", fontSize: 11 }}>{it.condicion || "—"}</td>
                  <td>
                    <span className="badge-estado" style={{ background: estCol.bg, color: estCol.color, border: `1px solid ${estCol.border}` }}>
                      {it.estado || "—"}
                    </span>
                  </td>
                  <td style={{ fontSize: 11 }}>{it.terminal || "—"}</td>
                  <td className="cell-comentarios" title={it.comentarios}>{it.comentarios || "—"}</td>
                  <td>
                    {it.foto_url
                      ? <a className="foto-link" href={it.foto_url} target="_blank" rel="noreferrer">Ver foto →</a>
                      : <span style={{ color: "var(--muted)", fontSize: 11 }}>—</span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <span className="page-info">
            Mostrando {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} de {filtered.length}
          </span>
          <div className="page-btns">
            <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>← Anterior</button>
            {(() => {
              const pgNums = [];
              const pgLeft  = Math.max(2, page - 2);
              const pgRight = Math.min(totalPages - 1, page + 2);
              pgNums.push(1);
              if (pgLeft > 2) pgNums.push("dots-l");
              for (let n = pgLeft; n <= pgRight; n++) pgNums.push(n);
              if (pgRight < totalPages - 1) pgNums.push("dots-r");
              if (totalPages > 1) pgNums.push(totalPages);
              return pgNums.map(p =>
                typeof p === "string"
                  ? <span key={p} style={{ padding: "5px 4px", fontSize: 11, color: "var(--muted)" }}>…</span>
                  : <button key={p} className={"page-btn" + (page === p ? " active" : "")} onClick={() => setPage(p)}>{p}</button>
              );
            })()}
            <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>Siguiente →</button>
          </div>
        </div>
      )}
    </>
  );
}
