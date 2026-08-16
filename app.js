/**
 * Minha Agenda Profissional - Local-First Core Engine
 */

const STORAGE_KEYS = {
  SETTINGS: 'map_settings',
  SERVICES: 'map_services',
  CLIENTS: 'map_clients',
  APPOINTMENTS: 'map_appointments'
};

// Dados Padrão Iniciais (Mock inicial inteligente)
const DEFAULT_SETTINGS = {
  businessName: 'Studio Bella & Estilo',
  ownerName: 'Camila Santos',
  phone: '11999998888',
  category: 'Estética e Beleza',
  workStart: '08:00',
  workEnd: '19:00',
  lunchStart: '12:00',
  lunchEnd: '13:00',
  slotInterval: 30, // minutos
  workDays: [1, 2, 3, 4, 5, 6] // Seg a Sáb (0=Dom)
};

const DEFAULT_SERVICES = [
  { id: 'srv_1', name: 'Corte Feminino + Escova', price: 90.00, duration: 60, color: '#2563eb' },
  { id: 'srv_2', name: 'Manicure & Pedicure', price: 65.00, duration: 60, color: '#ec4899' },
  { id: 'srv_3', name: 'Design de Sobrancelhas', price: 45.00, duration: 30, color: '#8b5cf6' },
  { id: 'srv_4', name: 'Limpeza de Pele Profunda', price: 130.00, duration: 90, color: '#10b981' }
];

const DEFAULT_CLIENTS = [
  { id: 'cli_1', name: 'Mariana Lima', phone: '11988881111', notes: 'Prefere atendimentos à tarde' },
  { id: 'cli_2', name: 'Juliana Costa', phone: '11977772222', notes: 'Alérgica a determinados esmaltes' },
  { id: 'cli_3', name: 'Patrícia Souza', phone: '11966663333', notes: '' }
];

// Obter data de hoje no formato YYYY-MM-DD
function getTodayDateString() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

// Inicializador do Repositório Local
class AppStore {
  static getSettings() {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : DEFAULT_SETTINGS;
  }
  static saveSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  static getServices() {
    const data = localStorage.getItem(STORAGE_KEYS.SERVICES);
    return data ? JSON.parse(data) : DEFAULT_SERVICES;
  }
  static saveServices(services) {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
  }

  static getClients() {
    const data = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    return data ? JSON.parse(data) : DEFAULT_CLIENTS;
  }
  static saveClients(clients) {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  }

  static getAppointments() {
    const data = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    if (!data) {
      // Cria agendamentos de demonstração para hoje
      const today = getTodayDateString();
      const mockAppointments = [
        {
          id: 'app_1',
          date: today,
          time: '09:00',
          duration: 60,
          clientId: 'cli_1',
          clientName: 'Mariana Lima',
          clientPhone: '11988881111',
          serviceId: 'srv_1',
          serviceName: 'Corte Feminino + Escova',
          price: 90.00,
          status: 'confirmado',
          notes: ''
        },
        {
          id: 'app_2',
          date: today,
          time: '14:00',
          duration: 30,
          clientId: 'cli_3',
          clientName: 'Patrícia Souza',
          clientPhone: '11966663333',
          serviceId: 'srv_3',
          serviceName: 'Design de Sobrancelhas',
          price: 45.00,
          status: 'agendado',
          notes: ''
        }
      ];
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(mockAppointments));
      return mockAppointments;
    }
    return JSON.parse(data);
  }
  static saveAppointments(apps) {
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(apps));
  }

  // Backup e Exportação completa
  static exportFullBackup() {
    return JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings: this.getSettings(),
      services: this.getServices(),
      clients: this.getClients(),
      appointments: this.getAppointments()
    }, null, 2);
  }

  static importFullBackup(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.settings) this.saveSettings(data.settings);
      if (data.services) this.saveServices(data.services);
      if (data.clients) this.saveClients(data.clients);
      if (data.appointments) this.saveAppointments(data.appointments);
      return true;
    } catch (e) {
      console.error('Falha ao importar backup:', e);
      return false;
    }
  }
}

// Utilitários de Horários e Agenda
const TimeUtils = {
  timeToMinutes(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  },
  minutesToTime(mins) {
    const h = Math.floor(mins / 60).toString().padStart(2, '0');
    const m = (mins % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  },
  formatDateBR(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  },
  formatCurrency(val) {
    return Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  },
  getAvailableSlots(dateStr, serviceDuration = 30) {
    const settings = AppStore.getSettings();
    const appointments = AppStore.getAppointments().filter(a => a.date === dateStr && a.status !== 'cancelado');
    
    const targetDate = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = targetDate.getDay();
    if (!settings.workDays.includes(dayOfWeek)) {
      return []; // Fechado no dia
    }

    const startMins = TimeUtils.timeToMinutes(settings.workStart);
    const endMins = TimeUtils.timeToMinutes(settings.workEnd);
    const lunchStartMins = TimeUtils.timeToMinutes(settings.lunchStart || '12:00');
    const lunchEndMins = TimeUtils.timeToMinutes(settings.lunchEnd || '13:00');
    const interval = settings.slotInterval || 30;

    const slots = [];
    for (let cur = startMins; cur + serviceDuration <= endMins; cur += interval) {
      const slotEnd = cur + serviceDuration;
      
      // Verifica almoço
      const overlapsLunch = (cur < lunchEndMins && slotEnd > lunchStartMins);
      if (overlapsLunch) continue;

      // Verifica colisão com agendamentos existentes
      const hasConflict = appointments.some(app => {
        const appStart = TimeUtils.timeToMinutes(app.time);
        const appEnd = appStart + (app.duration || 30);
        return (cur < appEnd && slotEnd > appStart);
      });

      if (!hasConflict) {
        slots.push(TimeUtils.minutesToTime(cur));
      }
    }
    return slots;
  }
};

// Integração WhatsApp
const WhatsAppService = {
  createWhatsAppLink(phone, message) {
    const cleanPhone = (phone || '').replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    return `https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodeURIComponent(message)}`;
  },
  
  getConfirmationMsg(app) {
    const settings = AppStore.getSettings();
    return `Olá *${app.clientName}*, tudo bem?\n\nPassando para confirmar seu agendamento no *${settings.businessName}*:\n🗓 *Data:* ${TimeUtils.formatDateBR(app.date)}\n⏰ *Horário:* ${app.time}\n✂️ *Serviço:* ${app.serviceName}\n💰 *Valor:* ${TimeUtils.formatCurrency(app.price)}\n\nPor favor, responda *SIM* para confirmar. Te esperamos! 😊`;
  },

  getReminderMsg(app) {
    const settings = AppStore.getSettings();
    return `Oi *${app.clientName}*, lembrete do seu horário amanhã no *${settings.businessName}* às *${app.time}* (${app.serviceName}).\n\nCaso precise remarcar, nos avise com antecedência. Até logo! ✨`;
  }
};

// Exposição Global
window.AppStore = AppStore;
window.TimeUtils = TimeUtils;
window.WhatsAppService = WhatsAppService;
window.getTodayDateString = getTodayDateString;
