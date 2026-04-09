import { Config } from './config.js';
import { State } from './state.js';
import { Toast } from './ui/components/Toast.js';
import { Modal } from './ui/components/Modal.js';
import { Router } from './ui/router.js';
import { FilesystemService } from './services/filesystem.js';
import { PDFService } from './services/pdf.js';
import { Calculator } from './services/calculator.js';
import { StorageService } from './services/storage.js';

// Глобальные хелперы для HTML-атрибутов
window.showToast = Toast.show;
window.closeModal = Modal.close;
window.switchTab = (id, btn) => Router.navigate(id, btn);

// Инициализация
document.addEventListener('DOMContentLoaded', async () => {
  console.log(`🚀 ${Config.appName} initializing...`);
  
  // Загружаем состояние
  await State.init();
  
  // Инициализируем страницы
  if (typeof initMeasurementsPage === 'function') initMeasurementsPage();
  if (typeof initCostPage === 'function') initCostPage();
  if (typeof initHistoryPage === 'function') initHistoryPage();
  if (typeof initSettingsPage === 'function') initSettingsPage();
  
  // Тема
  loadTheme();
  
  // Дата по умолчанию
  const dateInput = document.getElementById('measDate');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
  
  // Первая комната
  if (typeof addRoom === 'function') addRoom();
  
  console.log('✅ App initialized');
});

// Тема
function loadTheme() {
  if (localStorage.getItem('darkMode') === '1') {
    document.body.classList.add('dark');
    const btn = document.getElementById('themeBtn');
    if (btn) btn.textContent = '☀️';
  }
}
window.toggleTheme = function() {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  const btn = document.getElementById('themeBtn');
  if (btn) btn.textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem('darkMode', isDark ? '1' : '0');
};
