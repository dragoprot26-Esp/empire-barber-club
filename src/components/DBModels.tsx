import { useState } from 'react';
import { Database, Shield, CalendarDays, KeyRound, Workflow, Server } from 'lucide-react';

export default function DBModels() {
  const [activeTab, setActiveTab] = useState<'db' | 'auth' | 'workflow'>('db');

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl text-neutral-100 max-w-5xl mx-auto my-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-800 pb-4 mb-6">
        <div>
          <h2 className="text-xl font-bold font-sans tracking-tight text-amber-500 flex items-center gap-2">
            <Server className="w-5 h-5 text-amber-500" />
            Especificaciones y Arquitectura Técnica (Multi-Inquilino)
          </h2>
          <p className="text-xs text-neutral-400 mt-1 font-mono">
            Modelado de Base de Datos relacional, Autenticación Segura y Flujos de Trabajo.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-neutral-950 p-1 rounded-lg border border-neutral-800 gap-1 self-stretch md:self-auto">
          <button
            onClick={() => setActiveTab('db')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'db'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Base de Datos SQL
          </button>
          <button
            onClick={() => setActiveTab('auth')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'auth'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Autenticación & OTP
          </button>
          <button
            onClick={() => setActiveTab('workflow')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'workflow'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
            Flujo de Turnos
          </button>
        </div>
      </div>

      {/* Tab: DB Model */}
      {activeTab === 'db' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <h3 className="text-sm font-semibold text-neutral-200 font-mono border-b border-neutral-800 pb-2">
                Estrategia Multi-Inquilino
              </h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Utilizamos un enfoque de <strong>Esquema Único con Discriminación por Clave Foránea (`tenant_id`)</strong>. 
                Es el modelo más eficiente y escalable para una PWA SaaS de barberías.
              </p>
              <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400">Tipo de BD recomendada:</span>
                  <span className="text-amber-400 font-mono font-semibold">PostgreSQL</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400">Aislamiento de datos:</span>
                  <span className="text-green-400 font-mono">Row Level Security (RLS)</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400">Licenciamiento:</span>
                  <span className="text-blue-400 font-mono">Por Tenant (Basic/Premium)</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-semibold text-neutral-200 font-mono border-b border-neutral-800 pb-2 flex justify-between items-center">
                <span>Esquema Relacional de PostgreSQL (DDL)</span>
                <span className="text-[10px] bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded">DDL Schema</span>
              </h3>
              <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 text-[11px] font-mono overflow-x-auto max-h-[350px] scrollbar-thin">
                <pre className="text-amber-400">
{`-- 1. TABLA DE TENANTS (INQUILINOS)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  license_type VARCHAR(20) NOT NULL DEFAULT 'Basic', -- Basic, Premium, Empire
  font_preference VARCHAR(30) DEFAULT 'Inter',
  primary_color VARCHAR(30) DEFAULT '#D97706', -- Amber-600
  secondary_color VARCHAR(30) DEFAULT '#171717',
  logo_url TEXT,
  license_expiry TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABLA DE COLABORADORES (BARBEROS)
CREATE TABLE collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(50) DEFAULT 'Barber',
  email VARCHAR(100) NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, email) -- Autenticación aislada por inquilino
);

-- 3. TABLA DE SERVICIOS
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  duration_minutes INT NOT NULL, -- e.g. 30, 45, 60
  category VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABLA DE TURNOS (AGENDAMIENTO)
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  collaborator_id UUID REFERENCES collaborators(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE RESTRICT,
  client_name VARCHAR(100) NOT NULL,
  client_phone VARCHAR(50) NOT NULL,
  booking_date DATE NOT NULL,
  time_slot VARCHAR(20) NOT NULL, -- e.g. '10:00 AM'
  status VARCHAR(20) DEFAULT 'Pending', -- Pending, Confirmed, Completed, Cancelled
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABLA DE TESTIMONIOS (VALORACIONES ESTELARES)
CREATE TABLE testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  client_name VARCHAR(100) NOT NULL,
  comment TEXT NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. HISTORIAL DE PAGOS / LICENCIA
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  concept VARCHAR(150) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Paid'
);`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Auth */}
      {activeTab === 'auth' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-neutral-200 font-mono border-b border-neutral-800 pb-2 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-500" />
                Seguridad de Acceso del Inquilino (PWA)
              </h3>
              <ul className="text-xs text-neutral-300 space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">1.</span>
                  <span>
                    <strong>Autenticación de Dos Factores (OTP por Correo):</strong> Al intentar ingresar al panel administrativo, se simula la generación de un código secreto de un solo uso enviado por correo electrónico. El inquilino debe validarlo para poder ingresar al panel.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">2.</span>
                  <span>
                    <strong>Datos Biométricos (Opcional):</strong> Si el inquilino activa los datos biométricos (FaceID/Huella), se almacena un token local seguro. En los siguientes accesos se evitará ingresar la contraseña u OTP, mejorando la usabilidad diaria en dispositivos móviles.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">3.</span>
                  <span>
                    <strong>Recuperación de Contraseñas:</strong> El mismo sistema de correo simula el envío de un enlace o código OTP temporal para restablecer la contraseña de forma segura sin intervención manual del administrador del sistema.
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-neutral-950 p-5 rounded-lg border border-neutral-800 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-mono">
                Flujo Lógico de Seguridad
              </h4>
              
              {/* Process Flow Diagram */}
              <div className="space-y-2 text-xs font-mono">
                <div className="bg-neutral-900 p-2.5 rounded border border-neutral-800 flex justify-between items-center">
                  <span className="text-amber-500">Ingreso Credenciales</span>
                  <span className="text-neutral-500">Usuario + Contraseña</span>
                </div>
                <div className="text-center text-neutral-600">▼</div>
                <div className="bg-neutral-900 p-2.5 rounded border border-neutral-800 flex justify-between items-center">
                  <span className="text-amber-500">¿Biométricos Activos?</span>
                  <span className="text-green-500">Sí ➜ Bypass OTP / No ➜ Enviar OTP</span>
                </div>
                <div className="text-center text-neutral-600">▼</div>
                <div className="bg-neutral-900 p-2.5 rounded border border-neutral-800 flex justify-between items-center">
                  <span className="text-amber-500">Validar Código OTP</span>
                  <span className="text-blue-500">Código enviado al correo</span>
                </div>
                <div className="text-center text-neutral-600">▼</div>
                <div className="bg-neutral-900 p-2.5 rounded border border-neutral-800 flex justify-between items-center">
                  <span className="text-green-400">Acceso Autorizado</span>
                  <span className="text-neutral-400">Genera sesión JWT (Tenant ID)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Workflow */}
      {activeTab === 'workflow' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <h3 className="text-sm font-semibold text-neutral-200 font-mono border-b border-neutral-800 pb-2 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-amber-500" />
                Flujo de Agendamiento
              </h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                El agendamiento está optimizado para dispositivos móviles con diseño PWA. Permite a los clientes seleccionar servicios, el barbero colaborador, la fecha y hora disponible con una experiencia libre de fricciones.
              </p>
              <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400">Notificaciones:</span>
                  <span className="text-green-400 font-mono">Push instantáneas</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400">Control de Capacidad:</span>
                  <span className="text-amber-400 font-mono">Por Barbero/Horario</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400">Seguimiento:</span>
                  <span className="text-blue-400 font-mono">Historial para Inquilino</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-semibold text-neutral-200 font-mono border-b border-neutral-800 pb-2">
                Puntos de Contacto del Flujo de Gestión de Turnos
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 space-y-2">
                  <h4 className="text-xs font-bold text-amber-400 flex items-center gap-2">
                    <span className="w-5 h-5 bg-amber-500 text-neutral-950 rounded-full flex items-center justify-center font-mono font-bold text-[10px]">1</span>
                    Selección del Servicio
                  </h4>
                  <p className="text-[11px] text-neutral-300">
                    El cliente despliega el menú lateral o superior de servicios clasificados por categorías (Corte, Barba, Tratamientos, Packs Estilo NY) con precios y duraciones claras.
                  </p>
                </div>

                <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 space-y-2">
                  <h4 className="text-xs font-bold text-amber-400 flex items-center gap-2">
                    <span className="w-5 h-5 bg-amber-500 text-neutral-950 rounded-full flex items-center justify-center font-mono font-bold text-[10px]">2</span>
                    Selección del Barbero
                  </h4>
                  <p className="text-[11px] text-neutral-300">
                    Visualiza colaboradores disponibles que el inquilino ha configurado en su panel de control. Cada barbero cuenta con avatar e historial.
                  </p>
                </div>

                <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 space-y-2">
                  <h4 className="text-xs font-bold text-amber-400 flex items-center gap-2">
                    <span className="w-5 h-5 bg-amber-500 text-neutral-950 rounded-full flex items-center justify-center font-mono font-bold text-[10px]">3</span>
                    Calendario de Fechas y Horas
                  </h4>
                  <p className="text-[11px] text-neutral-300">
                    Navegación fluida por fechas. Se bloquean automáticamente las horas ya agendadas o fuera del horario comercial definido.
                  </p>
                </div>

                <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 space-y-2">
                  <h4 className="text-xs font-bold text-amber-400 flex items-center gap-2">
                    <span className="w-5 h-5 bg-amber-500 text-neutral-950 rounded-full flex items-center justify-center font-mono font-bold text-[10px]">4</span>
                    Confirmación y Notificación
                  </h4>
                  <p className="text-[11px] text-neutral-300">
                    Al confirmar el turno, el inquilino recibe una notificación Push en tiempo real y el cliente visualiza su estado "Confirmado" en pantalla con persistencia local.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
