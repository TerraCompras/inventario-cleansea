import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "./lib/supabase";

const fmtDateTime = (f) => f ? new Date(f).toLocaleString("es-AR", {
  day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit"
}) : "—";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --navy: #213363; --blue: #235C96; --green: #1A7A6E; --red: #DC2626;
  --bg: #EEF2F7; --surface: #FFFFFF; --border: #D6E0ED;
  --text: #213363; --muted: #6381A7;
  --sans: 'Montserrat', sans-serif; --mono: 'DM Mono', monospace;
}
body { font-family: var(--sans); background: var(--bg); color: var(--text); min-height: 100vh; }

.page { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; }
.card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; width: 100%; max-width: 680px; box-shadow: 0 8px 40px rgba(33,51,99,.12); overflow: hidden; }

/* HEADER */
.card-header { background: var(--navy); padding: 28px 32px; }
.card-logo { font-size: 16px; font-weight: 800; color: #fff; letter-spacing: 2px; margin-bottom: 4px; }
.card-numero { font-family: var(--mono); font-size: 24px; font-weight: 700; color: #6EE7DE; }
.card-fecha { font-size: 11px; color: rgba(255,255,255,.45); margin-top: 4px; font-family: var(--mono); }

/* LOGIN */
.login-body { padding: 32px; }
.login-title { font-size: 16px; font-weight: 700; color: var(--navy); margin-bottom: 6px; }
.login-sub { font-size: 12px; color: var(--muted); margin-bottom: 24px; }
.field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 14px; }
.field label { font-family: var(--mono); font-size: 9px; letter-spacing: 1px; color: var(--muted); text-transform: uppercase; }
.field input { padding: 10px 14px; border: 1px solid var(--border); border-radius: 8px; font-family: var(--sans); font-size: 13px; color: var(--text); outline: none; }
.field input:focus { border-color: var(--blue); }
.btn-login { width: 100%; padding: 12px; background: var(--blue); color: #fff; border: none; border-radius: 8px; font-family: var(--sans); font-size: 13px; font-weight: 700; cursor: pointer; margin-top: 4px; }
.btn-login:hover { background: var(--navy); }
.btn-login:disabled { opacity: .5; cursor: not-allowed; }

/* REMITO */
.remito-body { padding: 28px 32px; }
.section-title { font-family: var(--mono); font-size: 9px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border); }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
.field-label { font-family: var(--mono); font-size: 9px; letter-spacing: 1px; color: var(--muted); text-transform: uppercase; margin-bottom: 4px; }
.field-value { font-size: 13px; font-weight: 600; color: var(--navy); }

.items-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
.items-table th { font-family: var(--mono); font-size: 9px; letter-spacing: 1px; text-transform: uppercase; color: #fff; background: var(--navy); padding: 10px 14px; text-align: left; }
.items-table td { padding: 10px 14px; border-bottom: 1px solid #F0F4F8; font-size: 12px; }
.items-table tr:last-child td { border-bottom: none; }

/* ACCIONES */
.acciones { padding: 24px 32px 28px; background: #F8FAFC; border-top: 1px solid var(--border); }
.acciones-title { font-size: 14px; font-weight: 700; color: var(--navy); margin-bottom: 16px; }
.motivo-field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 16px; }
.motivo-field label { font-family: var(--mono); font-size: 9px; letter-spacing: 1px; color: var(--muted); text-transform: uppercase; }
.motivo-field input { padding: 10px 14px; border: 1px solid var(--border); border-radius: 8px; font-family: var(--sans); font-size: 12px; color: var(--text); outline: none; }
.motivo-field input:focus { border-color: var(--red); }
.btn-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.btn-confirmar { padding: 13px; background: var(--green); color: #fff; border: none; border-radius: 10px; font-family: var(--sans); font-size: 13px; font-weight: 700; cursor: pointer; transition: background .15s; }
.btn-confirmar:hover { background: #156057; }
.btn-confirmar:disabled { opacity: .5; cursor: not-allowed; }
.btn-rechazar { padding: 13px; background: #fff; color: var(--red); border: 2px solid var(--red); border-radius: 10px; font-family: var(--sans); font-size: 13px; font-weight: 700; cursor: pointer; transition: all .15s; }
.btn-rechazar:hover { background: #FEE2E2; }
.btn-rechazar:disabled { opacity: .5; cursor: not-allowed; }

/* ESTADOS FINALES */
.estado-confirmado { padding: 28px 32px; background: #D1FAE5; border-top: 1px solid #A7F3D0; text-align: center; }
.estado-rechazado  { padding: 28px 32px; background: #FEE2E2; border-top: 1px solid #FECACA; text-align: center; }
.estado-icon  { font-size: 40px; margin-bottom: 12px; }
.estado-title { font-size: 18px; font-weight: 700; margin-bottom: 6px; }
.estado-sub   { font-size: 12px; }
.estado-confirmado .estado-title { color: #065F46; }
.estado-confirmado .estado-sub   { color: #065F46; }
.estado-rechazado  .estado-title { color: #991B1B; }
.estado-rechazado  .estado-sub   { color: #991B1B; }

.sin-acceso { padding: 40px 32px; text-align: center; }
.sin-acceso-title { font-size: 16px; font-weight: 700; color: #991B1B; margin-bottom: 8px; }
.sin-acceso-sub { font-size: 12px; color: var(--muted); }

.error-msg { background: #FEE2E2; color: #991B1B; border: 1px solid #FECACA; border-radius: 8px; padding: 10px 14px; font-size: 12px; margin-bottom: 14px; }
.loading { padding: 60px 20px; text-align: center; font-family: var(--mono); font-size: 11px; color: var(--muted); letter-spacing: 2px; text-transform: uppercase; }
.not-found { padding: 60px 20px; text-align: center; }
.not-found-title { font-size: 16px; font-weight: 700; color: #991B1B; margin-bottom: 8px; }
.not-found-sub { font-size: 12px; color: var(--muted); }
.logout-link { font-size: 11px; color: var(--muted); text-align: center; margin-top: 12px; cursor: pointer; text-decoration: underline; }

@media (max-width: 600px) {
  .grid-2 { grid-template-columns: 1fr; }
  .card-header, .remito-body, .acciones, .login-body { padding: 20px; }
  .btn-row { grid-template-columns: 1fr; }
}
@media print {
  .acciones, .logout-link { display: none; }
  body { background: white; }
}
`;

export default function ConfirmarRemito() {
  const { token } = useParams();

  // Auth
  const [session, setSession]       = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass]   = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Remito
  const [remito, setRemito]         = useState(null);
  const [remitoLoading, setRemitoLoading] = useState(false);
  const [notFound, setNotFound]     = useState(false);
  const [tieneAcceso, setTieneAcceso] = useState(false);

  // Acciones
  const [motivo, setMotivo]         = useState("");
  const [saving, setSaving]         = useState(false);
  const [errorMsg, setErrorMsg]     = useState("");
  const [showRechazo, setShowRechazo] = useState(false);

  // 1. Escuchar sesión
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // 2. Cuando hay sesión, verificar acceso y cargar remito
  useEffect(() => {
    if (!session) return;
    verificarAccesoYCargar();
  }, [session, token]);

  const verificarAccesoYCargar = async () => {
    setRemitoLoading(true);
    try {
      // Verificar que el usuario tiene rol confirmar-remitos
      const { data: roles } = await supabase
        .from("user_roles")
        .select("modulos")
        .eq("user_id", session.user.id)
        .single();

      if (!roles?.modulos?.includes("confirmar-remitos")) {
        setTieneAcceso(false);
        setRemitoLoading(false);
        return;
      }
      setTieneAcceso(true);

      // Cargar remito
      const { data, error } = await supabase
        .from("inventario_remitos")
        .select("*, inventario_remito_items(*, inventario_items(modelo, familia, subtipo, numero_serie, capacidad))")
        .eq("token_confirmacion", token)
        .maybeSingle();
      if (error) throw error;
      if (!data) { setNotFound(true); return; }
      setRemito(data);
    } catch (e) {
      setNotFound(true);
    } finally {
      setRemitoLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoginLoading(true); setLoginError("");
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPass });
    if (error) setLoginError("Email o contraseña incorrectos.");
    setLoginLoading(false);
  };

  const handleConfirmar = async () => {
    setSaving(true); setErrorMsg("");
    try {
      const { error } = await supabase.from("inventario_remitos").update({
        estado: "Confirmado",
        confirmado_por: session.user.email,
        confirmado_at: new Date().toISOString(),
      }).eq("id", remito.id);
      if (error) throw error;
      setRemito(prev => ({ ...prev, estado: "Confirmado", confirmado_por: session.user.email, confirmado_at: new Date().toISOString() }));
    } catch (e) { setErrorMsg("Error al confirmar: " + e.message); }
    finally { setSaving(false); }
  };

  const handleRechazar = async () => {
    if (!motivo.trim()) { setErrorMsg("Ingresá el motivo del rechazo."); return; }
    setSaving(true); setErrorMsg("");
    try {
      const { error } = await supabase.from("inventario_remitos").update({
        estado: "Rechazado",
        confirmado_por: session.user.email,
        confirmado_at: new Date().toISOString(),
        motivo_rechazo: motivo.trim(),
      }).eq("id", remito.id);
      if (error) throw error;
      setRemito(prev => ({ ...prev, estado: "Rechazado", confirmado_por: session.user.email, confirmado_at: new Date().toISOString(), motivo_rechazo: motivo.trim() }));
    } catch (e) { setErrorMsg("Error al rechazar: " + e.message); }
    finally { setSaving(false); }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); };

  return (
    <>
      <style>{CSS}</style>
      <div className="page">
        <div className="card">
          {/* HEADER siempre visible si hay remito */}
          {remito && (
            <div className="card-header">
              <div className="card-logo">CLEAN SEA</div>
              <div className="card-numero">{remito.numero}</div>
              <div className="card-fecha">Emitido el {fmtDateTime(remito.created_at)} por {remito.usuario_emisor}</div>
            </div>
          )}

          {/* LOADING */}
          {(authLoading || remitoLoading) && (
            <div className="loading">Cargando...</div>
          )}

          {/* NO LOGUEADO → LOGIN */}
          {!authLoading && !session && (
            <div className="login-body">
              {!remito && <div style={{ fontFamily:"var(--mono)", fontSize:22, fontWeight:700, color:"var(--navy)", marginBottom:4 }}>CLEAN SEA</div>}
              <div className="login-title">Confirmación de remito</div>
              <div className="login-sub">Ingresá con tu cuenta para ver y confirmar el remito.</div>
              {loginError && <div className="error-msg">{loginError}</div>}
              <div className="field">
                <label>Email</label>
                <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  placeholder="base@cleansea.com.ar" autoFocus />
              </div>
              <div className="field">
                <label>Contraseña</label>
                <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  placeholder="••••••••" />
              </div>
              <button className="btn-login" onClick={handleLogin} disabled={loginLoading || !loginEmail || !loginPass}>
                {loginLoading ? "Ingresando..." : "Ingresar →"}
              </button>
            </div>
          )}

          {/* LOGUEADO SIN ACCESO */}
          {!authLoading && !remitoLoading && session && !tieneAcceso && (
            <div className="sin-acceso">
              <div className="sin-acceso-title">Sin acceso</div>
              <div className="sin-acceso-sub">Tu cuenta no tiene permisos para confirmar remitos.</div>
              <div className="logout-link" onClick={handleLogout}>Cerrar sesión</div>
            </div>
          )}

          {/* NOT FOUND */}
          {!authLoading && !remitoLoading && session && tieneAcceso && notFound && (
            <div className="not-found">
              <div className="not-found-title">Remito no encontrado</div>
              <div className="not-found-sub">El link puede ser inválido o ya expiró.</div>
              <div className="logout-link" onClick={handleLogout}>Cerrar sesión</div>
            </div>
          )}

          {/* REMITO CARGADO */}
          {!authLoading && !remitoLoading && session && tieneAcceso && remito && (
            <>
              <div className="remito-body">
                <div className="section-title">Datos del movimiento</div>
                <div className="grid-2">
                  <div>
                    <div className="field-label">Base de destino</div>
                    <div className="field-value">{remito.base_destino}</div>
                  </div>
                  <div>
                    <div className="field-label">Estado</div>
                    <div className="field-value" style={{ color: remito.estado === "Confirmado" ? "#065F46" : remito.estado === "Rechazado" ? "#991B1B" : "#92400E" }}>
                      {remito.estado === "Confirmado" ? "✓ Confirmado" : remito.estado === "Rechazado" ? "✗ Rechazado" : "⏳ Pendiente"}
                    </div>
                  </div>
                  {remito.observaciones && (
                    <div style={{ gridColumn:"1/-1" }}>
                      <div className="field-label">Observaciones</div>
                      <div className="field-value">{remito.observaciones}</div>
                    </div>
                  )}
                </div>

                <div className="section-title">Equipamiento</div>
                <table className="items-table">
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
                        <td style={{ fontWeight:600 }}>{linea.inventario_items?.modelo || "—"}</td>
                        <td style={{ fontSize:11, color:"var(--muted)" }}>{linea.inventario_items?.familia || "—"}</td>
                        <td>{linea.base_origen || "—"}</td>
                        <td style={{ fontFamily:"var(--mono)", textAlign:"center" }}>{linea.cantidad}</td>
                        <td style={{ fontSize:11, color:"var(--muted)" }}>{linea.transportista || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ESTADO FINAL */}
              {remito.estado === "Confirmado" && (
                <div className="estado-confirmado">
                  <div className="estado-icon">✅</div>
                  <div className="estado-title">Recepción confirmada</div>
                  <div className="estado-sub">Confirmado por <strong>{remito.confirmado_por}</strong> el {fmtDateTime(remito.confirmado_at)}</div>
                  <div className="logout-link" onClick={handleLogout}>Cerrar sesión</div>
                </div>
              )}

              {remito.estado === "Rechazado" && (
                <div className="estado-rechazado">
                  <div className="estado-icon">❌</div>
                  <div className="estado-title">Remito rechazado</div>
                  <div className="estado-sub">
                    Rechazado por <strong>{remito.confirmado_por}</strong> el {fmtDateTime(remito.confirmado_at)}
                    {remito.motivo_rechazo && <><br/>Motivo: <strong>{remito.motivo_rechazo}</strong></>}
                  </div>
                  <div className="logout-link" onClick={handleLogout}>Cerrar sesión</div>
                </div>
              )}

              {/* FORMULARIO DE ACCIÓN */}
              {remito.estado === "Pendiente" && (
                <div className="acciones">
                  <div className="acciones-title">
                    {showRechazo ? "Rechazar remito" : "Confirmar recepción del equipamiento"}
                  </div>
                  {errorMsg && <div className="error-msg">{errorMsg}</div>}

                  {showRechazo && (
                    <div className="motivo-field">
                      <label>Motivo del rechazo *</label>
                      <input type="text" value={motivo} onChange={e => { setMotivo(e.target.value); setErrorMsg(""); }}
                        placeholder="Ej: Equipamiento dañado, cantidad incorrecta..." autoFocus />
                    </div>
                  )}

                  <div className="btn-row">
                    {showRechazo ? (
                      <>
                        <button className="btn-rechazar" onClick={() => { setShowRechazo(false); setMotivo(""); setErrorMsg(""); }}>
                          ← Cancelar
                        </button>
                        <button className="btn-rechazar" onClick={handleRechazar} disabled={saving || !motivo.trim()}
                          style={{ background: saving ? undefined : "#DC2626", color:"#fff", borderColor:"#DC2626" }}>
                          {saving ? "Rechazando..." : "✗ Confirmar rechazo"}
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="btn-rechazar" onClick={() => setShowRechazo(true)} disabled={saving}>
                          ✗ Rechazar
                        </button>
                        <button className="btn-confirmar" onClick={handleConfirmar} disabled={saving}>
                          {saving ? "Confirmando..." : "✓ Confirmar recepción"}
                        </button>
                      </>
                    )}
                  </div>
                  <div style={{ marginTop:12, fontSize:11, color:"var(--muted)", textAlign:"center" }}>
                    Sesión activa: <strong>{session.user.email}</strong> · <span className="logout-link" style={{ display:"inline" }} onClick={handleLogout}>Cerrar sesión</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
