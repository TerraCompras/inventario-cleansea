// v5.0 - remitos digitales
import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";

const PORTAL_URL = "https://clean-sea-portal.vercel.app";
const APP_URL    = "https://inventario-cleansea.vercel.app";

const CODIGOS_BASE = {
  "Barranqueras":    "BA",
  "San Lorenzo":     "SL",
  "San Fernando":    "SF",
  "BRM":             "BRM",
  "Zárate/Campana":  "ZC",
  "Bahía Blanca":    "BB",
  "Rosales":         "RO",
};

const codigoBase = (base) => {
  if (!base) return "XX";
  const key = Object.keys(CODIGOS_BASE).find(k => base.toLowerCase().includes(k.toLowerCase()));
  return key ? CODIGOS_BASE[key] : base.substring(0,3).toUpperCase();
};

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

const ESTADOS_OPCIONES   = ["Disponible", "En uso", "Fuera de servicio", "Falta mantenimiento"];
const CONDICION_OPCIONES = ["Nuevo", "Usado"];
const PAGE_SIZE_OPTIONS  = [25, 50, 100, 200];
const ITEM_VACIO = {
  item_numero: "", categoria: "", ubicacion: "", fabricante: "", modelo: "",
  familia: "", subtipo: "", capacidad: "", combustible: "", obs: "",
  numero_serie: "", cantidad: "", metros: "", condicion: "Usado",
  estado: "Disponible", terminal: "", comentarios: "", foto_url: "",
  fecha_ultimo_mantenimiento: "", fecha_proximo_mantenimiento: "", notas_mantenimiento: "",
};

const fmtFecha = (f) => f ? new Date(f + "T12:00:00").toLocaleDateString("es-AR", { day:"2-digit", month:"2-digit", year:"numeric" }) : "—";
const fmtDateTime = (f) => f ? new Date(f).toLocaleString("es-AR", { day:"2-digit", month:"2-digit", year:"2-digit", hour:"2-digit", minute:"2-digit" }) : "—";

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

.tabs { display: flex; gap: 0; border-top: 1px solid rgba(255,255,255,.1); position: relative; z-index: 1; flex-wrap: wrap; }
.tab-btn { font-family: var(--sans); font-size: 12px; font-weight: 600; letter-spacing: .3px; padding: 14px 22px; background: none; border: none; color: rgba(255,255,255,.5); cursor: pointer; transition: all .15s; border-bottom: 3px solid transparent; }
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
.semaforo { display: inline-block; width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.semaforo-verde { background: #10B981; }
.semaforo-amarillo { background: #F59E0B; }
.semaforo-rojo { background: #EF4444; }
.semaforo-gris { background: #9CA3AF; }

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
.mov-table td { padding: 11px 16px; border-bottom: 1px solid #F0F4F8; font-size: 12px; color: var(--text); vertical-align: middle; text-align: left; }
.mov-table tr:last-child td { border-bottom: none; }
.mov-table tr:hover td { background: #F8FAFC; }
.arrow-badge { font-family: var(--mono); font-size: 10px; color: var(--muted); display: flex; align-items: center; gap: 6px; }
.arrow-badge strong { color: var(--navy); }
.mov-empty { padding: 40px 20px; text-align: center; color: var(--muted); font-size: 12px; }

/* HISTORIAL */
.hist-content { padding: 32px 40px 60px; }
.hist-table-outer { overflow-x: auto; width: 100%; }
.hist-table-outer .mov-table { min-width: 900px; }
.badge-tipo { display: inline-block; font-family: var(--mono); font-size: 8px; font-weight: 700; padding: 2px 7px; border-radius: 4px; white-space: nowrap; letter-spacing: .5px; }
.badge-alta { background: #D1FAE5; color: #065F46; border: 1px solid #A7F3D0; }
.badge-edicion { background: #DBEAFE; color: #1E40AF; border: 1px solid #BFDBFE; }
.badge-movimiento { background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A; }

/* REMITOS */
.rem-content { padding: 32px 40px 60px; }
.badge-remito { display: inline-block; font-family: var(--mono); font-size: 9px; font-weight: 700; padding: 3px 8px; border-radius: 4px; white-space: nowrap; }
.badge-pendiente { background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A; }
.badge-rechazado { background: #FEE2E2; color: #991B1B; border: 1px solid #FECACA; }
.rem-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
@media (max-width: 768px) { .rem-kpis { grid-template-columns: repeat(2, 1fr); } }
.rem-kpi { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px 20px; }
.rem-kpi-label { font-family: var(--mono); font-size: 9px; letter-spacing: 1.5px; color: var(--muted); text-transform: uppercase; margin-bottom: 8px; }
.rem-kpi-value { font-family: var(--mono); font-size: 28px; font-weight: 700; color: var(--navy); }
.rem-kpi-sub { font-size: 10px; color: var(--muted); margin-top: 4px; }
.badge-confirmado { background: #D1FAE5; color: #065F46; border: 1px solid #A7F3D0; }
.btn-link { font-family: var(--mono); font-size: 10px; color: var(--blue); background: none; border: 1px solid var(--border); padding: 3px 8px; border-radius: 4px; cursor: pointer; }
.btn-link:hover { background: #EFF6FF; }

/* REMITO IMPRIMIBLE */
@media print {
  .header, .hero, .tabs, .toolbar, .pagination, .no-print { display: none !important; }
  .remito-print { display: block !important; }
  body { background: white; }
}
.remito-print { display: none; }
.remito-doc { font-family: var(--sans); max-width: 750px; margin: 0 auto; padding: 40px; background: white; }
.remito-doc-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid var(--navy); padding-bottom: 20px; margin-bottom: 24px; }
.remito-doc-logo { font-size: 20px; font-weight: 800; color: var(--navy); letter-spacing: 2px; }
.remito-doc-numero { font-family: var(--mono); font-size: 22px; font-weight: 700; color: var(--navy); text-align: right; }
.remito-doc-fecha { font-size: 11px; color: var(--muted); text-align: right; margin-top: 4px; }
.remito-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 24px; }
.remito-field { }
.remito-field-label { font-family: var(--mono); font-size: 8px; letter-spacing: 1.5px; color: var(--muted); text-transform: uppercase; margin-bottom: 4px; }
.remito-field-value { font-size: 13px; font-weight: 600; color: var(--navy); }
.remito-items-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
.remito-items-table th { font-family: var(--mono); font-size: 9px; letter-spacing: 1px; text-transform: uppercase; color: white; background: var(--navy); padding: 10px 14px; text-align: left; }
.remito-items-table td { padding: 10px 14px; border-bottom: 1px solid #E5E7EB; font-size: 12px; }
.remito-firmas { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-top: 40px; }
.remito-firma-box { border-top: 2px solid var(--navy); padding-top: 8px; }
.remito-firma-label { font-family: var(--mono); font-size: 9px; letter-spacing: 1px; color: var(--muted); text-transform: uppercase; }
.remito-estado-confirmado { background: #D1FAE5; border: 1px solid #A7F3D0; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; font-size: 12px; color: #065F46; }


/* CARRITO DE REMITO */
.carrito-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; margin-top: 16px; }
.carrito-header { padding: 12px 16px; background: #F8FAFC; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
.carrito-title { font-size: 12px; font-weight: 700; color: var(--navy); }
.carrito-count { font-family: var(--mono); font-size: 10px; color: var(--muted); }
.carrito-item { padding: 10px 16px; border-bottom: 1px solid #F0F4F8; font-size: 11px; display: flex; align-items: center; gap: 10px; }
.carrito-item:last-child { border-bottom: none; }
.carrito-item-info { flex: 1; }
.carrito-item-modelo { font-weight: 600; color: var(--navy); }
.carrito-item-meta { color: var(--muted); font-size: 10px; margin-top: 2px; }
.carrito-item-remove { background: none; border: none; color: #EF4444; cursor: pointer; font-size: 14px; padding: 2px 6px; border-radius: 4px; }
.carrito-item-remove:hover { background: #FEE2E2; }
.carrito-empty { padding: 20px; text-align: center; color: var(--muted); font-size: 11px; }
.cantidad-input-wrap { display: flex; align-items: center; gap: 6px; }
.cantidad-badge { font-family: var(--mono); font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px; }
.cantidad-ok { background: #D1FAE5; color: #065F46; }
.cantidad-error { background: #FEE2E2; color: #991B1B; }
.btn-agregar { font-family: var(--sans); font-size: 11px; font-weight: 700; color: #fff; background: var(--blue); border: none; padding: 8px 14px; border-radius: 8px; cursor: pointer; white-space: nowrap; }
.btn-agregar:hover { background: #1A4A7A; }
.btn-agregar:disabled { opacity: .5; cursor: not-allowed; }
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
  .tabs .tab-btn { padding: 10px 12px; font-size: 10px; }
  .content-top { padding: 20px 16px 16px; }
  .toolbar { flex-direction: column; align-items: stretch; gap: 8px; }
  .search-box { min-width: unset; }
  .filter-select { min-width: unset; width: 100%; }
  .toolbar-right { flex-wrap: wrap; margin-left: 0; }
  .btn-nuevo { width: 100%; text-align: center; }
  table { min-width: 900px; }
  .pagination { padding: 12px 16px; flex-direction: column; gap: 10px; }
  .mov-content, .hist-content, .rem-content { padding: 20px 16px 40px; }
  .mov-grid { grid-template-columns: 1fr; }
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

.mant-kpis-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 32px; }

/* ── FIXES MOBILE ADICIONALES ── */
@media (max-width: 768px) {
  .mant-kpis-grid { grid-template-columns: repeat(2,1fr); }
  /* Header compacto */
  .header { padding: 0 14px; height: 54px; }
  .header-main { font-size: 11px; }
  .back-btn { font-size: 9px; padding: 4px 8px; }

  /* Mov grid — forzar 1 columna */
  .mov-grid { grid-template-columns: 1fr !important; }
  .mov-content { padding: 16px 14px 60px; }
  .form-card { padding: 16px; }

  /* Historial y remitos */
  .hist-content { padding: 16px 14px 40px; }
  .rem-content { padding: 16px 14px 40px; }
  .rem-kpis { grid-template-columns: 1fr 1fr; gap: 10px; }

  /* Remito imprimible */
  .remito-grid { grid-template-columns: 1fr; }
  .remito-firmas { grid-template-columns: 1fr; gap: 30px; }

  /* Modales */
  .modal-overlay { padding: 0; align-items: flex-end; }
  .modal { border-radius: 16px 16px 0 0; max-height: 92vh; }
  .modal-body { padding: 16px; grid-template-columns: 1fr; }
  .modal-footer { padding: 12px 16px; }

  /* Paginacion */
  .pagination { padding: 10px 14px; flex-direction: column; gap: 8px; align-items: flex-start; }
  .page-btns { flex-wrap: wrap; }
  .page-btn { padding: 4px 10px; font-size: 10px; }

  /* Tabla overflow */
  .table-outer { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .hist-table-outer { overflow-x: auto; -webkit-overflow-scrolling: touch; }

  /* content-top */
  .content-top { padding: 16px 14px; }

  /* Toolbar */
  .toolbar { padding: 12px; }
  .toolbar-right { width: 100%; justify-content: space-between; }
}

`;

// ─── MODAL ITEM ───────────────────────────────────────────────────────────────
function ModalItem({ item, onClose, onSaved, usuario }) {
  const esNuevo = !item?.id;
  const [form, setForm]         = useState(item ? { ...item } : { ...ITEM_VACIO });
  const [saving, setSaving]     = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.modelo?.trim())    { setErrorMsg("El modelo/descripción es obligatorio."); return; }
    if (!form.ubicacion?.trim()) { setErrorMsg("La base/ubicación es obligatoria."); return; }
    if (!form.estado)            { setErrorMsg("El estado es obligatorio."); return; }
    setSaving(true); setErrorMsg("");
    try {
      const payload = {
        item_numero:  form.item_numero  ? Number(form.item_numero)  : null,
        categoria:    form.categoria    || null, ubicacion: form.ubicacion || null,
        fabricante:   form.fabricante   || null, modelo:    form.modelo    || null,
        familia:      form.familia      || null, subtipo:   form.subtipo   || null,
        capacidad:    form.capacidad    || null, combustible: form.combustible || null,
        obs:          form.obs          || null, numero_serie: form.numero_serie || null,
        cantidad:     form.cantidad     ? Number(form.cantidad)  : null,
        metros:       form.metros       ? Number(form.metros)    : null,
        condicion:    form.condicion    || null, estado:    form.estado    || null,
        terminal:     form.terminal     || null, comentarios: form.comentarios || null,
        foto_url:                    form.foto_url                    || null,
        fecha_ultimo_mantenimiento:  form.fecha_ultimo_mantenimiento  || null,
        fecha_proximo_mantenimiento: form.fecha_proximo_mantenimiento || null,
        notas_mantenimiento:         form.notas_mantenimiento         || null,
      };
      if (esNuevo) {
        const { data, error } = await supabase.from("inventario_items").insert(payload).select().single();
        if (error) throw error;
        const { error: errLog } = await supabase.from("inventario_cambios").insert({ item_id: data.id, tipo: "ALTA", campo: null, valor_anterior: null, valor_nuevo: form.modelo, usuario });
        if (errLog) console.error("Log ALTA:", errLog.message);
      } else {
        const camposAuditar = ["modelo","ubicacion","familia","subtipo","capacidad","combustible","estado","condicion","cantidad","metros","numero_serie","comentarios","obs","terminal","fabricante","categoria","fecha_ultimo_mantenimiento","fecha_proximo_mantenimiento","notas_mantenimiento"];
        const cambios = camposAuditar.filter(c => String(item[c] ?? "") !== String(form[c] ?? ""))
          .map(campo => ({ item_id: item.id, tipo: "EDICION", campo, valor_anterior: String(item[campo] ?? "") || null, valor_nuevo: String(form[campo] ?? "") || null, usuario }));
        const { error } = await supabase.from("inventario_items").update(payload).eq("id", item.id);
        if (error) throw error;
        if (cambios.length > 0) {
          const { error: errCambios } = await supabase.from("inventario_cambios").insert(cambios);
          if (errCambios) console.error("Log EDICION:", errCambios.message);
        }
      }
      onSaved(); onClose();
    } catch (e) { setErrorMsg("Error al guardar: " + e.message); }
    finally { setSaving(false); }
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
          <div style={{ gridColumn:"1 / -1", borderTop:"1px solid var(--border)", paddingTop:16, marginTop:4 }}>
            <div style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:1, color:"var(--muted)", textTransform:"uppercase", marginBottom:12 }}>Mantenimiento</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              {fg("Último mantenimiento", "fecha_ultimo_mantenimiento", "date")}
              {fg("Próximo mantenimiento", "fecha_proximo_mantenimiento", "date")}
            </div>
          </div>
          <div className="form-group full">
            <label className="form-label">Notas de mantenimiento</label>
            <input className="form-input" value={form.notas_mantenimiento || ""} onChange={e => set("notas_mantenimiento", e.target.value)} placeholder="Ej: Revisión hidráulica, cambio de sellos..." />
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

// ─── MODAL REMITO ─────────────────────────────────────────────────────────────
function ModalRemito({ remito, onClose }) {
  const handlePrint = () => window.print();
  const linkConfirmacion = `${APP_URL}/confirmar/${remito.token_confirmacion}`;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 800 }}>
        <div className="modal-header no-print">
          <div className="modal-title">Remito {remito.numero}</div>
          <div style={{ display:"flex", gap:10 }}>
            <button className="btn-cancel" onClick={() => navigator.clipboard.writeText(linkConfirmacion)}>📋 Copiar link</button>
            <button className="btn-save" onClick={handlePrint}>🖨️ Imprimir</button>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
        </div>
        <div style={{ padding:"28px 32px" }}>
          {remito.estado === "Confirmado" && (
            <div className="remito-estado-confirmado">
              ✓ Confirmado por <strong>{remito.confirmado_por}</strong> el {fmtDateTime(remito.confirmado_at)}
            </div>
          )}
          <div className="remito-doc">
            <div className="remito-doc-header">
              <div>
                <div className="remito-doc-logo">CLEAN SEA</div>
                <div style={{ fontSize:11, color:"var(--muted)", marginTop:4 }}>Remito de equipamiento</div>
              </div>
              <div>
                <div className="remito-doc-numero">{remito.numero}</div>
                <div className="remito-doc-fecha">{fmtDateTime(remito.created_at)}</div>
                <div style={{ marginTop:8 }}>
                  <span className={`badge-remito ${remito.estado === "Confirmado" ? "badge-confirmado" : "badge-pendiente"}`}>
                    {remito.estado}
                  </span>
                </div>
              </div>
            </div>

            <div className="remito-grid">
              <div className="remito-field">
                <div className="remito-field-label">Base Origen</div>
                <div className="remito-field-value">{remito.base_origen}</div>
              </div>
              <div className="remito-field">
                <div className="remito-field-label">Base Destino</div>
                <div className="remito-field-value">{remito.base_destino}</div>
              </div>
              <div className="remito-field">
                <div className="remito-field-label">Transportista</div>
                <div className="remito-field-value">{remito.transportista || "—"}</div>
              </div>
              <div className="remito-field">
                <div className="remito-field-label">Emitido por</div>
                <div className="remito-field-value">{remito.usuario_emisor || "—"}</div>
              </div>
              <div className="remito-field">
                <div className="remito-field-label">Email destino</div>
                <div className="remito-field-value">{remito.email_destino || "—"}</div>
              </div>
              <div className="remito-field">
                <div className="remito-field-label">Observaciones</div>
                <div className="remito-field-value">{remito.observaciones || "—"}</div>
              </div>
            </div>

            <table className="remito-items-table">
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th>Familia</th>
                  <th>Origen</th>
                  <th>Cantidad</th>
                  <th>Transportista</th>
                </tr>
              </thead>
              <tbody>
                {(remito.inventario_remito_items || []).map((linea, idx) => (
                  <tr key={linea.id || idx}>
                    <td style={{ fontWeight:600 }}>{linea.inventario_items?.modelo || "—"}</td>
                    <td>{linea.inventario_items?.familia || "—"}</td>
                    <td>{linea.base_origen || "—"}</td>
                    <td style={{ fontFamily:"var(--mono)" }}>{linea.cantidad}</td>
                    <td style={{ color:"var(--muted)" }}>{linea.transportista || "—"}</td>
                  </tr>
                ))}
                {(!remito.inventario_remito_items || remito.inventario_remito_items.length === 0) && (
                  <tr><td colSpan={5} style={{ textAlign:"center", color:"var(--muted)", padding:16 }}>Sin líneas</td></tr>
                )}
              </tbody>
            </table>

            {remito.estado !== "Confirmado" && (
              <div style={{ background:"#F0F4F8", border:"1px solid var(--border)", borderRadius:8, padding:"12px 16px", marginBottom:24, fontSize:11 }}>
                <div style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:1, color:"var(--muted)", textTransform:"uppercase", marginBottom:6 }}>Link de confirmación</div>
                <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--blue)", wordBreak:"break-all" }}>{linkConfirmacion}</div>
              </div>
            )}

            <div className="remito-firmas">
              <div className="remito-firma-box">
                <div className="remito-firma-label">Firma y aclaración — Emisor</div>
                <div style={{ height:50 }}></div>
                <div style={{ fontSize:11, color:"var(--muted)", marginTop:4 }}>{remito.usuario_emisor}</div>
              </div>
              <div className="remito-firma-box">
                <div className="remito-firma-label">Firma y aclaración — Receptor</div>
                <div style={{ height:50 }}></div>
                {remito.confirmado_por && <div style={{ fontSize:11, color:"var(--muted)", marginTop:4 }}>{remito.confirmado_por}</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TAB INVENTARIO ───────────────────────────────────────────────────────────
function TabInventario({ items, onReload, usuario }) {
  const [search, setSearch]               = useState("");
  const [filtFamilia, setFiltFamilia]     = useState("");
  const [filtSubtipo, setFiltSubtipo]     = useState("");
  const [filtBase, setFiltBase]           = useState("");
  const [filtEst, setFiltEst]             = useState("");
  const [filtCondicion, setFiltCondicion] = useState("");
  const [page, setPage]                   = useState(1);
  const [pageSize, setPageSize]           = useState(50);
  const [modalItem, setModalItem]         = useState(null);

  useEffect(() => { setPage(1); }, [search, filtFamilia, filtSubtipo, filtBase, filtEst, filtCondicion, pageSize]);

  const filtered = items.filter(it => {
    const q = search.toLowerCase();
    const matchSearch = !q || [it.modelo, it.fabricante, it.comentarios, it.terminal,
      it.ubicacion, it.numero_serie, it.familia, it.subtipo, it.capacidad,
      it.combustible, it.obs, String(it.item_numero || "")]
      .some(f => f && String(f).toLowerCase().includes(q));
    return matchSearch &&
      (!filtFamilia   || it.familia   === filtFamilia) &&
      (!filtSubtipo   || it.subtipo   === filtSubtipo) &&
      (!filtBase      || it.ubicacion === filtBase) &&
      (!filtEst       || it.estado    === filtEst) &&
      (!filtCondicion || it.condicion === filtCondicion);
  });

  const familias    = [...new Set(items.map(i => i.familia).filter(Boolean))].sort();
  const subtipos    = [...new Set(items.filter(i => !filtFamilia || i.familia === filtFamilia).map(i => i.subtipo).filter(Boolean))].sort();
  const bases       = [...new Set(items.map(i => i.ubicacion).filter(Boolean))].sort();
  const estados     = [...new Set(items.map(i => i.estado).filter(Boolean))].sort();
  const condiciones = [...new Set(items.map(i => i.condicion).filter(Boolean))].sort();
  const totalPages  = Math.ceil(filtered.length / pageSize);
  const pageItems   = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      <div className="content-top">
        <div className="section-label">Inventario completo</div>
        <div className="toolbar">
          <input className="search-box" placeholder="Buscar por modelo, familia, subtipo, capacidad, base, Nº serie..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="filter-select" value={filtFamilia} onChange={e => { setFiltFamilia(e.target.value); setFiltSubtipo(""); }}>
            <option value="">Todas las familias</option>
            {familias.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <select className="filter-select" value={filtSubtipo} onChange={e => setFiltSubtipo(e.target.value)}>
            <option value="">Todos los subtipos</option>
            {subtipos.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="filter-select" value={filtBase} onChange={e => setFiltBase(e.target.value)}>
            <option value="">Todas las bases</option>
            {bases.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select className="filter-select" value={filtEst} onChange={e => setFiltEst(e.target.value)}>
            <option value="">Todos los estados</option>
            {estados.map(est => <option key={est} value={est}>{est}</option>)}
          </select>
          <select className="filter-select" value={filtCondicion} onChange={e => setFiltCondicion(e.target.value)}>
            <option value="">Todas las condiciones</option>
            {condiciones.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="toolbar-right">
            <span className="count-badge">{filtered.length} resultados</span>
            <select className="filter-select" style={{ minWidth:120 }} value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
              {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n} por página</option>)}
            </select>
            {(search || filtFamilia || filtSubtipo || filtBase || filtEst || filtCondicion) &&
              <button className="clear-btn" onClick={() => { setSearch(""); setFiltFamilia(""); setFiltSubtipo(""); setFiltBase(""); setFiltEst(""); setFiltCondicion(""); setPage(1); }}>Limpiar</button>
            }
            <button className="btn-nuevo" onClick={() => setModalItem(false)}>+ Nuevo ítem</button>
          </div>
        </div>
      </div>

      <div className="table-outer">
        <table>
          <thead>
            <tr>
              <th></th><th>Mant.</th><th>Item</th><th>Familia</th><th>Subtipo</th>
              <th>Capacidad</th><th>Combustible</th><th>Base</th><th>Modelo / Descripción</th>
              <th>Fabricante</th><th>Nº Serie</th><th>Cant.</th><th>Metros</th>
              <th>Condición</th><th>Estado</th><th>Terminal</th><th>Obs</th><th>Comentarios</th><th>Foto</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 && <tr><td colSpan={19} className="empty">No se encontraron resultados</td></tr>}
            {pageItems.map(it => {
              const estCol = ESTADOS_COLOR[it.estado] || { bg:"#F3F4F6", color:"#6B7280", border:"#E5E7EB" };
              const famCol = FAMILIA_COLOR[it.familia] || "#4B5563";
              return (
                <tr key={it.id}>
                  <td><button className="btn-edit" onClick={() => setModalItem(it)}>✏️</button></td>
                  <td style={{ textAlign:"center" }}>
                    {it.fecha_proximo_mantenimiento ? (() => {
                      const dias = Math.ceil((new Date(it.fecha_proximo_mantenimiento) - new Date()) / 86400000);
                      if (dias < 0)   return <span className="semaforo semaforo-rojo"     title="Mantenimiento vencido" />;
                      if (dias <= 30) return <span className="semaforo semaforo-amarillo" title={`Vence en ${dias} días`} />;
                      return              <span className="semaforo semaforo-verde"     title={`Vence en ${dias} días`} />;
                    })() : <span className="semaforo semaforo-gris" title="Sin fecha" />}
                  </td>
                  <td className="cell-num">{it.item_numero ?? "—"}</td>
                  <td><span className="badge-fam" style={{ background:`${famCol}18`, color:famCol, border:`1px solid ${famCol}30` }}>{it.familia || "—"}</span></td>
                  <td style={{ fontSize:11, color:"var(--muted)" }}>{it.subtipo || "—"}</td>
                  <td className="cell-med" title={it.capacidad}>{it.capacidad || "—"}</td>
                  <td style={{ fontSize:11, color:"var(--muted)" }}>{it.combustible || "—"}</td>
                  <td style={{ fontWeight:500 }}>{it.ubicacion || "—"}</td>
                  <td className="cell-long" title={it.modelo}>{it.modelo || "—"}</td>
                  <td style={{ color:"var(--muted)", fontSize:11 }}>{it.fabricante || "—"}</td>
                  <td className="cell-num">{it.numero_serie || "—"}</td>
                  <td className="cell-num" style={{ textAlign:"center" }}>{it.cantidad ?? "—"}</td>
                  <td className="cell-num" style={{ textAlign:"center" }}>{it.metros != null ? `${it.metros}m` : "—"}</td>
                  <td style={{ fontSize:11, color:"var(--muted)" }}>{it.condicion || "—"}</td>
                  <td><span className="badge-estado" style={{ background:estCol.bg, color:estCol.color, border:`1px solid ${estCol.border}` }}>{it.estado || "—"}</span></td>
                  <td style={{ fontSize:11 }}>{it.terminal || "—"}</td>
                  <td className="cell-med" title={it.obs}>{it.obs || "—"}</td>
                  <td className="cell-long" title={it.comentarios}>{it.comentarios || "—"}</td>
                  <td>{it.foto_url ? <a className="foto-link" href={it.foto_url} target="_blank" rel="noreferrer">Ver →</a> : <span style={{ color:"var(--muted)", fontSize:11 }}>—</span>}</td>
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
              const pgNums = []; const L = Math.max(2,page-2); const R = Math.min(totalPages-1,page+2);
              pgNums.push(1);
              if (L > 2) pgNums.push("dl");
              for (let n=L; n<=R; n++) pgNums.push(n);
              if (R < totalPages-1) pgNums.push("dr");
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
        <ModalItem item={modalItem === false ? null : modalItem} onClose={() => setModalItem(null)} onSaved={onReload} usuario={usuario} />
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

  // Filtros cascada para buscar ítem
  const [filtFamilia, setFiltFamilia]       = useState("");
  const [filtSubtipo, setFiltSubtipo]       = useState("");
  const [filtCapacidad, setFiltCapacidad]   = useState("");
  const [filtCombustible, setFiltCombustible] = useState("");
  const [filtBaseOrigen, setFiltBaseOrigen] = useState("");
  const [itemId, setItemId]                 = useState("");
  const [cantidadMov, setCantidadMov]       = useState(1);
  const [transportistaLinea, setTransportistaLinea] = useState("");
  const [emailTransportistaLinea, setEmailTransportistaLinea] = useState("");

  // Carrito
  const [lineas, setLineas]                 = useState([]);

  // Carrito y remito creado
  const [remitoCreado, setRemitoCreado]     = useState(null);

  // Datos generales del remito
  const [baseDestino, setBaseDestino]       = useState("");
  const [emailDestino, setEmailDestino]     = useState("");
  const [observaciones, setObservaciones]   = useState("");

  useEffect(() => { loadMovimientos(); }, []);

  const loadMovimientos = async () => {
    setLoadingMov(true);
    try {
      const { data, error } = await supabase
        .from("inventario_movimientos")
        .select("*, inventario_items(modelo, familia, subtipo, ubicacion)")
        .order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      setMovimientos(data || []);
    } catch (e) { setErrorLoad("Error al cargar movimientos: " + e.message); }
    finally { setLoadingMov(false); }
  };

  // Cascada de filtros — excluir ítems ya en el carrito
  const idsEnCarrito = new Set(lineas.map(l => l.itemId));
  const itemsMovibles = items.filter(i => (i.estado === "Disponible" || i.estado === "En uso") && !idsEnCarrito.has(i.id));
  const familiasCasc   = [...new Set(itemsMovibles.map(i => i.familia).filter(Boolean))].sort();
  const subtiposCasc   = [...new Set(itemsMovibles.filter(i => !filtFamilia || i.familia === filtFamilia).map(i => i.subtipo).filter(Boolean))].sort();
  const capacidadesCasc = [...new Set(itemsMovibles.filter(i => (!filtFamilia || i.familia === filtFamilia) && (!filtSubtipo || i.subtipo === filtSubtipo)).map(i => i.capacidad).filter(Boolean))].sort();
  const combustiblesCasc = [...new Set(itemsMovibles.filter(i => (!filtFamilia || i.familia === filtFamilia) && (!filtSubtipo || i.subtipo === filtSubtipo) && (!filtCapacidad || i.capacidad === filtCapacidad)).map(i => i.combustible).filter(Boolean))].sort();
  const basesCasc = [...new Set(itemsMovibles.filter(i =>
    (!filtFamilia || i.familia === filtFamilia) &&
    (!filtSubtipo || i.subtipo === filtSubtipo) &&
    (!filtCapacidad || i.capacidad === filtCapacidad) &&
    (!filtCombustible || i.combustible === filtCombustible)
  ).map(i => i.ubicacion).filter(Boolean))].sort();
  const itemsFiltrados = itemsMovibles.filter(i =>
    (!filtFamilia    || i.familia    === filtFamilia) &&
    (!filtSubtipo    || i.subtipo    === filtSubtipo) &&
    (!filtCapacidad  || i.capacidad  === filtCapacidad) &&
    (!filtCombustible|| i.combustible=== filtCombustible) &&
    (!filtBaseOrigen || i.ubicacion  === filtBaseOrigen)
  );
  const itemSel     = items.find(i => i.id === itemId);
  const maxCantidad = itemSel ? (itemSel.numero_serie ? 1 : (itemSel.cantidad || 1)) : 1;
  const cantExcede  = cantidadMov > maxCantidad;
  const basesDestino = [...new Set(items.map(i => i.ubicacion).filter(Boolean))].sort();

  const resetBuscador = () => {
    setFiltFamilia(""); setFiltSubtipo(""); setFiltCapacidad(""); setFiltCombustible("");
    setFiltBaseOrigen(""); setItemId(""); setCantidadMov(1);
    setTransportistaLinea(""); setEmailTransportistaLinea(""); setErrorMsg("");
  };

  const agregarLinea = () => {
    if (!itemId)    { setErrorMsg("Seleccioná un ítem."); return; }
    if (cantExcede) { setErrorMsg(`Cantidad máxima disponible: ${maxCantidad}`); return; }
    if (cantidadMov < 1) { setErrorMsg("Cantidad mínima: 1"); return; }
    if (baseDestino && itemSel.ubicacion === baseDestino) { setErrorMsg("La base destino no puede ser igual a la de origen."); return; }
    setLineas(prev => [...prev, {
      itemId, item: itemSel, cantidad: cantidadMov,
      baseOrigen: itemSel.ubicacion,
      transportista: transportistaLinea,
      emailTransportista: emailTransportistaLinea,
    }]);
    resetBuscador();
  };

  const quitarLinea = (idx) => setLineas(prev => prev.filter((_, i) => i !== idx));

  const generarNumero = async (destino) => {
    const cod = codigoBase(destino);
    const prefix = `CS-${cod}-`;
    const { data } = await supabase.from("inventario_remitos").select("numero")
      .ilike("numero", `${prefix}%`).order("created_at", { ascending: false }).limit(1);
    const last = (data && data.length > 0) ? (parseInt(data[0].numero.split("-").pop()) || 0) : 0;
    return `${prefix}${String(last + 1).padStart(3, "0")}`;
  };

  const handleSubmit = async () => {
    if (lineas.length === 0) { setErrorMsg("Agregá al menos un ítem al remito."); return; }
    if (!baseDestino)        { setErrorMsg("Seleccioná la base de destino."); return; }
    const origenesConDestino = lineas.filter(l => l.baseOrigen === baseDestino);
    if (origenesConDestino.length > 0) { setErrorMsg(`El ítem "${origenesConDestino[0].item.modelo?.substring(0,30)}" ya está en la base destino.`); return; }

    setSaving(true); setErrorMsg(""); setSuccessMsg("");
    try {
      // 1. Generar número de remito
      let numero = await generarNumero(baseDestino);
      let remData, e3;
      for (let intento = 0; intento < 3; intento++) {
        ({ data: remData, error: e3 } = await supabase.from("inventario_remitos")
          .insert({ numero, base_destino: baseDestino, email_destino: emailDestino || null, observaciones: observaciones || null, estado: "Pendiente", usuario_emisor: usuario })
          .select().single());
        if (!e3) break;
        if (e3.code === "23505") {
          const n = parseInt(numero.split("-").pop()) || 0;
          const pfx = numero.substring(0, numero.lastIndexOf("-") + 1);
          numero = `${pfx}${String(n + 1).padStart(3, "0")}`;
        } else break;
      }
      if (e3) throw e3;

      // 2. Procesar cada línea
      for (const linea of lineas) {
        // Actualizar ubicación
        const { error: eUpd } = await supabase.from("inventario_items").update({ ubicacion: baseDestino }).eq("id", linea.itemId);
        if (eUpd) throw eUpd;

        // Registrar movimiento
        const { data: movData, error: eMov } = await supabase.from("inventario_movimientos")
          .insert({ item_id: linea.itemId, base_origen: linea.baseOrigen, base_destino: baseDestino, cantidad: linea.cantidad, motivo: observaciones || null, usuario })
          .select().single();
        if (eMov) throw eMov;

        // Log de cambio
        const { error: eLog } = await supabase.from("inventario_cambios").insert({ item_id: linea.itemId, tipo: "MOVIMIENTO", campo: "ubicacion", valor_anterior: linea.baseOrigen, valor_nuevo: baseDestino, usuario });
        if (eLog) console.error("Log:", eLog.message);

        // Línea del remito
        const { error: eLinea } = await supabase.from("inventario_remito_items").insert({
          remito_id: remData.id, item_id: linea.itemId, base_origen: linea.baseOrigen,
          cantidad: linea.cantidad, transportista: linea.transportista || null,
          email_transportista: linea.emailTransportista || null,
        });
        if (eLinea) throw eLinea;
      }

      // 3. Cargar remito completo para el modal
      const { data: remFull } = await supabase.from("inventario_remitos")
        .select("*, inventario_remito_items(*, inventario_items(modelo, familia, subtipo, numero_serie, capacidad))")
        .eq("id", remData.id).single();

      if (remFull) setRemitoCreado(remFull);
      setSuccessMsg(`✓ Remito ${numero} generado con ${lineas.length} ítem${lineas.length > 1 ? "s" : ""}`);
      setLineas([]);
      setBaseDestino(""); setEmailDestino(""); setObservaciones("");
      await loadMovimientos();
      onMovimientoCreado();
    } catch (e) { setErrorMsg("Error: " + e.message); }
    finally { setSaving(false); }
  };

  return (
    <>
    <div className="mov-content">
      <div className="section-label">Movimientos de equipamiento</div>
      <div className="mov-grid">

        {/* PANEL IZQUIERDO */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* BUSCADOR DE ÍTEM */}
          <div className="form-card">
            <div className="form-card-title">Buscar ítem</div>
            {errorMsg && <div className="form-error">{errorMsg}</div>}

            <div className="form-group">
              <label className="form-label">1. Familia</label>
              <select className="form-input" value={filtFamilia} onChange={e => { setFiltFamilia(e.target.value); setFiltSubtipo(""); setFiltCapacidad(""); setFiltCombustible(""); setFiltBaseOrigen(""); setItemId(""); setCantidadMov(1); setErrorMsg(""); }}>
                <option value="">Todas las familias...</option>
                {familiasCasc.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">2. Subtipo</label>
              <select className="form-input" value={filtSubtipo} onChange={e => { setFiltSubtipo(e.target.value); setFiltCapacidad(""); setFiltCombustible(""); setFiltBaseOrigen(""); setItemId(""); setCantidadMov(1); setErrorMsg(""); }} disabled={!filtFamilia}>
                <option value="">{filtFamilia ? "Seleccioná subtipo..." : "Primero elegí familia"}</option>
                {subtiposCasc.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">3. Capacidad</label>
              <select className="form-input" value={filtCapacidad} onChange={e => { setFiltCapacidad(e.target.value); setFiltCombustible(""); setFiltBaseOrigen(""); setItemId(""); setCantidadMov(1); setErrorMsg(""); }} disabled={!filtSubtipo}>
                <option value="">{filtSubtipo ? "Todas las capacidades..." : "Primero elegí subtipo"}</option>
                {capacidadesCasc.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">4. Combustible / Material</label>
              <select className="form-input" value={filtCombustible} onChange={e => { setFiltCombustible(e.target.value); setFiltBaseOrigen(""); setItemId(""); setCantidadMov(1); setErrorMsg(""); }} disabled={!filtSubtipo}>
                <option value="">{filtSubtipo ? "Todos..." : "Primero elegí subtipo"}</option>
                {combustiblesCasc.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">5. Base de origen</label>
              <select className="form-input" value={filtBaseOrigen} onChange={e => { setFiltBaseOrigen(e.target.value); setItemId(""); setCantidadMov(1); setErrorMsg(""); }} disabled={!filtFamilia}>
                <option value="">{filtFamilia ? "Todas las bases..." : "Primero elegí familia"}</option>
                {basesCasc.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">6. Ítem específico</label>
              <select className="form-input" value={itemId} onChange={e => { setItemId(e.target.value); setCantidadMov(1); setErrorMsg(""); }} disabled={!filtBaseOrigen}>
                <option value="">{filtBaseOrigen ? (itemsFiltrados.length === 0 ? "Sin ítems disponibles" : "Seleccioná ítem...") : "Primero elegí base"}</option>
                {itemsFiltrados.map(i => <option key={i.id} value={i.id}>#{i.item_numero} — {i.modelo?.substring(0,35)} ({i.estado})</option>)}
              </select>
            </div>

            {itemSel && (
              <div style={{ background:"#F0F4F8", border:"1px solid var(--border)", borderRadius:8, padding:"10px 14px", fontSize:11 }}>
                <div style={{ fontWeight:700, color:"var(--navy)", marginBottom:4 }}>{itemSel.modelo}</div>
                <div style={{ color:"var(--muted)" }}>Base: <strong style={{ color:"var(--navy)" }}>{itemSel.ubicacion}</strong> · Stock disponible: <strong style={{ color:"var(--navy)" }}>{itemSel.numero_serie ? "único" : itemSel.cantidad}</strong></div>
                {itemSel.capacidad && <div style={{ color:"var(--muted)" }}>Capacidad: {itemSel.capacidad}</div>}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Cantidad</label>
              <input type="number" className="form-input"
                min={1} max={maxCantidad} value={cantidadMov}
                onChange={e => { setCantidadMov(Number(e.target.value)); setErrorMsg(""); }}
                disabled={!!itemSel?.numero_serie}
                style={{ borderColor: cantExcede ? "#EF4444" : undefined }}
              />
              {itemSel && (
                <span className={`cantidad-badge ${cantExcede ? "cantidad-error" : "cantidad-ok"}`} style={{ display:"inline-block", marginTop:4 }}>
                  {cantExcede ? `⚠ Excede el máximo (${maxCantidad})` : `✓ Stock disponible: ${itemSel.numero_serie ? "único" : maxCantidad}`}
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Transportista</label>
              <input type="text" className="form-input" placeholder="Nombre del transportista" value={transportistaLinea} onChange={e => setTransportistaLinea(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Email del transportista</label>
              <input type="email" className="form-input" placeholder="transportista@ejemplo.com" value={emailTransportistaLinea} onChange={e => setEmailTransportistaLinea(e.target.value)} />
            </div>

            <button className="btn-agregar" onClick={agregarLinea} disabled={!itemId || cantExcede}>
              + Agregar al remito
            </button>
          </div>

          {/* DATOS GENERALES DEL REMITO */}
          <div className="form-card">
            <div className="form-card-title">Datos del remito</div>
            {successMsg && <div className="form-success">{successMsg}</div>}

            <div className="form-group">
              <label className="form-label">Base de destino *</label>
              <select className="form-input" value={baseDestino} onChange={e => { setBaseDestino(e.target.value); setErrorMsg(""); }}>
                <option value="">Seleccioná base de destino...</option>
                {basesDestino.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Email receptor en destino</label>
              <input type="email" className="form-input" placeholder="receptor@cleansea.com.ar" value={emailDestino} onChange={e => setEmailDestino(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Observaciones generales</label>
              <input type="text" className="form-input" placeholder="Ej: Respuesta emergencia, mantenimiento..." value={observaciones} onChange={e => setObservaciones(e.target.value)} />
            </div>

            <button className="btn-primary" onClick={handleSubmit} disabled={saving || lineas.length === 0 || !baseDestino}>
              {saving ? "Generando remito..." : `Confirmar y generar remito (${lineas.length} ítem${lineas.length !== 1 ? "s" : ""}) →`}
            </button>
          </div>
        </div>

        {/* PANEL DERECHO */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {/* CARRITO */}
          <div className="carrito-wrap">
            <div className="carrito-header">
              <div className="carrito-title">Ítems en este remito</div>
              <div className="carrito-count">{lineas.length} ítem{lineas.length !== 1 ? "s" : ""}</div>
            </div>
            {lineas.length === 0
              ? <div className="carrito-empty">Buscá ítems y agregálos acá</div>
              : lineas.map((l, idx) => (
                <div key={idx} className="carrito-item">
                  <div className="carrito-item-info">
                    <div className="carrito-item-modelo">#{l.item.item_numero} — {l.item.modelo?.substring(0,40)}</div>
                    <div className="carrito-item-meta">
                      {l.item.familia} · Base: {l.baseOrigen} · Cant: {l.cantidad}
                      {l.transportista && ` · Transp: ${l.transportista}`}
                    </div>
                  </div>
                  <button className="carrito-item-remove" onClick={() => quitarLinea(idx)} title="Quitar del remito">×</button>
                </div>
              ))
            }
          </div>

          {/* HISTORIAL */}
          <div className="mov-table-wrap">
            <div className="mov-table-header">
              <div className="mov-table-title">Últimos movimientos</div>
              <div className="mov-table-count">{movimientos.length} registros</div>
            </div>
            {errorLoad ? <div className="mov-empty" style={{ color:"#991B1B" }}>{errorLoad}</div>
            : loadingMov ? <div className="mov-empty">Cargando...</div>
            : movimientos.length === 0 ? <div className="mov-empty">No hay movimientos registrados aún.</div>
            : (
              <table className="mov-table">
                <thead><tr><th>Fecha</th><th>Ítem</th><th>Movimiento</th><th>Cant.</th></tr></thead>
                <tbody>
                  {movimientos.map(mov => (
                    <tr key={mov.id}>
                      <td className="cell-num" style={{ whiteSpace:"nowrap" }}>{fmtDateTime(mov.created_at)}</td>
                      <td style={{ fontWeight:500 }}>
                        {mov.inventario_items?.modelo?.substring(0,30) || "—"}
                        <div style={{ fontSize:10, color:"var(--muted)", marginTop:2 }}>{mov.inventario_items?.familia}</div>
                      </td>
                      <td><div className="arrow-badge"><strong>{mov.base_origen}</strong><span>→</span><strong style={{ color:"var(--green)" }}>{mov.base_destino}</strong></div></td>
                      <td className="cell-num" style={{ textAlign:"center" }}>{mov.cantidad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
    {remitoCreado && <ModalRemito remito={remitoCreado} onClose={() => setRemitoCreado(null)} />}
    </>
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
        const { data, error } = await supabase.from("inventario_cambios").select("*, inventario_items(modelo, familia, ubicacion)").order("created_at", { ascending: false }).limit(200);
        if (error) throw error;
        setCambios(data || []);
      } catch (e) { setErrorMsg("Error: " + e.message); }
      finally { setLoading(false); }
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
          <div className="mov-table-title">Historial completo</div>
          <div className="mov-table-count">{cambios.length} registros</div>
        </div>
        {errorMsg ? <div className="mov-empty" style={{ color:"#991B1B" }}>{errorMsg}</div>
        : loading  ? <div className="mov-empty">Cargando...</div>
        : cambios.length === 0 ? <div className="mov-empty">No hay cambios registrados.</div>
        : (
          <div className="hist-table-outer">
            <table className="mov-table">
              <thead><tr><th>Fecha</th><th>Tipo</th><th>Ítem</th><th>Campo</th><th>Valor anterior</th><th>Valor nuevo</th><th>Usuario</th></tr></thead>
              <tbody>
                {cambios.map(c => (
                  <tr key={c.id}>
                    <td className="cell-num" style={{ whiteSpace:"nowrap" }}>{fmtDateTime(c.created_at)}</td>
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
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TAB REMITOS ─────────────────────────────────────────────────────────────
function TabRemitos() {
  const [remitos, setRemitos]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [errorMsg, setErrorMsg]   = useState("");
  const [verRemito, setVerRemito] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from("inventario_remitos")
          .select("*, inventario_remito_items(id, cantidad, base_origen, transportista, inventario_items(modelo, familia))")
          .order("created_at", { ascending: false }).limit(200);
        if (error) throw error;
        setRemitos(data || []);
      } catch (e) { setErrorMsg("Error: " + e.message); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const total       = remitos.length;
  const pendientes  = remitos.filter(r => r.estado === "Pendiente").length;
  const confirmados = remitos.filter(r => r.estado === "Confirmado").length;
  const rechazados  = remitos.filter(r => r.estado === "Rechazado").length;

  const badgeRemito = (estado) => {
    if (estado === "Confirmado") return <span className="badge-remito badge-confirmado">Confirmado</span>;
    if (estado === "Rechazado")  return <span className="badge-remito badge-rechazado">Rechazado</span>;
    return <span className="badge-remito badge-pendiente">Pendiente</span>;
  };

  return (
    <div className="rem-content">
      <div className="section-label">Remitos de movimiento</div>

      {/* KPIs */}
      <div className="rem-kpis">
        <div className="rem-kpi">
          <div className="rem-kpi-label">Total</div>
          <div className="rem-kpi-value">{total}</div>
          <div className="rem-kpi-sub">remitos generados</div>
        </div>
        <div className="rem-kpi" style={{ borderColor: "#FDE68A" }}>
          <div className="rem-kpi-label" style={{ color:"#92400E" }}>Pendientes</div>
          <div className="rem-kpi-value" style={{ color:"#F59E0B" }}>{pendientes}</div>
          <div className="rem-kpi-sub">sin confirmar</div>
        </div>
        <div className="rem-kpi" style={{ borderColor: "#A7F3D0" }}>
          <div className="rem-kpi-label" style={{ color:"#065F46" }}>Confirmados</div>
          <div className="rem-kpi-value" style={{ color:"#10B981" }}>{confirmados}</div>
          <div className="rem-kpi-sub">recibidos correctamente</div>
        </div>
        <div className="rem-kpi" style={{ borderColor: "#FECACA" }}>
          <div className="rem-kpi-label" style={{ color:"#991B1B" }}>Rechazados</div>
          <div className="rem-kpi-value" style={{ color:"#EF4444" }}>{rechazados}</div>
          <div className="rem-kpi-sub">requieren atención</div>
        </div>
      </div>

      <div className="mov-table-wrap">
        <div className="mov-table-header">
          <div className="mov-table-title">Registro de remitos</div>
          <div className="mov-table-count">{total} remitos</div>
        </div>
        {errorMsg ? <div className="mov-empty" style={{ color:"#991B1B" }}>{errorMsg}</div>
        : loading  ? <div className="mov-empty">Cargando...</div>
        : remitos.length === 0 ? <div className="mov-empty">No hay remitos generados aún.</div>
        : (
          <div className="hist-table-outer">
            <table className="mov-table">
              <thead>
                <tr>
                  <th>Número</th><th>Fecha</th><th>Ítem</th><th>Origen</th><th>Destino</th>
                  <th>Transportista</th><th>Cant.</th><th>Estado</th><th>Confirmado por</th><th>Motivo rechazo</th><th></th>
                </tr>
              </thead>
              <tbody>
                {remitos.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontFamily:"var(--mono)", fontWeight:700, color:"var(--navy)", fontSize:11 }}>{r.numero}</td>
                    <td className="cell-num" style={{ whiteSpace:"nowrap" }}>{fmtDateTime(r.created_at)}</td>
                    <td style={{ fontWeight:500 }}>
                      {r.inventario_remito_items?.[0]?.inventario_items?.modelo || "—"}
                      <div style={{ fontSize:10, color:"var(--muted)", marginTop:2 }}>
                        {r.inventario_remito_items?.length > 1 ? `${r.inventario_remito_items.length} ítems` : r.inventario_remito_items?.[0]?.inventario_items?.familia || "—"}
                      </div>
                    </td>
                    <td style={{ fontSize:11, color:"var(--muted)" }}>
                      {r.inventario_remito_items?.map(l => l.base_origen).filter((v,i,a) => a.indexOf(v)===i).join(", ") || "—"}
                    </td>
                    <td style={{ color:"var(--green)", fontWeight:500 }}>{r.base_destino}</td>
                    <td style={{ fontSize:11, color:"var(--muted)" }}>{r.inventario_remito_items?.[0]?.transportista || "—"}</td>
                    <td className="cell-num" style={{ textAlign:"center" }}>
                      {r.inventario_remito_items?.reduce((s, l) => s + (l.cantidad || 0), 0) || "—"}
                    </td>
                    <td>{badgeRemito(r.estado)}</td>
                    <td style={{ fontSize:11, color:"var(--muted)" }}>
                      {r.confirmado_por
                        ? <span>{r.confirmado_por}<br/><span style={{ fontSize:10 }}>{fmtDateTime(r.confirmado_at)}</span></span>
                        : "—"}
                    </td>
                    <td style={{ fontSize:11, color:"#991B1B", maxWidth:140, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }} title={r.motivo_rechazo}>
                      {r.motivo_rechazo || "—"}
                    </td>
                    <td><button className="btn-link" onClick={() => setVerRemito(r)}>Ver →</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {verRemito && <ModalRemito remito={verRemito} onClose={() => setVerRemito(null)} />}
    </div>
  );
}

// ─── TAB MANTENIMIENTO ────────────────────────────────────────────────────────
function TabMantenimiento({ items }) {
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const conMant   = items.filter(i => i.fecha_proximo_mantenimiento);
  const vencidos  = conMant.filter(i => { const d = new Date(i.fecha_proximo_mantenimiento); d.setHours(0,0,0,0); return d < hoy; });
  const proximos  = conMant.filter(i => { const d = new Date(i.fecha_proximo_mantenimiento); d.setHours(0,0,0,0); const dias = Math.ceil((d-hoy)/86400000); return dias >= 0 && dias <= 30; });
  const okItems   = conMant.filter(i => { const d = new Date(i.fecha_proximo_mantenimiento); d.setHours(0,0,0,0); return Math.ceil((d-hoy)/86400000) > 30; });
  const sinFecha  = items.filter(i => !i.fecha_proximo_mantenimiento);

  const diasRestantes = (f) => { const d = new Date(f); d.setHours(0,0,0,0); return Math.ceil((d-hoy)/86400000); };

  const seccion = (titulo, lista, colorBadge, colorBg) => lista.length === 0 ? null : (
    <div style={{ marginBottom:32 }}>
      <div className="section-label">{titulo} <span style={{ fontFamily:"var(--mono)", fontSize:9, background:colorBg, color:colorBadge, border:`1px solid ${colorBadge}40`, padding:"2px 8px", borderRadius:4 }}>{lista.length} ítems</span></div>
      <div className="mov-table-wrap">
        <table className="mov-table">
          <thead><tr><th>#</th><th>Familia</th><th>Modelo</th><th>Base</th><th>Próximo mant.</th><th>Último mant.</th><th>Días</th><th>Notas</th><th>Estado</th></tr></thead>
          <tbody>
            {lista.map(it => {
              const dias = it.fecha_proximo_mantenimiento ? diasRestantes(it.fecha_proximo_mantenimiento) : null;
              const famCol = FAMILIA_COLOR[it.familia] || "#4B5563";
              const estCol = ESTADOS_COLOR[it.estado] || { bg:"#F3F4F6", color:"#6B7280", border:"#E5E7EB" };
              return (
                <tr key={it.id}>
                  <td className="cell-num">{it.item_numero ?? "—"}</td>
                  <td><span className="badge-fam" style={{ background:`${famCol}18`, color:famCol, border:`1px solid ${famCol}30` }}>{it.familia || "—"}</span></td>
                               <td style={{ fontWeight:500, maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{it.modelo || "—"}</td>
                  <td>{it.ubicacion || "—"}</td>
                  <td style={{ fontFamily:"var(--mono)", fontSize:11, color: dias !== null && dias < 0 ? "#EF4444" : dias !== null && dias <= 30 ? "#F59E0B" : "var(--text)" }}>{fmtFecha(it.fecha_proximo_mantenimiento)}</td>
                  <td style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--muted)" }}>{fmtFecha(it.fecha_ultimo_mantenimiento)}</td>
                  <td style={{ fontFamily:"var(--mono)", fontSize:11, fontWeight:700, color: dias !== null && dias < 0 ? "#EF4444" : dias !== null && dias <= 30 ? "#F59E0B" : "#10B981" }}>
                    {dias !== null ? (dias < 0 ? `${Math.abs(dias)}d vencido` : `${dias}d`) : "—"}
                  </td>
                  <td style={{ fontSize:11, color:"var(--muted)", maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{it.notas_mantenimiento || "—"}</td>
                  <td><span className="badge-estado" style={{ background:estCol.bg, color:estCol.color, border:`1px solid ${estCol.border}` }}>{it.estado || "—"}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="hist-content">
      <div className="mant-kpis-grid">
        <div style={{ background:"#FEE2E2", border:"1px solid #FECACA", borderRadius:12, padding:"16px 20px" }}>
          <div style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:1.5, color:"#991B1B", textTransform:"uppercase", marginBottom:8 }}>Vencidos</div>
          <div style={{ fontFamily:"var(--mono)", fontSize:32, fontWeight:700, color:"#EF4444" }}>{vencidos.length}</div>
          <div style={{ fontSize:10, color:"#991B1B", marginTop:4 }}>requieren atención inmediata</div>
        </div>
        <div style={{ background:"#FEF3C7", border:"1px solid #FDE68A", borderRadius:12, padding:"16px 20px" }}>
          <div style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:1.5, color:"#92400E", textTransform:"uppercase", marginBottom:8 }}>Próximos 30 días</div>
          <div style={{ fontFamily:"var(--mono)", fontSize:32, fontWeight:700, color:"#F59E0B" }}>{proximos.length}</div>
          <div style={{ fontSize:10, color:"#92400E", marginTop:4 }}>programar mantenimiento</div>
        </div>
        <div style={{ background:"#D1FAE5", border:"1px solid #A7F3D0", borderRadius:12, padding:"16px 20px" }}>
          <div style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:1.5, color:"#065F46", textTransform:"uppercase", marginBottom:8 }}>Al día</div>
          <div style={{ fontFamily:"var(--mono)", fontSize:32, fontWeight:700, color:"#10B981" }}>{okItems.length}</div>
          <div style={{ fontSize:10, color:"#065F46", marginTop:4 }}>más de 30 días restantes</div>
        </div>
        <div style={{ background:"#F3F4F6", border:"1px solid #E5E7EB", borderRadius:12, padding:"16px 20px" }}>
          <div style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:1.5, color:"#6B7280", textTransform:"uppercase", marginBottom:8 }}>Sin fecha</div>
          <div style={{ fontFamily:"var(--mono)", fontSize:32, fontWeight:700, color:"#9CA3AF" }}>{sinFecha.length}</div>
          <div style={{ fontSize:10, color:"#6B7280", marginTop:4 }}>sin planificación</div>
        </div>
      </div>
      {seccion("🔴 Vencidos", vencidos, "#EF4444", "#FEE2E2")}
      {seccion("🟡 Próximos 30 días", proximos, "#F59E0B", "#FEF3C7")}
      {seccion("🟢 Al día", okItems, "#10B981", "#D1FAE5")}
    </div>
  );
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
function LoginPage() {
  const [email, setEmail]       = useState("");
  const [pass, setPass]         = useState("");
  const [loadingL, setLoadingL] = useState(false);
  const [error, setError]       = useState("");

  const handleLogin = async () => {
    setLoadingL(true); setError("");
    try {
      const { error: e } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (e) setError("Credenciales incorrectas. Verificá tu email y contraseña.");
    } catch {
      setError("Error de conexión. Verificá tu red e intentá nuevamente.");
    } finally {
      setLoadingL(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") handleLogin(); };

  const loginCSS = `
    .lw{min-height:100vh;display:flex;background:#0B1E1C;position:relative;overflow:hidden}
    .lo{position:absolute;inset:0;z-index:1;background:linear-gradient(135deg,rgba(11,30,28,0.93) 0%,rgba(11,30,28,0.75) 60%,rgba(11,30,28,0.93) 100%)}
    .ll{position:absolute;inset:0;z-index:0;background-image:linear-gradient(rgba(26,122,110,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(26,122,110,0.05) 1px,transparent 1px);background-size:60px 60px}
    .ls{position:relative;z-index:2;display:flex;width:100%}
    .lleft{flex:1;display:flex;flex-direction:column;justify-content:center;padding:80px 60px;border-right:1px solid rgba(26,122,110,0.2)}
    .ley{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:3px;color:rgba(255,255,255,0.4);text-transform:uppercase;margin-bottom:16px}
    .ltitle{font-size:44px;font-weight:900;color:#fff;line-height:0.95;letter-spacing:-2px}
    .ltitle span{color:#22998A;display:block}
    .lline{width:48px;height:3px;background:#1A7A6E;margin:18px 0}
    .lsub{font-size:13px;color:rgba(255,255,255,0.4);line-height:1.7;max-width:300px;font-style:italic}
    .lright{width:420px;flex-shrink:0;display:flex;align-items:center;justify-content:center;padding:60px 48px}
    .lcard{width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(26,122,110,0.25);border-radius:16px;padding:36px;backdrop-filter:blur(20px)}
    .lct{font-size:15px;font-weight:700;color:#fff;margin-bottom:4px}
    .lcs{font-family:'DM Mono',monospace;font-size:10px;color:rgba(255,255,255,0.35);letter-spacing:1px;margin-bottom:24px;text-transform:uppercase}
    .lfg{display:flex;flex-direction:column;gap:5px;margin-bottom:12px}
    .lfg label{font-size:9px;color:rgba(255,255,255,0.4);letter-spacing:1px;text-transform:uppercase;font-weight:600}
    .lfg input{border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:10px 13px;font-size:13px;font-family:'Montserrat',sans-serif;color:#fff;background:rgba(255,255,255,0.06);outline:none;transition:border-color .15s}
    .lfg input::placeholder{color:rgba(255,255,255,0.2)}
    .lfg input:focus{border-color:#22998A}
    .lbtn{width:100%;padding:11px;margin-top:8px;background:#1A7A6E;color:#fff;border:none;border-radius:8px;font-family:'Montserrat',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:background .15s}
    .lbtn:hover{background:#22998A}
    .lbtn:disabled{opacity:.5;cursor:not-allowed}
    .lerr{background:rgba(239,68,68,0.12);color:#FCA5A5;border:1px solid rgba(239,68,68,0.25);border-radius:8px;padding:10px 13px;font-size:12px;margin-bottom:12px}
    .lfoot{text-align:center;font-family:'DM Mono',monospace;font-size:9px;color:rgba(255,255,255,0.2);margin-top:16px;letter-spacing:1px}
    @media(max-width:768px){.ls{flex-direction:column}.lleft{padding:48px 32px;border-right:none;border-bottom:1px solid rgba(26,122,110,0.2)}.lright{width:100%;padding:32px 24px}.ltitle{font-size:32px}}
  `;

  return (
    <>
      <style>{loginCSS}</style>
      <div className="lw">
        <div className="ll" /><div className="lo" />
        <div className="ls">
          <div className="lleft">
            <div className="ley">Inventario de equipamiento</div>
            <div className="ltitle">INVENTARIO<span>CLEAN SEA</span></div>
            <div className="lline" />
            <div className="lsub">Control de stock, movimientos y remitos de equipamiento de respuesta a derrames.</div>
          </div>
          <div className="lright">
            <div className="lcard">
              <div className="lct">Acceso al sistema</div>
              <div className="lcs">Solo personal autorizado</div>
              {error && <div className="lerr">{error}</div>}
              <div className="lfg"><label>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={handleKey} placeholder="usuario@cleansea.com.ar" autoFocus /></div>
              <div className="lfg"><label>Contraseña</label><input type="password" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={handleKey} placeholder="••••••••" /></div>
              <button className="lbtn" onClick={handleLogin} disabled={loadingL || !email || !pass}>{loadingL ? "Ingresando..." : "Ingresar →"}</button>
              <div className="lfoot">Clean Sea · Inventario · Confidencial</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function InventarioApp() {
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab]             = useState("inventario");
  const [usuario, setUsuario]     = useState("sistema");

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
    } catch (e) { setLoadError("Error al cargar el inventario: " + e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadItems(); }, []);

  const total       = items.length;
  const disponibles = items.filter(i => i.estado === "Disponible").length;
  const enUso       = items.filter(i => i.estado === "En uso").length;
  const fueraServ   = items.filter(i => i.estado === "Fuera de servicio").length;
  const faltaMant   = items.filter(i => i.estado === "Falta mantenimiento").length;

  if (loading)   return <div className="loading"><style>{CSS}</style><div className="loading-text">Cargando inventario...</div></div>;
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
        <button className="back-btn" onClick={() => window.location.href = PORTAL_URL}>← Volver al portal</button>
      </header>

      <div className="hero">
        <div className="hero-content">
          <div className="hero-eyebrow">Sistema de inventario</div>
          <h1 className="hero-title">Equipamiento <span>operativo</span></h1>
          <div className="kpis">
            <div className="kpi"><div className="kpi-label">Total ítems</div><div className="kpi-value">{total}</div><div className="kpi-sub">registros activos</div></div>
            <div className="kpi green"><div className="kpi-label">Disponibles</div><div className="kpi-value">{disponibles}</div><div className="kpi-sub">{total ? Math.round(disponibles/total*100) : 0}%</div></div>
            <div className="kpi blue"><div className="kpi-label">En uso</div><div className="kpi-value">{enUso}</div><div className="kpi-sub">desplegados</div></div>
            <div className="kpi yellow"><div className="kpi-label">Falta mant.</div><div className="kpi-value">{faltaMant}</div><div className="kpi-sub">requieren atención</div></div>
            <div className="kpi red"><div className="kpi-label">Fuera servicio</div><div className="kpi-value">{fueraServ}</div><div className="kpi-sub">no operativos</div></div>
          </div>
          <div className="tabs">
            <button className={"tab-btn"+(tab==="inventario"?" active":"")} onClick={()=>setTab("inventario")}>📦 Inventario</button>
            <button className={"tab-btn"+(tab==="movimientos"?" active":"")} onClick={()=>setTab("movimientos")}>🔄 Movimientos</button>
            <button className={"tab-btn"+(tab==="remitos"?" active":"")} onClick={()=>setTab("remitos")}>📄 Remitos</button>
            <button className={"tab-btn"+(tab==="historial"?" active":"")} onClick={()=>setTab("historial")}>📋 Historial</button>
            <button className={"tab-btn"+(tab==="mantenimiento"?" active":"")} onClick={()=>setTab("mantenimiento")}>🔧 Mantenimiento</button>
          </div>
        </div>
      </div>

      {tab === "inventario"    && <TabInventario   items={items} onReload={loadItems} usuario={usuario} />}
      {tab === "movimientos"   && <TabMovimientos  items={items} onMovimientoCreado={loadItems} usuario={usuario} />}
      {tab === "remitos"       && <TabRemitos />}
      {tab === "historial"     && <TabHistorial />}
      {tab === "mantenimiento" && <TabMantenimiento items={items} />}
    </>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#0B1E1C" }}>
      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"rgba(255,255,255,0.3)", letterSpacing:3, textTransform:"uppercase" }}>Cargando...</div>
    </div>
  );

  if (!session) return <LoginPage />;
  return <InventarioApp />;
}
