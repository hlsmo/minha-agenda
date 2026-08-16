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
  businessName: 'Enf.ª Juliana Mendes • Estética Clínica',
  ownerName: 'Enf.ª Juliana Mendes (COREN-SP 123.456)',
  phone: '11987654321',
  category: 'Enfermagem Estética & Harmonização Facial',
  workStart: '08:30',
  workEnd: '19:00',
  lunchStart: '12:30',
  lunchEnd: '13:30',
  slotInterval: 30,
  workDays: [1, 2, 3, 4, 5, 6]
};

const DEFAULT_SERVICES = [
  { id: 'srv_1', name: 'Toxina Botulínica (Testa, Glabela e Olhos)', price: 1150.00, duration: 45, color: '#7C3B14' },
  { id: 'srv_2', name: 'Preenchimento Labial c/ Ácido Hialurônico (1ml)', price: 1250.00, duration: 60, color: '#A83222' },
  { id: 'srv_3', name: 'Bioestimulador de Colágeno Facial', price: 1900.00, duration: 60, color: '#B38234' },
  { id: 'srv_4', name: 'Biorevitalização / Skinbooster Hidratação Profunda', price: 650.00, duration: 45, color: '#6B6047' },
  { id: 'srv_5', name: 'Peeling Químico Renovador & Clareador', price: 260.00, duration: 45, color: '#D97706' },
  { id: 'srv_6', name: 'Limpeza de Pele Profunda c/ Fototerapia LED', price: 190.00, duration: 75, color: '#B8621B' },
  { id: 'srv_7', name: 'Drenagem Linfática Facial / Pós-Procedimento', price: 150.00, duration: 45, color: '#976B23' }
];

const DEFAULT_CLIENTS = [
  { id: 'cli_1', name: 'Mariana Silveira', phone: '11988881111', notes: 'Retorno de Toxina Botulínica (15 dias). Sensibilidade leve à lidocaína tópica. Fototipo II.' },
  { id: 'cli_2', name: 'Camila Rodrigues', phone: '11977772222', notes: 'Protocolo Bioestimulador (Sessão 2/3). Tendência a melasma malar. Uso diário de FPS 70.' },
  { id: 'cli_3', name: 'Beatriz Antunes', phone: '11966663333', notes: 'Avaliação inicial para Preenchimento Labial e Skinbooster. Sem alergias conhecidas.' },
  { id: 'cli_4', name: 'Juliana Castro', phone: '11955554444', notes: 'Protocolo acne/oleosidade com Peeling e Limpeza de Pele. Não gestante/lactante.' }
];

// Obter data de hoje no formato YYYY-MM-DD
function getTodayDateString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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
          duration: 45,
          clientId: 'cli_1',
          clientName: 'Mariana Silveira',
          clientPhone: '11988881111',
          serviceId: 'srv_1',
          serviceName: 'Toxina Botulínica (Testa, Glabela e Olhos)',
          price: 1150.00,
          status: 'confirmado',
          notes: 'Retoque glabelar programado'
        },
        {
          id: 'app_2',
          date: today,
          time: '14:30',
          duration: 60,
          clientId: 'cli_3',
          clientName: 'Beatriz Antunes',
          clientPhone: '11966663333',
          serviceId: 'srv_2',
          serviceName: 'Preenchimento Labial c/ Ácido Hialurônico (1ml)',
          price: 1250.00,
          status: 'agendado',
          notes: 'Aplicar anestésico tópico 20 min antes'
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
      const isArr = Array.isArray;
      const isObj = v => v && typeof v === 'object' && !isArr(v);
      if (!isObj(data)) throw new Error('Root inválido');
      if (data.settings && isObj(data.settings)) this.saveSettings(data.settings);
      if (data.services && isArr(data.services)) this.saveServices(data.services);
      if (data.clients && isArr(data.clients)) this.saveClients(data.clients);
      if (data.appointments && isArr(data.appointments)) this.saveAppointments(data.appointments);
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
    const clients = AppStore.getClients();
    const client = clients.find(c => c.id === app.clientId);
    const clientName = (client ? client.name : app.clientName) || app.clientName;
    return `Olá *${clientName}*, tudo bem? ✨\n\nPassando para confirmar seu atendimento na *${settings.businessName}*:\n\n🗓 *Data:* ${TimeUtils.formatDateBR(app.date)}\n⏰ *Horário:* ${app.time}\n💉 *Procedimento:* ${app.serviceName}\n💰 *Investimento:* ${TimeUtils.formatCurrency(app.price)}\n\n📋 *Recomendações Prévias:*\n• Chegue com 10 min de antecedência para preparo e assepsia.\n• Evite maquiagem na região do procedimento no dia.\n\nPor favor, responda *SIM* para confirmar. Estamos ansiosos para te receber! 🌸`;
  },

  getReminderMsg(app) {
    const settings = AppStore.getSettings();
    const clients = AppStore.getClients();
    const client = clients.find(c => c.id === app.clientId);
    const clientName = (client ? client.name : app.clientName) || app.clientName;
    return `Oi *${clientName}*, lembrete do seu procedimento amanhã na *${settings.businessName}*:\n\n⏰ *Horário:* ${app.time}\n💉 *Procedimento:* ${app.serviceName}\n\nLembre-se de manter a pele bem hidratada e com protetor solar. Caso precise remarcar, avise com antecedência. Até logo! ✨`;
  }
};

// Sanitização XSS
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Exposição Global
window.escapeHtml = escapeHtml;
window.AppStore = AppStore;
window.TimeUtils = TimeUtils;
window.WhatsAppService = WhatsAppService;
window.getTodayDateString = getTodayDateString;
