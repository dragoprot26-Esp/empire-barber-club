import { useState, useEffect, FormEvent } from 'react';
import { 
  Users, Palette, CreditCard, ShieldCheck, Bell, LogOut, Eye, Plus, Trash2, Edit2, Check, X,
  Key, Fingerprint, Mail, RefreshCw, AlertCircle, Sparkles, UserPlus, Scissors, Calendar, Settings, MapPin, Phone, Store, Clock, Upload,
  Download, TrendingUp, BarChart2, FileText, Trash
} from 'lucide-react';
import { Tenant, Collaborator, Payment, PushNotification, Service, Booking } from '../types';

interface ImageUploaderProps {
  label: string;
  currentImage?: string;
  onUpload: (base64: string) => void;
}

function ImageUploader({ label, currentImage, onUpload }: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          onUpload(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-[11px] font-semibold text-neutral-300 flex justify-between items-center">
        <span>{label}</span>
        <span className="text-[9px] font-mono text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">Móvil 📱 + PC 💻</span>
      </label>
      <div className="flex flex-col sm:flex-row gap-4 items-center bg-neutral-950/60 p-4 rounded-xl border border-neutral-800">
        {currentImage && (
          <div className="relative shrink-0">
            <img 
              src={currentImage} 
              alt="Vista previa" 
              className="w-16 h-16 rounded-xl object-cover border border-amber-500/40 bg-neutral-900"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
        <div 
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
          onDrop={(e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]); }}
          className={`flex-1 w-full border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all relative ${
            dragActive ? 'border-amber-500 bg-amber-500/5' : 'border-neutral-800 hover:border-amber-500/40 bg-neutral-950 hover:bg-neutral-950/80'
          }`}
        >
          <input
            type="file"
            accept="image/*"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <div className="flex flex-col items-center justify-center gap-1">
            <Upload className="w-4 h-4 text-amber-500" />
            <span className="text-[11px] font-bold text-neutral-200">Subir imagen</span>
            <span className="text-[9px] text-neutral-500 font-medium">Toma una foto o arrastra un archivo aquí</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TenantAdminProps {
  tenant: Tenant;
  setTenant: (t: Tenant) => void;
  collaborators: Collaborator[];
  setCollaborators: (cols: Collaborator[]) => void;
  services: Service[];
  setServices: (s: Service[]) => void;
  bookings: Booking[];
  setBookings: (b: Booking[]) => void;
  payments: Payment[];
  setPayments: (p: Payment[]) => void;
  notifications: PushNotification[];
  setNotifications: (n: PushNotification[]) => void;
  onLogout: () => void;
  onPreviewPublic: () => void; // Triggered by the "eye" button
  securitySettings: {
    otpEnabled: boolean;
    biometricsEnabled: boolean;
  };
  setSecuritySettings: (s: { otpEnabled: boolean; biometricsEnabled: boolean }) => void;
  generalTimeSlots: string[];
  setGeneralTimeSlots: (slots: string[]) => void;
  gallery: any[];
  setGallery: (g: any[]) => void;
  sessionRole?: 'admin' | 'colab';
  sessionUser?: string;
}

export default function TenantAdmin({
  tenant,
  setTenant,
  collaborators,
  setCollaborators,
  services,
  setServices,
  bookings,
  setBookings,
  payments,
  setPayments,
  notifications,
  setNotifications,
  onLogout,
  onPreviewPublic,
  securitySettings,
  setSecuritySettings,
  generalTimeSlots,
  setGeneralTimeSlots,
  gallery,
  setGallery,
  sessionRole = 'admin',
  sessionUser = ''
}: TenantAdminProps) {
  const [activeTab, setActiveTab] = useState<'colaboradores' | 'servicios' | 'turnos' | 'personalizacion' | 'configuracion' | 'pagos' | 'seguridad' | 'notificaciones'>('colaboradores');
  const [clearOnDownload, setClearOnDownload] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [paymentsSubTab, setPaymentsSubTab] = useState<'ventas' | 'licencia'>('ventas');

  // Session Simulation & Role restrictions
  const [simulatedSession, setSimulatedSession] = useState<string>('inquilino-1');
  const [secondaryAdminId, setSecondaryAdminId] = useState<string>('col-3'); // Vito Corleone as default second admin
  
  // Find current collaborator
  const activeCollab = collaborators.find(c => c.id === simulatedSession);

  // An active session is an Administrator (Inquilino) if:
  // 1. simulatedSession is 'inquilino-1' (primary admin)
  // 2. simulatedSession is 'inquilino-2' (the second admin designated directly)
  // 3. activeCollab is explicitly marked as isAdmin or matches secondaryAdminId
  const forcedColab = sessionRole === 'colab';
  const isCurrentlyAdmin = forcedColab ? false : (
    simulatedSession === 'inquilino-1' ||
    simulatedSession === 'inquilino-2' ||
    (activeCollab && (activeCollab.isAdmin || activeCollab.id === secondaryAdminId)));

  // Auto-enforce tab restrictions for normal collaborators
  useEffect(() => {
    if (!isCurrentlyAdmin) {
      const allowedTabs = ['turnos', 'notificaciones'];
      if (!allowedTabs.includes(activeTab)) {
        setActiveTab('turnos');
      }
      if (paymentsSubTab !== 'ventas') {
        setPaymentsSubTab('ventas');
      }
    }
  }, [isCurrentlyAdmin, activeTab, paymentsSubTab]);

  // Si el que entró es un barbero (colaborador), fijamos su sesión a su propio id
  // para que solo vea SUS turnos.
  useEffect(() => {
    if (forcedColab && sessionUser) {
      const me = collaborators.find(c => ((c.username || c.email) || '').toLowerCase() === sessionUser.toLowerCase());
      if (me && simulatedSession !== me.id) setSimulatedSession(me.id);
    }
  }, [forcedColab, sessionUser, collaborators]);

  // Set default isAdmin true for secondaryAdminId on mount if not already set
  useEffect(() => {
    if (secondaryAdminId && collaborators.length > 0) {
      const changed = collaborators.map(c => {
        if (c.id === secondaryAdminId && !c.isAdmin) {
          return { ...c, isAdmin: true };
        }
        return c;
      });
      // Simple check to avoid infinite re-render loops
      if (JSON.stringify(changed) !== JSON.stringify(collaborators)) {
        setCollaborators(changed);
      }
    }
  }, [secondaryAdminId, collaborators, setCollaborators]);

  const completedBookings = bookings.filter(b => 
    b.status === 'Completed' && (isCurrentlyAdmin || b.collaboratorId === simulatedSession)
  );
  
  // Collaborator Form states
  const [isAddingCollab, setIsAddingCollab] = useState(false);
  const [editingCollabId, setEditingCollabId] = useState<string | null>(null);
  const [collabForm, setCollabForm] = useState({
    name: '',
    role: 'Barbero Senior',
    email: '',
    password: '',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    isAdmin: false,
    scheduleType: 'general' as 'general' | 'custom',
    customSlots: [] as string[]
  });

  // Service Form states
  const [isAddingService, setIsAddingService] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    price: 30,
    duration: 30,
    category: 'Cortes',
    description: ''
  });

  // Booking detail view modal state
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  
  // Local Config Form states
  const [configForm, setConfigForm] = useState({
    name: tenant.name,
    phone: tenant.phone || '',
    address: tenant.address || '',
    description: tenant.description || '',
    shopImageUrl: tenant.shopImageUrl || '',
    currency: tenant.currency || 'ARS',
    phonePrefix: tenant.phonePrefix || '+54 9'
  });

  // Color preset options
  const colorPresets = [
    { name: 'NYC Soho Brick (Vintage Brass)', primary: '#B8860B', secondary: '#171717', text: 'Classic NYC Barber vibes with dark goldenrod and warm brass undertones.' },
    { name: 'Brooklyn Slate', primary: '#0EA5E9', secondary: '#0F172A', text: 'Modern minimalist warehouse style with slate blue and steel darks.' },
    { name: 'Mahogany Gold', primary: '#B45309', secondary: '#1A0F05', text: 'Luxury wood and gold finishes, capturing Manhattan Upper East Side prestige.' },
    { name: 'Midnight Brass', primary: '#10B981', secondary: '#064E3B', text: 'Retro green vintage leather with polished brass highlight accents.' }
  ];

  // Font options
  const fontOptions = [
    { id: 'sans', name: 'Inter (Sleek/Modern)', className: 'font-sans' },
    { id: 'serif', name: 'Playfair (Classic NYC Vintage)', className: 'font-serif' },
    { id: 'mono', name: 'JetBrains Mono (Industrial Loft)', className: 'font-mono' },
    { id: 'grotesk', name: 'Space Grotesk (Tech Editorial)', className: 'font-sans tracking-tight' }
  ];

  // Handler: Add or update Collaborator
  const handleSaveCollaborator = (e: FormEvent) => {
    e.preventDefault();
    if (!collabForm.name || !collabForm.email) return;

    if (editingCollabId) {
      setCollaborators(
        collaborators.map(c => 
          c.id === editingCollabId 
            ? { ...c, name: collabForm.name, role: collabForm.role, email: collabForm.email, username: collabForm.email, password: collabForm.password || c.password, isAdmin: !!collabForm.isAdmin, scheduleType: collabForm.scheduleType, customSlots: collabForm.customSlots }
            : c
        )
      );
      // Trigger a visual notification
      triggerPush('Colaborador Actualizado', `Los datos de ${collabForm.name} han sido guardados con éxito.`);
      setEditingCollabId(null);
    } else {
      const newCollab: Collaborator = {
        id: Math.random().toString(36).substring(7),
        tenantId: tenant.id,
        name: collabForm.name,
        role: collabForm.role,
        email: collabForm.email,
        avatar: collabForm.avatar,
        isAdmin: !!collabForm.isAdmin,
        scheduleType: collabForm.scheduleType,
        customSlots: collabForm.customSlots,
        username: collabForm.email,
        password: collabForm.password
      };
      setCollaborators([...collaborators, newCollab]);
      triggerPush('Nuevo Colaborador', `¡Se ha agregado a ${collabForm.name} al equipo de barberos!`);
      setIsAddingCollab(false);
    }

    // Reset form
    setCollabForm({
      name: '',
      role: 'Barbero Senior',
      email: '',
      password: '',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      isAdmin: false,
      scheduleType: 'general',
      customSlots: []
    });
  };

  const handleEditCollab = (c: Collaborator) => {
    setEditingCollabId(c.id);
    setIsAddingCollab(true);
    setCollabForm({
      name: c.name,
      role: c.role,
      email: c.email,
      password: '••••••••',
      avatar: c.avatar,
      isAdmin: !!c.isAdmin,
      scheduleType: c.scheduleType || 'general',
      customSlots: c.customSlots || []
    });
  };

  const handleDeleteCollab = (id: string, name: string) => {
    setCollaborators(collaborators.filter(c => c.id !== id));
    triggerPush('Colaborador Eliminado', `Se removió a ${name} del listado activo.`);
  };

  // Service management handlers
  const handleSaveService = (e: FormEvent) => {
    e.preventDefault();
    if (!serviceForm.name || !serviceForm.price) return;

    if (editingServiceId) {
      setServices(
        services.map(s => 
          s.id === editingServiceId 
            ? { ...s, name: serviceForm.name, price: Number(serviceForm.price), duration: Number(serviceForm.duration), category: serviceForm.category, description: serviceForm.description } 
            : s
        )
      );
      triggerPush('Servicio Actualizado', `El servicio "${serviceForm.name}" ha sido guardado con éxito.`);
      setEditingServiceId(null);
    } else {
      const newService: Service = {
        id: Math.random().toString(36).substring(7),
        name: serviceForm.name,
        price: Number(serviceForm.price),
        duration: Number(serviceForm.duration),
        category: serviceForm.category,
        description: serviceForm.description
      };
      setServices([...services, newService]);
      triggerPush('Nuevo Servicio Creado', `Se ha agregado el servicio "${serviceForm.name}" a la lista.`);
    }

    setIsAddingService(false);
    setServiceForm({
      name: '',
      price: 30,
      duration: 30,
      category: 'Cortes',
      description: ''
    });
  };

  const handleEditService = (s: Service) => {
    setEditingServiceId(s.id);
    setIsAddingService(true);
    setServiceForm({
      name: s.name,
      price: s.price,
      duration: s.duration,
      category: s.category,
      description: s.description || ''
    });
  };

  const handleDeleteService = (id: string, name: string) => {
    setServices(services.filter(s => s.id !== id));
    triggerPush('Servicio Eliminado', `Se removió el servicio "${name}" del menú.`);
  };

  // Booking handlers
  const handleUpdateBookingStatus = (id: string, status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled') => {
    setBookings(
      bookings.map(b => b.id === id ? { ...b, status } : b)
    );
    const booking = bookings.find(b => b.id === id);
    const clientName = booking ? booking.clientName : 'Cliente';
    
    let statusLabel = '';
    if (status === 'Completed') statusLabel = 'Atendido';
    if (status === 'Confirmed' || status === 'Pending') statusLabel = 'En Espera';
    if (status === 'Cancelled') statusLabel = 'Cancelado';

    triggerPush('Estado de Turno Actualizado', `El turno de ${clientName} se marcó como ${statusLabel}.`);
    
    // Also update selected booking if detail modal is open
    if (selectedBooking && selectedBooking.id === id) {
      setSelectedBooking(prev => prev ? { ...prev, status } : null);
    }
  };

  // Local Config handler
  const handleSaveConfig = (e: FormEvent) => {
    e.preventDefault();
    setTenant({
      ...tenant,
      name: configForm.name,
      phone: configForm.phone,
      address: configForm.address,
      description: configForm.description,
      shopImageUrl: configForm.shopImageUrl,
      currency: configForm.currency,
      phonePrefix: configForm.phonePrefix
    });
    triggerPush('Configuración Actualizada', 'Los datos del local han sido guardados con éxito.');
  };

  // Push notification helper
  const triggerPush = (title: string, body: string) => {
    const newNotif: PushNotification = {
      id: Math.random().toString(36).substring(7),
      title,
      body,
      date: new Date().toLocaleTimeString(),
      read: false
    };
    setNotifications([newNotif, ...notifications]);
  };

  // Simulates push notification
  const handleSimulateBooking = () => {
    const names = ['Carlos Tévez', 'Lionel Messi', 'Robert De Niro', 'Al Pacino', 'Scarlett Johansson'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const services = ['Corte de Cabello + Afeitado Imperial', 'Afeitado con Navaja Caliente', 'Tratamiento Capilar NYC'];
    const randomService = services[Math.floor(Math.random() * services.length)];
    
    triggerPush(
      '¡Nuevo Turno Reservado!',
      `${randomName} reservó para ${randomService} hoy en la tarde.`
    );
  };

  // Payments Dashboard Handlers
  const handleDownloadCSV = () => {
    const completed = bookings.filter(b => b.status === 'Completed');
    if (completed.length === 0) {
      alert('No hay historial de cobros completados para descargar.');
      return;
    }

    let csvContent = "ID,Cliente,Telefono,Servicio,Categoria,Monto,Barbero,Fecha,Horario,Estado\n";
    completed.forEach(b => {
      const s = services.find(srv => srv.id === b.serviceId);
      const c = collaborators.find(col => col.id === b.collaboratorId);
      const serviceName = s ? s.name : 'Servicio';
      const category = s ? s.category : 'Categoría';
      const price = s ? s.price : 0;
      const barberName = c ? c.name : 'Especialista';
      
      const cleanClient = b.clientName.replace(/,/g, '');
      const cleanService = serviceName.replace(/,/g, '');
      const cleanCategory = category.replace(/,/g, '');
      const cleanBarber = barberName.replace(/,/g, '');

      csvContent += `${b.id},${cleanClient},${b.clientPhone},${cleanService},${cleanCategory},${price},${cleanBarber},${b.date},${b.timeSlot},Completado\n`;
    });

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Reporte_Cobros_${tenant.slug}_Planilla.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerPush('Planilla Descargada', 'Se ha exportado el historial de cobros en formato CSV.');

    if (clearOnDownload) {
      setTimeout(() => {
        handleClearHistory();
      }, 500);
    }
  };

  const handleDownloadExcel = () => {
    const completed = bookings.filter(b => b.status === 'Completed');
    if (completed.length === 0) {
      alert('No hay historial de cobros completados para descargar.');
      return;
    }

    const excelContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th { background-color: #B8860B; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #dddddd; text-align: left; }
          td { padding: 10px; border: 1px solid #dddddd; font-size: 13px; }
          .header-title { font-size: 20px; font-weight: bold; color: #111111; margin-bottom: 5px; }
          .meta-info { font-size: 12px; color: #666666; margin-bottom: 20px; }
          .total-row { font-weight: bold; background-color: #f9f9f9; }
        </style>
      </head>
      <body>
        <div class="header-title">Reporte de Ventas y Cobros - ${tenant.name}</div>
        <div class="meta-info">Fecha de Emisión: ${new Date().toLocaleDateString()} | Licencia: ${tenant.licenseType}</div>
        <table>
          <thead>
            <tr>
              <th>ID Turno</th>
              <th>Cliente</th>
              <th>Teléfono</th>
              <th>Servicio</th>
              <th>Categoría</th>
              <th>Monto (${tenant.currency || 'ARS'})</th>
              <th>Barbero Especialista</th>
              <th>Fecha</th>
              <th>Horario</th>
            </tr>
          </thead>
          <tbody>
            ${completed.map(b => {
              const s = services.find(srv => srv.id === b.serviceId);
              const c = collaborators.find(col => col.id === b.collaboratorId);
              return `
                <tr>
                  <td>${b.id}</td>
                  <td>${b.clientName}</td>
                  <td>${b.clientPhone}</td>
                  <td>${s?.name || 'Servicio'}</td>
                  <td>${s?.category || 'Categoría'}</td>
                  <td>$${s?.price || 0}.00</td>
                  <td>${c?.name || 'Especialista'}</td>
                  <td>${b.date}</td>
                  <td>${b.timeSlot}</td>
                </tr>
              `;
            }).join('')}
            <tr class="total-row">
              <td colspan="5" style="text-align: right; font-weight: bold;">TOTAL INGRESOS:</td>
              <td style="font-weight: bold; color: #B8860B;">$${completed.reduce((acc, b) => acc + (services.find(s => s.id === b.serviceId)?.price || 0), 0)}.00</td>
              <td colspan="3"></td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Reporte_Cobros_${tenant.slug}_Excel.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerPush('Excel Descargado', 'Se ha exportado el reporte financiero para Excel.');

    if (clearOnDownload) {
      setTimeout(() => {
        handleClearHistory();
      }, 500);
    }
  };

  const handleClearHistory = () => {
    const nonCompleted = bookings.filter(b => b.status !== 'Completed');
    const countCleared = bookings.length - nonCompleted.length;
    if (countCleared === 0) {
      alert('No hay turnos completados en el historial para vaciar.');
      return;
    }
    const confirmClear = window.confirm(`¿Estás completamente seguro de vaciar el historial? Se eliminarán de forma permanente ${countCleared} registros de cobros.`);
    if (confirmClear) {
      setBookings(nonCompleted);
      triggerPush('Historial Vaciado', `Se han archivado/eliminado ${countCleared} turnos completados del listado activo.`);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-6">
      
      {/* MÓDULO DE SEGURIDAD Y SIMULACIÓN DE ROLES MULTITENANT (solo dueño/admin) */}
      {!forcedColab && (
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 mb-2 space-y-4 animate-fade-in print:hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                Portal de Simulación de Sesión y Control de Roles 🔐
              </h3>
              <p className="text-[10px] text-neutral-400">
                Alterna entre perfiles de Administrador (Inquilinos) y Colaboradores para verificar las vistas reducidas y filtros financieros en tiempo real.
              </p>
            </div>
          </div>
          <span className="text-[9px] font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded">
            ROLES CONFIGURADOS: {1 + (secondaryAdminId ? 1 : 0)} INQUILINO(S)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
          <div className="space-y-1">
            <span className="text-[10px] text-neutral-400 font-semibold block">Simular sesión de usuario activa:</span>
            <select
              value={simulatedSession}
              onChange={e => {
                const val = e.target.value;
                setSimulatedSession(val);
                triggerPush('Cambio de Sesión Simulado', `Ahora estás operando en el panel con el perfil de: ${
                  val === 'inquilino-1' ? 'Administrador Principal (Inquilino 1)' :
                  val === 'inquilino-2' ? 'Segundo Administrador (Inquilino 2)' :
                  collaborators.find(c => c.id === val)?.name || 'Colaborador'
                }`);
              }}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer font-medium"
            >
              <optgroup label="Administradores (Inquilinos)">
                <option value="inquilino-1">👑 Administrador Principal (Inquilino 1) - Manhattan Owner</option>
                {secondaryAdminId && (
                  <option value="inquilino-2">
                    🛡️ Segundo Administrador (Inquilino 2) - {collaborators.find(c => c.id === secondaryAdminId)?.name || 'Asignado'}
                  </option>
                )}
              </optgroup>
              <optgroup label="Colaboradores (Visión Reducida)">
                {collaborators.map(c => (
                  <option key={c.id} value={c.id}>
                    👤 {c.name} {c.id === secondaryAdminId ? ' (Inquilino 2)' : ' (Colaborador Regular)'}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="md:col-span-2 bg-neutral-950 p-3 rounded-xl border border-neutral-800 flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isCurrentlyAdmin ? 'bg-amber-500 animate-pulse' : 'bg-blue-400 animate-pulse'}`} />
            <div className="text-[10px] leading-relaxed text-neutral-300">
              {isCurrentlyAdmin ? (
                <span>
                  <strong>MODO INQUILINO COMPLETO (Admin):</strong> Tienes control de todo el panel, puedes ver las ventas globales de todos los barberos, modificar configuraciones del local, cambiar la tipografía/colores, OTP y administrar colaboradores.
                </span>
              ) : (
                <span>
                  <strong>VISIÓN REDUCIDA (Colaborador):</strong> Operando como <strong className="text-amber-500">{activeCollab?.name}</strong>. Acceso limitado: Solo ves tus turnos asignados, servicios del catálogo (solo lectura), notificaciones y tu historial de cobros concretados individuales.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Top Banner / Status */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 mb-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <span className="text-xl font-bold text-amber-500 font-serif">NY</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-white">{tenant.name}</h1>
              <span className="text-xs bg-amber-500 text-neutral-950 px-2 py-0.5 rounded-full font-bold">
                {isCurrentlyAdmin ? 'Inquilino Activo' : 'Colaborador (Acceso Reducido)'}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1 font-mono">
              Licencia: <span className="text-amber-400 font-semibold">{tenant.licenseType}</span> | Vence: {tenant.licenseExpiry}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {/* OJO Preview Button */}
          <button
            onClick={onPreviewPublic}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold border border-neutral-700 transition-all cursor-pointer shadow-md"
            title="Previsualizar Cambios en Vivo (Presiona para alternar sin salir)"
          >
            <Eye className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>Ver Página Pública</span>
          </button>

          <button
            onClick={onLogout}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-red-950/40 hover:bg-red-900/60 text-red-200 px-4 py-2.5 rounded-xl text-xs font-semibold border border-red-900/50 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Main Admin Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left navigation sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <div className="bg-neutral-950 rounded-xl p-2 border border-neutral-800 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible">
            {isCurrentlyAdmin && (
              <button
                onClick={() => setActiveTab('colaboradores')}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'colaboradores'
                    ? 'bg-amber-500 text-neutral-950 font-bold'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>Colaboradores</span>
              </button>
            )}

            {isCurrentlyAdmin && (
            <button
              onClick={() => setActiveTab('servicios')}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'servicios'
                  ? 'bg-amber-500 text-neutral-950 font-bold'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
              }`}
            >
              <Scissors className="w-4 h-4 shrink-0" />
              <span>Servicios</span>
            </button>
            )}

            <button
              onClick={() => setActiveTab('turnos')}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all relative ${
                activeTab === 'turnos'
                  ? 'bg-amber-500 text-neutral-950 font-bold'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
              }`}
            >
              <Calendar className="w-4 h-4 shrink-0" />
              <span>Turnos / Reservas</span>
              {bookings.length > 0 && (
                <span className="ml-auto bg-neutral-900 text-amber-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-amber-500/30">
                  {isCurrentlyAdmin ? bookings.length : bookings.filter(b => b.collaboratorId === simulatedSession).length}
                </span>
              )}
            </button>

            {isCurrentlyAdmin && (
              <button
                onClick={() => setActiveTab('personalizacion')}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'personalizacion'
                    ? 'bg-amber-500 text-neutral-950 font-bold'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                <Palette className="w-4 h-4 shrink-0" />
                <span>Personalización Visual</span>
              </button>
            )}

            {isCurrentlyAdmin && (
              <button
                onClick={() => setActiveTab('configuracion')}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'configuracion'
                    ? 'bg-amber-500 text-neutral-950 font-bold'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                <Store className="w-4 h-4 shrink-0" />
                <span>Configuración Local</span>
              </button>
            )}

            {isCurrentlyAdmin && (
            <button
              onClick={() => setActiveTab('pagos')}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'pagos'
                  ? 'bg-amber-500 text-neutral-950 font-bold'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
              }`}
            >
              <CreditCard className="w-4 h-4 shrink-0" />
              <span>Historial de Pagos</span>
            </button>
            )}

            {isCurrentlyAdmin && (
              <button
                onClick={() => setActiveTab('seguridad')}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'seguridad'
                    ? 'bg-amber-500 text-neutral-950 font-bold'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Seguridad & OTP</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('notificaciones')}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all relative ${
                activeTab === 'notificaciones'
                  ? 'bg-amber-500 text-neutral-950 font-bold'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
              }`}
            >
              <Bell className="w-4 h-4 shrink-0" />
              <span>Notificaciones Push</span>
              {notifications.some(n => !n.read) && (
                <span className="absolute right-3 top-3.5 w-2 h-2 rounded-full bg-red-500 animate-ping" />
              )}
            </button>
          </div>

          <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800 text-center space-y-2 hidden lg:block">
            <h4 className="text-xs font-bold text-amber-500 font-serif">Modo Demo Multitenant</h4>
            <p className="text-[10px] text-neutral-400">
              Modifica los colores o colaboradores aquí, haz click en el OJO de arriba y comprueba el aislamiento en tiempo real.
            </p>
          </div>
        </div>

        {/* Tab contents (3/4 layout) */}
        <div className="lg:col-span-3 bg-neutral-950 border border-neutral-800 rounded-2xl p-6 min-h-[450px]">
          
          {/* Tab 1: Colaboradores */}
          {activeTab === 'colaboradores' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-amber-500" />
                    Gestión de Colaboradores
                  </h3>
                  <p className="text-xs text-neutral-400">Crea, edita y administra los barberos asignados a tu inquilino.</p>
                </div>
                {!isAddingCollab && (
                  <button
                    onClick={() => setIsAddingCollab(true)}
                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Agregar Barbero</span>
                  </button>
                )}
              </div>

              {/* Collaborator Form */}
              {isAddingCollab && (
                <form onSubmit={handleSaveCollaborator} className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 space-y-4 animate-slide-up">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold font-mono text-amber-400 uppercase">
                      {editingCollabId ? 'Editar Colaborador' : 'Agregar Nuevo Colaborador'}
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCollab(false);
                        setEditingCollabId(null);
                        setCollabForm({
                          name: '',
                          role: 'Barbero Senior',
                          email: '',
                          password: '',
                          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                          isAdmin: false,
                          scheduleType: 'general',
                          customSlots: []
                        });
                      }}
                      className="text-neutral-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-neutral-300">Nombre Completo</label>
                      <input
                        type="text"
                        required
                        value={collabForm.name}
                        onChange={e => setCollabForm({ ...collabForm, name: e.target.value })}
                        placeholder="Ej. Frank Sinatra Jr"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-neutral-300">Puesto / Rol</label>
                      <select
                        value={collabForm.role}
                        onChange={e => setCollabForm({ ...collabForm, role: e.target.value })}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="Barbero Master (Estilo NY)">Barbero Master (Estilo NY)</option>
                        <option value="Barbero Senior">Barbero Senior</option>
                        <option value="Especialista en Afeitado Navaja">Especialista en Afeitado Navaja</option>
                        <option value="Colorista & Estilista">Colorista & Estilista</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-neutral-300">Correo Electrónico (Usuario)</label>
                      <input
                        type="email"
                        required
                        value={collabForm.email}
                        onChange={e => setCollabForm({ ...collabForm, email: e.target.value })}
                        placeholder="frank@barbers.com"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-neutral-300">Contraseña de Acceso</label>
                      <input
                        type="password"
                        required={!editingCollabId}
                        value={collabForm.password}
                        onChange={e => setCollabForm({ ...collabForm, password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <ImageUploader 
                    label="Foto / Avatar del Barbero (Móvil o PC)" 
                    currentImage={collabForm.avatar} 
                    onUpload={(base64) => setCollabForm({ ...collabForm, avatar: base64 })}
                  />

                  {/* Flujo Horario (Schedule Flow Selector) */}
                  <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-4">
                    <div>
                      <h5 className="text-xs font-bold text-amber-500 uppercase font-mono flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-500" />
                        Configuración de Flujo Horario
                      </h5>
                      <p className="text-[10px] text-neutral-400 mt-0.5">Define si este colaborador utiliza el horario general predefinido del local o su propio horario personalizado.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pb-2">
                      <button
                        type="button"
                        onClick={() => setCollabForm({ ...collabForm, scheduleType: 'general' })}
                        className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                          collabForm.scheduleType === 'general'
                            ? 'bg-neutral-900 border-amber-500 shadow-sm shadow-amber-500/5'
                            : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${collabForm.scheduleType === 'general' ? 'bg-amber-500' : 'bg-neutral-600'}`} />
                          Horario General
                        </span>
                        <span className="text-[9px] text-neutral-400">Usa las horas preestablecidas del local ({generalTimeSlots.length} horas activas).</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCollabForm({ 
                          ...collabForm, 
                          scheduleType: 'custom', 
                          customSlots: collabForm.customSlots.length > 0 ? collabForm.customSlots : [...generalTimeSlots] 
                        })}
                        className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                          collabForm.scheduleType === 'custom'
                            ? 'bg-neutral-900 border-amber-500 shadow-sm shadow-amber-500/5'
                            : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${collabForm.scheduleType === 'custom' ? 'bg-amber-500' : 'bg-neutral-600'}`} />
                          Horario Personalizado
                        </span>
                        <span className="text-[9px] text-neutral-400">Selecciona horas de atención específicas para este barbero.</span>
                      </button>
                    </div>

                    {collabForm.scheduleType === 'general' ? (
                      <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-lg p-3 space-y-1.5">
                        <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase">Horas Generales Predefinidas (Modo Lectura):</span>
                        <div className="flex flex-wrap gap-1.5 animate-fade-in">
                          {generalTimeSlots.map(slot => (
                            <span key={slot} className="text-[9px] font-mono bg-neutral-950 border border-neutral-800/80 px-2 py-0.5 rounded text-neutral-400">
                              {slot}
                            </span>
                          ))}
                        </div>
                        <p className="text-[8px] text-neutral-500 italic mt-1">💡 Puedes redefinir estas horas generales en la pestaña de "Configuración Local".</p>
                      </div>
                    ) : (
                      <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-lg p-3 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-mono font-bold text-amber-500 uppercase">Selecciona Horas del Pool Disponible:</span>
                          <span className="text-[8px] font-mono bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded">
                            {collabForm.customSlots.length} Seleccionadas
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5 max-h-48 overflow-y-auto pr-1 animate-fade-in">
                          {[
                            '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
                            '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
                            '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM'
                          ].map(hour => {
                            const isChecked = collabForm.customSlots.includes(hour);
                            return (
                              <button
                                type="button"
                                key={hour}
                                onClick={() => {
                                  if (isChecked) {
                                    setCollabForm({
                                      ...collabForm,
                                      customSlots: collabForm.customSlots.filter(s => s !== hour)
                                    });
                                  } else {
                                    setCollabForm({
                                      ...collabForm,
                                      customSlots: [...collabForm.customSlots, hour].sort((a, b) => {
                                        const parseTime = (t: string) => {
                                          const [time, period] = t.split(' ');
                                          let [h, m] = time.split(':').map(Number);
                                          if (period === 'PM' && h !== 12) h += 12;
                                          if (period === 'AM' && h === 12) h = 0;
                                          return h * 60 + m;
                                        };
                                        return parseTime(a) - parseTime(b);
                                      })
                                    });
                                  }
                                }}
                                className={`py-1.5 px-2 rounded font-mono text-[9px] font-bold text-center border transition-all cursor-pointer ${
                                  isChecked
                                    ? 'bg-amber-500 text-neutral-950 border-amber-500'
                                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                                }`}
                              >
                                {hour}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Admin Checkbox (Cajita con tilde) */}
                  <div className="flex items-start gap-3 bg-neutral-950 p-3.5 rounded-xl border border-neutral-800">
                    <input
                      type="checkbox"
                      id="collabIsAdminCheckbox"
                      checked={collabForm.isAdmin || false}
                      onChange={e => setCollabForm({ ...collabForm, isAdmin: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500 bg-neutral-900 border-neutral-700 focus:ring-amber-500 cursor-pointer mt-0.5 accent-amber-500"
                    />
                    <label htmlFor="collabIsAdminCheckbox" className="text-xs text-neutral-300 font-medium cursor-pointer flex flex-col">
                      <span className="font-bold text-amber-500 text-[10px] uppercase font-mono flex items-center gap-1.5">
                        👑 Rol de Administrador (Inquilino)
                      </span>
                      <span className="text-[10px] text-neutral-400 mt-0.5">
                        Si se activa esta casilla, este colaborador tendrá acceso completo a todo el panel (facturas, personalización visual y configuración local). Si no, su acceso será reducido.
                      </span>
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCollab(false);
                        setEditingCollabId(null);
                      }}
                      className="bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1.5 rounded-lg text-xs"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-4 py-1.5 rounded-lg text-xs"
                    >
                      Guardar Colaborador
                    </button>
                  </div>
                </form>
              )}

              {/* Asignación de Segundo Administrador (con opcion de dos inquilino, el primero selecciona al segundo) */}
              {simulatedSession === 'inquilino-1' && (
                <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-500 animate-pulse" />
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Asignación de Segundo Administrador (Inquilino)</h4>
                      <p className="text-[10px] text-neutral-400">Como Inquilino Principal (Administrador 1), puedes seleccionar quién es tu co-administrador (Inquilino 2).</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <label className="text-[11px] font-mono text-neutral-400 whitespace-nowrap">Co-Inquilino Designado:</label>
                    <select
                      value={secondaryAdminId || ''}
                      onChange={e => {
                        const nextId = e.target.value;
                        setSecondaryAdminId(nextId);
                        if (nextId) {
                          setCollaborators(
                            collaborators.map(c => 
                              c.id === nextId ? { ...c, isAdmin: true } : c
                            )
                          );
                          const targetName = collaborators.find(col => col.id === nextId)?.name || 'colaborador';
                          triggerPush('Segundo Administrador Designado', `El primer Inquilino ha seleccionado a ${targetName} como Segundo Administrador.`);
                        }
                      }}
                      className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="">-- Ninguno (Sin segundo administrador asignado) --</option>
                      {collaborators.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.isAdmin ? '👑 (Ya es Admin)' : ''}
                        </option>
                      ))}
                    </select>
                    {secondaryAdminId && (
                      <span className="text-[10px] bg-amber-500/15 text-amber-500 border border-amber-500/30 px-2.5 py-1 rounded font-bold font-mono whitespace-nowrap">
                        Activo: 2do Inquilino 👑
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Collaborators List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {collaborators.map(collab => (
                  <div key={collab.id} className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 flex justify-between items-center hover:border-neutral-700 transition-all">
                    <div className="flex items-center gap-3">
                      <img
                        src={collab.avatar}
                        alt={collab.name}
                        className="w-10 h-10 rounded-full object-cover border border-amber-500/30"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>{collab.name}</span>
                          {(collab.isAdmin || collab.id === secondaryAdminId) && (
                            <span 
                              className="text-[8px] bg-amber-500 text-neutral-950 font-mono font-extrabold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow border border-amber-400"
                              title={collab.id === secondaryAdminId ? "Segundo Administrador (Inquilino 2) seleccionado por el primero" : "Administrador (Inquilino) habilitado"}
                            >
                              👑 ADMIN {collab.id === secondaryAdminId ? '2' : ''}
                            </span>
                          )}
                        </h4>
                        <p className="text-[10px] text-amber-500 font-medium">{collab.role}</p>
                        <p className="text-[9px] text-neutral-400 font-mono mt-0.5">{collab.email}</p>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {collab.scheduleType === 'custom' ? (
                            <span className="text-[8px] font-mono bg-blue-500/10 border border-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded flex items-center gap-1 font-bold">
                              <span className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" />
                              ⏰ Custom: {collab.customSlots?.length || 0} hrs
                            </span>
                          ) : (
                            <span className="text-[8px] font-mono bg-neutral-800 border border-neutral-700 text-neutral-400 px-1.5 py-0.5 rounded flex items-center gap-1 font-bold">
                              <span className="w-1 h-1 rounded-full bg-neutral-500" />
                              📅 Gral: {generalTimeSlots.length} hrs
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditCollab(collab)}
                        className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs transition-all"
                        title="Editar colaborador"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCollab(collab.id, collab.name)}
                        className="p-1.5 bg-red-950/30 hover:bg-red-900/50 text-red-400 rounded-lg text-xs transition-all"
                        title="Eliminar colaborador"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Servicios */}
          {activeTab === 'servicios' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Scissors className="w-5 h-5 text-amber-500" />
                    Catálogo de Servicios
                  </h3>
                  <p className="text-xs text-neutral-400">Administra los servicios, precios, duración y detalles de tu menú.</p>
                </div>
                {!isAddingService && isCurrentlyAdmin && (
                  <button
                    onClick={() => setIsAddingService(true)}
                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar Servicio</span>
                  </button>
                )}
              </div>

              {!isCurrentlyAdmin && (
                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                  <div className="text-[11px] leading-snug text-neutral-400">
                    <strong>Catálogo en Modo Lectura:</strong> Los colaboradores regulares solo pueden consultar el menú de servicios activos. Las modificaciones de precios y descripciones están restringidas únicamente a los administradores.
                  </div>
                </div>
              )}

              {/* Service Form */}
              {isAddingService && (
                <form onSubmit={handleSaveService} className="bg-neutral-900 p-5 rounded-xl border border-neutral-800 space-y-4 animate-slide-up">
                  <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
                    <h4 className="text-xs font-bold font-mono text-amber-400 uppercase">
                      {editingServiceId ? 'Editar Servicio' : 'Crear Nuevo Servicio'}
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingService(false);
                        setEditingServiceId(null);
                        setServiceForm({ name: '', price: 30, duration: 30, category: 'Cortes', description: '' });
                      }}
                      className="text-neutral-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-neutral-300">Nombre del Servicio</label>
                      <input
                        type="text"
                        required
                        value={serviceForm.name}
                        onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })}
                        placeholder="Ej. Corte de Cabello Manhattan Style"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-neutral-300">Categoría</label>
                      <select
                        value={serviceForm.category}
                        onChange={e => setServiceForm({ ...serviceForm, category: e.target.value })}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="Cortes">Cortes</option>
                        <option value="Afeitados">Afeitados</option>
                        <option value="Barba">Barba</option>
                        <option value="Combos Premium">Combos Premium</option>
                        <option value="Tratamientos">Tratamientos / Estética</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-neutral-300">Precio ({tenant.currency || 'ARS'})</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={serviceForm.price}
                        onChange={e => setServiceForm({ ...serviceForm, price: Number(e.target.value) })}
                        placeholder="Ej. 35"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-neutral-300">Duración Estimada (Minutos)</label>
                      <input
                        type="number"
                        required
                        min="5"
                        step="5"
                        value={serviceForm.duration}
                        onChange={e => setServiceForm({ ...serviceForm, duration: Number(e.target.value) })}
                        placeholder="Ej. 30"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-300">Detalle / Descripción del Servicio</label>
                    <textarea
                      rows={3}
                      value={serviceForm.description}
                      onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })}
                      placeholder="Corte con tijera y máquina, lavado con champú premium, peinado con pomada artesanal..."
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingService(false);
                        setEditingServiceId(null);
                        setServiceForm({ name: '', price: 30, duration: 30, category: 'Cortes', description: '' });
                      }}
                      className="bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1.5 rounded-lg text-xs"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-4 py-1.5 rounded-lg text-xs"
                    >
                      Guardar Servicio
                    </button>
                  </div>
                </form>
              )}

              {/* Services List Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map(s => (
                  <div key={s.id} className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 flex flex-col justify-between hover:border-neutral-700 transition-all space-y-3">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] uppercase font-mono tracking-wider bg-neutral-950 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded font-bold">
                          {s.category}
                        </span>
                        <span className="text-sm font-bold text-amber-400 font-mono">${s.price.toFixed(2)}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white mt-1.5">{s.name}</h4>
                      <p className="text-[10px] text-neutral-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-neutral-500" />
                        <span>Duración: {s.duration} min</span>
                      </p>
                      {s.description && (
                        <p className="text-[10px] text-neutral-400 mt-2 bg-neutral-950/40 p-2 rounded border border-neutral-900 italic">
                          {s.description}
                        </p>
                      )}
                    </div>

                    {isCurrentlyAdmin && (
                      <div className="flex justify-end gap-1.5 pt-2 border-t border-neutral-900">
                        <button
                          onClick={() => handleEditService(s)}
                          className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs transition-all"
                          title="Editar servicio"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteService(s.id, s.name)}
                          className="p-1.5 bg-red-950/30 hover:bg-red-900/50 text-red-400 rounded-lg text-xs transition-all"
                          title="Eliminar servicio"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Turnos */}
          {activeTab === 'turnos' && (() => {
            const displayBookings = isCurrentlyAdmin 
              ? bookings 
              : bookings.filter(b => b.collaboratorId === simulatedSession);

            return (
              <div className="space-y-6 animate-fade-in">
                <div className="border-b border-neutral-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-amber-500" />
                      Panel de Reservas y Turnos
                    </h3>
                    <p className="text-xs text-neutral-400">Controla las citas agendadas, asiste a tus clientes o cancela según disponibilidad.</p>
                  </div>
                </div>

                {!isCurrentlyAdmin && (
                  <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                    <div className="text-[11px] leading-snug text-neutral-300">
                      <strong>Filtro de Seguridad Activo:</strong> Estás visualizando únicamente tus turnos asignados individuales como <strong className="text-amber-500">{activeCollab?.name}</strong>. Para ver la agenda completa de la barbería, cambia tu sesión simulada arriba a un rol de Administrador.
                    </div>
                  </div>
                )}

                {/* Turnos List / Table */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                  <div className="p-4 bg-neutral-950 border-b border-neutral-800 flex justify-between items-center">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Listado de Turnos Registrados</span>
                    <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
                      {displayBookings.length} Reservas {isCurrentlyAdmin ? 'Totales' : 'Asignadas'}
                    </span>
                  </div>

                  {displayBookings.length === 0 ? (
                    <div className="text-center py-12 text-neutral-500 text-xs">
                      No hay turnos registrados en este momento para esta vista.
                    </div>
                  ) : (
                    <div className="divide-y divide-neutral-800/60">
                      {displayBookings.map(booking => {
                        const service = services.find(s => s.id === booking.serviceId);
                        const barber = collaborators.find(c => c.id === booking.collaboratorId);
                        return (
                          <div key={booking.id} className="p-4 hover:bg-neutral-950/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1.5 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-xs font-bold text-white">{booking.clientName}</h4>
                                <span className="text-[9px] font-mono text-neutral-400">({booking.clientPhone})</span>
                                
                                {/* Status badges */}
                                {booking.status === 'Completed' && (
                                  <span className="bg-green-950 text-green-300 border border-green-800 px-2 py-0.5 rounded-full text-[9px] font-bold">
                                    Atendido
                                  </span>
                                )}
                                {(booking.status === 'Confirmed' || booking.status === 'Pending') && (
                                  <span className="bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded-full text-[9px] font-bold">
                                    En Espera
                                  </span>
                                )}
                                {booking.status === 'Cancelled' && (
                                  <span className="bg-red-950 text-red-300 border border-red-800 px-2 py-0.5 rounded-full text-[9px] font-bold">
                                    Cancelado
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-neutral-300">
                                <p className="flex items-center gap-1.5">
                                  <Scissors className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                  <span>{service?.name || 'Servicio Personalizado'}</span>
                                </p>
                                <p className="flex items-center gap-1.5">
                                  <Users className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                  <span>Atendido por: {barber?.name || 'Cualquier barbero'}</span>
                                </p>
                                <p className="flex items-center gap-1.5 font-mono text-neutral-400 text-[10px]">
                                  <Calendar className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                                  <span>Fecha: {booking.date} | {booking.timeSlot}</span>
                                </p>
                              </div>
                            </div>

                            {/* Quick change status controls */}
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setSelectedBooking(booking)}
                                className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                title="Ver detalle del turno"
                              >
                                Ver Detalle
                              </button>
                              
                              <button
                                onClick={() => handleUpdateBookingStatus(booking.id, 'Completed')}
                                className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                                  booking.status === 'Completed'
                                    ? 'bg-green-600 text-neutral-950 font-bold'
                                    : 'bg-neutral-800 hover:bg-green-950/40 text-green-400 hover:text-green-300'
                                }`}
                              title="Marcar como Atendido"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleUpdateBookingStatus(booking.id, 'Confirmed')}
                              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                                booking.status === 'Confirmed' || booking.status === 'Pending'
                                  ? 'bg-amber-500 text-neutral-950 font-bold'
                                  : 'bg-neutral-800 hover:bg-amber-950/40 text-amber-400 hover:text-amber-300'
                              }`}
                              title="Marcar como En Espera"
                            >
                              <Clock className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleUpdateBookingStatus(booking.id, 'Cancelled')}
                              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                                booking.status === 'Cancelled'
                                  ? 'bg-red-600 text-white font-bold'
                                  : 'bg-neutral-800 hover:bg-red-950/40 text-red-400 hover:text-red-300'
                              }`}
                              title="Cancelar Turno"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Selected Booking Detail Ticket */}
              {selectedBooking && (
                <div className="bg-neutral-900 p-5 rounded-xl border border-neutral-800 space-y-4 animate-slide-up">
                  <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
                    <span className="text-xs font-bold font-mono text-amber-500 uppercase">Detalle del Ticket de Turno</span>
                    <button onClick={() => setSelectedBooking(null)} className="text-neutral-400 hover:text-white cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="bg-neutral-950 border border-neutral-800/80 p-5 rounded-xl font-mono text-xs text-neutral-300 space-y-3 shadow-inner relative overflow-hidden">
                    {/* Retro ticket border stripes */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-neutral-900 to-amber-500" />
                    
                    <div className="text-center pb-3 border-b border-dashed border-neutral-800">
                      <h4 className="font-bold text-white uppercase text-[13px]">{tenant.name}</h4>
                      <p className="text-[10px] text-neutral-500">ID: {selectedBooking.id}</p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">CLIENTE:</span>
                        <span className="text-white font-bold">{selectedBooking.clientName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">TELEFONO:</span>
                        <span className="text-neutral-300">{selectedBooking.clientPhone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">FECHA:</span>
                        <span className="text-white">{selectedBooking.date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">HORARIO:</span>
                        <span className="text-amber-400 font-bold">{selectedBooking.timeSlot}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">BARBERO:</span>
                        <span className="text-white">
                          {collaborators.find(c => c.id === selectedBooking.collaboratorId)?.name || 'Especialista'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">SERVICIO:</span>
                        <span className="text-white text-right">
                          {services.find(s => s.id === selectedBooking.serviceId)?.name || 'Corte'}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1.5 border-t border-neutral-900 font-bold">
                        <span className="text-neutral-500">PRECIO:</span>
                        <span className="text-amber-500">
                          ${services.find(s => s.id === selectedBooking.serviceId)?.price || 30}.00 {tenant.currency || 'ARS'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-dashed border-neutral-800 flex justify-between items-center">
                      <span className="text-neutral-500">ESTADO:</span>
                      <span className={`px-2.5 py-0.5 rounded font-black uppercase text-[9px] ${
                        selectedBooking.status === 'Completed'
                          ? 'bg-green-950 text-green-400 border border-green-800'
                          : selectedBooking.status === 'Cancelled'
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}>
                        {selectedBooking.status === 'Completed' ? 'Atendido' : selectedBooking.status === 'Cancelled' ? 'Cancelado' : 'En Espera'}
                      </span>
                    </div>

                    <div className="pt-2 text-center text-[10px] text-neutral-500">
                      ¡Gracias por reservar con nosotros! NYC Estilo Tradicional
                    </div>
                  </div>

                  {/* Actions inside Detail */}
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        const pref = (tenant.phonePrefix || '+54 9').replace(/\D/g, '');
                        const tel = (selectedBooking.clientPhone || '').replace(/\D/g, '');
                        const svc = services.find(s => s.id === selectedBooking.serviceId)?.name || 'tu servicio';
                        const msg = `Hola ${selectedBooking.clientName}! Te recordamos tu turno en ${tenant.name} para ${svc} el ${selectedBooking.date} a las ${selectedBooking.timeSlot}. ¡Te esperamos!`;
                        window.open(`https://wa.me/${pref}${tel}?text=${encodeURIComponent(msg)}`, '_blank');
                      }}
                      className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-amber-500 border border-amber-500/20 hover:border-amber-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Enviar WhatsApp
                    </button>
                    {selectedBooking.status !== 'Completed' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateBookingStatus(selectedBooking.id, 'Completed')}
                        className="px-3.5 py-2 bg-green-900/60 hover:bg-green-800 text-green-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Marcar Atendido
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedBooking(null)}
                      className="px-3.5 py-2 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 text-white rounded-xl text-xs cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

          {/* Tab: Configuración */}
          {activeTab === 'configuracion' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-neutral-800 pb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Store className="w-5 h-5 text-amber-500" />
                  Configuración del Local
                </h3>
                <p className="text-xs text-neutral-400">Administra los datos públicos de tu barbería como dirección, teléfono y nombre.</p>
              </div>

              <form onSubmit={handleSaveConfig} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-300">Nombre del Local / Barbería</label>
                    <input
                      type="text"
                      required
                      value={configForm.name}
                      onChange={e => setConfigForm({ ...configForm, name: e.target.value })}
                      placeholder="Ej. Empire State Barbershop"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-300">Teléfono de Contacto</label>
                    <input
                      type="text"
                      required
                      value={configForm.phone}
                      onChange={e => setConfigForm({ ...configForm, phone: e.target.value })}
                      placeholder="Ej. 555-123-4567"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-300">Dirección Física (Se abrirá en Google Maps al hacer click)</label>
                  <input
                    type="text"
                    required
                    value={configForm.address}
                    onChange={e => setConfigForm({ ...configForm, address: e.target.value })}
                    placeholder="Ej. 45th Ave, Queens NYC"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-300">Moneda (símbolo)</label>
                    <input
                      type="text"
                      value={configForm.currency}
                      onChange={e => setConfigForm({ ...configForm, currency: e.target.value })}
                      placeholder="Ej. ARS"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                    <p className="text-[9px] text-neutral-500">Se muestra junto a los precios (ej: ARS, USD).</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-300">Prefijo de WhatsApp</label>
                    <input
                      type="text"
                      value={configForm.phonePrefix}
                      onChange={e => setConfigForm({ ...configForm, phonePrefix: e.target.value })}
                      placeholder="Ej. +54 9"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                    <p className="text-[9px] text-neutral-500">Se antepone al teléfono del cliente para WhatsApp.</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-300">Eslogan / Descripción Breve</label>
                  <textarea
                    rows={2}
                    required
                    value={configForm.description}
                    onChange={e => setConfigForm({ ...configForm, description: e.target.value })}
                    placeholder="Ej. Desde 1924, brindando la mejor experiencia de barbería tradicional en el corazón de Manhattan."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-4">
                  <ImageUploader 
                    label="Imagen de Portada / Local" 
                    currentImage={configForm.shopImageUrl} 
                    onUpload={(base64) => setConfigForm({ ...configForm, shopImageUrl: base64 })}
                  />

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-semibold text-neutral-300">O ingresa un enlace (URL) directamente</label>
                      <span className="text-[10px] text-neutral-500">Inserta un enlace o elige un preset abajo</span>
                    </div>
                    <input
                      type="text"
                      value={configForm.shopImageUrl}
                      onChange={e => setConfigForm({ ...configForm, shopImageUrl: e.target.value })}
                      placeholder="Ej. https://images.unsplash.com/..."
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono text-[11px]"
                    />
                  </div>

                  {/* Portada Presets Selection */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold text-amber-500 uppercase font-mono block">Imágenes Preestablecidas Elegantes</span>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        {
                          name: 'Vintage Cuero/Madera',
                          url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=1024',
                          desc: 'Ambiente clásico, sillas retro'
                        },
                        {
                          name: 'Soho Brick Shop',
                          url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=1024',
                          desc: 'Ladrillo rústico, luces cálidas'
                        },
                        {
                          name: 'Modern Clean Salon',
                          url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=1024',
                          desc: 'Brillo metálico, minimalismo'
                        },
                        {
                          name: 'Traditional Barber Chair',
                          url: 'https://images.unsplash.com/photo-1605497746444-11d59596c88d?auto=format&fit=crop&q=80&w=1024',
                          desc: 'Detalle silla clásica barber'
                        }
                      ].map(preset => {
                        const isSelected = configForm.shopImageUrl === preset.url;
                        return (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => setConfigForm({ ...configForm, shopImageUrl: preset.url })}
                            className={`p-1.5 rounded-xl border text-left bg-neutral-900 hover:border-neutral-700 transition-all cursor-pointer flex flex-col ${
                              isSelected ? 'border-amber-500 shadow-md shadow-amber-500/10' : 'border-neutral-800'
                            }`}
                          >
                            <img
                              src={preset.url}
                              alt={preset.name}
                              className="w-full h-16 object-cover rounded-lg"
                              referrerPolicy="no-referrer"
                            />
                            <span className="text-[9px] font-bold text-white mt-1.5 block truncate">{preset.name}</span>
                            <span className="text-[7px] text-neutral-400 block truncate leading-tight">{preset.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Flujo Horario General Predeterminado */}
                <div className="bg-neutral-900/60 p-5 rounded-xl border border-neutral-800 space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-amber-500 uppercase font-mono flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-500" />
                      Flujo Horario General Predeterminado (PWA del Local)
                    </h4>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      Define las horas de atención estándar del local. Los barberos que utilicen "Horario General" heredarán automáticamente esta lista de turnos disponibles.
                    </p>
                  </div>

                  <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800/60 space-y-3">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <span className="text-[10px] font-mono font-bold text-neutral-300 uppercase">Lista de Horas del Local</span>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setGeneralTimeSlots([
                            '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'
                          ])}
                          className="text-[8px] font-bold text-amber-500 hover:text-white border border-amber-500/10 hover:border-amber-500 bg-neutral-900 px-2 py-1 rounded transition-all cursor-pointer"
                        >
                          Resetear a Default
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {[
                        '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
                        '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
                        '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM'
                      ].map(hour => {
                        const isSelected = generalTimeSlots.includes(hour);
                        return (
                          <button
                            type="button"
                            key={hour}
                            onClick={() => {
                              if (isSelected) {
                                if (generalTimeSlots.length <= 1) {
                                  alert('Debe haber al menos un horario general habilitado.');
                                  return;
                                }
                                setGeneralTimeSlots(generalTimeSlots.filter(s => s !== hour));
                              } else {
                                setGeneralTimeSlots([...generalTimeSlots, hour].sort((a, b) => {
                                  const parseTime = (t: string) => {
                                    const [time, period] = t.split(' ');
                                    let [h, m] = time.split(':').map(Number);
                                    if (period === 'PM' && h !== 12) h += 12;
                                    if (period === 'AM' && h === 12) h = 0;
                                    return h * 60 + m;
                                  };
                                  return parseTime(a) - parseTime(b);
                                }));
                              }
                            }}
                            className={`py-1.5 rounded font-mono text-[9px] font-bold text-center border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500 text-neutral-950 border-amber-500 font-extrabold'
                                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                            }`}
                          >
                            {hour}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-6 py-2 rounded-xl text-xs shadow-md cursor-pointer transition-all"
                  >
                    Guardar Configuración de Local
                  </button>
                </div>
              </form>

              {/* Galería de Trabajos */}
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5 space-y-4 mt-6">
                <h3 className="text-sm font-bold text-white flex items-center gap-2"><span>🖼️</span> Galería de Trabajos</h3>
                <p className="text-[11px] text-neutral-400">Subí fotos de tus cortes/trabajos (desde el celular o la PC). Se muestran en la página pública de la barbería.</p>
                <ImageUploader
                  label="Agregar foto a la galería (Móvil o PC)"
                  currentImage=""
                  onUpload={(base64) => setGallery([...(gallery || []), { id: Math.random().toString(36).slice(2), image: base64, title: '' }])}
                />
                {gallery && gallery.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {gallery.map((g: any) => (
                      <div key={g.id} className="relative group rounded-xl overflow-hidden border border-neutral-800">
                        <img src={g.image} alt="galería" className="w-full h-24 object-cover" />
                        <button
                          type="button"
                          onClick={() => setGallery(gallery.filter((x: any) => x.id !== g.id))}
                          className="absolute top-1 right-1 bg-red-600/90 hover:bg-red-500 text-white w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                          title="Eliminar foto"
                        >✕</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-neutral-500 italic">Todavía no cargaste fotos. Hasta que subas las tuyas, la página pública muestra fotos de ejemplo.</p>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Personalización Visual */}
          {activeTab === 'personalizacion' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-neutral-800 pb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Palette className="w-5 h-5 text-amber-500" />
                  Personalización Visual del Tenant
                </h3>
                <p className="text-xs text-neutral-400">
                  Ajusta la paleta de colores y la tipografía con las que tus clientes verán tu barbería en tiempo real.
                </p>
              </div>

              {/* Live configuration fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Colors presets Selection */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase text-amber-500 font-mono">1. Esquema de Colores</h4>
                  <div className="space-y-2.5">
                    {colorPresets.map(preset => {
                      const isSelected = tenant.primaryColor === preset.primary;
                      return (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => setTenant({ ...tenant, primaryColor: preset.primary, secondaryColor: preset.secondary })}
                          className={`w-full text-left p-3 rounded-xl border transition-all ${
                            isSelected 
                              ? 'bg-neutral-900 border-amber-500 shadow-md shadow-amber-500/10' 
                              : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-white">{preset.name}</span>
                            <div className="flex gap-1.5">
                              <span className="w-3.5 h-3.5 rounded-full border border-neutral-800" style={{ backgroundColor: preset.primary }} />
                              <span className="w-3.5 h-3.5 rounded-full border border-neutral-800" style={{ backgroundColor: preset.secondary }} />
                            </div>
                          </div>
                          <p className="text-[10px] text-neutral-400 leading-normal">{preset.text}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Font preference selection */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase text-amber-500 font-mono">2. Tipografía del Local</h4>
                  <div className="space-y-2.5">
                    {fontOptions.map(fontOpt => {
                      const isSelected = tenant.font === fontOpt.id;
                      return (
                        <button
                          key={fontOpt.id}
                          type="button"
                          onClick={() => setTenant({ ...tenant, font: fontOpt.id })}
                          className={`w-full text-left p-3 rounded-xl border transition-all ${
                            isSelected 
                              ? 'bg-neutral-900 border-amber-500' 
                              : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700'
                          }`}
                        >
                          <span className={`text-xs text-white block ${fontOpt.className}`}>
                            {fontOpt.name} - Estilo Clásico
                          </span>
                          <span className="text-[9px] text-neutral-400 font-mono block mt-1">
                            Ej. "The Bronx Cuts & Shave Club"
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Real-time feedback notice */}
                  <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                    <div>
                      <h5 className="text-[11px] font-bold text-white">Visualización en Vivo Disponible</h5>
                      <p className="text-[10px] text-neutral-400 mt-0.5">
                        Haz clic en el botón de "Ojo" arriba. Verás la página tal como la configuras. Al cerrarla, regresarás inmediatamente a este panel.
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Branding and Cover options */}
              <div className="bg-neutral-900/40 p-5 rounded-xl border border-neutral-800 space-y-4">
                <h4 className="text-xs font-bold uppercase text-amber-500 font-mono flex items-center gap-2">
                  <Store className="w-4 h-4 text-amber-500" />
                  <span>3. Identidad y Portada (Branding)</span>
                </h4>
                
                <div className="space-y-4">
                  <ImageUploader 
                    label="Imagen de Portada (Branding)" 
                    currentImage={tenant.shopImageUrl} 
                    onUpload={(base64) => {
                      setTenant({ ...tenant, shopImageUrl: base64 });
                      setConfigForm(prev => ({ ...prev, shopImageUrl: base64 }));
                    }}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-neutral-300">Nombre de la Barbería</label>
                      <input
                        type="text"
                        value={tenant.name}
                        onChange={e => {
                          setTenant({ ...tenant, name: e.target.value });
                          setConfigForm(prev => ({ ...prev, name: e.target.value }));
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                        placeholder="Nombre del local"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-neutral-300">O ingresa un enlace (URL) directamente</label>
                      <input
                        type="text"
                        value={tenant.shopImageUrl}
                        onChange={e => {
                          setTenant({ ...tenant, shopImageUrl: e.target.value });
                          setConfigForm(prev => ({ ...prev, shopImageUrl: e.target.value }));
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono text-[11px]"
                        placeholder="https://images.unsplash.com/..."
                      />
                    </div>
                  </div>
                </div>

                {/* Cover presets inline */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-amber-500 uppercase font-mono block">Cambio rápido de imagen del local:</span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      {
                        name: 'Vintage Cuero/Madera',
                        url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=1024'
                      },
                      {
                        name: 'Soho Brick Shop',
                        url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=1024'
                      },
                      {
                        name: 'Modern Clean Salon',
                        url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=1024'
                      },
                      {
                        name: 'Traditional Barber Chair',
                        url: 'https://images.unsplash.com/photo-1605497746444-11d59596c88d?auto=format&fit=crop&q=80&w=1024'
                      }
                    ].map(p => {
                      const isSelected = tenant.shopImageUrl === p.url;
                      return (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => {
                            setTenant({ ...tenant, shopImageUrl: p.url });
                            setConfigForm(prev => ({ ...prev, shopImageUrl: p.url }));
                          }}
                          className={`p-1.5 rounded-xl border text-left bg-neutral-950 hover:border-neutral-700 transition-all cursor-pointer flex flex-col ${
                            isSelected ? 'border-amber-500 shadow-md shadow-amber-500/10' : 'border-neutral-800'
                          }`}
                        >
                          <img
                            src={p.url}
                            alt={p.name}
                            className="w-full h-12 object-cover rounded-lg"
                            referrerPolicy="no-referrer"
                          />
                          <span className="text-[8px] font-bold text-neutral-300 mt-1 block truncate text-center">{p.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Pagos y Licencia */}
          {activeTab === 'pagos' && (
            <div className="space-y-6 animate-fade-in print:hidden">
              <div className="border-b border-neutral-800 pb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-500" />
                  Módulo de Cobros y Reportes Financieros
                </h3>
                <p className="text-xs text-neutral-400">Controla la facturación de turnos de tus clientes y el estado de tu licencia.</p>
              </div>

              {/* Toggles for subtabs */}
              <div className="flex border-b border-neutral-800 gap-6">
                <button
                  type="button"
                  onClick={() => setPaymentsSubTab('ventas')}
                  className={`pb-3 text-sm font-bold transition-all relative cursor-pointer ${
                    paymentsSubTab === 'ventas' ? 'text-amber-500 font-black' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Dashboard de Ventas (Cobros de Turnos)
                  </span>
                  {paymentsSubTab === 'ventas' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full animate-fade-in" />
                  )}
                </button>
                {isCurrentlyAdmin && (
                  <button
                    type="button"
                    onClick={() => setPaymentsSubTab('licencia')}
                    className={`pb-3 text-sm font-bold transition-all relative cursor-pointer ${
                      paymentsSubTab === 'licencia' ? 'text-amber-500 font-black' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      Licencia e Historial del Sistema
                    </span>
                    {paymentsSubTab === 'licencia' && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full animate-fade-in" />
                    )}
                  </button>
                )}
              </div>

              {paymentsSubTab === 'ventas' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Financial Stats Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {(() => {
                      const completed = completedBookings;
                      const now = new Date();
                      let dailyTotal = 0;
                      let weeklyTotal = 0;
                      let monthlyTotal = 0;
                      let yearlyTotal = 0;
                      
                      completed.forEach(b => {
                        const s = services.find(srv => srv.id === b.serviceId);
                        const price = s ? s.price : 0;
                        
                        const [year, month, day] = b.date.split('-').map(Number);
                        const bDate = new Date(year, month - 1, day);
                        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                        
                        // Check Day (seeded 2026-07-08 is July 8, 2026)
                        if (b.date === '2026-07-08' || (year === now.getFullYear() && (month - 1) === now.getMonth() && day === now.getDate())) {
                          dailyTotal += price;
                        }
                        
                        // Check Week
                        const diffTime = Math.abs(today.getTime() - bDate.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        if (diffDays <= 7 || b.date === '2026-07-08') {
                          weeklyTotal += price;
                        }
                        
                        // Check Month
                        if (b.date.startsWith('2026-07') || (year === now.getFullYear() && (month - 1) === now.getMonth())) {
                          monthlyTotal += price;
                        }
                        
                        // Check Year
                        if (b.date.startsWith('2026') || year === now.getFullYear()) {
                          yearlyTotal += price;
                        }
                      });

                      return (
                        <>
                          <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 flex items-center justify-between">
                            <div>
                              <span className="text-[9px] uppercase font-mono font-bold text-neutral-400 block">Ventas de Hoy 📱</span>
                              <span className="text-xl font-bold text-amber-500 mt-0.5 block">${dailyTotal.toFixed(2)} {tenant.currency || 'ARS'}</span>
                              <span className="text-[8px] font-mono text-neutral-500 block mt-1">Día actual o 2026-07-08</span>
                            </div>
                            <Clock className="w-8 h-8 text-neutral-700 shrink-0" />
                          </div>

                          <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 flex items-center justify-between">
                            <div>
                              <span className="text-[9px] uppercase font-mono font-bold text-neutral-400 block">Esta Semana 💻</span>
                              <span className="text-xl font-bold text-white mt-0.5 block">${weeklyTotal.toFixed(2)} {tenant.currency || 'ARS'}</span>
                              <span className="text-[8px] font-mono text-neutral-500 block mt-1">Últimos 7 días activos</span>
                            </div>
                            <Calendar className="w-8 h-8 text-neutral-700 shrink-0" />
                          </div>

                          <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 flex items-center justify-between">
                            <div>
                              <span className="text-[9px] uppercase font-mono font-bold text-neutral-400 block">Este Mes 📊</span>
                              <span className="text-xl font-bold text-emerald-400 mt-0.5 block">${monthlyTotal.toFixed(2)} {tenant.currency || 'ARS'}</span>
                              <span className="text-[8px] font-mono text-neutral-500 block mt-1">Mes en curso</span>
                            </div>
                            <TrendingUp className="w-8 h-8 text-neutral-700 shrink-0" />
                          </div>

                          <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 flex items-center justify-between">
                            <div>
                              <span className="text-[9px] uppercase font-mono font-bold text-neutral-400 block">Este Año 🏆</span>
                              <span className="text-xl font-bold text-indigo-400 mt-0.5 block">${yearlyTotal.toFixed(2)} {tenant.currency || 'ARS'}</span>
                              <span className="text-[8px] font-mono text-neutral-500 block mt-1">Año {now.getFullYear()}</span>
                            </div>
                            <BarChart2 className="w-8 h-8 text-neutral-700 shrink-0" />
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Actions & Exporters Control Center */}
                  <div className="bg-neutral-900/40 border border-neutral-800/80 p-5 rounded-xl space-y-4">
                    {isCurrentlyAdmin ? (
                      <>
                        <h4 className="text-xs font-bold uppercase text-amber-500 font-mono flex items-center gap-2">
                          <Download className="w-4 h-4 text-amber-500" />
                          Centro de Exportación de Reportes
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setShowPrintModal(true)}
                              className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 hover:border-amber-500/40 text-neutral-200 hover:text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            >
                              <FileText className="w-4 h-4 text-red-400" />
                              Imprimir o PDF
                            </button>

                            <button
                              type="button"
                              onClick={handleDownloadExcel}
                              className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 hover:border-amber-500/40 text-neutral-200 hover:text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            >
                              <FileText className="w-4 h-4 text-emerald-400" />
                              Descargar Excel (.xls)
                            </button>

                            <button
                              type="button"
                              onClick={handleDownloadCSV}
                              className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 hover:border-amber-500/40 text-neutral-200 hover:text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            >
                              <FileText className="w-4 h-4 text-amber-400" />
                              Planilla de Cálculo (.csv)
                            </button>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-3 bg-neutral-950 border border-neutral-800 p-3 rounded-xl">
                              <input
                                type="checkbox"
                                id="clearOnDownloadCheckbox"
                                checked={clearOnDownload}
                                onChange={e => setClearOnDownload(e.target.checked)}
                                className="w-4 h-4 rounded text-amber-500 bg-neutral-900 border-neutral-700 focus:ring-amber-500 focus:ring-offset-neutral-900 cursor-pointer"
                              />
                              <label htmlFor="clearOnDownloadCheckbox" className="text-xs text-neutral-300 font-medium cursor-pointer flex flex-col">
                                <span className="font-bold text-amber-500 text-[10px] uppercase font-mono">Vaciar historial tras descargar</span>
                                <span className="text-[10px] text-neutral-500">Al descargar Excel o Planilla, se borrarán todos los turnos completados automáticamente.</span>
                              </label>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={handleClearHistory}
                            className="flex items-center gap-1.5 text-[10px] font-bold text-red-400 hover:text-red-300 transition-all border border-red-500/10 hover:border-red-500/30 px-3 py-1.5 rounded-lg bg-red-500/5 cursor-pointer"
                          >
                            <Trash className="w-3.5 h-3.5" />
                            Vaciar Historial de Cobros de Forma Manual
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-start gap-3 bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <h5 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Acceso de Lectura Personalizado Activo 🔒</h5>
                          <p className="text-[10px] text-neutral-400 mt-1 leading-relaxed">
                            Estás consultando únicamente tu historial financiero de cobros individuales concretados como <strong className="text-amber-500">{activeCollab?.name}</strong>. Las funciones administrativas de descarga de planillas fiscales (Excel, CSV, PDF) y vaciado destructivo de historial están estrictamente reservadas para el Inquilino Administrador de la cuenta.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Booking details table - Concretados */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold uppercase text-amber-500 font-mono">Detalle de Cobros y Clientes Concretados</h4>
                      <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full font-mono border border-amber-500/20">
                        {completedBookings.length} Turnos Completados
                      </span>
                    </div>

                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                      {completedBookings.length === 0 ? (
                        <div className="p-8 text-center text-neutral-500 space-y-1">
                          <AlertCircle className="w-8 h-8 text-neutral-600 mx-auto" />
                          <p className="text-xs font-bold text-neutral-400">Sin historial de cobros</p>
                          <p className="text-[10px] text-neutral-500">Aún no se han marcado turnos como "Completed" en la sección de Turnos.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-neutral-950 border-b border-neutral-800 text-[10px] uppercase tracking-wider font-mono text-neutral-400">
                                <th className="p-3">Turno ID</th>
                                <th className="p-3">Cliente</th>
                                <th className="p-3">Servicio Concretado</th>
                                <th className="p-3 text-right">Monto</th>
                                <th className="p-3">Barbero / Quien Concretó</th>
                                <th className="p-3">Fecha y Hora</th>
                                <th className="p-3 text-right">Estado</th>
                              </tr>
                            </thead>
                            <tbody className="text-xs text-neutral-200 divide-y divide-neutral-800/50">
                              {completedBookings.map(b => {
                                const s = services.find(srv => srv.id === b.serviceId);
                                const c = collaborators.find(col => col.id === b.collaboratorId);
                                return (
                                  <tr key={b.id} className="hover:bg-neutral-950/40 transition-colors">
                                    <td className="p-3 font-mono text-neutral-400 text-[11px]">{b.id}</td>
                                    <td className="p-3">
                                      <div className="font-semibold">{b.clientName}</div>
                                      <div className="text-[10px] text-neutral-500">{b.clientPhone}</div>
                                    </td>
                                    <td className="p-3">
                                      <div className="font-semibold text-neutral-300">{s?.name || 'Servicio'}</div>
                                      <div className="text-[10px] text-neutral-500">{s?.category || 'Categoría'}</div>
                                    </td>
                                    <td className="p-3 font-bold text-amber-500 text-right font-mono text-[13px]">
                                      ${s?.price || 0}.00
                                    </td>
                                    <td className="p-3">
                                      {c ? (
                                        <div className="flex items-center gap-2">
                                          <img
                                            src={c.avatar}
                                            alt={c.name}
                                            className="w-6 h-6 rounded-full object-cover border border-neutral-800 bg-neutral-950 shrink-0"
                                            referrerPolicy="no-referrer"
                                          />
                                          <div>
                                            <div className="font-semibold text-white text-[11px]">{c.name}</div>
                                            <div className="text-[9px] text-neutral-500 font-mono uppercase">{c.role.split(' ')[0]}</div>
                                          </div>
                                        </div>
                                      ) : (
                                        <span className="text-neutral-500 italic text-[11px]">No asignado</span>
                                      )}
                                    </td>
                                    <td className="p-3">
                                      <div className="text-neutral-300">{b.date}</div>
                                      <div className="text-[10px] text-amber-500 font-medium font-mono">{b.timeSlot}</div>
                                    </td>
                                    <td className="p-3 text-right">
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-green-950 text-green-300 border border-green-800">
                                        <Check className="w-2.5 h-2.5 text-green-400" />
                                        Atendido
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}

              {paymentsSubTab === 'licencia' && (
                <div className="space-y-6 animate-fade-in">
                  {/* License overview cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800">
                      <span className="text-[10px] uppercase font-mono font-bold text-neutral-400 block">Tipo de Licencia</span>
                      <span className="text-lg font-bold text-amber-500 mt-1 block">{tenant.licenseType} Plan</span>
                    </div>
                    <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800">
                      <span className="text-[10px] uppercase font-mono font-bold text-neutral-400 block">Próximo Vencimiento</span>
                      <span className="text-sm font-bold text-white mt-1.5 block">{tenant.licenseExpiry}</span>
                    </div>
                    <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800">
                      <span className="text-[10px] uppercase font-mono font-bold text-neutral-400 block">Estado del Servicio</span>
                      <span className="text-sm font-bold text-green-400 mt-1.5 block flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        {tenant.status}
                      </span>
                    </div>
                  </div>

                  {/* Payments Table */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase text-amber-500 font-mono">Facturas de Pago</h4>
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-neutral-950 border-b border-neutral-800 text-[10px] uppercase tracking-wider font-mono text-neutral-400">
                            <th className="p-3">Factura ID</th>
                            <th className="p-3">Concepto</th>
                            <th className="p-3">Fecha</th>
                            <th className="p-3">Monto</th>
                            <th className="p-3 text-right">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="text-xs text-neutral-200 divide-y divide-neutral-800/50">
                          {payments.map(payment => (
                            <tr key={payment.id} className="hover:bg-neutral-950/40 transition-colors">
                              <td className="p-3 font-mono text-neutral-400 text-[11px]">{payment.id}</td>
                              <td className="p-3 font-semibold">{payment.concept}</td>
                              <td className="p-3 text-neutral-300">{payment.date}</td>
                              <td className="p-3 font-bold text-amber-500">${payment.amount.toFixed(2)} {tenant.currency || 'ARS'}</td>
                              <td className="p-3 text-right">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-950 text-green-300 border border-green-800">
                                  {payment.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Seguridad & OTP */}
          {activeTab === 'seguridad' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-neutral-800 pb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-500" />
                  Parámetros de Seguridad y Control de Acceso
                </h3>
                <p className="text-xs text-neutral-400">
                  Configura cómo deseas resguardar el panel de inquilino.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Config list */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase text-amber-500 font-mono">Ajustes de Ingreso</h4>
                  
                  {/* OTP Switch */}
                  <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-bold text-white">Código de Verificación por Correo</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={securitySettings.otpEnabled}
                        onChange={e => setSecuritySettings({ ...securitySettings, otpEnabled: e.target.checked })}
                        className="w-4 h-4 text-amber-500 rounded border-neutral-800 focus:ring-amber-500"
                      />
                    </div>
                    <p className="text-[10px] text-neutral-400">
                      Al cerrar sesión e intentar ingresar de nuevo, se le solicitará un código de 6 dígitos que simula llegar a su correo registrado.
                    </p>
                  </div>

                  {/* Biometrics Switch */}
                  <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Fingerprint className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-bold text-white">Autenticación Biométrica (FaceID/Huella)</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={securitySettings.biometricsEnabled}
                        onChange={e => setSecuritySettings({ ...securitySettings, biometricsEnabled: e.target.checked })}
                        className="w-4 h-4 text-amber-500 rounded border-neutral-800 focus:ring-amber-500"
                      />
                    </div>
                    <p className="text-[10px] text-neutral-400">
                      Evita pedir OTP o claves secundarias guardando la firma digital del dispositivo del barbero para ingresos instantáneos seguros.
                    </p>
                  </div>
                </div>

                {/* Password recovery and diagnostics */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase text-amber-500 font-mono">Recuperación de Contraseña</h4>
                  <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 space-y-3">
                    <p className="text-[11px] text-neutral-300">
                      ¿Deseas simular la recuperación de claves de tus colaboradores o la propia? Al solicitarla se gatillará el mismo canal OTP.
                    </p>
                    <button
                      type="button"
                      onClick={() => alert('¡Simulación iniciada! Se ha despachado un correo electrónico con instrucciones y código OTP de recuperación para el email del inquilino.')}
                      className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-amber-500 border border-amber-500/30 px-3 py-1.5 rounded-lg text-xs font-bold transition-all w-full justify-center cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Simular Enlace de Recuperación</span>
                    </button>
                  </div>

                  <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl text-neutral-300 flex gap-3 text-xs">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                    <div>
                      <span className="font-bold block text-white text-[11px]">Nota de Resguardo</span>
                      <span className="text-[10px] text-neutral-400 block mt-0.5">
                        Si desactivas "Datos Biométricos" y tienes activo el OTP de correo, obligatoriamente se gatillará la verificación secundaria en el próximo login por seguridad.
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Tab 5: Notificaciones Push */}
          {activeTab === 'notificaciones' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Bell className="w-5 h-5 text-amber-500" />
                    Notificaciones en Tiempo Real (Push)
                  </h3>
                  <p className="text-xs text-neutral-400">Canal activo con WebSockets simulado para control de flujo de la barbería.</p>
                </div>
                <button
                  type="button"
                  onClick={handleSimulateBooking}
                  className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                  <span>Simular Cliente Agendando</span>
                </button>
              </div>

              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {notifications.length === 0 ? (
                  <div className="text-center py-12 text-neutral-500 text-xs">
                    No hay notificaciones recibidas en esta sesión. Presiona "Simular Cliente Agendando" arriba.
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div key={notif.id} className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <h4 className="text-xs font-bold text-white">{notif.title}</h4>
                        </div>
                        <p className="text-[11px] text-neutral-300 leading-relaxed">{notif.body}</p>
                      </div>
                      <span className="text-[9px] font-mono text-neutral-500">{notif.date}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Dynamic print-only style tag */}
      {showPrintModal && (
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body * {
              visibility: hidden !important;
            }
            #print-report-section, #print-report-section * {
              visibility: visible !important;
            }
            #print-report-section {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              background: white !important;
              color: black !important;
              padding: 20px !important;
            }
          }
        `}} />
      )}

      {/* Print PDF Modal UI */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
              <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                <span>Vista Previa de Impresión / Guardar PDF</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="text-neutral-400 hover:text-white p-1 hover:bg-neutral-800 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[350px] overflow-y-auto bg-white text-neutral-900 p-6 rounded-xl space-y-4 shadow-inner" id="print-preview-area">
              <div className="border-b border-neutral-300 pb-3 text-neutral-900">
                <h2 className="text-xl font-bold">{tenant.name}</h2>
                <p className="text-xs text-neutral-600">Reporte de Facturación y Ventas por Clientes</p>
                <p className="text-[10px] text-neutral-500 mt-1">Fecha de Emisión: {new Date().toLocaleDateString()} | Licencia: {tenant.licenseType}</p>
              </div>

              {(() => {
                const completed = bookings.filter(b => b.status === 'Completed');
                const now = new Date();
                let dailyTotal = 0;
                let weeklyTotal = 0;
                let monthlyTotal = 0;
                let yearlyTotal = 0;
                
                completed.forEach(b => {
                  const s = services.find(srv => srv.id === b.serviceId);
                  const price = s ? s.price : 0;
                  const [year, month, day] = b.date.split('-').map(Number);
                  const bDate = new Date(year, month - 1, day);
                  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                  
                  if (b.date === '2026-07-08' || (year === now.getFullYear() && (month - 1) === now.getMonth() && day === now.getDate())) {
                    dailyTotal += price;
                  }
                  
                  const diffTime = Math.abs(today.getTime() - bDate.getTime());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  if (diffDays <= 7 || b.date === '2026-07-08') {
                    weeklyTotal += price;
                  }
                  
                  if (b.date.startsWith('2026-07') || (year === now.getFullYear() && (month - 1) === now.getMonth())) {
                    monthlyTotal += price;
                  }
                  
                  if (b.date.startsWith('2026') || year === now.getFullYear()) {
                    yearlyTotal += price;
                  }
                });

                return (
                  <div className="grid grid-cols-4 gap-2 text-center text-neutral-900">
                    <div className="bg-neutral-50 border border-neutral-200 p-2 rounded">
                      <span className="text-[8px] font-bold text-neutral-500 uppercase block">Hoy</span>
                      <span className="text-xs font-black">${dailyTotal.toFixed(2)}</span>
                    </div>
                    <div className="bg-neutral-50 border border-neutral-200 p-2 rounded">
                      <span className="text-[8px] font-bold text-neutral-500 uppercase block">Semana</span>
                      <span className="text-xs font-black">${weeklyTotal.toFixed(2)}</span>
                    </div>
                    <div className="bg-neutral-50 border border-neutral-200 p-2 rounded">
                      <span className="text-[8px] font-bold text-neutral-500 uppercase block">Mes</span>
                      <span className="text-xs font-black">${monthlyTotal.toFixed(2)}</span>
                    </div>
                    <div className="bg-neutral-50 border border-neutral-200 p-2 rounded">
                      <span className="text-[8px] font-bold text-neutral-500 uppercase block">Año</span>
                      <span className="text-xs font-black">${yearlyTotal.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })()}

              <table className="w-full text-left text-[11px] border-collapse text-neutral-900">
                <thead>
                  <tr className="bg-neutral-100 border-b border-neutral-200 text-neutral-600 font-bold">
                    <th className="p-1.5">Cliente</th>
                    <th className="p-1.5">Servicio</th>
                    <th className="p-1.5 text-right">Precio</th>
                    <th className="p-1.5">Barbero / Concretó</th>
                    <th className="p-1.5">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {bookings.filter(b => b.status === 'Completed').map(b => (
                    <tr key={b.id} className="text-neutral-800">
                      <td className="p-1.5">{b.clientName}</td>
                      <td className="p-1.5">{services.find(s => s.id === b.serviceId)?.name || 'Servicio'}</td>
                      <td className="p-1.5 text-right font-semibold">${services.find(s => s.id === b.serviceId)?.price || 0}.00</td>
                      <td className="p-1.5">{collaborators.find(c => c.id === b.collaboratorId)?.name || 'Especialista'}</td>
                      <td className="p-1.5 font-mono text-[10px]">{b.date} {b.timeSlot}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 border-t border-neutral-800 pt-4 print:hidden">
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-3 py-1.5 text-xs font-bold text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-1.5 bg-amber-500 text-neutral-950 rounded-lg text-xs font-black uppercase tracking-wider hover:bg-amber-400 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                <span>Confirmar e Imprimir / PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print PDF Render Area (Hidden in browser UI, visible ONLY in @media print) */}
      <div className="hidden print:block text-neutral-900 bg-white p-8 font-sans" id="print-report-section">
        <div className="border-b border-neutral-300 pb-4 mb-6">
          <h1 className="text-2xl font-black">{tenant.name}</h1>
          <p className="text-xs text-neutral-600">Reporte de Facturación y Ventas de Clientes</p>
          <p className="text-[10px] text-neutral-500 mt-1">Fecha de Emisión: {new Date().toLocaleDateString()} | Licencia: {tenant.licenseType}</p>
        </div>

        {(() => {
          const completed = bookings.filter(b => b.status === 'Completed');
          const now = new Date();
          let dailyTotal = 0;
          let weeklyTotal = 0;
          let monthlyTotal = 0;
          let yearlyTotal = 0;
          
          completed.forEach(b => {
            const s = services.find(srv => srv.id === b.serviceId);
            const price = s ? s.price : 0;
            const [year, month, day] = b.date.split('-').map(Number);
            const bDate = new Date(year, month - 1, day);
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            if (b.date === '2026-07-08' || (year === now.getFullYear() && (month - 1) === now.getMonth() && day === now.getDate())) {
              dailyTotal += price;
            }
            
            const diffTime = Math.abs(today.getTime() - bDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays <= 7 || b.date === '2026-07-08') {
              weeklyTotal += price;
            }
            
            if (b.date.startsWith('2026-07') || (year === now.getFullYear() && (month - 1) === now.getMonth())) {
              monthlyTotal += price;
            }
            
            if (b.date.startsWith('2026') || year === now.getFullYear()) {
              yearlyTotal += price;
            }
          });

          return (
            <div className="grid grid-cols-4 gap-4 mb-6 text-center">
              <div className="border border-neutral-300 p-3 rounded">
                <span className="text-[10px] font-bold text-neutral-500 uppercase block">Hoy</span>
                <span className="text-sm font-black text-neutral-900">${dailyTotal.toFixed(2)} {tenant.currency || 'ARS'}</span>
              </div>
              <div className="border border-neutral-300 p-3 rounded">
                <span className="text-[10px] font-bold text-neutral-500 uppercase block">Esta Semana</span>
                <span className="text-sm font-black text-neutral-900">${weeklyTotal.toFixed(2)} {tenant.currency || 'ARS'}</span>
              </div>
              <div className="border border-neutral-300 p-3 rounded">
                <span className="text-[10px] font-bold text-neutral-500 uppercase block">Este Mes</span>
                <span className="text-sm font-black text-neutral-900">${monthlyTotal.toFixed(2)} {tenant.currency || 'ARS'}</span>
              </div>
              <div className="border border-neutral-300 p-3 rounded">
                <span className="text-[10px] font-bold text-neutral-500 uppercase block">Este Año</span>
                <span className="text-sm font-black text-neutral-900">${yearlyTotal.toFixed(2)} {tenant.currency || 'ARS'}</span>
              </div>
            </div>
          );
        })()}

        <table className="w-full text-left text-xs border-collapse mt-4">
          <thead>
            <tr className="bg-neutral-100 border-b border-neutral-300 font-bold text-neutral-700">
              <th className="p-2 border border-neutral-300">Cliente</th>
              <th className="p-2 border border-neutral-300">Servicio</th>
              <th className="p-2 border border-neutral-300 text-right">Monto</th>
              <th className="p-2 border border-neutral-300">Barbero Concretó</th>
              <th className="p-2 border border-neutral-300">Fecha y Horario</th>
            </tr>
          </thead>
          <tbody>
            {bookings.filter(b => b.status === 'Completed').map(b => {
              const s = services.find(srv => srv.id === b.serviceId);
              const c = collaborators.find(col => col.id === b.collaboratorId);
              return (
                <tr key={b.id} className="border-b border-neutral-200">
                  <td className="p-2 border border-neutral-300 font-medium">{b.clientName} ({b.clientPhone})</td>
                  <td className="p-2 border border-neutral-300">{s?.name || 'Servicio'}</td>
                  <td className="p-2 border border-neutral-300 text-right font-bold">${s?.price || 0}.00</td>
                  <td className="p-2 border border-neutral-300">{c?.name || 'Especialista'}</td>
                  <td className="p-2 border border-neutral-300 font-mono text-[10px]">{b.date} {b.timeSlot}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
