// v4.0 - alta, edicion, log de cambios
import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";

const PORTAL_URL = "https://clean-sea-portal.vercel.app";

const ESTADOS_COLOR = {
  "Disponible":          { bg: "#D1FAE5", color: "#065F46", border: "#A7F3D0" },
  "En uso":              { bg: "#DBEAFE", color: "#1E40AF", border: "#BFDBFE" },
  "Fuera de servicio":   { bg: "#FEE2E2", color: "#991B1B", border: "#FECACA" },
  "Falta mantenimiento": { bg: "#FEF3C7", color: "#92400E", border: "#FDE68A" },
};

const FAMILIA_COLOR = {
  "Barrera de Contención":   "#1A7A6E",
  "Bomba":                   "#235C96",
  "Manguera":                "#C05621",
  "Skimmer":                 "#0E7490",
  "Absorbente":              "#7C3AED",
  "Tanque / Almacenamiento": "#854F0B",
  "Power Pack":              "#B45309",
  "Seguridad / EPP":         "#DC2626",
  "Maniobra":                "#1D4ED8",
  "Infraestructura":         "#374151",
  "Equipamiento limpieza":   "#059669",
  "Herramienta / Util":      "#6B7280",
  "Defensa portuaria":       "#0891B2",
  "Vehiculo / Embarcacion":  "#7C3AED",
  "Repuesto / Reparacion":   "#9D174D",
  "Kit de seguridad":        "#B91C1C",
  "Otros / Auxiliares":      "#4B5563",
};

const ESTADOS_OPCIONES = ["Disponible", "En uso", "Fuera de servicio", "Falta mantenimiento"];
const CONDICION_OPCIONES = ["Nuevo", "Usado"];
const PAGE_SIZE_OPTIONS = [25, 50, 100, 200];
const ITEM_VACIO = {
  item_numero: "", categoria: "", ubicacion: "", fabricante: "", modelo: "",
  familia: "", subtipo: "", capacidad: "", combustible: "", obs: "",
  numero_serie: "", cantidad: "", metros: "", condicion: "Usado",
  estado: "Disponible", terminal: "", comentarios: "", foto_url: "",
};

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

.header { background: var(--navy); padding: 0 40px; display: flex; align-items: center; justify-content: space-between; height: 64px; box-shadow: 0 2px 12px rgba(33,51,99,.2); position: sticky; top: 0; z-index: 10; }
.header-brand { display: flex; align-items: center; gap: 12px; }
.header-logo { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(255,255,255,.2); }
.header-main { font-size: 13px; font-weight: 700; color: #fff; letter-spacing: 1.5px; text-transform: uppercase; }
.header-sub { font-size: 9px; color: rgba(255,255,255,.45); letter-spacing: .5px; font-family: var(--mono); margin-top: 1px; }
.back-btn { background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.2); color: rgba(255,255,255,.7); font-family: var(--sans); font-size: 10px; font-weight: 600; padding: 5px 12px; border-radius: 6px; cursor: pointer; transition: all .15s; }
.back-btn:hover { background: rgba(255,255,255,.2); color: #fff; }

.hero { background: linear-gradient(135deg, var(--navy) 0%, #1a2a5e 50%, #0f3d38 100%); padding: 40px 24px 0; position: relative; overflow: hidden; }
.hero::before { content: ''; position: absolute; top: -60px; right: -60px; width: 300px; height: 300px; border-radius: 50%; background: rgba(26,122,110,.2); pointer-events: none; }
.hero-content { position: relative; z-index: 1; }
.hero-eyebrow { font-family: var(--mono); font-size: 10px; letter-spacing: 3px; color: rgba(255,255,255,.4); text-transform: uppercase; margin-bottom: 8px; }
.hero-title { font-size: 28px; font-weight: 800; color: #fff; margin-bottom: 24px; }
.hero-title span { color: #6EE7DE; }

.kpis { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; margin-bottom: 28px; }
@media (max-width: 1100px) { .kpis { grid-template-columns: repeat(3, 1fr); } }
.kpi { background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.12); border-radius: 12px; padding: 16px 20px; }
.kpi-label { font-family: var(--mono); font-size: 9px; letter-spacing: 1.5px; color: rgba(255,255,255,.45); text-transform: uppercase; margin-bottom: 8px; }
.kpi-value { font-family: var(--mono); font-size: 28px; font-weight: 700; color: #fff; }
.kpi-sub { font-size: 10px; color: rgba(255,255,255,.35); margin-top: 4px; }
.kpi.green .kpi-value { color: #6EE7DE; }
.kpi.red   .kpi-value { color: #FCA5A5; }
.kpi.yellow .kpi-value { color: #FCD34D; }
.kpi.blue  .kpi-value { color: #93C5FD; }

.tabs { display: flex; gap: 0; border-top: 1px solid rgba(255,255,255,.1); position: relative; z-index: 1; }
.tab-btn { font-family: var(--sans); font-size: 12px; font-weight: 600; letter-spacing: .3px; padding: 14px 28px; background: none; border: none; color: rgba(255,255,255,.5); cursor: pointer; transition: all .15s; border-bottom: 3px solid transparent; }
.tab-btn:hover { color: rgba(255,255,255,.8); }
.tab-btn.active { color: #6EE7DE; border-bottom-color: #6EE7DE; }

.content-top { padding: 32px 24px 20px; }
.section-label { font-family: var(--mono); font-size: 9px; letter-spacing: 2.5px; color: var(--muted); text-transform: uppercase; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
.section-label::after { content: ''; flex: 1; height: 1px; background: var(--border); }

.toolbar { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px 20px; display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
.search-box { flex: 1; min-width: 220px; padding: 8px 14px; border: 1px solid var(--border); border-radius: 8px; font-family: var(--sans); font-size: 12px; color: var(--text); outline: none; transition: border-color .15s; }
.search-box:focus { border-color: var(--blue); }
.filter-select { padding: 8px 12px; border: 1px solid var(--border); border-radius: 8px; font-family: var(--sans); font-size: 12px; color: var(--text); background: #fff; outline: none; cursor: pointer; min-width: 150px; }
.filter-select:focus { border-color: var(--blue); }
.toolbar-right { display: flex; align-items: center; gap: 10px; margin-left: auto; }
.count-badge { font-family: var(--mono); font-size: 10px; color: var(--muted); background: #F0F4F8; border: 1px solid var(--border); padding: 4px 10px; border-radius: 6px; }
.clear-btn { font-family: var(--sans); font-size: 11px; font-weight: 600; color: var(--blue); background: none; border: 1px solid var(--border); padding: 6px 12px; border-radius: 6px; cursor: pointer; }
.clear-btn:hover { background: #F0F4F8; }
.btn-nuevo { font-family: var(--sans); font-size: 11px; font-weight: 700; color: #fff; background: var(--green); border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; letter-spacing: .3px; white-space: nowrap; }
.btn-nuevo:hover { background: #156057; }

.table-outer { overflow-x: auto; width: 100%; background: var(--surface); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
table { min-width: 1500px; width: 100%; border-collapse: collapse; }
thead { background: #F8FAFC; }
th { font-family: var(--mono); font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--muted); padding: 12px 16px; text-align: left; border-bottom: 1px solid var(--border); white-space: nowrap; }
td { padding: 10px 16px; border-bottom: 1px solid #F0F4F8; font-size: 12px; color: var(--text); vertical-align: middle; }
tr:last-child td { border-bottom: none; }
tr:hover td { background: #F8FAFC; }

.badge-estado { display: inline-block; font-family: var(--mono); font-size: 9px; font-weight: 700; padding: 3px 8px; border-radius: 4px; letter-spacing: .3px; white-space: nowrap; }
.badge-fam { display: inline-block; font-family: var(--mono); font-size: 9px; font-weight: 600; padding: 2px 8px; border-radius: 4px; white-space: nowrap; }
.foto-link { color: var(--blue); text-decoration: none; font-size: 11px; }
.foto-link:hover { text-decoration: underline; }
.cell-long { max-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cell-med { max-width: 130px; font-size: 11px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cell-num { font-family: var(--mono); font-size: 11px; color: var(--muted); }
.btn-edit { font-family: var(--sans); font-size: 10px; font-weight: 600; color: var(--blue); background: none; border: 1px solid var(--border); padding: 4px 10px; border-radius: 6px; cursor: pointer; white-space: nowrap; }
.btn-edit:hover { background: #EFF6FF; border-color: var(--blue); }

.pagination { display: flex; align-items: center; justify-content: space-between; padding: 14px 40px; border-top: 1px solid var(--border); background: #F8FAFC; margin-bottom: 40px; }
.page-info { font-family: var(--mono); font-size: 10px; color: var(--muted); }
.page-btns { display: flex; gap: 6px; align-items: center; }
.page-btn { font-family: var(--sans); font-size: 11px; font-weight: 600; padding: 5px 12px; border-radius: 6px; cursor: pointer; transition: all .15s; border: 1px solid var(--border); background: #fff; color: var(--navy); }
.page-btn:hover:not(:disabled) { background: var(--navy); color: #fff; border-color: var(--navy); }
.page-btn:disabled { opacity: .4; cursor: not-allowed; }
.page-btn.active { background: var(--navy); color: #fff; border-color: var(--navy); }

/* MODAL */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px; }
.modal { background: var(--surface); border-radius: 16px; width: 100%; max-width: 700px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,.3); }
.modal-header { padding: 24px 28px 16px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; background: var(--surface); z-index: 1; }
.modal-title { font-size: 16px; font-weight: 700; color: var(--navy); }
.modal-close { background: none; border: none; font-size: 20px; color: var(--muted); cursor: pointer; padding: 4px 8px; border-radius: 6px; }
.modal-close:hover { background: #F0F4F8; }
.modal-body { padding: 24px 28px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.modal-body .full { grid-column: 1 / -1; }
.modal-footer { padding: 16px 28px 24px; border-top: 1px solid var(--border); display: flex; gap: 12px; justify-content: flex-end; }
.form-group { display: flex; flex-direction: column; gap: 5px; }
.form-label { font-family: var(--mono); font-size: 9px; letter-spacing: 1px; color: var(--muted); text-transform: uppercase; }
.form-input { padding: 9px 12px; border: 1px solid var(--border); border-radius: 8px; font-family: var(--sans); font-size: 12px; color: var(--text); outline: none; background: #fff; width: 100%; }
.form-input:focus { border-color: var(--blue); }
.btn-cancel { font-family: var(--sans); font-size: 12px; font-weight: 600; color: var(--muted); background: none; border: 1px solid var(--border); padding: 9px 20px; border-radius: 8px; cursor: pointer; }
.btn-cancel:hover { background: #F0F4F8; }
.btn-save { font-family: var(--sans); font-size: 12px; font-weight: 700; color: #fff; background: var(--green); border: none; padding: 9px 24px; border-radius: 8px; cursor: pointer; }
.btn-save:hover { background: #156057; }
.btn-save:disabled { opacity: .5; cursor: not-allowed; }
.form-error-inline { background: #FEE2E2; color: #991B1B; border: 1px solid #FECACA; border-radius: 8px; padding: 10px 14px; font-size: 12px; grid-column: 1 / -1; }

/* MOVIMIENTOS */
.mov-content { padding: 32px 40px 60px; }
.mov-grid { display: grid; grid-template-columns: 380px 1fr; gap: 24px; align-items: start; }
@media (max-width: 900px) { .mov-grid { grid-template-columns: 1fr; } }
.form-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 24px; display: flex; flex-direction: column; gap: 16px; }
.form-card-title { font-size: 14px; font-weight: 700; color: var(--navy); }
.form-hint { font-size: 10px; color: var(--muted); margin-top: 2px; }
.btn-primary { width: 100%; padding: 11px; background: var(--green); color: #fff; border: none; border-radius: 8px; font-family: var(--sans); font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-primary:hover { background: #156057; }
.btn-primary:disabled { opacity: .5; cursor: not-allowed; }
.form-success { background: #D1FAE5; color: #065F46; border: 1px solid #A7F3D0; border-radius: 8px; padding: 10px 14px; font-size: 12px; }
.form-error { background: #FEE2E2; color: #991B1B; border: 1px solid #FECACA; border-radius: 8px; padding: 10px 14px; font-size: 12px; }
.mov-table-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
.mov-table-header { padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
.mov-table-title { font-size: 13px; font-weight: 700; color: var(--navy); }
.mov-table-count { font-family: var(--mono); font-size: 10px; color: var(--muted); }
.mov-table { width: 100%; border-collapse: collapse; }
.mov-table th { font-family: var(--mono); font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--muted); padding: 10px 16px; text-align: left; border-bottom: 1px solid var(--border); background: #F8FAFC; white-space: nowrap; }
.mov-table td { padding: 11px 16px; border-bottom: 1px solid #F0F4F8; font-size: 12px; color: var(--text); vertical-align: middle; }
.mov-table tr:last-child td { border-bottom: none; }
.mov-table tr:hover td { background: #F8FAFC; }
.arrow-badge { font-family: var(--mono); font-size: 10px; color: var(--muted); display: flex; align-items: center; gap: 6px; }
.arrow-badge strong { color: var(--navy); }
.mov-empty { padding: 40px 20px; text-align: center; color: var(--muted); font-size: 12px; }

/* HISTORIAL */
.hist-content { padding: 32px 40px 60px; }
.badge-tipo { display: inline-block; font-family: var(--mono); font-size: 8px; font-weight: 700; padding: 2px 7px; border-radius: 4px; white-space: nowrap; letter-spacing: .5px; }
.badge-alta { background: #D1FAE5; color: #065F46; border: 1px solid #A7F3D0; }
.badge-edicion { background: #DBEAFE; color: #1E40AF; border: 1px solid #BFDBFE; }
.badge-movimiento { background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A; }

.loading { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--navy); }
.loading-text { font-family: var(--mono); font-size: 11px; color: rgba(255,255,255,.4); letter-spacing: 2px; text-transform: uppercase; }
.empty { padding: 60px 20px; text-align: center; color: var(--muted); font-size: 13px; }

/* RESPONSIVE */
@media (max-width: 768px) {
  .header { padding: 0 16px; }
  .hero { padding: 24px 16px 0; }
  .hero-title { font-size: 20px; }
  .kpis { grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 16px; }
  .kpi-value { font-size: 22px; }
  .tabs .tab-btn { padding: 12px 14px; font-size: 11px; }
  .content-top { padding: 20px 16px 16px; }
  .toolbar { flex-direction: column; align-items: stretch; gap: 8px; }
  .search-box { min-width: unset; }
  .filter-select { min-width: unset; width: 100%; }
  .toolbar-right { flex-wrap: wrap; margin-left: 0; }
  .count-badge { font-size: 9px; }
  .btn-nuevo { width: 100%; text-align: center; }
  table { min-width: 900px; }
  .pagination { padding: 12px 16px; flex-direction: column; gap: 10px; }
  .mov-content { padding: 20px 16px 40px; }
  .mov-grid { grid-template-columns: 1fr; }
  .hist-content { padding: 20px 16px 40px; }
  .modal { margin: 0; border-radius: 12px; }
  .modal-body { grid-template-columns: 1fr; }
  .modal-body .full { grid-column: 1; }
}
@media (max-width: 480px) {
  .kpis { grid-template-columns: 1fr 1fr; }
  .kpi { padding: 12px 14px; }
  .kpi-value { font-size: 20px; }
  .hero-title { font-size: 18px; }
  table { min-width: 700px; }
}
`;

// ─── MODAL ITEM ───────────────────────────────────────────────────────────────
function ModalItem({ item, onClose, onSaved, usuario }) {
  const esNuevo = !item?.id;
  const [form, setForm]       = useState(item ? { ...item } : { ...ITEM_VACIO });
  const [saving, setSaving]   = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.modelo?.trim()) { setErrorMsg("El modelo/descripción es obligatorio."); return; }
    if (!form.ubicacion?.trim()) { setErrorMsg("La base/ubicación es obligatoria."); return; }
    if (!form.estado) { setErrorMsg("El estado es obligatorio."); return; }

    setSaving(true); setErrorMsg("");
    try {
      const payload = {
        item_numero:  form.item_numero  ? Number(form.item_numero)  : null,
        categoria:    form.categoria    || null,
        ubicacion:    form.ubicacion    || null,
        fabricante:   form.fabricante   || null,
        modelo:       form.modelo       || null,
        familia:      form.familia      || null,
        subtipo:      form.subtipo      || null,
        capacidad:    form.capacidad    || null,
        combustible:  form.combustible  || null,
        obs:          form.obs          || null,
        numero_serie: form.numero_serie || null,
        cantidad:     form.cantidad     ? Number(form.cantidad)     : null,
        metros:       form.metros       ? Number(form.metros)       : null,
        condicion:    form.condicion    || null,
        estado:       form.estado       || null,
        terminal:     form.terminal     || null,
        comentarios:  form.comentarios  || null,
        foto_url:     form.foto_url     || null,
      };

      if (esNuevo) {
        const { data, error } = await supabase.from("inventario_items").insert(payload).select().single();
        if (error) throw error;
        const { error: errLog } = await supabase.from("inventario_cambios").insert({
          item_id: data.id, tipo: "ALTA", campo: null,
          valor_anterior: null, valor_nuevo: form.modelo, usuario,
        });
        if (errLog) console.error("Log ALTA no registrado:", errLog.message);
      } else {
        // Detectar campos modificados para el log
        const cambios = [];
        const camposAuditar = ["modelo","ubicacion","familia","subtipo","capacidad","combustible","estado","condicion","cantidad","metros","numero_serie","comentarios","obs","terminal","fabricante","categoria"];
        for (const campo of camposAuditar) {
          const ant = String(item[campo] ?? "");
          const nvo = String(form[campo] ?? "");
          if (ant !== nvo) cambios.push({ item_id: item.id, tipo: "EDICION", campo, valor_anterior: ant || null, valor_nuevo: nvo || null, usuario });
        }
        const { error } = await supabase.from("inventario_items").update(payload).eq("id", item.id);
        if (error) throw error;
        if (cambios.length > 0) {
          await supabase.from("inventario_cambios").insert(cambios);
        }
      }
      onSaved();
      onClose();
    } catch (e) {
      setErrorMsg("Error al guardar: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const fg = (label, key, type = "text", opts = null) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {opts
        ? <select className="form-input" value={form[key] || ""} onChange={e => set(key, e.target.value)}>
            <option value="">—</option>
            {opts.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        : <input type={type} className="form-input" value={form[key] || ""} onChange={e => set(key, e.target.value)} />
      }
    </div>
  );

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{esNuevo ? "Nuevo ítem" : `Editar ítem #${item.item_numero}`}</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {errorMsg && <div className="form-error-inline">{errorMsg}</div>}
          {fg("Nº Item", "item_numero", "number")}
          {fg("Categoría original", "categoria")}
          {fg("Familia normalizada", "familia")}
          {fg("Subtipo", "subtipo")}
          {fg("Capacidad / Medida", "capacidad")}
          {fg("Combustible / Material", "combustible")}
          <div className="form-group full">
            <label className="form-label">Modelo / Descripción *</label>
            <input className="form-input" value={form.modelo || ""} onChange={e => set("modelo", e.target.value)} />
          </div>
          {fg("Fabricante", "fabricante")}
          {fg("Nº Serie", "numero_serie")}
          {fg("Base / Ubicación *", "ubicacion")}
          {fg("Terminal", "terminal")}
          {fg("Cantidad", "cantidad", "number")}
          {fg("Metros", "metros", "number")}
          {fg("Condición", "condicion", "text", CONDICION_OPCIONES)}
          {fg("Estado *", "estado", "text", ESTADOS_OPCIONES)}
          <div className="form-group full">
            <label className="form-label">Observaciones</label>
            <input className="form-input" value={form.obs || ""} onChange={e => set("obs", e.target.value)} />
          </div>
          <div className="form-group full">
            <label className="form-label">Comentarios</label>
            <input className="form-input" value={form.comentarios || ""} onChange={e => set("comentarios", e.target.value)} />
          </div>
          <div className="form-group full">
            <label className="form-label">URL Foto</label>
            <input className="form-input" value={form.foto_url || ""} onChange={e => set("foto_url", e.target.value)} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-save" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : esNuevo ? "Crear ítem" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TAB INVENTARIO ───────────────────────────────────────────────────────────
function TabInventario({ items, onReload, usuario }) {
  const [search, setSearch]           = useState("");
  const [filtFamilia, setFiltFamilia] = useState("");
  const [filtBase, setFiltBase]       = useState("");
  const [filtEst, setFiltEst]         = useState("");
  const [page, setPage]               = useState(1);
  const [pageSize, setPageSize]       = useState(50);
  const [modalItem, setModalItem]     = useState(null); // null=cerrado, false=nuevo, obj=editar

  useEffect(() => { setPage(1); }, [search, filtFamilia, filtBase, filtEst, pageSize]);

  const filtered = items.filter(it => {
    const q = search.toLowerCase();
    const matchSearch = !q || [it.modelo, it.fabricante, it.comentarios, it.terminal,
      it.ubicacion, it.numero_serie, it.familia, it.subtipo, it.capacidad,
      it.combustible, it.obs, String(it.item_numero || "")]
      .some(f => f && String(f).toLowerCase().includes(q));
    return matchSearch &&
      (!filtFamilia || it.familia === filtFamilia) &&
      (!filtBase    || it.ubicacion === filtBase) &&
      (!filtEst     || it.estado === filtEst);
  });

  const familias   = [...new Set(items.map(i => i.familia).filter(Boolean))].sort();
  const bases      = [...new Set(items.map(i => i.ubicacion).filter(Boolean))].sort();
  const estados    = [...new Set(items.map(i => i.estado).filter(Boolean))].sort();
  const totalPages = Math.ceil(filtered.length / pageSize);
  const pageItems  = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      <div className="content-top">
        <div className="section-label">Inventario completo</div>
        <div className="toolbar">
          <input className="search-box"
            placeholder="Buscar por modelo, familia, subtipo, capacidad, base, Nº serie..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
          <select className="filter-select" value={filtFamilia} onChange={e => setFiltFamilia(e.target.value)}>
            <option value="">Todas las familias</option>
            {familias.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <select className="filter-select" value={filtBase} onChange={e => setFiltBase(e.target.value)}>
            <option value="">Todas las bases</option>
            {bases.map(b => <option key={b} value={b}>{b}</option>)}
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
            {(search || filtFamilia || filtBase || filtEst) &&
              <button className="clear-btn" onClick={() => { setSearch(""); setFiltFamilia(""); setFiltBase(""); setFiltEst(""); setPage(1); }}>Limpiar</button>
            }
            <button className="btn-nuevo" onClick={() => setModalItem(false)}>+ Nuevo ítem</button>
          </div>
        </div>
      </div>

      <div className="table-outer">
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Item</th>
              <th>Familia</th>
              <th>Subtipo</th>
              <th>Capacidad</th>
              <th>Combustible</th>
              <th>Base</th>
              <th>Modelo / Descripción</th>
              <th>Fabricante</th>
              <th>Nº Serie</th>
              <th>Cant.</th>
              <th>Metros</th>
              <th>Condición</th>
              <th>Estado</th>
              <th>Terminal</th>
              <th>Obs</th>
              <th>Comentarios</th>
              <th>Foto</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 && (
              <tr><td colSpan={18} className="empty">No se encontraron resultados</td></tr>
            )}
            {pageItems.map(it => {
              const estCol = ESTADOS_COLOR[it.estado] || { bg: "#F3F4F6", color: "#6B7280", border: "#E5E7EB" };
              const famCol = FAMILIA_COLOR[it.familia] || "#4B5563";
              return (
                <tr key={it.id}>
                  <td><button className="btn-edit" onClick={() => setModalItem(it)}>✏️</button></td>
                  <td className="cell-num">{it.item_numero ?? "—"}</td>
                  <td><span className="badge-fam" style={{ background: `${famCol}18`, color: famCol, border: `1px solid ${famCol}30` }}>{it.familia || "—"}</span></td>
                  <td style={{ fontSize: 11, color: "var(--muted)" }}>{it.subtipo || "—"}</td>
                  <td className="cell-med" title={it.capacidad}>{it.capacidad || "—"}</td>
                  <td style={{ fontSize: 11, color: "var(--muted)" }}>{it.combustible || "—"}</td>
                  <td style={{ fontWeight: 500 }}>{it.ubicacion || "—"}</td>
                  <td className="cell-long" title={it.modelo}>{it.modelo || "—"}</td>
                  <td style={{ color: "var(--muted)", fontSize: 11 }}>{it.fabricante || "—"}</td>
                  <td className="cell-num">{it.numero_serie || "—"}</td>
                  <td className="cell-num" style={{ textAlign: "center" }}>{it.cantidad ?? "—"}</td>
                  <td className="cell-num" style={{ textAlign: "center" }}>{it.metros != null ? `${it.metros}m` : "—"}</td>
                  <td style={{ fontSize: 11, color: "var(--muted)" }}>{it.condicion || "—"}</td>
                  <td><span className="badge-estado" style={{ background: estCol.bg, color: estCol.color, border: `1px solid ${estCol.border}` }}>{it.estado || "—"}</span></td>
                  <td style={{ fontSize: 11 }}>{it.terminal || "—"}</td>
                  <td className="cell-med" title={it.obs}>{it.obs || "—"}</td>
                  <td className="cell-long" title={it.comentarios}>{it.comentarios || "—"}</td>
                  <td>{it.foto_url ? <a className="foto-link" href={it.foto_url} target="_blank" rel="noreferrer">Ver →</a> : <span style={{ color: "var(--muted)", fontSize: 11 }}>—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <span className="page-info">Mostrando {(page-1)*pageSize+1}–{Math.min(page*pageSize, filtered.length)} de {filtered.length}</span>
          <div className="page-btns">
            <button className="page-btn" onClick={() => setPage(p => p-1)} disabled={page===1}>← Anterior</button>
            {(() => {
              const pgNums = []; const pgLeft = Math.max(2,page-2); const pgRight = Math.min(totalPages-1,page+2);
              pgNums.push(1);
              if (pgLeft > 2) pgNums.push("dots-l");
              for (let n=pgLeft; n<=pgRight; n++) pgNums.push(n);
              if (pgRight < totalPages-1) pgNums.push("dots-r");
              if (totalPages > 1) pgNums.push(totalPages);
              return pgNums.map(p => typeof p === "string"
                ? <span key={p} style={{ padding:"5px 4px", fontSize:11, color:"var(--muted)" }}>…</span>
                : <button key={p} className={"page-btn"+(page===p?" active":"")} onClick={()=>setPage(p)}>{p}</button>);
            })()}
            <button className="page-btn" onClick={() => setPage(p => p+1)} disabled={page===totalPages}>Siguiente →</button>
          </div>
        </div>
      )}

      {modalItem !== null && (
        <ModalItem
          item={modalItem === false ? null : modalItem}
          onClose={() => setModalItem(null)}
          onSaved={onReload}
          usuario={usuario}
        />
      )}
    </>
  );
}

// ─── TAB MOVIMIENTOS ──────────────────────────────────────────────────────────
function TabMovimientos({ items, onMovimientoCreado, usuario }) {
  const [movimientos, setMovimientos]       = useState([]);
  const [loadingMov, setLoadingMov]         = useState(true);
  const [saving, setSaving]                 = useState(false);
  const [successMsg, setSuccessMsg]         = useState("");
  const [errorMsg, setErrorMsg]             = useState("");
  const [errorLoad, setErrorLoad]           = useState("");
  const [filtFamilia, setFiltFamilia]       = useState("");
  const [filtSubtipo, setFiltSubtipo]       = useState("");
  const [filtBaseOrigen, setFiltBaseOrigen] = useState("");
  const [itemId, setItemId]                 = useState("");
  const [cantidadMov, setCantidadMov]       = useState(1);
  const [baseDestino, setBaseDestino]       = useState("");
  const [motivo, setMotivo]                 = useState("");

  useEffect(() => { loadMovimientos(); }, []);

  const loadMovimientos = async () => {
    setLoadingMov(true);
    try {
      const { data, error } = await supabase
        .from("inventario_movimientos")
        .select("*, inventario_items(modelo, familia, subtipo, ubicacion)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      setMovimientos(data || []);
    } catch (e) {
      setErrorLoad("Error al cargar el historial: " + e.message);
    } finally {
      setLoadingMov(false);
    }
  };

  const itemsMovibles  = items.filter(i => i.estado === "Disponible" || i.estado === "En uso");
  const familiasCasc   = [...new Set(itemsMovibles.map(i => i.familia).filter(Boolean))].sort();
  const subtiposCasc   = [...new Set(itemsMovibles.filter(i => !filtFamilia || i.familia === filtFamilia).map(i => i.subtipo).filter(Boolean))].sort();
  const basesCasc      = [...new Set(itemsMovibles.filter(i => (!filtFamilia || i.familia === filtFamilia) && (!filtSubtipo || i.subtipo === filtSubtipo)).map(i => i.ubicacion).filter(Boolean))].sort();
  const itemsFiltrados = itemsMovibles.filter(i => (!filtFamilia || i.familia === filtFamilia) && (!filtSubtipo || i.subtipo === filtSubtipo) && (!filtBaseOrigen || i.ubicacion === filtBaseOrigen));
  const itemSeleccionado = items.find(i => i.id === itemId);
  const basesDestino   = [...new Set(items.map(i => i.ubicacion).filter(Boolean))].sort();
  const maxCantidad    = itemSeleccionado ? (itemSeleccionado.numero_serie ? 1 : (itemSeleccionado.cantidad || 1)) : 1;

  const resetFiltros = () => { setFiltFamilia(""); setFiltSubtipo(""); setFiltBaseOrigen(""); setItemId(""); setCantidadMov(1); setBaseDestino(""); setErrorMsg(""); setSuccessMsg(""); };

  const handleSubmit = async () => {
    if (!itemId)      { setErrorMsg("Seleccioná un ítem."); return; }
    if (!baseDestino) { setErrorMsg("Seleccioná la base de destino."); return; }
    if (baseDestino === itemSeleccionado.ubicacion) { setErrorMsg("La base destino no puede ser la misma que la de origen."); return; }
    if (cantidadMov < 1 || cantidadMov > maxCantidad) { setErrorMsg(`Cantidad debe ser entre 1 y ${maxCantidad}.`); return; }

    const snapId = itemId, snapOrigen = itemSeleccionado.ubicacion,
          snapModelo = itemSeleccionado.modelo, snapCantidad = cantidadMov, snapMotivo = motivo;
    setSaving(true); setErrorMsg(""); setSuccessMsg("");
    try {
      const { error: e1 } = await supabase.from("inventario_items").update({ ubicacion: baseDestino }).eq("id", snapId);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("inventario_movimientos").insert({ item_id: snapId, base_origen: snapOrigen, base_destino: baseDestino, cantidad: snapCantidad, motivo: snapMotivo || null, usuario });
      if (e2) throw e2;
      const { error: errLog } = await supabase.from("inventario_cambios").insert({ item_id: snapId, tipo: "MOVIMIENTO", campo: "ubicacion", valor_anterior: snapOrigen, valor_nuevo: baseDestino, usuario });
      if (errLog) console.error("Log MOVIMIENTO no registrado:", errLog.message);
      setSuccessMsg(`✓ Movimiento registrado: ${snapModelo} → ${baseDestino}`);
      resetFiltros(); setMotivo("");
      await loadMovimientos();
      onMovimientoCreado();
    } catch (e) {
      setErrorMsg("Error al registrar movimiento: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mov-content">
      <div className="section-label">Movimientos de equipamiento</div>
      <div className="mov-grid">
        <div className="form-card">
          <div className="form-card-title">Registrar movimiento</div>
          {successMsg && <div className="form-success">{successMsg}</div>}
          {errorMsg   && <div className="form-error">{errorMsg}</div>}

          <div className="form-group">
            <label className="form-label">1. Familia</label>
            <select className="form-input filter-select" value={filtFamilia} onChange={e => { setFiltFamilia(e.target.value); setFiltSubtipo(""); setFiltBaseOrigen(""); setItemId(""); setCantidadMov(1); setErrorMsg(""); setSuccessMsg(""); }}>
              <option value="">Todas las familias...</option>
              {familiasCasc.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">2. Subtipo</label>
            <select className="form-input filter-select" value={filtSubtipo} onChange={e => { setFiltSubtipo(e.target.value); setFiltBaseOrigen(""); setItemId(""); setCantidadMov(1); setErrorMsg(""); setSuccessMsg(""); }} disabled={!filtFamilia}>
              <option value="">{filtFamilia ? "Seleccioná subtipo..." : "Primero elegí familia"}</option>
              {subtiposCasc.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">3. Base de origen</label>
            <select className="form-input filter-select" value={filtBaseOrigen} onChange={e => { setFiltBaseOrigen(e.target.value); setItemId(""); setCantidadMov(1); setErrorMsg(""); setSuccessMsg(""); }} disabled={!filtFamilia}>
              <option value="">{filtFamilia ? "Seleccioná base..." : "Primero elegí familia"}</option>
              {basesCasc.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">4. Ítem específico</label>
            <select className="form-input filter-select" value={itemId} onChange={e => { setItemId(e.target.value); setCantidadMov(1); setErrorMsg(""); setSuccessMsg(""); }} disabled={!filtBaseOrigen}>
              <option value="">{filtBaseOrigen ? (itemsFiltrados.length === 0 ? "Sin ítems disponibles" : "Seleccioná ítem...") : "Primero elegí base"}</option>
              {itemsFiltrados.map(i => <option key={i.id} value={i.id}>#{i.item_numero}{i.numero_serie ? ` — Serie: ${i.numero_serie}` : ""} — {i.modelo?.substring(0,30)} — {i.estado}</option>)}
            </select>
            {filtBaseOrigen && itemsFiltrados.length === 0 && <span className="form-hint" style={{ color:"#991B1B" }}>No hay ítems disponibles.</span>}
          </div>

          {itemSeleccionado && (
            <div style={{ background:"#F0F4F8", border:"1px solid var(--border)", borderRadius:8, padding:"10px 14px", fontSize:11 }}>
              <div style={{ fontWeight:700, color:"var(--navy)", marginBottom:4 }}>{itemSeleccionado.modelo}</div>
              <div style={{ color:"var(--muted)" }}>Familia: <strong style={{ color:"var(--navy)" }}>{itemSeleccionado.familia}</strong></div>
              <div style={{ color:"var(--muted)" }}>Base actual: <strong style={{ color:"var(--navy)" }}>{itemSeleccionado.ubicacion}</strong></div>
              <div style={{ color:"var(--muted)" }}>Estado: {itemSeleccionado.estado}</div>
              {itemSeleccionado.capacidad && <div style={{ color:"var(--muted)" }}>Capacidad: {itemSeleccionado.capacidad}</div>}
              {itemSeleccionado.numero_serie && <div style={{ color:"var(--muted)" }}>Nº Serie: {itemSeleccionado.numero_serie}</div>}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Base de destino</label>
            <select className="form-input filter-select" value={baseDestino} onChange={e => { setBaseDestino(e.target.value); setErrorMsg(""); setSuccessMsg(""); }} disabled={!itemId}>
              <option value="">Seleccioná base de destino...</option>
              {basesDestino.filter(b => b !== itemSeleccionado?.ubicacion).map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Cantidad</label>
            <input type="number" className="form-input" min={1} max={maxCantidad} value={cantidadMov} onChange={e => setCantidadMov(Number(e.target.value))} disabled={!!itemSeleccionado?.numero_serie} />
            {itemSeleccionado?.numero_serie ? <span className="form-hint">Ítem único — cantidad fija en 1</span> : itemSeleccionado && <span className="form-hint">Máximo disponible: {maxCantidad}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Motivo (opcional)</label>
            <input type="text" className="form-input" placeholder="Ej: Respuesta emergencia, rotación de stock..." value={motivo} onChange={e => setMotivo(e.target.value)} />
          </div>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving || !itemId || !baseDestino}>
            {saving ? "Registrando..." : "Registrar movimiento →"}
          </button>
        </div>

        <div className="mov-table-wrap">
          <div className="mov-table-header">
            <div className="mov-table-title">Historial de movimientos</div>
            <div className="mov-table-count">{movimientos.length} registros</div>
          </div>
          {errorLoad ? <div className="mov-empty" style={{ color:"#991B1B" }}>{errorLoad}</div>
          : loadingMov ? <div className="mov-empty">Cargando...</div>
          : movimientos.length === 0 ? <div className="mov-empty">No hay movimientos registrados aún.</div>
          : (
            <table className="mov-table">
              <thead><tr><th>Fecha</th><th>Ítem</th><th>Movimiento</th><th>Cant.</th><th>Motivo</th></tr></thead>
              <tbody>
                {movimientos.map(mov => (
                  <tr key={mov.id}>
                    <td className="cell-num" style={{ whiteSpace:"nowrap" }}>{new Date(mov.created_at).toLocaleString("es-AR", { day:"2-digit", month:"2-digit", year:"2-digit", hour:"2-digit", minute:"2-digit" })}</td>
                    <td style={{ fontWeight:500 }}>
                      {mov.inventario_items?.modelo || "—"}
                      <div style={{ fontSize:10, color:"var(--muted)", marginTop:2 }}>{mov.inventario_items?.familia}{mov.inventario_items?.subtipo ? ` · ${mov.inventario_items.subtipo}` : ""}</div>
                    </td>
                    <td><div className="arrow-badge"><strong>{mov.base_origen}</strong><span>→</span><strong style={{ color:"var(--green)" }}>{mov.base_destino}</strong></div></td>
                    <td className="cell-num" style={{ textAlign:"center" }}>{mov.cantidad}</td>
                    <td style={{ color:"var(--muted)", fontSize:11 }}>{mov.motivo || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── TAB HISTORIAL ────────────────────────────────────────────────────────────
function TabHistorial() {
  const [cambios, setCambios]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("inventario_cambios")
          .select("*, inventario_items(modelo, familia, ubicacion)")
          .order("created_at", { ascending: false })
          .limit(200);
        if (error) throw error;
        setCambios(data || []);
      } catch (e) {
        setErrorMsg("Error al cargar el historial: " + e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const badgeTipo = (tipo) => {
    if (tipo === "ALTA")       return <span className="badge-tipo badge-alta">ALTA</span>;
    if (tipo === "EDICION")    return <span className="badge-tipo badge-edicion">EDICIÓN</span>;
    if (tipo === "MOVIMIENTO") return <span className="badge-tipo badge-movimiento">MOVIMIENTO</span>;
    return <span className="badge-tipo">{tipo}</span>;
  };

  return (
    <div className="hist-content">
      <div className="section-label">Log de cambios</div>
      <div className="mov-table-wrap">
        <div className="mov-table-header">
          <div className="mov-table-title">Historial completo de cambios</div>
          <div className="mov-table-count">{cambios.length} registros</div>
        </div>
        {errorMsg ? <div className="mov-empty" style={{ color:"#991B1B" }}>{errorMsg}</div>
        : loading ? <div className="mov-empty">Cargando...</div>
        : cambios.length === 0 ? <div className="mov-empty">No hay cambios registrados aún.</div>
        : (
          <table className="mov-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Ítem</th>
                <th>Campo</th>
                <th>Valor anterior</th>
                <th>Valor nuevo</th>
                <th>Usuario</th>
              </tr>
            </thead>
            <tbody>
              {cambios.map(c => (
                <tr key={c.id}>
                  <td className="cell-num" style={{ whiteSpace:"nowrap" }}>{new Date(c.created_at).toLocaleString("es-AR", { day:"2-digit", month:"2-digit", year:"2-digit", hour:"2-digit", minute:"2-digit" })}</td>
                  <td>{badgeTipo(c.tipo)}</td>
                  <td style={{ fontWeight:500 }}>
                    {c.inventario_items?.modelo || "—"}
                    <div style={{ fontSize:10, color:"var(--muted)", marginTop:2 }}>{c.inventario_items?.familia} · {c.inventario_items?.ubicacion}</div>
                  </td>
                  <td style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--muted)" }}>{c.campo || "—"}</td>
                  <td style={{ fontSize:11, color:"#991B1B", maxWidth:150, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }} title={c.valor_anterior}>{c.valor_anterior || "—"}</td>
                  <td style={{ fontSize:11, color:"#065F46", maxWidth:150, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }} title={c.valor_nuevo}>{c.valor_nuevo || "—"}</td>
                  <td style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--muted)" }}>{c.usuario || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
export default function App() {
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab]             = useState("inventario");
  const [usuario, setUsuario] = useState("sistema");
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) setUsuario(session.user.email);
    });
  }, []);

  const loadItems = async () => {
    setLoading(true); setLoadError("");
    try {
      const { data, error } = await supabase.from("inventario_items").select("*").order("item_numero", { ascending: true });
      if (error) throw error;
      setItems(data || []);
    } catch (e) {
      setLoadError("Error al cargar el inventario: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadItems(); }, []);

  const total       = items.length;
  const disponibles = items.filter(i => i.estado === "Disponible").length;
  const enUso       = items.filter(i => i.estado === "En uso").length;
  const fueraServ   = items.filter(i => i.estado === "Fuera de servicio").length;
  const faltaMant   = items.filter(i => i.estado === "Falta mantenimiento").length;

  if (loading) return (
    <div className="loading"><style>{CSS}</style><div className="loading-text">Cargando inventario...</div></div>
  );
  if (loadError) return (
    <div className="loading"><style>{CSS}</style>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontFamily:"var(--mono)", fontSize:11, color:"#FCA5A5", letterSpacing:1, marginBottom:16 }}>{loadError}</div>
        <button onClick={loadItems} style={{ fontFamily:"var(--sans)", fontSize:12, padding:"8px 20px", borderRadius:8, border:"1px solid rgba(255,255,255,.2)", background:"rgba(255,255,255,.1)", color:"#fff", cursor:"pointer" }}>Reintentar</button>
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
        <button className="back-btn" onClick={() => window.open(PORTAL_URL, "_self")}>← Volver al portal</button>
      </header>

      <div className="hero">
        <div className="hero-content">
          <div className="hero-eyebrow">Sistema de inventario</div>
          <h1 className="hero-title">Equipamiento <span>operativo</span></h1>
          <div className="kpis">
            <div className="kpi"><div className="kpi-label">Total ítems</div><div className="kpi-value">{total}</div><div className="kpi-sub">registros activos</div></div>
            <div className="kpi green"><div className="kpi-label">Disponibles</div><div className="kpi-value">{disponibles}</div><div className="kpi-sub">{total ? Math.round(disponibles/total*100) : 0}% del total</div></div>
            <div className="kpi blue"><div className="kpi-label">En uso</div><div className="kpi-value">{enUso}</div><div className="kpi-sub">desplegados</div></div>
            <div className="kpi yellow"><div className="kpi-label">Falta mant.</div><div className="kpi-value">{faltaMant}</div><div className="kpi-sub">requieren atención</div></div>
            <div className="kpi red"><div className="kpi-label">Fuera servicio</div><div className="kpi-value">{fueraServ}</div><div className="kpi-sub">no operativos</div></div>
          </div>
          <div className="tabs">
            <button className={"tab-btn"+(tab==="inventario"?" active":"")} onClick={()=>setTab("inventario")}>📦 Inventario</button>
            <button className={"tab-btn"+(tab==="movimientos"?" active":"")} onClick={()=>setTab("movimientos")}>🔄 Movimientos</button>
            <button className={"tab-btn"+(tab==="historial"?" active":"")} onClick={()=>setTab("historial")}>📋 Historial</button>
          </div>
        </div>
      </div>

      {tab === "inventario"  && <TabInventario  items={items} onReload={loadItems} usuario={usuario} />}
      {tab === "movimientos" && <TabMovimientos items={items} onMovimientoCreado={loadItems} usuario={usuario} />}
      {tab === "historial"   && <TabHistorial />}
    </>
  );
}
