// === ОСНОВНАЯ ЛОГИКА ПРИЛОЖЕНИЯ ===
let rooms = [], measData = {}, pdfData = { blob: null, name: '' };

// Утилиты
const $ = id => document.getElementById(id);
const show = msg => { const t = $('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2500); };
const closeModal = () => $('pdfModal').classList.remove('show');

// Навигация
function go(pageId, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  $(pageId).classList.add('active');
  document.querySelectorAll('.nav button').forEach(b => b.classList.remove('act'));
  if (btn) btn.classList.add('act');
}

// Комнаты
function addRoom() {
  rooms.push({ id: Date.now(), name: `Комната ${rooms.length + 1}`, area: 0, layer: 0 });
  renderRooms();
}

function renderRooms() {
  $('rooms').innerHTML = rooms.map((r, i) => `
    <div class="card">
      <b>${r.name}</b>
      <input type="number" placeholder="Площадь м²" value="${r.area}" oninput="updRoom(${r.id},'area',this.value)">
      <input type="number" placeholder="Слой см" value="${r.layer}" oninput="updRoom(${r.id},'layer',this.value)">
    </div>`).join('');
  calcTotal();
}

function updRoom(id, f, v) {
  const r = rooms.find(x => x.id === id);
  if (r) { r[f] = parseFloat(v) || 0; calcTotal(); }
}

function calcTotal() {
  let a = 0, v = 0;
  rooms.forEach(r => { a += r.area; v += r.area * (r.layer / 100); });
  $('tArea').textContent = a.toFixed(2) + ' м²';
  $('tLayer').textContent = rooms.length ? (v / a * 100).toFixed(1) + ' см' : '0 см';
  $('tVol').textContent = v.toFixed(3) + ' м³';
}

// Сохранение/загрузка
function saveMeas() {
  if (!$('addr').value) return show('⚠️ Введите адрес');
  measData = {
    id: 'm_' + Date.now(),
    addr: $('addr').value,
    client: $('client').value,
    date: $('date').value,
    rooms: [...rooms],
    totalArea: parseFloat($('tArea').textContent) || 0
  };
  let db = JSON.parse(localStorage.getItem(Config.storageKey) || '[]');
  db.push(measData);
  localStorage.setItem(Config.storageKey, JSON.stringify(db));
  show('✅ Замер сохранён');
  renderHist();
}

function renderHist() {
  const db = JSON.parse(localStorage.getItem(Config.storageKey) || '[]');
  $('list').innerHTML = db.map(m => `
    <li class="card" style="margin-bottom:8px">
      <b>${m.addr}</b> <small>${m.date}</small><br>
      ${m.totalArea} м² 
      <button onclick="loadMeas('${m.id}')" style="float:right">📂</button>
    </li>`).join('');
}

function loadMeas(id) {
  const m = JSON.parse(localStorage.getItem(Config.storageKey) || '[]').find(x => x.id === id);
  if (!m) return;
  $('addr').value = m.addr;
  $('client').value = m.client;
  $('date').value = m.date;
  rooms = m.rooms;
  renderRooms();
  go('pMeas');
  show('📂 Загружено');
}

// PDF
function openPDFModal(type) {
  $('mTitle').textContent = type === 'measure' ? '📄 Лист замера' : '💰 Коммерческое';
  $('mText').textContent = 'Нажмите кнопку для создания и сохранения';
  $('pdfModal').classList.add('show');

  const el = document.createElement('div');
  el.innerHTML = `<h1>Стяжка Pro</h1><p>Адрес: ${$('addr').value || '-'}</p><p>Площадь: ${$('tArea').textContent}</p><p>Слой: ${$('tLayer').textContent}</p>`;
  el.style.cssText = 'position:absolute;left:-9999px;top:0';
  document.body.appendChild(el);

  html2pdf().from(el).outputPdf('blob').then(blob => {
    pdfData = { blob, name: `Screed_${Date.now()}.pdf` };
    document.body.removeChild(el);
    $('mText').textContent = '✅ Файл готов к сохранению';
  }).catch(e => { document.body.removeChild(el); show('❌ Ошибка PDF'); closeModal(); });
}

// Сохранение PDF через FileService
window.startPDF = async function() {
  if (!pdfData?.blob) return show('⚠️ Файл не создан');
  try {
    show('📥 Сохранение...');
    const res = await FileService.save(pdfData.blob, pdfData.name);
    const msg = res.visible
      ? `✅ Готово!\n\n📁 Внутренняя память / Documents / Screed1 /\n📄 ${pdfData.name}`
      : `✅ Сохранено в Data.\n\nПуть:\n${res.path}`;
    alert(msg);
    closeModal();
  } catch (e) {
    alert(`❌ Ошибка:\n${e.message}`);
  }
};

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
  $('date').value = new Date().toISOString().split('T')[0];
  addRoom();
  console.log('✅ App initialized');
});
