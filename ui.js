// ================= INTERFACE CONTROLLER =================
let selectedDate = getTodayDateString();

function showToast(msg) {
  const toast = document.getElementById('toast-msg');
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 2400);
}

// Modal Control
function openModal(id) {
  document.getElementById(id).classList.add('open');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

document.querySelectorAll('.close-modal').forEach(btn => {
  btn.addEventListener('click', () => {
    closeModal(btn.getAttribute('data-modal'));
  });
});

// Navigation Tabs
const navItems = document.querySelectorAll('.nav-item');
const tabSections = document.querySelectorAll('.tab-section');

navItems.forEach(item => {
  item.addEventListener('click', () => {
    const targetTab = item.getAttribute('data-tab');
    navItems.forEach(n => n.classList.remove('active'));
    tabSections.forEach(t => t.classList.remove('active'));
    item.classList.add('active');
    document.getElementById(targetTab).classList.add('active');

    if (targetTab === 'tab-agenda') renderAgenda();
    if (targetTab === 'tab-clientes') renderClients();
    if (targetTab === 'tab-servicos') renderServices();
    if (targetTab === 'tab-financeiro') renderFinancials();
    if (targetTab === 'tab-ajustes') loadSettings();
  });
});

// Date Navigation
function changeDay(delta) {
  const d = new Date(selectedDate + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  selectedDate = d.toISOString().split('T')[0];
  updateDateLabel();
  renderAgenda();
}

function updateDateLabel() {
  const today = getTodayDateString();
  const parts = selectedDate.split('-');
  const d = new Date(selectedDate + 'T00:00:00');
  const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  const dayName = dayNames[d.getDay()];
  const dayNum = parts[2];
  const monthName = monthNames[parseInt(parts[1]) - 1];

  let label = `${dayName}, ${dayNum} de ${monthName}`;
  if (selectedDate === today) label = `Hoje • ${label}`;
  document.getElementById('lbl-current-date').textContent = label;
}

document.getElementById('btn-prev-day').addEventListener('click', () => changeDay(-1));
document.getElementById('btn-next-day').addEventListener('click', () => changeDay(1));

// ================= RENDER AGENDA =================
function renderAgenda() {
  const appointments = AppStore.getAppointments().filter(a => a.date === selectedDate);
  // Ordena por horário
  appointments.sort((a, b) => a.time.localeCompare(b.time));

  // Stats
  const confirmedCount = appointments.filter(a => a.status === 'confirmado' || a.status === 'concluido').length;
  const totalRev = appointments
    .filter(a => a.status !== 'cancelado')
    .reduce((sum, a) => sum + Number(a.price || 0), 0);

  document.getElementById('stat-day-total').textContent = appointments.length;
  document.getElementById('stat-day-confirmed').textContent = confirmedCount;
  document.getElementById('stat-day-rev').textContent = TimeUtils.formatCurrency(totalRev);

  const container = document.getElementById('appointments-container');
  if (appointments.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
        <p>Nenhum horário marcado para este dia.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = appointments.map(app => {
    const confirmUrl = WhatsAppService.createWhatsAppLink(app.clientPhone, WhatsAppService.getConfirmationMsg(app));
    const reminderUrl = WhatsAppService.createWhatsAppLink(app.clientPhone, WhatsAppService.getReminderMsg(app));

    return `
      <div class="appointment-item status-${app.status}">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div class="app-time-badge">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            ${app.time} (${app.duration} min)
          </div>
          <span class="status-pill ${escapeHtml(app.status)}">${escapeHtml(app.status)}</span>
        </div>
        
        <div class="app-client-name">${escapeHtml(app.clientName)}</div>
        <div class="app-service-info">
          <span>💉 ${escapeHtml(app.serviceName)}</span> • <strong>${TimeUtils.formatCurrency(app.price)}</strong>
          ${app.notes ? `<div style="font-size:0.78rem; color:var(--text-light); margin-top:2px;">Obs: ${escapeHtml(app.notes)}</div>` : ''}
        </div>

        <div class="app-footer">
          <div class="app-actions">
            <a href="${confirmUrl}" target="_blank" class="btn btn-sm btn-secondary" title="Enviar Confirmação WhatsApp" style="color:#25d366; text-decoration:none; font-size:0.75rem; padding:0.25rem 0.5rem;">
              📱 Confirmar
            </a>
            <a href="${reminderUrl}" target="_blank" class="btn btn-sm btn-secondary" title="Enviar Lembrete WhatsApp" style="text-decoration:none; font-size:0.75rem; padding:0.25rem 0.5rem;">
              🔔 Lembrete
            </a>
          </div>
          <div style="display:flex; gap:4px;">
            <button class="icon-btn" style="width:28px; height:28px;" data-action="cycle-status" data-id="${app.id}" title="Alterar status">
              ✓
            </button>
            <button class="icon-btn" style="width:28px; height:28px;" data-action="delete-appointment" data-id="${app.id}" title="Excluir">
              🗑
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function handleCycleStatus(appId) {
  const apps = AppStore.getAppointments();
  const idx = apps.findIndex(a => a.id === appId);
  if (idx !== -1) {
    const statuses = ['agendado', 'confirmado', 'concluido', 'cancelado'];
    const next = statuses[(statuses.indexOf(apps[idx].status) + 1) % statuses.length];
    apps[idx].status = next;
    AppStore.saveAppointments(apps);
    renderAgenda();
    showToast(`Status atualizado para: ${next}`);
  }
}

function handleDeleteAppointment(appId) {
  if (confirm('Deseja excluir este agendamento?')) {
    const apps = AppStore.getAppointments().filter(a => a.id !== appId);
    AppStore.saveAppointments(apps);
    renderAgenda();
    showToast('Agendamento excluído');
  }
}

document.getElementById('appointments-container').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const { action, id } = btn.dataset;
  if (action === 'cycle-status') handleCycleStatus(id);
  if (action === 'delete-appointment') handleDeleteAppointment(id);
});

// ================= RENDER CLIENTES =================
function renderClients(query = '') {
  const clients = AppStore.getClients();
  const apps = AppStore.getAppointments();
  const container = document.getElementById('clients-list-container');

  const filtered = clients.filter(c => 
    c.name.toLowerCase().includes(query.toLowerCase()) || 
    c.phone.includes(query)
  );

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>Nenhum cliente encontrado.</p></div>`;
    return;
  }

  container.innerHTML = filtered.map(c => {
    const clientApps = apps.filter(a => a.clientId === c.id || a.clientName === c.name);
    const totalSpent = clientApps.filter(a => a.status === 'concluido').reduce((sum, a) => sum + Number(a.price || 0), 0);

    return `
      <div class="card" style="margin-bottom:0.75rem;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <strong style="font-size:1rem;">${escapeHtml(c.name)}</strong>
            <div style="font-size:0.85rem; color:var(--text-muted);">📱 ${escapeHtml(c.phone)}</div>
            ${c.notes ? `<div style="font-size:0.8rem; color:var(--text-light); margin-top:3px;">📝 ${escapeHtml(c.notes)}</div>` : ''}
          </div>
          <div style="text-align:right;">
            <div style="font-size:0.75rem; color:var(--text-muted);">Total Gasto</div>
            <strong style="color:var(--success); font-size:0.9rem;">${TimeUtils.formatCurrency(totalSpent)}</strong>
          </div>
        </div>
        <div style="margin-top:0.75rem; padding-top:0.5rem; border-top:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:0.75rem; color:var(--text-muted);">${clientApps.length} agendamento(s)</span>
          <a href="https://api.whatsapp.com/send?phone=55${c.phone.replace(/\D/g,'')}" target="_blank" class="btn btn-sm btn-secondary" style="font-size:0.75rem; padding:0.25rem 0.6rem;">
            Chamar WhatsApp
          </a>
        </div>
      </div>
    `;
  }).join('');
}

document.getElementById('input-search-clients').addEventListener('input', (e) => {
  renderClients(e.target.value);
});

// ================= RENDER SERVIÇOS =================
function renderServices() {
  const services = AppStore.getServices();
  const container = document.getElementById('services-list-container');
  
  container.innerHTML = services.map(s => `
    <div class="card" style="margin-bottom:0.6rem; padding:0.85rem; display:flex; justify-content:space-between; align-items:center;">
      <div>
        <strong style="font-size:0.95rem;">${escapeHtml(s.name)}</strong>
        <div style="font-size:0.8rem; color:var(--text-muted);">⏱ ${s.duration} min • <span style="color:var(--primary); font-weight:700;">${TimeUtils.formatCurrency(s.price)}</span></div>
      </div>
      <button class="icon-btn" style="width:30px; height:30px;" data-action="delete-service" data-id="${s.id}" title="Excluir Serviço">🗑</button>
    </div>
  `).join('');
}

function handleDeleteService(srvId) {
  if (confirm('Deseja excluir este serviço?')) {
    const srvs = AppStore.getServices().filter(s => s.id !== srvId);
    AppStore.saveServices(srvs);
    renderServices();
    showToast('Serviço excluído');
  }
}

document.getElementById('services-list-container').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  if (btn.dataset.action === 'delete-service') handleDeleteService(btn.dataset.id);
});

// ================= RENDER FINANCEIRO =================
function renderFinancials() {
  const apps = AppStore.getAppointments();
  const today = getTodayDateString();
  const currentMonth = today.slice(0, 7);

  const todayRealizado = apps.filter(a => a.date === today && a.status === 'concluido');
  const todayRevRealizado = todayRealizado.reduce((sum, a) => sum + Number(a.price || 0), 0);

  const monthApps = apps.filter(a => a.date.startsWith(currentMonth) && a.status !== 'cancelado');
  const monthRealizados = monthApps.filter(a => a.status === 'concluido');
  const monthRevRealizado = monthRealizados.reduce((sum, a) => sum + Number(a.price || 0), 0);
  const monthRevPrevisto = monthApps.reduce((sum, a) => sum + Number(a.price || 0), 0);
  const ticketAvg = monthRealizados.length > 0 ? (monthRevRealizado / monthRealizados.length) : 0;

  document.getElementById('fin-today-rev').textContent = TimeUtils.formatCurrency(todayRevRealizado);
  document.getElementById('fin-month-rev').textContent = `${TimeUtils.formatCurrency(monthRevRealizado)} / prev. ${TimeUtils.formatCurrency(monthRevPrevisto)}`;
  document.getElementById('fin-month-count').textContent = `${monthRealizados.length} / ${monthApps.length}`;
  document.getElementById('fin-ticket-avg').textContent = TimeUtils.formatCurrency(ticketAvg);

  // Top Serviços
  const serviceCounts = {};
  monthApps.forEach(a => {
    serviceCounts[a.serviceName] = (serviceCounts[a.serviceName] || 0) + 1;
  });

  const topContainer = document.getElementById('fin-top-services');
  const entries = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) {
    topContainer.innerHTML = '<div style="font-size:0.85rem; color:var(--text-muted);">Nenhum atendimento registrado neste mês.</div>';
  } else {
    topContainer.innerHTML = entries.map(([name, count]) => `
      <div style="display:flex; justify-content:space-between; font-size:0.85rem; padding:0.35rem 0; border-bottom:1px solid var(--border-color);">
        <span>${escapeHtml(name)}</span>
        <strong>${count}x</strong>
      </div>
    `).join('');
  }
}

// ================= CONFIGURAÇÕES & SYNC =================
function loadSettings() {
  const s = AppStore.getSettings();
  document.getElementById('header-business-name').textContent = s.businessName;
  document.getElementById('header-owner-name').textContent = s.ownerName || s.category;
  
  document.getElementById('cfg-business-name').value = s.businessName || '';
  document.getElementById('cfg-phone').value = s.phone || '';
  document.getElementById('cfg-category').value = s.category || '';
  
  document.getElementById('cfg-work-start').value = s.workStart || '08:00';
  document.getElementById('cfg-work-end').value = s.workEnd || '19:00';
  document.getElementById('cfg-lunch-start').value = s.lunchStart || '12:00';
  document.getElementById('cfg-lunch-end').value = s.lunchEnd || '13:00';
  const slotIntervalEl = document.getElementById('cfg-slot-interval');
  if (slotIntervalEl) slotIntervalEl.value = s.slotInterval || 30;
}

document.getElementById('form-business-settings').addEventListener('submit', (e) => {
  e.preventDefault();
  const s = AppStore.getSettings();
  s.businessName = document.getElementById('cfg-business-name').value;
  s.phone = document.getElementById('cfg-phone').value;
  s.category = document.getElementById('cfg-category').value;
  AppStore.saveSettings(s);
  loadSettings();
  showToast('Perfil atualizado com sucesso!');
});

document.getElementById('form-work-hours').addEventListener('submit', (e) => {
  e.preventDefault();
  const s = AppStore.getSettings();
  s.workStart = document.getElementById('cfg-work-start').value;
  s.workEnd = document.getElementById('cfg-work-end').value;
  s.lunchStart = document.getElementById('cfg-lunch-start').value;
  s.lunchEnd = document.getElementById('cfg-lunch-end').value;
  const slotEl = document.getElementById('cfg-slot-interval');
  if (slotEl) s.slotInterval = parseInt(slotEl.value);
  AppStore.saveSettings(s);
  showToast('Horários de expediente salvos!');
});

// Backup Export / Import
document.getElementById('btn-export-backup').addEventListener('click', () => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(AppStore.exportFullBackup());
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `minha_agenda_backup_${getTodayDateString()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast('Backup exportado com sucesso!');
});

document.getElementById('btn-import-backup-trigger').addEventListener('click', () => {
  document.getElementById('input-backup-file').click();
});

document.getElementById('input-backup-file').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    const success = AppStore.importFullBackup(event.target.result);
    if (success) {
      showToast('Dados restaurados com sucesso!');
      loadSettings();
      renderAgenda();
    } else {
      alert('Arquivo de backup inválido.');
    }
  };
  reader.readAsText(file);
});

// ================= MODAL HANDLERS (NOVO AGENDAMENTO / CLIENTE / SERVIÇO) =================
document.getElementById('btn-open-new-app').addEventListener('click', () => {
  populateAppDropdowns();
  document.getElementById('app-date').value = selectedDate;
  document.getElementById('app-time').value = '10:00';
  openModal('modal-appointment');
});

function populateAppDropdowns() {
  const clients = AppStore.getClients();
  const services = AppStore.getServices();
  
  const clientSelect = document.getElementById('app-client-select');
  clientSelect.innerHTML = clients.map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)} (${escapeHtml(c.phone)})</option>`).join('');

  const serviceSelect = document.getElementById('app-service-select');
  serviceSelect.innerHTML = services.map(s => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.name)} - ${TimeUtils.formatCurrency(s.price)} (${s.duration} min)</option>`).join('');
}

document.getElementById('form-appointment').addEventListener('submit', (e) => {
  e.preventDefault();
  const settings = AppStore.getSettings();
  const timeMins = TimeUtils.timeToMinutes(document.getElementById('app-time').value);
  const startMins = TimeUtils.timeToMinutes(settings.workStart);
  const endMins = TimeUtils.timeToMinutes(settings.workEnd);
  if (timeMins < startMins || timeMins >= endMins) {
    showToast('⚠️ Horário fora do expediente configurado.');
    return;
  }
  const clients = AppStore.getClients();
  const services = AppStore.getServices();

  const clientId = document.getElementById('app-client-select').value;
  const serviceId = document.getElementById('app-service-select').value;
  const client = clients.find(c => c.id === clientId);
  const service = services.find(s => s.id === serviceId);

  const newApp = {
    id: 'app_' + Date.now(),
    date: document.getElementById('app-date').value,
    time: document.getElementById('app-time').value,
    duration: service ? service.duration : 30,
    clientId: client.id,
    clientName: client.name,
    clientPhone: client.phone,
    serviceId: service.id,
    serviceName: service.name,
    price: service.price,
    status: document.getElementById('app-status').value,
    notes: document.getElementById('app-notes').value
  };

  const apps = AppStore.getAppointments();
  apps.push(newApp);
  AppStore.saveAppointments(apps);

  closeModal('modal-appointment');
  renderAgenda();
  showToast('Agendamento salvo com sucesso!');
});

// Novo Cliente
document.getElementById('btn-open-new-client').addEventListener('click', () => {
  document.getElementById('form-client').reset();
  openModal('modal-client');
});
document.getElementById('btn-quick-new-client').addEventListener('click', () => {
  document.getElementById('form-client').reset();
  openModal('modal-client');
});

document.getElementById('form-client').addEventListener('submit', (e) => {
  e.preventDefault();
  const newCli = {
    id: 'cli_' + Date.now(),
    name: document.getElementById('cli-name').value,
    phone: document.getElementById('cli-phone').value,
    notes: document.getElementById('cli-notes').value
  };
  const clients = AppStore.getClients();
  clients.push(newCli);
  AppStore.saveClients(clients);
  closeModal('modal-client');
  renderClients();
  populateAppDropdowns();
  showToast('Cliente cadastrado!');
});

// Novo Serviço
document.getElementById('btn-open-new-service').addEventListener('click', () => {
  document.getElementById('form-service').reset();
  openModal('modal-service');
});

document.getElementById('form-service').addEventListener('submit', (e) => {
  e.preventDefault();
  const newSrv = {
    id: 'srv_' + Date.now(),
    name: document.getElementById('srv-name').value,
    price: parseFloat(document.getElementById('srv-price').value),
    duration: parseInt(document.getElementById('srv-duration').value),
    color: '#2563eb'
  };
  const services = AppStore.getServices();
  services.push(newSrv);
  AppStore.saveServices(services);
  closeModal('modal-service');
  renderServices();
  showToast('Serviço adicionado!');
});

// Initial Boot
loadSettings();
updateDateLabel();
renderAgenda();
