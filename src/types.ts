export interface Tenant {
  id: string;
  name: string;
  slug: string;
  font: string; // 'sans' | 'serif' | 'mono' | 'grotesk'
  primaryColor: string; // Tailwind color class or hex
  secondaryColor: string; // Tailwind color class or hex
  logoUrl: string;
  licenseType: 'Basic' | 'Premium' | 'Empire';
  licenseExpiry: string;
  status: 'Active' | 'Suspended' | 'Expired';
  phone?: string;
  address?: string;
  shopImageUrl?: string;
  description?: string;
  currency?: string;    // moneda a mostrar (ej: 'ARS', 'USD')
  phonePrefix?: string; // prefijo para WhatsApp (ej: '+54 9')
}

export interface Collaborator {
  id: string;
  tenantId: string;
  name: string;
  role: string;
  email: string;
  avatar: string;
  isAdmin?: boolean;
  scheduleType?: 'general' | 'custom';
  customSlots?: string[];
  username?: string; // para login del barbero (= email)
  password?: string; // clave de acceso del barbero
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number; // in minutes
  category: string;
  description?: string;
}

export interface Booking {
  id: string;
  tenantId: string;
  clientName: string;
  clientPhone: string;
  serviceId: string;
  collaboratorId: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "10:00 AM"
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
}

export interface Testimonial {
  id: string;
  tenantId: string;
  clientName: string;
  comment: string;
  rating: number; // 1 to 5 stars
  date: string;
}

export interface Payment {
  id: string;
  tenantId: string;
  amount: number;
  date: string;
  concept: string;
  status: 'Paid' | 'Pending' | 'Failed';
}

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  date: string;
  read: boolean;
}
