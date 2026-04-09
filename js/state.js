import { StorageService } from './services/storage.js';

export const AppState = {
  rooms: [],
  corrections: { globalMm: 3, perRoomMm: 0, enabled: true },
  currentMeasure: null,
  editingId: null,
  settings: { ...Config.defaultSettings },
  
  // Подписчики на изменения
  _subscribers: {},
  
  // Подписка на изменения
  subscribe(key, callback) {
    if (!this._subscribers[key]) this._subscribers[key] = [];
    this._subscribers[key].push(callback);
  },
  
  // Уведомление подписчиков
  _notify(key, value) {
    if (this._subscribers[key]) {
      this._subscribers[key].forEach(cb => cb(value));
    }
  },
  
  // Инициализация из localStorage
  async init() {
    const saved = await StorageService.get(Config.storageKey);
    if (saved?.rooms) this.rooms = saved.rooms;
    if (saved?.corrections) this.corrections = saved.corrections;
    if (saved?.settings) this.settings = { ...Config.defaultSettings, ...saved.settings };
    this._notify('all', this);
  },
  
  // Сохранение в localStorage
  async save() {
    await StorageService.set(Config.storageKey, {
      rooms: this.rooms,
      corrections: this.corrections,
      settings: this.settings
    });
  }
};

// Proxy для реактивности
export const State = new Proxy(AppState, {
  set(target, prop, value) {
    target[prop] = value;
    target._notify(prop, value);
    target._notify('all', target);
    // Автосохранение важных данных
    if (['rooms', 'corrections', 'settings'].includes(prop)) {
      target.save();
    }
    return true;
  }
});
console.log('✅ State module loaded');
