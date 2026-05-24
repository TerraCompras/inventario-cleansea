import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "./lib/supabase";

const fmtDateTime = (f) => f ? new Date(f).toLocaleString("es-AR", {
  day:"2-digit", month:"2-digit", year:"numeric",
  hour:"2-digit", minute:"2-digit"
}) : "—";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --navy: #213363; --blue: #235C96; --green: #1A7A6E;
  --bg: #EEF2F7; --surface: #FFFFFF; --border: #D6E0ED;
  --text: #213363; --muted: #6381A7;
  --sans: 'Montserrat', sans-serif; --mono: 'DM Mono', monospace;
}
body { font-family: var(--sans); background: var(--bg); color: var(--text); min-height: 100vh; }

.conf-page { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; }
.conf-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; width: 100%; max-width: 680px; box-shadow: 0 8px 40px rgba(33,51,99,.12); overflow: hidden; }
.conf-header { background: var(--navy); padding: 28px 32px; }
.conf-logo { font-size: 16px; font-weight: 800; color: #fff; letter-spacing: 2px; margin-bottom: 4px; }
.conf-numero { font-family: var(--mono); font-size: 24px; font-weight: 700; color: #6EE7DE; }
.conf-fecha { font-size: 11px; color: rgba(255,255,255,.45); margin-top: 4px; font-family: var(--mono); }
.conf-body { padding: 28px 32px; }
.conf-section { margin-bottom: 24px; }
.conf-section-title { font-family: var(--mono); font-size: 9px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border); }
.conf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.conf-field-label { font-family: var(--mono); font-size: 9px; letter-spacing: 1px; color: var(--muted); text-transform: uppercase; margin-bottom: 4px; }
.conf-field-value { font-size: 13px; font-weight: 600; color: var(--navy); }
.conf-items-table { width: 100%; border-collapse: collapse; }
.conf-items-table th { font-family: var(--mono); font-size: 9px; letter-spacing: 1px; text-transform: uppercase; color: #fff; background: var(--navy); padding: 10px 14px; text-align: left; }
.conf-items-table td { padding: 10px 14px; border-bottom: 1px solid #F0F4F8; font-size: 12px; }
.conf-items-table tr:last-child td { border-bottom: none; }

.conf-form { border-top: 1px solid var(--border); padding: 24px 32px 28px; background: #F8FAFC; }
.conf-form-title { font-size: 14px; font-weight: 700; color: var(--navy); margin-bottom: 16px; }
.conf-input-label { font-family: var(--mono); font-size: 9px; letter-spacing: 1px; color: var(--muted); text-transform: uppercase; margin-bottom: 6px; display: block; }
.conf-input { width: 100%; padding: 10px 14px; border: 1px solid var(--border); border-radius: 8px; font-family: var(--sans); font-size: 13px; color: var(--text); outline: none; margin-bottom: 16px; }
.conf-input:focus { border-color: var(--blue); }
.conf-btn { width: 100%; padding: 13px; background: var(--green); color: #fff; border: none; border-radius: 10px; font-family: var(--sans); font-size: 14px; font-weight: 700; cursor: pointer; letter-spacing: .3px; transition: background .15s; }
.conf-btn:hover { background: #156057; }
.conf-btn:disabled { opacity: .5; cursor: not-allowed; }
.conf-error { background: #FEE2E2; color: #991B1B; border: 1px solid #FECACA; border-radius: 8px; padding: 10px 14px; font-size: 12px; margin-bottom: 14px; }

.conf-ya-confirmado { padding: 28px 32px; background: #D1FAE5; border-top: 1px solid #A7F3D0; text-align: center; }
.conf-ya-confirmado-icon { font-size: 40px; margin-bottom: 12px; }
.conf-ya-confirmado-title { font-size: 18px; font-weight: 700; color: #065F46; margin-bottom: 6px; }
.conf-ya-confirmado-sub { font-size: 12px; color: #065F46; }

.conf-loading { text-align: center; padding: 60px 20px; }
.conf-loading-text { font-family: var(--mono); font-size: 11px; color: var(--muted); letter-spacing: 2px; text-transform: uppercase; }
.conf-not-found { text-align: center; padding: 60px 20px; }
.conf-not-found-title { font-size: 18px; font-weight: 700; color: #991B1B; margin-bottom: 8px; }
.conf-not-found-sub { font-size: 12px; color: var(--muted); }

@media (max-width: 600px) {
  .conf-grid { grid-template-columns: 1fr; }
  .conf-header, .conf-body, .conf-form, .conf-ya-confirmado { padding: 20px; }
}

@media print {
  .conf-form { display: none; }
  body { background: white; }
}
`;

export default function ConfirmarRemito() {
  const { token } = useParams();
  const [remito, setRemito]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [notFound, setNotFound]   = useState(false);
  const [nombre, setNombre]       = useState("");
  const [saving, setSaving]       = useState(false);
  const [errorMsg, setErrorMsg]   = useState("");
  const [confirmado, setConfirmado] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("inventario_remitos")
          .select("*, inventario_remito_items(*, inventario_items(modelo, familia, subtipo, numero_serie, capacidad))")
          .eq("token_confirmacion", token)
          .maybeSingle();
        if (error) throw error;
        if (!data) { setNotFound(true); return; }
        setRemito(data);
        if (data.estado === "Confirmado") setConfirmado(true);
      } catch (e) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const handleConfirmar = async () => {
    if (!nombre.trim()) { setErrorMsg("Ingresá tu nombre para confirmar la recepción."); return; }
    setSaving(true); setErrorMsg("");
    try {
      const { error } = await supabase
        .from("inventario_remitos")
        .update({
          estado: "Confirmado",
          confirmado_por: nombre.trim(),
          confirmado_at: new Date().toISOString(),
        })
        .eq("id", remito.id);
      if (error) throw error;
      setConfirmado(true);
      setRemito(prev => ({ ...prev, estado: "Confirmado", confirmado_por: nombre.trim(), confirmado_at: new Date().toISOString() }));
    } catch (e) {
      setErrorMsg("Error al confirmar: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="conf-page">
        <div className="conf-card">
          {loading ? (
            <div className="conf-loading">
              <div className="conf-loading-text">Cargando remito...</div>
            </div>
          ) : notFound ? (
            <div className="conf-not-found">
              <div className="conf-not-found-title">Remito no encontrado</div>
              <div className="conf-not-found-sub">El link puede ser inválido o ya expiró.</div>
            </div>
          ) : (
            <>
              <div className="conf-header">
                <div className="conf-logo">CLEAN SEA</div>
                <div className="conf-numero">{remito.numero}</div>
                <div className="conf-fecha">Emitido el {fmtDateTime(remito.created_at)} por {remito.usuario_emisor}</div>
              </div>

              <div className="conf-body">
                <div className="conf-section">
                  <div className="conf-section-title">Datos del movimiento</div>
                  <div className="conf-grid">
                    <div>
                      <div className="conf-field-label">Base de destino</div>
                      <div className="conf-field-value">{remito.base_destino}</div>
                    </div>
                    <div>
                      <div className="conf-field-label">Estado</div>
                      <div className="conf-field-value" style={{ color: confirmado ? "#065F46" : "#92400E" }}>
                        {confirmado ? "✓ Confirmado" : "⏳ Pendiente de confirmación"}
                      </div>
                    </div>
                    {remito.observaciones && (
                      <div style={{ gridColumn: "1 / -1" }}>
                        <div className="conf-field-label">Observaciones</div>
                        <div className="conf-field-value">{remito.observaciones}</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="conf-section">
                  <div className="conf-section-title">Equipamiento</div>
                  <table className="conf-items-table">
                    <thead>
                      <tr>
                        <th>Descripción</th>
                        <th>Familia</th>
                        <th>Origen</th>
                        <th>Cant.</th>
                        <th>Transportista</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(remito.inventario_remito_items || []).map((linea, idx) => (
                        <tr key={linea.id || idx}>
                          <td style={{ fontWeight: 600 }}>{linea.inventario_items?.modelo || "—"}</td>
                          <td style={{ fontSize: 11, color: "var(--muted)" }}>{linea.inventario_items?.familia || "—"}</td>
                          <td>{linea.base_origen || "—"}</td>
                          <td style={{ fontFamily: "var(--mono)", textAlign: "center" }}>{linea.cantidad}</td>
                          <td style={{ fontSize: 11, color: "var(--muted)" }}>{linea.transportista || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {confirmado ? (
                <div className="conf-ya-confirmado">
                  <div className="conf-ya-confirmado-icon">✅</div>
                  <div className="conf-ya-confirmado-title">Recepción confirmada</div>
                  <div className="conf-ya-confirmado-sub">
                    Confirmado por <strong>{remito.confirmado_por}</strong> el {fmtDateTime(remito.confirmado_at)}
                  </div>
                </div>
              ) : (
                <div className="conf-form">
                  <div className="conf-form-title">Confirmar recepción del equipamiento</div>
                  {errorMsg && <div className="conf-error">{errorMsg}</div>}
                  <label className="conf-input-label">Tu nombre completo *</label>
                  <input
                    type="text"
                    className="conf-input"
                    placeholder="Ej: Juan Pérez"
                    value={nombre}
                    onChange={e => { setNombre(e.target.value); setErrorMsg(""); }}
                  />
                  <button className="conf-btn" onClick={handleConfirmar} disabled={saving || !nombre.trim()}>
                    {saving ? "Confirmando..." : "✓ Confirmar recepción del equipamiento"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
