import { useState, useEffect, FormEvent } from 'react';
import { 
  Calendar, Clock, Check, Share2, Star, MessageSquare, ChevronDown, 
  Instagram, Facebook, Twitter, Phone, Send, Scissors, Award, Compass,
  Search, FileText, X, AlertCircle
} from 'lucide-react';
import { Tenant, Collaborator, Service, Booking, Testimonial } from '../types';

interface PublicPageProps {
  tenant: Tenant;
  collaborators: Collaborator[];
  services: Service[];
  bookings: Booking[];
  setBookings: (b: Booking[]) => void;
  testimonials: Testimonial[];
  setTestimonials: (t: Testimonial[]) => void;
  onAddNotification: (title: string, body: string) => void;
  shopImagePath: string;
  generalTimeSlots?: string[];
  publicMode?: boolean;
  licenseCode?: string;
  onBook?: (b: Booking) => Promise<boolean>;
  onTestimonial?: (t: Testimonial) => Promise<boolean>;
}

export default function PublicPage({
  tenant,
  collaborators,
  services,
  bookings,
  setBookings,
  testimonials,
  setTestimonials,
  onAddNotification,
  shopImagePath,
  generalTimeSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'],
  publicMode = false,
  onBook,
  onTestimonial
}: PublicPageProps) {
  // Booking Form states
  const [selectedServiceId, setSelectedServiceId] = useState<string>(services[0]?.id || '');
  const [selectedCollabId, setSelectedCollabId] = useState<string>(collaborators[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState<string>('2026-07-09'); // Default to tomorrow
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('11:00 AM');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // Ticket editing / modification states
  const [isEditingTicket, setIsEditingTicket] = useState(false);
  const [editCollabId, setEditCollabId] = useState('');
  const [editServiceId, setEditServiceId] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTimeSlot, setEditTimeSlot] = useState('');

  // Keep selectedTimeSlot in sync when selected collaborator changes
  useEffect(() => {
    const col = collaborators.find(c => c.id === selectedCollabId);
    const slots = col?.scheduleType === 'custom' && col.customSlots && col.customSlots.length > 0
      ? col.customSlots
      : generalTimeSlots;
    if (slots.length > 0 && !slots.includes(selectedTimeSlot)) {
      setSelectedTimeSlot(slots[0]);
    }
  }, [selectedCollabId, selectedTimeSlot]);

  // Keep editTimeSlot in sync when editCollabId changes during ticket editing
  useEffect(() => {
    if (isEditingTicket && editCollabId) {
      const col = collaborators.find(c => c.id === editCollabId);
      const slots = col?.scheduleType === 'custom' && col.customSlots && col.customSlots.length > 0
        ? col.customSlots
        : generalTimeSlots;
      if (slots.length > 0 && !slots.includes(editTimeSlot)) {
        setEditTimeSlot(slots[0]);
      }
    }
  }, [isEditingTicket, editCollabId, editTimeSlot]);
  
  // Testimonials and Reviews States
  const [showReviews, setShowReviews] = useState(false);
  const [newReview, setNewReview] = useState({ name: '', comment: '', rating: 5 });
  const [isBookingSuccess, setIsBookingSuccess] = useState(false);

  // Turnos search/lookup and client ticket states
  const [publicTab, setPublicTab] = useState<'reservar' | 'consultar'>('reservar');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchedBookings, setSearchedBookings] = useState<Booking[] | null>(null);
  const [searchClicked, setSearchClicked] = useState(false);
  const [selectedClientBookingTicket, setSelectedClientBookingTicket] = useState<Booking | null>(null);

  const handleSearchBookings = () => {
    const query = searchPhone.trim().toLowerCase();
    if (!query) {
      alert('Por favor introduzca un término de búsqueda (teléfono, nombre o código de reserva).');
      return;
    }
    const filtered = bookings.filter(b => {
      const bPhone = b.clientPhone.replace(/\D/g, '');
      const sPhone = query.replace(/\D/g, '');
      
      const cleanId = b.id.toLowerCase();
      const searchWithHash = query.startsWith('#') ? query.slice(1) : query;
      
      // Look up matches via phone check, name check, or booking ID check
      return b.clientPhone.includes(query) || 
             b.clientName.toLowerCase().includes(query) ||
             cleanId === query ||
             cleanId === searchWithHash ||
             cleanId.includes(query) ||
             (sPhone.length > 0 && bPhone.endsWith(sPhone));
    });
    setSearchedBookings(filtered);
    setSearchClicked(true);
  };

  const handleSaveModifiedBooking = () => {
    if (!selectedClientBookingTicket) return;
    
    const updatedBookings = bookings.map(b => {
      if (b.id === selectedClientBookingTicket.id) {
        return {
          ...b,
          collaboratorId: editCollabId,
          serviceId: editServiceId,
          date: editDate,
          timeSlot: editTimeSlot,
        };
      }
      return b;
    });
    
    setBookings(updatedBookings);
    
    const updatedTicket = {
      ...selectedClientBookingTicket,
      collaboratorId: editCollabId,
      serviceId: editServiceId,
      date: editDate,
      timeSlot: editTimeSlot,
    };
    
    setSelectedClientBookingTicket(updatedTicket);
    
    // Also update searched list so it stays in sync
    setSearchedBookings(prev => 
      prev ? prev.map(b => b.id === selectedClientBookingTicket.id ? updatedTicket : b) : null
    );
    
    onAddNotification(
      'Turno Modificado 📝',
      `El cliente ${selectedClientBookingTicket.clientName} ha modificado su turno al día ${editDate} a las ${editTimeSlot}.`
    );
    
    setIsEditingTicket(false);
    alert('Su turno ha sido modificado exitosamente.');
  };

  const handleCancelClientBooking = (booking: Booking) => {
    const confirmCancel = window.confirm(`¿Está seguro de que desea cancelar su turno para el día ${booking.date} a las ${booking.timeSlot}?`);
    if (!confirmCancel) return;

    const updated = bookings.map(b => b.id === booking.id ? { ...b, status: 'Cancelled' as const } : b);
    setBookings(updated);

    onAddNotification(
      'Turno Cancelado por Cliente ⚠️',
      `El cliente ${booking.clientName} ha cancelado su turno del ${booking.date} a las ${booking.timeSlot}.`
    );

    // Update locally too
    setSearchedBookings(prev => prev ? prev.map(b => b.id === booking.id ? { ...b, status: 'Cancelled' as const } : b) : null);
    alert('Su turno ha sido cancelado exitosamente.');
  };

  // Gallery of completed works (Galeria de trabajos realizados)
  const [galleryWorks, setGalleryWorks] = useState([
    {
      id: 1,
      title: 'NYC High Fade & Texturizado',
      image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&auto=format&fit=crop&q=80',
      likes: 42,
      barber: 'Tony R.'
    },
    {
      id: 2,
      title: 'Afeitado Clásico Imperial con Navaja',
      image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=500&auto=format&fit=crop&q=80',
      likes: 38,
      barber: 'Salvatore B.'
    },
    {
      id: 3,
      title: 'Corte Ejecutivo Pompadour',
      image: 'https://images.unsplash.com/photo-1593702275687-f8b402bf1fb5?w=500&auto=format&fit=crop&q=80',
      likes: 56,
      barber: 'Vito C.'
    },
    {
      id: 4,
      title: 'Perfilado de Barba Estilo Bronx',
      image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=500&auto=format&fit=crop&q=80',
      likes: 31,
      barber: 'Tony R.'
    }
  ]);

  // Social sharing helper
  const handleShare = (workTitle: string) => {
    const shareText = `¡Mira este increíble estilo de barbería en ${tenant.name}! "${workTitle}". Visítanos y reserva tu turno.`;
    const shareUrl = window.location.href;
    
    // Check if web share API is available
    if (navigator.share) {
      navigator.share({
        title: tenant.name,
        text: shareText,
        url: shareUrl,
      }).catch(err => console.log('Share error', err));
    } else {
      // Fallback popup simulation
      alert(`[COMPARTIR EN REDES]\nTexto: "${shareText}"\nEnlace: ${shareUrl}\n\n¡Enlace de compartir copiado al portapapeles con éxito! Potenciando la presencia digital de ${tenant.name} en tu comunidad.`);
    }
  };

  // Select dynamic classes based on tenant settings
  const getFontClass = () => {
    switch (tenant.font) {
      case 'serif': return 'font-serif';
      case 'mono': return 'font-mono';
      case 'grotesk': return 'font-sans tracking-tight';
      default: return 'font-sans';
    }
  };

  // Convert custom hex primary colors to safety style variables
  const primaryColor = tenant.primaryColor;

  const currentService = services.find(s => s.id === selectedServiceId) || services[0];
  const currentCollab = collaborators.find(c => c.id === selectedCollabId) || collaborators[0];

  // Time Slots list based on selected collaborator's schedule
  const availableSlots = currentCollab?.scheduleType === 'custom' && currentCollab.customSlots && currentCollab.customSlots.length > 0
    ? currentCollab.customSlots
    : generalTimeSlots;

  // Submit booking
  const handleBookingSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientPhone) {
      alert('Por favor complete su nombre y teléfono para agendar.');
      return;
    }

    const newBooking: Booking = {
      id: Math.random().toString(36).substring(7),
      tenantId: tenant.id,
      clientName,
      clientPhone,
      serviceId: selectedServiceId,
      collaboratorId: selectedCollabId,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      status: 'Confirmed'
    };

    if (onBook) {
      const ok = await onBook(newBooking);
      if (!ok) { alert('No se pudo registrar la reserva. Revisá tu conexión e intentá de nuevo.'); return; }
    } else {
      setBookings([newBooking, ...bookings]);
    }

    // Add real-time push notification for tenant admin
    onAddNotification(
      'Nueva Reserva de Turno',
      `¡Excelente! ${clientName} reservó un turno con ${currentCollab.name} para ${currentService.name} el ${selectedDate} a las ${selectedTimeSlot}.`
    );

    setIsBookingSuccess(true);
    setSelectedClientBookingTicket(newBooking);
    setTimeout(() => {
      setIsBookingSuccess(false);
      setClientName('');
      setClientPhone('');
    }, 5000);
  };

  // Post testimonial
  const handleReviewSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newReview.name || !newReview.comment) return;

    const testimonial: Testimonial = {
      id: Math.random().toString(36).substring(7),
      tenantId: tenant.id,
      clientName: newReview.name,
      comment: newReview.comment,
      rating: newReview.rating,
      date: 'Hoy'
    };

    if (onTestimonial) {
      const ok = await onTestimonial(testimonial);
      if (!ok) { alert('No se pudo enviar tu reseña. Intentá de nuevo.'); return; }
    } else {
      setTestimonials([testimonial, ...testimonials]);
    }
    onAddNotification('Nueva Reseña de Cliente', `★${newReview.rating} de ${newReview.name}: "${newReview.comment}"`);
    setNewReview({ name: '', comment: '', rating: 5 });
  };

  return (
    <div className={`text-neutral-100 pb-16 ${getFontClass()}`}>
      
      {/* 1. Shop Image in the Middle Top */}
      <div className="relative max-w-5xl mx-auto rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl mb-12">
        <div className="h-[280px] md:h-[400px] w-full relative">
          <img
            src={tenant.shopImageUrl || shopImagePath}
            alt={`Interior de ${tenant.name}`}
            className="w-full h-full object-cover brightness-[0.7] contrast-[1.05]"
            referrerPolicy="no-referrer"
          />
          {/* NYC Dark Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
          
          <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-widest text-amber-500 font-bold bg-neutral-950/70 border border-amber-500/30 px-2.5 py-1 rounded">
                Estilo Tradicional Nueva York
              </span>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white uppercase drop-shadow-lg mt-2">
                {tenant.name}
              </h1>
              <p className="text-xs md:text-sm text-neutral-300 max-w-xl font-medium drop-shadow">
                {tenant.description || 'Un rincón exclusivo inspirado en el Soho neoyorquino. Cortes perfectos, toallas calientes y café artesanal.'}
              </p>
              {tenant.phone && (
                <p className="text-xs text-neutral-400 font-mono flex items-center gap-1.5 mt-1">
                  <Phone className="w-3.5 h-3.5 text-amber-500" />
                  <span>Tel: {tenant.phone}</span>
                </p>
              )}
            </div>
            
            <div className="flex gap-4 text-xs font-mono text-neutral-400">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tenant.address || '45th Ave, Queens NYC')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-neutral-950/80 hover:bg-neutral-900 text-neutral-100 hover:text-amber-500 px-3.5 py-2 rounded-xl border border-neutral-800 hover:border-amber-500 transition-all cursor-pointer shadow-lg group"
                title="Ver ubicación en Google Maps"
              >
                <Compass className="w-4 h-4 text-amber-500 group-hover:animate-spin" />
                <span className="font-bold underline decoration-amber-500/30 group-hover:decoration-amber-500">{tenant.address || '45th Ave, Queens NYC'}</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Selector for Public Page: Reservar vs Consultar */}
      <div className="max-w-5xl mx-auto flex bg-neutral-950 p-1.5 rounded-2xl border border-neutral-850 gap-2 mb-8">
        <button
          type="button"
          onClick={() => setPublicTab('reservar')}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            publicTab === 'reservar'
              ? 'bg-amber-500 text-neutral-950 font-black shadow-lg'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Agendar Nuevo Turno</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setPublicTab('consultar');
            setSearchClicked(false);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            publicTab === 'consultar'
              ? 'bg-amber-500 text-neutral-950 font-black shadow-lg'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Compass className="w-4 h-4 font-bold" />
          <span>Consultar / Mis Turnos</span>
        </button>
      </div>

      {publicTab === 'consultar' ? (
        <div className="max-w-xl mx-auto bg-neutral-950 border border-neutral-800 rounded-2xl p-6 space-y-6 mb-16 animate-fade-in">
          <div className="border-b border-neutral-800 pb-4 text-center">
            <h2 className="text-lg font-bold text-white uppercase tracking-tight flex items-center justify-center gap-2">
              <Compass className="w-5 h-5 text-amber-500" />
              Consulta de Turnos Agendados
            </h2>
            <p className="text-xs text-neutral-400 mt-1">Introduce tu número de teléfono, nombre o código de reserva para listar tus citas agendadas, modificar tus turnos o descargar tu comprobante.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold uppercase text-neutral-400">Buscar por Nombre, Teléfono o Código</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchPhone}
                  onChange={e => setSearchPhone(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSearchBookings(); }}
                  placeholder="Ej. +1 555-987-6543, Al Pacino o #33TGQ8"
                  className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={handleSearchBookings}
                  className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-6 py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Search className="w-4 h-4" />
                  <span>Buscar</span>
                </button>
              </div>
            </div>

            {searchClicked && (
              <div className="space-y-4 pt-4 border-t border-neutral-800">
                <h3 className="text-xs font-mono font-bold text-amber-500 uppercase">Citas encontradas</h3>
                {searchedBookings && searchedBookings.length > 0 ? (
                  <div className="space-y-4">
                    {searchedBookings.map(b => {
                      const service = services.find(s => s.id === b.serviceId);
                      const barber = collaborators.find(c => c.id === b.collaboratorId);
                      return (
                        <div key={b.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3 hover:border-neutral-700 transition-all">
                          <div className="flex justify-between items-start flex-wrap gap-2">
                            <div>
                              <h4 className="text-xs font-bold text-white uppercase">{b.clientName}</h4>
                              <p className="text-[10px] text-neutral-500 font-mono mt-0.5">ID: {b.id.toUpperCase()}</p>
                            </div>
                            
                            {/* Badges */}
                            {b.status === 'Completed' && (
                              <span className="bg-green-950/80 text-green-300 border border-green-800 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider">
                                Atendido
                              </span>
                            )}
                            {b.status === 'Cancelled' && (
                              <span className="bg-red-950/80 text-red-300 border border-red-800 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider">
                                Cancelado
                              </span>
                            )}
                            {(b.status === 'Confirmed' || b.status === 'Pending') && (
                              <span className="bg-amber-950/80 text-amber-300 border border-amber-800 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider animate-pulse">
                                Confirmado
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-[11px] text-neutral-300 pt-3 border-t border-neutral-800/50">
                            <div>
                              <span className="text-[9px] text-neutral-500 block uppercase font-mono">Servicio</span>
                              <span className="font-semibold text-white">{service?.name || 'Corte Imperial'}</span>
                              <span className="text-[10px] text-amber-500 font-mono block font-bold">${service?.price || 30}.00 USD</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-neutral-500 block uppercase font-mono">Barbero</span>
                              <span className="font-semibold text-white">{barber?.name || 'Colaborador'}</span>
                              <span className="text-[9px] text-amber-500/80 block">{barber?.role || 'Estilista'}</span>
                            </div>
                            <div className="col-span-2 pt-1">
                              <span className="text-[9px] text-neutral-500 block uppercase font-mono font-bold">Fecha y Hora</span>
                              <span className="text-white font-semibold">{b.date} a las {b.timeSlot}</span>
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-3 border-t border-neutral-800/50 flex-wrap">
                            <button
                              type="button"
                              onClick={() => setSelectedClientBookingTicket(b)}
                              className="bg-neutral-950 hover:bg-neutral-850 text-neutral-200 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-bold border border-neutral-800 hover:border-amber-500/30 transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <FileText className="w-3.5 h-3.5 text-amber-500" />
                              <span>Ver Ticket Digital</span>
                            </button>

                            {b.status !== 'Completed' && b.status !== 'Cancelled' && (
                              <button
                                type="button"
                                onClick={() => handleCancelClientBooking(b)}
                                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-red-500/20 hover:border-red-500/40 transition-all cursor-pointer flex items-center gap-1"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Cancelar Turno</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-neutral-900/50 border border-neutral-800 rounded-xl space-y-2">
                    <AlertCircle className="w-8 h-8 text-neutral-600 mx-auto" />
                    <p className="text-xs text-neutral-300 font-bold">Sin turnos registrados</p>
                    <p className="text-[11px] text-neutral-500 px-4">No encontramos citas activas para "{searchPhone}". Verifica el número de teléfono o realiza una nueva reserva.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* 2. Main Page Grid: Services (Right) & Booking + Calendar (Left) */
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16 animate-fade-in">
          
          {/* Left Column: Calendar & Booking Info (7 cols) */}
          <div className="lg:col-span-7 bg-neutral-950 border border-neutral-800 rounded-2xl p-6 space-y-6">
            <div className="border-b border-neutral-800 pb-4">
              <h2 className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2">
                <Calendar className="w-5 h-5" style={{ color: primaryColor }} />
                1. Selecciona Fecha & Barbero
              </h2>
              <p className="text-xs text-neutral-400">Escoge el día de tu reserva y tu estilista preferido.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Barbero Picker */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold uppercase text-neutral-400">Colaborador / Barbero</label>
                <div className="grid grid-cols-1 gap-2">
                  {collaborators.map(c => {
                    const isSelected = selectedCollabId === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCollabId(c.id)}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-neutral-900 border-amber-500 shadow-md' 
                            : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <img
                          src={c.avatar}
                          alt={c.name}
                          className="w-10 h-10 rounded-full object-cover border border-amber-500/20"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-white">{c.name}</h4>
                          <p className="text-[10px] text-amber-500 font-medium">{c.role}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date Calendar Simulation */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold uppercase text-neutral-400">Fecha del Turno</label>
                <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 text-center space-y-4">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    min="2026-07-08"
                    max="2026-07-20"
                    className="bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg px-3 py-2 w-full focus:outline-none focus:border-amber-500"
                  />
                  <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono">
                    <span className="text-neutral-500">Mie 8</span>
                    <span className="text-amber-500 font-bold">Jue 9 (Mañ)</span>
                    <span className="text-neutral-300">Vie 10</span>
                  </div>
                  <p className="text-[10px] text-neutral-400">Abierto todos los días de 9:00 AM a 8:00 PM</p>
                </div>
              </div>
            </div>

            {/* Time Picker */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold uppercase text-neutral-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                2. Horario Disponible
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {availableSlots.map(slot => {
                  const isSelected = selectedTimeSlot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedTimeSlot(slot)}
                      className={`p-2 rounded-lg text-xs font-semibold text-center border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 text-neutral-950 font-bold border-amber-500 shadow-md'
                          : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-neutral-800'
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Services & Client Confirm (5 cols) */}
          <div className="lg:col-span-5 bg-neutral-950 border border-neutral-800 rounded-2xl p-6 space-y-6">
            <div className="border-b border-neutral-800 pb-4">
              <h2 className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2">
                <Scissors className="w-5 h-5" style={{ color: primaryColor }} />
                Menú de Servicios
              </h2>
              <p className="text-xs text-neutral-400">Despliega el menú o escoge tu tratamiento clásico.</p>
            </div>

            {/* Service Dropdown Selector (Required "menu desplegable de servicios a la derecha") */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold uppercase text-neutral-400 block">Elegir Servicio Especializado</label>
              <div className="relative">
                <select
                  value={selectedServiceId}
                  onChange={e => setSelectedServiceId(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3.5 text-xs text-white appearance-none focus:outline-none focus:border-amber-500 font-semibold cursor-pointer"
                >
                  {services.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} — ${s.price} ({s.duration} min)
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-4 text-amber-500 pointer-events-none">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Selected Service Detail Box */}
            {currentService && (
              <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-white">{currentService.name}</span>
                  <span className="text-xs font-mono font-bold text-amber-500">${currentService.price} USD</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Categoría: <span className="text-neutral-300 font-medium">{currentService.category}</span> | Duración estimada: {currentService.duration} minutos. Incluye lavado y productos premium estilo neoyorquino.
                </p>
              </div>
            )}

            {/* Client Details Form */}
            <form onSubmit={handleBookingSubmit} className="space-y-4 pt-4 border-t border-neutral-800">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-neutral-300">Su Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  placeholder="Ej. Al Pacino"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-neutral-300">Número de Teléfono</label>
                <input
                  type="tel"
                  required
                  value={clientPhone}
                  onChange={e => setClientPhone(e.target.value)}
                  placeholder="Ej. +1 555-987-6543"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Submit Reservation button */}
              <button
                type="submit"
                className="w-full font-bold px-4 py-3 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer text-neutral-950"
                style={{ backgroundColor: primaryColor }}
              >
                Confirmar Turno en {tenant.name}
              </button>

              {isBookingSuccess && (
                <div className="bg-green-950/50 border border-green-800 text-green-300 p-3 rounded-lg text-center text-xs animate-slide-up flex items-center justify-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>¡Turno Confirmado con éxito! Se despachó la alerta al panel de la barbería.</span>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* 3. GALERIA DE TRABAJOS REALIZADOS & BOTON COMPARTIR */}
      <div className="max-w-5xl mx-auto space-y-6 mb-16">
        <div className="border-b border-neutral-800 pb-4">
          <h2 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            Galería de Estilos Manhattan
          </h2>
          <p className="text-xs text-neutral-400">
            Nuestros últimos trabajos realizados en vivo. Dale click a compartir para potenciar nuestra presencia digital en la comunidad.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {galleryWorks.map(work => (
            <div key={work.id} className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden group hover:border-neutral-700 transition-all flex flex-col justify-between">
              <div className="h-56 relative overflow-hidden">
                <img
                  src={work.image}
                  alt={work.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-end p-4">
                  <span className="text-[10px] text-amber-400 font-mono">Por {work.barber}</span>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <h4 className="text-xs font-bold text-white leading-snug line-clamp-2">{work.title}</h4>
                <div className="flex justify-between items-center pt-2 border-t border-neutral-900">
                  <span className="text-[10px] text-neutral-400 font-mono">Realizado</span>
                  <button
                    onClick={() => handleShare(work.title)}
                    className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-amber-500 border border-neutral-800 px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                    title="Compartir en redes sociales"
                  >
                    <Share2 className="w-3 h-3" />
                    <span>Compartir</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. CLIENT TESTIMONIALS (¿Qué dicen de nosotros? / De nuestros clientes) */}
      <div className="max-w-5xl mx-auto bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-800 pb-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-500" />
              ¿Qué Dicen de Nosotros?
            </h2>
            <p className="text-xs text-neutral-400">Nuestros clientes avalan la excelencia de nuestro servicio al estilo Nueva York.</p>
          </div>

          {/* "De nuestros clientes" Button that deploys testimonials list */}
          <button
            onClick={() => setShowReviews(!showReviews)}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-amber-500 font-bold border border-neutral-800 px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            <span>De nuestros clientes</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showReviews ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Testimonials deployed section */}
        {showReviews && (
          <div className="space-y-8 animate-fade-in">
            {/* Grid of Reviews */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map(item => (
                <div key={item.id} className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 space-y-3 relative">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white">{item.clientName}</span>
                    <span className="text-[10px] text-neutral-500 font-mono">{item.date}</span>
                  </div>
                  
                  {/* Stellar ratings */}
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < item.rating ? 'fill-amber-500 text-amber-500' : 'text-neutral-700'}`}
                      />
                    ))}
                  </div>

                  <p className="text-[11px] text-neutral-300 italic leading-relaxed">
                    "{item.comment}"
                  </p>
                </div>
              ))}
            </div>

            {/* Interactive review poster */}
            <div className="bg-neutral-900 p-5 rounded-xl border border-neutral-800 max-w-xl">
              <h3 className="text-xs font-mono font-bold uppercase text-amber-500 mb-4 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5" />
                Déjanos tu Valoración Estelar
              </h3>
              
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400">Su Nombre</label>
                    <input
                      type="text"
                      required
                      value={newReview.name}
                      onChange={e => setNewReview({ ...newReview, name: e.target.value })}
                      placeholder="Frank Sinatra"
                      className="w-full bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400">Valoración (Estrellas)</label>
                    <div className="flex gap-1.5 py-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewReview({ ...newReview, rating: star })}
                          className="hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`w-5 h-5 ${star <= newReview.rating ? 'fill-amber-500 text-amber-500' : 'text-neutral-700'}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400">Comentario</label>
                  <textarea
                    required
                    rows={2}
                    value={newReview.comment}
                    onChange={e => setNewReview({ ...newReview, comment: e.target.value })}
                    placeholder="Excelente servicio, el afeitado con navaja es fenomenal. Totalmente recomendado..."
                    className="w-full bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-4 py-2 rounded-lg text-xs"
                >
                  Enviar Comentario
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* 5. TICKET DIGITAL DE RESERVA MODAL */}
      {selectedClientBookingTicket && (() => {
        const tService = services.find(s => s.id === selectedClientBookingTicket.serviceId);
        const tCollab = collaborators.find(c => c.id === selectedClientBookingTicket.collaboratorId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/80 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative space-y-4 overflow-hidden">
              
              {/* Retro barber receipt texture accent */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-neutral-100 to-amber-500" />
              
              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  setSelectedClientBookingTicket(null);
                  setIsEditingTicket(false);
                }}
                className="absolute top-4 right-4 text-neutral-400 hover:text-white bg-neutral-950 p-1.5 rounded-full border border-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {isEditingTicket ? (
                <div className="space-y-4 pt-2 animate-fade-in">
                  <div className="text-center space-y-1">
                    <Scissors className="w-8 h-8 text-amber-500 mx-auto animate-spin" style={{ animationDuration: '3s' }} />
                    <h3 className="text-sm font-mono tracking-widest uppercase text-amber-500 font-bold">Modificar Tu Turno</h3>
                    <p className="text-[10px] text-neutral-400">Selecciona los nuevos detalles de tu cita</p>
                  </div>

                  <div className="border-t border-dashed border-neutral-800 my-2" />

                  <div className="space-y-3 text-xs">
                    {/* Barbero */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-neutral-400 font-bold block">Barbero / Estilista</label>
                      <select
                        value={editCollabId}
                        onChange={e => setEditCollabId(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer font-semibold"
                      >
                        {collaborators.map(c => (
                          <option key={c.id} value={c.id}>{c.name} — {c.role}</option>
                        ))}
                      </select>
                    </div>

                    {/* Servicio */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-neutral-400 font-bold block">Servicio Especializado</label>
                      <select
                        value={editServiceId}
                        onChange={e => setEditServiceId(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer font-semibold"
                      >
                        {services.map(s => (
                          <option key={s.id} value={s.id}>{s.name} — ${s.price} USD</option>
                        ))}
                      </select>
                    </div>

                    {/* Fecha */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-neutral-400 font-bold block">Fecha de la Cita</label>
                      <input
                        type="date"
                        value={editDate}
                        onChange={e => setEditDate(e.target.value)}
                        min="2026-07-08"
                        max="2026-07-20"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer font-semibold"
                      />
                    </div>

                    {/* Horario */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-neutral-400 font-bold block">Horario de Reserva</label>
                      <select
                        value={editTimeSlot}
                        onChange={e => setEditTimeSlot(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer font-semibold"
                      >
                        {(() => {
                          const tempCollab = collaborators.find(c => c.id === editCollabId);
                          const tempSlots = tempCollab?.scheduleType === 'custom' && tempCollab.customSlots && tempCollab.customSlots.length > 0
                            ? tempCollab.customSlots
                            : generalTimeSlots;
                          return tempSlots.map(slot => (
                            <option key={slot} value={slot}>{slot}</option>
                          ));
                        })()}
                      </select>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-neutral-800 my-4" />

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingTicket(false)}
                      className="bg-neutral-950 hover:bg-neutral-850 text-neutral-400 border border-neutral-800 py-2.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer text-center block"
                    >
                      Atrás
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveModifiedBooking}
                      className="bg-amber-500 hover:bg-amber-400 text-neutral-950 py-2.5 rounded-xl text-[11px] font-black transition-all cursor-pointer text-center block"
                    >
                      Guardar Cambios
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-center space-y-1 pt-2">
                    <Scissors className="w-8 h-8 text-amber-500 mx-auto animate-bounce" />
                    <h3 className="text-sm font-mono tracking-widest uppercase text-amber-500 font-bold">Comprobante de Reserva</h3>
                    <h4 className="text-base font-extrabold text-white uppercase">{tenant.name}</h4>
                    <p className="text-[10px] text-neutral-400 font-mono">{tenant.address || 'Queens, NYC'}</p>
                    
                    {/* Enlarged Code Block */}
                    <div 
                      onClick={() => {
                        navigator.clipboard.writeText(selectedClientBookingTicket.id.toUpperCase());
                        alert('¡Código de Reserva copiado!');
                      }}
                      className="mt-2 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 px-4 inline-block w-full text-center shadow-inner cursor-pointer transition-colors"
                      title="Haz clic para copiar"
                    >
                      <span className="text-[9px] text-neutral-400 font-mono block uppercase tracking-wider">CÓDIGO DE RESERVA (Copia)</span>
                      <span className="text-2xl font-black text-amber-500 font-mono tracking-widest block">
                        #{selectedClientBookingTicket.id.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-400 px-1 mt-2">
                      Usa este código en la pestaña <span className="text-amber-500 font-bold">Consultar / Mis Turnos</span> para buscar o modificar tus citas.
                    </p>
                  </div>

                  {/* Physical style receipt cut line */}
                  <div className="border-t border-dashed border-neutral-800 my-4" />

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-400 font-mono">CLIENTE:</span>
                      <span className="font-bold text-white uppercase">{selectedClientBookingTicket.clientName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-400 font-mono">TELÉFONO:</span>
                      <span className="font-mono text-neutral-300">{selectedClientBookingTicket.clientPhone}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-400 font-mono">BARBERO:</span>
                      <span className="font-bold text-amber-500 uppercase">{tCollab?.name || 'Colaborador'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-400 font-mono">FECHA:</span>
                      <span className="font-bold text-white">{selectedClientBookingTicket.date}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-400 font-mono">HORARIO:</span>
                      <span className="font-bold text-amber-500">{selectedClientBookingTicket.timeSlot}</span>
                    </div>
                    
                    <div className="border-t border-neutral-800 pt-2 flex justify-between items-start">
                      <div>
                        <span className="text-[10px] text-neutral-500 block uppercase font-mono">SERVICIO</span>
                        <span className="font-semibold text-neutral-200">{tService?.name || 'Corte & Estilo'}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-neutral-500 block uppercase font-mono">TOTAL</span>
                        <span className="font-mono font-bold text-white text-sm">${tService?.price || 30}.00 USD</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
                      <span className="text-[10px] text-neutral-400 font-mono uppercase">ESTADO DE RESERVA</span>
                      {selectedClientBookingTicket.status === 'Completed' ? (
                        <span className="bg-green-950 text-green-300 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Atendido</span>
                      ) : selectedClientBookingTicket.status === 'Cancelled' ? (
                        <span className="bg-red-950 text-red-300 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Cancelado</span>
                      ) : (
                        <span className="bg-amber-950 text-amber-300 text-[10px] px-2 py-0.5 rounded font-bold uppercase animate-pulse">Confirmado</span>
                      )}
                    </div>
                  </div>

                  <p className="text-[9px] text-center text-neutral-500 italic font-mono">
                    ¡Gracias por elegir {tenant.name}! Presenta este ticket al llegar.
                  </p>

                  {/* Utility actions inside ticket */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const printSection = document.createElement('div');
                        printSection.innerHTML = `
                          <div style="font-family: monospace; padding: 40px; color: black; background: white; text-align: center; max-width: 300px; margin: auto; border: 1px solid #ccc;">
                            <h2>${tenant.name}</h2>
                            <p>${tenant.address || 'NYC'}</p>
                            <p>ID: #${selectedClientBookingTicket.id.toUpperCase()}</p>
                            <hr style="border-top: 1px dashed black;"/>
                            <p>Cliente: ${selectedClientBookingTicket.clientName}</p>
                            <p>Barbero: ${tCollab?.name || ''}</p>
                            <p>Fecha: ${selectedClientBookingTicket.date}</p>
                            <p>Hora: ${selectedClientBookingTicket.timeSlot}</p>
                            <p>Servicio: ${tService?.name || ''}</p>
                            <h3>TOTAL: $${tService?.price || 30}.00 USD</h3>
                            <hr style="border-top: 1px dashed black;"/>
                            <p>¡Gracias por su preferencia!</p>
                          </div>
                        `;
                        const win = window.open('', '_blank');
                        if (win) {
                          win.document.write(printSection.innerHTML);
                          win.document.close();
                          win.print();
                        }
                      }}
                      className="bg-neutral-950 hover:bg-neutral-800 text-amber-500 border border-neutral-800 hover:border-amber-500/30 py-2.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer text-center block"
                    >
                      Imprimir Ticket
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditCollabId(selectedClientBookingTicket.collaboratorId);
                        setEditServiceId(selectedClientBookingTicket.serviceId);
                        setEditDate(selectedClientBookingTicket.date);
                        setEditTimeSlot(selectedClientBookingTicket.timeSlot);
                        setIsEditingTicket(true);
                      }}
                      className="bg-amber-500 hover:bg-amber-400 text-neutral-950 py-2.5 rounded-xl text-[11px] font-black transition-all cursor-pointer text-center block"
                    >
                      Modificar Turno
                    </button>
                  </div>

                  {/* Share via WhatsApp option */}
                  <button
                    type="button"
                    onClick={() => {
                      const messageText = `Hola! Reservé mi turno en ${tenant.name} para ${tService?.name} con ${tCollab?.name} el día ${selectedClientBookingTicket.date} a las ${selectedClientBookingTicket.timeSlot}. ID: MHB-${selectedClientBookingTicket.id.toUpperCase()}`;
                      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(messageText)}`, '_blank');
                    }}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 rounded-xl text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Compartir por WhatsApp</span>
                  </button>
                </>
              )}
              
            </div>
          </div>
        );
      })()}

    </div>
  );
}
