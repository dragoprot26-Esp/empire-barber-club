import { useState, useEffect, useRef, FormEvent } from 'react';
import {
  ShieldCheck, Eye, LayoutDashboard, Lock, Mail, KeyRound, Share2, Fingerprint,
} from 'lucide-react';
import { Tenant, Collaborator, Service, Booking, Testimonial, Payment, PushNotification } from './types';
import PublicPage from './components/PublicPage';
import TenantAdmin from './components/TenantAdmin';
import {
  validarLicencia, asegurarCuentaSeguraDueno, asegurarCuentaSeguraColab,
  cloudLoad, cloudSave, barbPublica, barbAgregarReserva, barbAgregarTestimonio,
  barbHistListar, barbHistRestaurar,
  signOut,
} from './cloud';
import * as bio from './biometric';

// ── Barbería vacía por defecto (local nuevo; los datos reales vienen de la nube) ──
const defaultTenant: Tenant = {
  id: '',
  name: 'Mi Barbería',
  slug: '',
  font: 'serif',
  primaryColor: '#B8860B',
  secondaryColor: '#171717',
  logoUrl: '💈',
  licenseType: 'Basic',
  licenseExpiry: '',
  status: 'Active',
  phone: '',
  address: '',
  shopImageUrl: '',
  description: 'Cortes perfectos, toallas calientes y mucho estilo.',
  currency: 'ARS',
  phonePrefix: '+54 9',
};
const defaultTimeSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'];

interface Licencia { codigo: string; usuario_admin?: string; pass_admin?: string; nombre_negocio?: string; plan?: string; fecha_vencimiento?: string; }

function getLicencia(): Licencia | null { try { return JSON.parse(localStorage.getItem('barb_licencia') || 'null'); } catch { return null; } }
function saveLicencia(l: Licencia) { localStorage.setItem('barb_licencia', JSON.stringify(l)); }
function getCodigoURL(): string | null { try { return new URLSearchParams(window.location.search).get('codigo'); } catch { return null; } }

export default function App() {
  const publicCode = getCodigoURL();
  const publicMode = !!publicCode;

  // Datos de la barbería
  const [tenant, setTenant] = useState<Tenant>(defaultTenant);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [generalTimeSlots, setGeneralTimeSlots] = useState<string[]>(defaultTimeSlots);

  // Vistas
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const [cargandoPublico, setCargandoPublico] = useState(publicMode);
  const [bloqueada, setBloqueada] = useState(false);

  // Seguridad (OTP estético)
  const [securitySettings, setSecuritySettings] = useState({ otpEnabled: true, biometricsEnabled: false });

  // Flujo de login: 'license' | 'credentials' | 'otp'
  const [loginStep, setLoginStep] = useState<'license' | 'credentials' | 'otp'>('license');
  const [licenseInput, setLicenseInput] = useState('');
  const [userInput, setUserInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);
  const rolRef = useRef<'admin' | 'colab'>('admin');
  const hydratedRef = useRef(false);
  const [sessionRole, setSessionRole] = useState<'admin' | 'colab'>('admin');
  const [sessionUser, setSessionUser] = useState('');
  const [bioAvail, setBioAvail] = useState(false);
  const [bioOn, setBioOn] = useState(false);
  const pendingBioRef = useRef<bio.BioCreds | null>(null);

  const addNotification = (title: string, body: string) => {
    setNotifications(prev => [{ id: Math.random().toString(36).slice(2), title, body, date: new Date().toLocaleTimeString(), read: false }, ...prev].slice(0, 15));
  };

  // ── Hidratar estado desde un objeto de datos (nube o público) ──
  const hydrate = (data: any) => {
    if (!data) return;
    const shop = data.shop || {};
    setTenant({ ...defaultTenant, ...shop, id: shop.id || tenant.id });
    setServices(Array.isArray(shop.services) ? shop.services : []);
    setCollaborators(Array.isArray(shop.collaborators) ? shop.collaborators : []);
    setTestimonials(Array.isArray(shop.testimonials) ? shop.testimonials : (Array.isArray(data.testimonials) ? data.testimonials : []));
    setGallery(Array.isArray(shop.gallery) ? shop.gallery : []);
    setGeneralTimeSlots(Array.isArray(shop.timeSlots) && shop.timeSlots.length ? shop.timeSlots : defaultTimeSlots);
    setBookings(Array.isArray(data.bookings) ? data.bookings : []);
    setPayments(Array.isArray(data.payments) ? data.payments : []);
    if (Array.isArray(data.notifications)) setNotifications(data.notifications.slice(0, 15));
  };

  // ── Modo público: cargar la vidriera por RPC ──
  useEffect(() => {
    if (!publicMode) return;
    (async () => {
      const r = await barbPublica(publicCode!);
      if (r && (r as any).bloqueada) { setBloqueada(true); setCargandoPublico(false); return; }  // kill switch
      if (r && r.ok && r.shop) hydrate({ shop: r.shop });
      setCargandoPublico(false);
    })();
  }, []);

  // ── Detectar biometría del dispositivo ──
  useEffect(() => {
    if (publicMode) return;
    bio.bioSupported().then(setBioAvail);
    setBioOn(bio.bioEnabled());
  }, []);

  // ── Guardado automático en la nube (solo admin logueado) ──
  useEffect(() => {
    if (publicMode || !isAdminLoggedIn || !hydratedRef.current) return;
    const codigo = getLicencia()?.codigo;
    if (!codigo) return;
    const t = setTimeout(() => {
      const data = {
        shop: { ...tenant, services, collaborators, testimonials, gallery, timeSlots: generalTimeSlots },
        bookings, payments, notifications,
      };
      cloudSave(codigo, data);
    }, 900);
    return () => clearTimeout(t);
  }, [tenant, collaborators, services, bookings, testimonials, gallery, payments, generalTimeSlots]);

  // ── Login ──
  const handleAdminBadgeClick = () => {
    if (isAdminLoggedIn) { setIsPreviewActive(false); return; }
    setLoginError(''); setOtpInput(''); setGeneratedOtp('');
    const lic = getLicencia();
    setLoginStep(lic ? 'credentials' : 'license');
    setIsLoginModalOpen(true);
  };

  const handleLicenseSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError(''); setLoginBusy(true);
    try {
      const cod = licenseInput.trim().toUpperCase();
      if (!cod.startsWith('BARB-')) { setLoginError('El código debe empezar con BARB-'); return; }
      const lic = await validarLicencia(cod);
      if (!lic) { setLoginError('Código no encontrado o vencido. Verificá con el panel CyC.'); return; }
      saveLicencia({ codigo: cod, usuario_admin: lic.usuario_admin, pass_admin: lic.pass_admin, nombre_negocio: lic.nombre_negocio, plan: lic.plan, fecha_vencimiento: lic.fecha_vencimiento });
      setLoginStep('credentials');
    } finally { setLoginBusy(false); }
  };

  const handleCredentialsSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError(''); setLoginBusy(true);
    try {
      const lic = getLicencia();
      if (!lic) { setLoginStep('license'); return; }
      const u = userInput.trim(); const p = passwordInput;
      if (!u || !p) { setLoginError('Ingresá usuario y contraseña.'); return; }
      const esDueno = (u === lic.usuario_admin && p === lic.pass_admin);
      const r = esDueno
        ? await asegurarCuentaSeguraDueno(u, p, lic.codigo)
        : await asegurarCuentaSeguraColab(u, p, lic.codigo);
      if (!r.ok) { setLoginError(r.msg || 'No se pudo ingresar.'); return; }
      rolRef.current = esDueno ? 'admin' : 'colab';
      setSessionRole(esDueno ? 'admin' : 'colab');
      setSessionUser(u);
      pendingBioRef.current = { codigo: lic.codigo, usuario: u, password: p, role: esDueno ? 'admin' : 'colab' };
      if (securitySettings.otpEnabled) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(code); setOtpInput(''); setLoginStep('otp');
      } else {
        await finishLogin();
      }
    } finally { setLoginBusy(false); }
  };

  const handleOtpVerify = async (e: FormEvent) => {
    e.preventDefault();
    if (otpInput.trim() !== generatedOtp) { setLoginError('Código incorrecto. Copiá el que figura en pantalla.'); return; }
    setLoginError(''); setLoginBusy(true);
    try { await finishLogin(); } finally { setLoginBusy(false); }
  };

  const finishLogin = async () => {
    const codigo = getLicencia()?.codigo;
    if (codigo) {
      const data = await cloudLoad(codigo);
      if (data && Object.keys(data).length) hydrate(data);
      else { const l = getLicencia(); setTenant(t => ({ ...t, id: codigo, name: l?.nombre_negocio || t.name })); }
    }
    hydratedRef.current = true;
    setIsAdminLoggedIn(true);
    setIsLoginModalOpen(false);
    addNotification('Inicio de sesión', 'Acceso al panel otorgado.');
    // Ofrecer activar la huella si el dispositivo la soporta y no está activada
    if (bioAvail && !bio.bioEnabled() && pendingBioRef.current) {
      const creds = pendingBioRef.current;
      setTimeout(async () => {
        if (window.confirm('¿Querés usar tu huella / Face ID para entrar más rápido la próxima vez?')) {
          try { await bio.bioEnable(creds); setBioOn(true); } catch (e) { /* cancelado */ }
        }
        pendingBioRef.current = null;
      }, 700);
    }
  };

  const handleBioLogin = async () => {
    setLoginError('');
    try {
      const creds = await bio.bioLogin();
      if (!creds) return;
      const lic = getLicencia();
      if (!lic || lic.codigo !== creds.codigo) {
        setLoginError('La licencia guardada no coincide. Ingresá con licencia y contraseña.');
        return;
      }
      setLoginBusy(true);
      const r = creds.role === 'admin'
        ? await asegurarCuentaSeguraDueno(creds.usuario, creds.password, creds.codigo)
        : await asegurarCuentaSeguraColab(creds.usuario, creds.password, creds.codigo);
      if (!r.ok) { setLoginError(r.msg || 'No se pudo entrar con huella.'); return; }
      rolRef.current = creds.role;
      setSessionRole(creds.role);
      setSessionUser(creds.usuario);
      pendingBioRef.current = null;
      await finishLogin();
    } catch (e: any) {
      if (e && e.name === 'NotAllowedError') setLoginError('Biometría cancelada.');
      else setLoginError('No se pudo verificar la huella.');
    } finally {
      setLoginBusy(false);
    }
  };

  const handleLogout = async () => {
    // Guardado sincrónico antes de salir: no se pierde ningún cambio reciente.
    const codigo = getLicencia()?.codigo;
    if (codigo && hydratedRef.current) {
      try {
        const data = {
          shop: { ...tenant, services, collaborators, testimonials, gallery, timeSlots: generalTimeSlots },
          bookings, payments, notifications,
        };
        await cloudSave(codigo, data);
      } catch (e) { /* noop */ }
    }
    signOut();
    hydratedRef.current = false;
    setIsAdminLoggedIn(false);
    setIsPreviewActive(false);
    addNotification('Sesión cerrada', 'Se cerró la sesión del panel por seguridad.');
  };

  // Copias de seguridad: listar y restaurar
  const handleListBackups = async () => {
    const codigo = getLicencia()?.codigo;
    if (!codigo) return [];
    return await barbHistListar(codigo);
  };
  const handleRestoreBackup = async (id: number) => {
    const codigo = getLicencia()?.codigo;
    if (!codigo) return false;
    const data = await barbHistRestaurar(codigo, id);
    if (!data) return false;
    hydrate(data); // recarga la barbería con la copia restaurada
    return true;
  };

  // ── Reserva de turno (público por RPC / admin local) ──
  const handleBook = async (booking: Booking) => {
    if (publicMode) {
      const ok = await barbAgregarReserva(publicCode!, booking);
      if (ok) setBookings(prev => [booking, ...prev]);
      return ok;
    }
    setBookings(prev => [booking, ...prev]);
    return true;
  };
  const handleTestimonial = async (testimonial: Testimonial) => {
    if (publicMode) {
      const ok = await barbAgregarTestimonio(publicCode!, testimonial);
      if (ok) setTestimonials(prev => [testimonial, ...prev]);
      return ok;
    }
    setTestimonials(prev => [testimonial, ...prev]);
    return true;
  };

  // ── Compartir / visitar la vitrina pública ──
  const codigoActual = () => (getLicencia()?.codigo || tenant.id || '');
  const linkVitrina = () => `${window.location.origin}/?codigo=${encodeURIComponent(codigoActual())}`;
  const compartirPagina = async () => {
    const cod = codigoActual();
    if (!cod) { alert('Activá tu licencia primero para compartir tu página.'); return; }
    const url = linkVitrina();
    const text = `Reservá tu turno en ${tenant.name}: ${url}`;
    try {
      if ((navigator as any).share) { await (navigator as any).share({ title: tenant.name, text, url }); }
      else { await navigator.clipboard.writeText(url); alert('Link de tu página copiado:\n' + url); }
    } catch (e) { /* cancelado */ }
  };
  const visitarVitrina = () => {
    window.open('https://vitrina-cyc.vercel.app/', '_blank');
  };

  const barberShopImagePath = tenant.shopImageUrl || '';

  // ── Modo público: solo la vidriera ──
  if (publicMode) {
    // Kill switch: si el dueño bloqueó la pública, el visitante ve "En Mantenimiento".
    if (bloqueada) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-neutral-950 text-neutral-100">
          <div className="max-w-md w-full text-center bg-neutral-900 border border-white/10 rounded-3xl p-8 shadow-2xl">
            <div className="text-5xl mb-4">🛠️</div>
            <h1 className="text-2xl font-bold tracking-tight mb-2">En Mantenimiento</h1>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Estamos trabajando para brindarte una mejor experiencia. La página vuelve muy pronto.
              <br /><br />¡Gracias por tu paciencia! Saludos cordiales. 🙌
            </p>
            <div className="mt-6 h-1 w-16 bg-amber-500 rounded-full mx-auto"></div>
          </div>
        </div>
      );
    }
    if (cargandoPublico) {
      return <div className="min-h-screen bg-neutral-950 text-amber-500 flex items-center justify-center font-serif">Cargando barbería…</div>;
    }
    return (
      <PublicPage
        tenant={tenant}
        collaborators={collaborators}
        services={services}
        bookings={bookings}
        setBookings={setBookings}
        testimonials={testimonials}
        setTestimonials={setTestimonials}
        onAddNotification={addNotification}
        shopImagePath={barberShopImagePath}
        generalTimeSlots={generalTimeSlots}
        gallery={gallery}
        publicMode={true}
        licenseCode={publicCode!}
        onBook={handleBook}
        onTestimonial={handleTestimonial}
      />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-900 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <button
            onClick={handleAdminBadgeClick}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-neutral-900 border border-amber-500/30 hover:border-amber-500 transition-all cursor-pointer group shadow-lg"
            title="Acceso al panel de la barbería"
          >
            <ShieldCheck className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-amber-500 block">Panel</span>
              <span className="text-xs font-bold text-white block">{isAdminLoggedIn ? 'Ir al Panel' : 'Ingreso Seguro'}</span>
            </div>
          </button>

          <div className="text-center">
            <h2 className="text-sm font-serif italic text-neutral-400">{tenant.name || 'Barbería'}</h2>
            <p className="text-[9px] font-mono text-amber-500 tracking-widest uppercase">Reservá tu turno</p>
          </div>

          <div className="flex items-center gap-2">
            {isAdminLoggedIn ? (
              <button
                onClick={() => setIsPreviewActive(!isPreviewActive)}
                className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-neutral-800 transition-all cursor-pointer"
                title="Alternar previsualización sin cerrar sesión"
              >
                {isPreviewActive
                  ? (<><LayoutDashboard className="w-3.5 h-3.5 text-amber-500" /><span>Volver a Panel</span></>)
                  : (<><Eye className="w-3.5 h-3.5 text-amber-500 animate-pulse" /><span>Ojo: Vista Web</span></>)}
              </button>
            ) : (
              <button
                onClick={compartirPagina}
                className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-amber-500 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-neutral-800 transition-all cursor-pointer"
                title="Compartir el link de tu página pública"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Compartir página</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {isPreviewActive && isAdminLoggedIn && (
        <div className="bg-amber-500 text-neutral-950 py-2.5 px-4 font-bold text-xs shadow-inner flex justify-between items-center">
          <span>MODO PREVISUALIZACIÓN — Estás viendo la página pública con tu configuración.</span>
          <button onClick={() => setIsPreviewActive(false)} className="bg-neutral-950 hover:bg-neutral-900 text-amber-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase cursor-pointer">
            Cerrar Vista e ir a Panel
          </button>
        </div>
      )}

      <main className="flex-grow">
        {isAdminLoggedIn && !isPreviewActive ? (
          <TenantAdmin
            tenant={tenant}
            setTenant={setTenant}
            collaborators={collaborators}
            setCollaborators={setCollaborators}
            services={services}
            setServices={setServices}
            bookings={bookings}
            setBookings={setBookings}
            payments={payments}
            setPayments={setPayments}
            notifications={notifications}
            setNotifications={setNotifications}
            onLogout={handleLogout}
            onPreviewPublic={() => setIsPreviewActive(true)}
            securitySettings={securitySettings}
            setSecuritySettings={setSecuritySettings}
            generalTimeSlots={generalTimeSlots}
            setGeneralTimeSlots={setGeneralTimeSlots}
            gallery={gallery}
            setGallery={setGallery}
            sessionRole={sessionRole}
            sessionUser={sessionUser}
            onListBackups={handleListBackups}
            onRestoreBackup={handleRestoreBackup}
          />
        ) : (
          <PublicPage
            tenant={tenant}
            collaborators={collaborators}
            services={services}
            bookings={bookings}
            setBookings={setBookings}
            testimonials={testimonials}
            setTestimonials={setTestimonials}
            onAddNotification={addNotification}
            shopImagePath={barberShopImagePath}
            generalTimeSlots={generalTimeSlots}
            gallery={gallery}
            publicMode={false}
            licenseCode={tenant.id}
            onBook={handleBook}
            onTestimonial={handleTestimonial}
          />
        )}
      </main>

      <footer className="border-t border-neutral-900 bg-neutral-950 py-6 px-6 text-center space-y-3">
        <p className="text-xs text-neutral-400 font-mono">{tenant.name || 'Barbería'} © {new Date().getFullYear()}</p>
        <button
          onClick={visitarVitrina}
          className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-wider transition-all cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Visitá la Vitrina</span>
        </button>
        <p className="text-[10px] text-neutral-500">Sistema de turnos · CyC</p>
      </footer>

      {/* LOGIN MODAL (licencia → credenciales → OTP estético) */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl relative animate-slide-up">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-tight font-serif">Acceso Seguro</h3>
                  <p className="text-[10px] text-neutral-400">Panel de la barbería</p>
                </div>
              </div>
              <button onClick={() => setIsLoginModalOpen(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>

            {loginError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-[11px] rounded-lg px-3 py-2">{loginError}</div>
            )}

            {bioOn && bioAvail && (
              <button
                type="button"
                onClick={handleBioLogin}
                disabled={loginBusy}
                className="w-full flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-60 text-amber-400 font-bold px-4 py-3 rounded-lg text-xs uppercase tracking-wider border border-amber-500/30 transition-all cursor-pointer"
              >
                <Fingerprint className="w-4 h-4" />
                <span>Entrar con huella / Face ID</span>
              </button>
            )}

            {loginStep === 'license' && (
              <form onSubmit={handleLicenseSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] text-neutral-400 flex items-center gap-1.5"><KeyRound className="w-3.5 h-3.5 text-amber-500" /> Código de licencia</label>
                  <input
                    type="text" required value={licenseInput}
                    onChange={e => setLicenseInput(e.target.value.toUpperCase())}
                    placeholder="BARB-PREM-2026-XXXX"
                    className="w-full bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg px-3 py-2.5 font-mono tracking-wider focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button type="submit" disabled={loginBusy} className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-neutral-950 font-bold px-4 py-2.5 rounded-lg text-xs uppercase tracking-wider">
                  {loginBusy ? 'Verificando…' : 'Activar licencia'}
                </button>
              </form>
            )}

            {loginStep === 'credentials' && (
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] text-neutral-400">Usuario</label>
                  <input type="text" required value={userInput} onChange={e => setUserInput(e.target.value)} placeholder="usuario"
                    className="w-full bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-amber-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] text-neutral-400">Contraseña</label>
                  <input type="password" required value={passwordInput} onChange={e => setPasswordInput(e.target.value)} placeholder="••••••••"
                    className="w-full bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-amber-500" />
                </div>
                <p className="text-[10px] text-neutral-500 leading-relaxed">
                  <span className="text-neutral-400 font-semibold">Dueño:</span> usuario y contraseña de la licencia.{' '}
                  <span className="text-neutral-400 font-semibold">Barbero:</span> tu email y clave cargados en el panel.
                </p>
                <button type="submit" disabled={loginBusy} className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-neutral-950 font-bold px-4 py-2.5 rounded-lg text-xs uppercase tracking-wider">
                  {loginBusy ? 'Verificando…' : 'Ingresar'}
                </button>
                <button type="button" onClick={() => setLoginStep('license')} className="w-full text-center text-[10px] text-neutral-400 hover:text-white">Cambiar licencia</button>
              </form>
            )}

            {loginStep === 'otp' && (
              <form onSubmit={handleOtpVerify} className="space-y-4">
                <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl text-neutral-300 space-y-2">
                  <div className="flex gap-2 items-start text-xs">
                    <Mail className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block">Verificación adicional</span>
                      <span className="text-[10px] text-neutral-400 block mt-0.5">Ingresá el código de seguridad para entrar al panel.</span>
                    </div>
                  </div>
                  <div className="bg-neutral-950 p-2 rounded border border-neutral-800/80 text-center text-xs">
                    <span className="text-neutral-400 font-mono">Código:</span>{' '}
                    <span className="text-green-400 font-mono font-bold tracking-widest">{generatedOtp}</span>
                  </div>
                </div>
                <input type="text" required maxLength={6} value={otpInput} onChange={e => setOtpInput(e.target.value)} placeholder="000000"
                  className="w-full bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg px-3 py-2.5 text-center font-mono font-bold text-base tracking-widest focus:outline-none focus:border-amber-500" />
                <button type="submit" disabled={loginBusy} className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-neutral-950 font-bold px-4 py-2.5 rounded-lg text-xs uppercase tracking-wider">
                  {loginBusy ? 'Entrando…' : 'Verificar código'}
                </button>
                <button type="button" onClick={() => setLoginStep('credentials')} className="w-full text-center text-[10px] text-neutral-400 hover:text-white">Volver</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
