import { Config } from './config.js';
import { FileService } from './services/filesystem.js';
import { PDFService } from './services/pdf.js';
import { Calculator } from './services/calculator.js';
import { Toast, Modal } from './ui/components.js';

// === STATE ===
let rooms = [], editingId = null, roomUid = 0, currentCalc = null;
let corrections = { globalMm: 3, perRoomMm: 0, enabled: true };
let pdfData = { blob: null, name: '', pendingAction: null };

// === INIT ===
document.addEventListener('DOMContentLoaded', () => { 
  loadSettings(); loadTheme();
  document.getElementById('measDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('corrToggle').checked = true;
  toggleCorrection(); addRoom(); renderHistory(); filterForCost(); 
});

// === THEME ===
window.toggleTheme = function(){
  document.body.classList.toggle('dark');
  const d = document.body.classList.contains('dark');
  document.getElementById('themeBtn').textContent = d ? '☀️' : '🌙';
  localStorage.setItem('darkMode', d ? '1' : '0');
};
function loadTheme(){
  if(localStorage.getItem('darkMode')==='1'){
    document.body.classList.add('dark');
    document.getElementById('themeBtn').textContent='☀️';
  }
}

// === NAVIGATION ===
window.switchTab = function(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  const m = {pageMeasurements:0, pageCost:1, pageHistory:2, pageSettings:3};
  if(m[id]!==undefined) document.querySelectorAll('.nav-btn')[m[id]].classList.add('active');
  if(id==='pageHistory') renderHistory();
  if(id==='pageCost') showCostList();
};

// === ROOMS ===
window.addRoom = function(n='',a='',l=''){
  roomUid++;
  rooms.push({id:`r_${Date.now()}_${roomUid}`, name:n||`Комната ${rooms.length+1}`, area:a, layer:l});
  renderRooms(); recalcSummary();
};
window.removeRoom = function(id){
  if(rooms.length<=1) return Toast.show('⚠️ Нужна хотя бы одна комната');
  rooms = rooms.filter(r=>r.id!==id);
  renderRooms(); recalcSummary();
};
window.updateRoom = function(id,f,v){
  const r = rooms.find(x=>x.id===id);
  if(r){
    r[f] = v;
    const el = document.getElementById(`res-${id}`);
    if(el){
      const a = parseFloat(r.area)||0, l = getEff(parseFloat(r.layer)||0);
      el.textContent = (a>0&&l>0) ? `Итог: ${a} × ${l} = ${(a*l).toFixed(2)}` : '';
    }
    recalcSummary();
  }
};
function renderRooms(){
  const c = document.getElementById('roomsContainer');
  c.innerHTML = rooms.map((r,i)=>{
    const a = parseFloat(r.area)||0, l = getEff(parseFloat(r.layer)||0);
    const res = (a>0&&l>0) ? `Итог: ${a} × ${l} = ${(a*l).toFixed(2)}` : '';
    return `<div class="room-card"><div class="room-header"><span class="room-number">${i+1}</span><button class="btn-remove" onclick="removeRoom('${r.id}')">✕</button></div><div class="room-fields"><div class="field-group"><label>Название</label><input type="text" value="${r.name}" oninput="updateRoom('${r.id}','name',this.value)"></div><div class="field-group"><label>Площадь (м²)</label><input type="number" step="0.01" min="0" value="${r.area}" oninput="updateRoom('${r.id}','area',this.value)"></div><div class="field-group"><label>Слой (см)</label><input type="number" step="0.1" min="0" value="${r.layer}" oninput="updateRoom('${r.id}','layer',this.value)"></div></div><div class="room-result" id="res-${r.id}">${res}</div></div>`;
  }).join('');
}
window.toggleCorrection = function(){
  corrections.enabled = document.getElementById('corrToggle').checked;
  document.querySelectorAll('.correction-grid input').forEach(i=>i.disabled=!corrections.enabled);
  recalcSummary();
};
window.applyCorrections = function(){
  corrections.globalMm = parseFloat(document.getElementById('corrGlobalMm').value)||0;
  corrections.perRoomMm = parseFloat(document.getElementById('corrPerRoomMm').value)||0;
  recalcSummary();
};
function getEff(baseCm, corr){
  const c = corr || corrections;
  if(!c.enabled) return baseCm;
  return baseCm + (c.globalMm/10) + (c.perRoomMm/10);
}
function recalcSummary(){
  let ta=0, w=0;
  rooms.forEach(r=>{ const a=parseFloat(r.area)||0, l=getEff(parseFloat(r.layer)||0); if(a>0){ta+=a; w+=(a*l);} });
  const avg = ta>0 ? w/ta : 0, vol = ta*(avg/100);
  document.getElementById('totalArea').textContent = ta.toFixed(2)+' м²';
  document.getElementById('avgLayer').textContent = avg.toFixed(2)+' см';
  document.getElementById('totalVolume').textContent = vol.toFixed(3)+' м³';
  document.getElementById('totalIndex').textContent = w.toFixed(2);
}

// === SAVE/LOAD ===
window.saveMeasurement = function(){
  const addr = document.getElementById('addressInput').value.trim(),
        dt = document.getElementById('measDate').value,
        cl = document.getElementById('clientName').value.trim();
  if(!addr) return Toast.show('⚠️ Введите адрес');
  if(rooms.filter(r=>parseFloat(r.area)>0).length===0) return Toast.show('⚠️ Заполните площадь');
  
  let ta=0, w=0;
  rooms.forEach(r=>{ const a=parseFloat(r.area)||0, l=getEff(parseFloat(r.layer)||0); if(a>0){ta+=a; w+=(a*l);} });
  
  const data = {
    id: editingId || 'm_'+Date.now(),
    address: addr, client: cl, date: dt,
    rooms: JSON.parse(JSON.stringify(rooms)),
    totalArea: ta, avgLayer: ta>0?w/ta:0,
    corrections: {...corrections},
    savedAt: new Date().toISOString()
  };
  
  let db = getDB();
  if(editingId){
    const i = db.findIndex(m=>m.id===editingId);
    if(i!==-1) db[i] = data;
    editingId = null;
    document.getElementById('editIndicator').classList.remove('visible');
  } else db.push(data);
  
  localStorage.setItem(Config.storageKey, JSON.stringify(db));
  Toast.show('✅ Сохранено');
  clearForm();
};
function getDB(){ return JSON.parse(localStorage.getItem(Config.storageKey)||'[]'); }

window.loadMeasurement = function(id){
  const m = getDB().find(x=>x.id===id);
  if(!m) return;
  editingId = m.id;
  document.getElementById('addressInput').value = m.address;
  document.getElementById('clientName').value = m.client || '';
  document.getElementById('measDate').value = m.date || new Date().toISOString().split('T')[0];
  rooms = JSON.parse(JSON.stringify(m.rooms));
  corrections = m.corrections || {globalMm:0, perRoomMm:0, enabled:false};
  document.getElementById('corrGlobalMm').value = corrections.globalMm;
  document.getElementById('corrPerRoomMm').value = corrections.perRoomMm;
  document.getElementById('corrToggle').checked = corrections.enabled;
  toggleCorrection();
  renderRooms(); recalcSummary();
  document.getElementById('editIndicator').classList.add('visible');
  switchTab('pageMeasurements');
  Toast.show('✏️ Загружено');
};
window.deleteMeasurement = function(id){
  if(!confirm('Удалить замер?')) return;
  localStorage.setItem(Config.storageKey, JSON.stringify(getDB().filter(m=>m.id!==id)));
  renderHistory(); filterForCost();
  Toast.show('🗑 Удалено');
};
window.clearForm = function(){
  document.getElementById('addressInput').value = '';
  document.getElementById('clientName').value = '';
  document.getElementById('measDate').value = new Date().toISOString().split('T')[0];
  rooms = []; editingId = null;
  corrections = {globalMm:3, perRoomMm:0, enabled:true};
  document.getElementById('corrGlobalMm').value = 3;
  document.getElementById('corrPerRoomMm').value = 0;
  document.getElementById('corrToggle').checked = true;
  toggleCorrection();
  document.getElementById('editIndicator').classList.remove('visible');
  addRoom();
};

// === HISTORY ===
function renderHistory(){
  const db = getDB(), list = document.getElementById('savedList'), emp = document.getElementById('emptyState');
  if(db.length===0){ list.innerHTML=''; emp.style.display='block'; return; }
  emp.style.display='none';
  list.innerHTML = db.map(m=>{
    const c = m.corrections||{globalMm:0,perRoomMm:0,enabled:false};
    const hint = c.enabled ? ` • 🔧 ${c.globalMm>0?'+':''}${c.globalMm}/${c.perRoomMm>0?'+':''}${c.perRoomMm}мм` : '';
    return `<li class="saved-item"><div class="saved-address">📍 ${m.address}</div><div class="saved-client">👤 ${m.client||'Не указан'}</div><div class="saved-meta">${m.date||''} · ${m.rooms.length} комн. · ${m.totalArea.toFixed(1)} м² · ${m.avgLayer.toFixed(1)} см${hint}</div><div class="saved-actions"><button class="btn-edit" onclick="loadMeasurement('${m.id}')">✏️</button><button class="btn-calc" onclick="window.calcFromArchive('${m.id}')">💰</button><button class="btn-pdf-m" onclick="showMeasPDFModal('${m.id}')">📄</button><button class="btn-del" onclick="deleteMeasurement('${m.id}')">🗑</button></div></li>`;
  }).join('');
}

// === COST CALC ===
window.calcFromArchive = function(id){
  switchTab('pageCost');
  document.getElementById('costSearchBlock').style.display='none';
  document.getElementById('costList').style.display='none';
  document.getElementById('costResult').style.display='none';
  setTimeout(()=>calculateCost(id), 200);
};
function showCostList(){
  document.getElementById('costSearchBlock').style.display='block';
  document.getElementById('costList').style.display='block';
  document.getElementById('costResult').style.display='none';
  document.getElementById('searchCost').value='';
  filterForCost();
}
function filterForCost(){
  const q = document.getElementById('searchCost').value.toLowerCase();
  const db = getDB().filter(m => (m.address||'').toLowerCase().includes(q) || (m.client||'').toLowerCase().includes(q) || (m.date||'').includes(q));
  const cont = document.getElementById('costList');
  if(q.length>0 && db.length===0){ cont.innerHTML='<div style="text-align:center;padding:20px;color:var(--text-secondary)">Ничего не найдено</div>'; return; }
  cont.innerHTML = db.map(m=>`<div class="cost-item" id="ci-${m.id}" onclick="calcFromArchive('${m.id}')"><div style="font-weight:600">📍 ${m.address}</div><div style="font-size:12px;color:var(--text-secondary)">👤 ${m.client||'—'} • 📅 ${m.date||'—'} • ${m.totalArea.toFixed(1)} м²</div></div>`).join('');
}
function calculateCost(id){
  if(!id) return Toast.show('⚠️ Выберите замер');
  const m = getDB().find(x=>x.id===id);
  if(!m) return;
  const s = getSettings(), area = m.totalArea, layer = m.avgLayer;
  const cost = Calculator.calcCost(area, layer, s);
  currentCalc = { m, s, area, layer, ...cost };
  
  const box = document.getElementById('costResult');
  box.style.display = 'block';
  box.innerHTML = `
    <div class="cost-summary">
      <div class="cost-summary-item"><div class="label">Площадь</div><div class="value">${area.toFixed(2)} м²</div></div>
      <div class="cost-summary-item"><div class="label">Слой</div><div class="value">${layer.toFixed(1)} см</div></div>
      <div class="cost-summary-item"><div class="label">Цена/м²</div><div class="value">${cost.pricePerM2.toFixed(0)} ₽</div></div>
    </div>
    <div class="cost-result">
      <table class="cost-table">
        <tr><th>Позиция</th><th>Расчёт</th><th>Сумма</th></tr>
        <tr><td>Песок</td><td>${cost.details.sandB} меш.</td><td>${cost.sand.toLocaleString('ru-RU')} ₽</td></tr>
        <tr><td>Цемент</td><td>${cost.details.cemB} меш.</td><td>${cost.cement.toLocaleString('ru-RU')} ₽</td></tr>
        <tr><td>Фибра</td><td>${cost.details.fibKg.toFixed(2)} кг</td><td>${cost.fiber.toFixed(0)} ₽</td></tr>
        <tr><td>Плёнка</td><td>${area.toFixed(2)} м²</td><td>${cost.film.toFixed(0)} ₽</td></tr>
        <tr><td>Сетка</td><td>${area.toFixed(2)} м²</td><td>${cost.mesh.toFixed(0)} ₽</td></tr>
        <tr><td>Доставка</td><td>${cost.details.totalTons.toFixed(1)} т → ${cost.details.trips} рейс.</td><td>${cost.delivery.toLocaleString('ru-RU')} ₽</td></tr>
        <tr><td>Подъём</td><td>${Math.ceil(cost.details.totalTons)} т</td><td>${cost.lift.toLocaleString('ru-RU')} ₽</td></tr>
        <tr><td>Работа</td><td>${area.toFixed(2)} м²</td><td>${cost.labor.toLocaleString('ru-RU')} ₽</td></tr>
        <tr class="total-row"><td>ИТОГО</td><td></td><td>${cost.total.toLocaleString('ru-RU')} ₽</td></tr>
      </table>
      <div class="btn-group">
        <button class="btn btn-secondary" onclick="showCostList()">← Назад</button>
        <button class="btn btn-success" onclick="showCostPDFModal()">📥 Скачать PDF</button>
      </div>
    </div>`;
}

// === PDF GENERATION ===
window.closeModal = Modal.close;

window.showMeasPDFModal = function(id){
  Modal.open('📄 Лист замера', 'Нажмите кнопку для создания файла');
  preparePDFData('pdfMeasTpl','pdfMeasCont',`ЛистЗамера_${getDB().find(x=>x.id===id)?.address||'file'}`, id);
};
window.showCostPDFModal = function(){
  if(!currentCalc) return Toast.show('⚠️ Сначала выполните расчёт');
  Modal.open('💰 Коммерческое предложение', 'Нажмите кнопку для создания файла');
  preparePDFData('pdfCostTpl','pdfCostCont',`Расчёт_${currentCalc.m.address||'file'}`);
};

async function preparePDFData(tplId, contId, baseName, id=null){
  const m = id ? getDB().find(x=>x.id===id) : currentCalc?.m;
  if(!m) return;

  // Заполнение КП
  if(!id && currentCalc){
    const {s,area,layer,total,ppm,details} = currentCalc;
    document.getElementById('pdfCostNum').textContent = 'КП-' + Math.floor(1000 + Math.random()*9000);
    document.getElementById('pdfCostDate').textContent = new Date().toLocaleDateString('ru-RU');
    document.getElementById('pdfCostStrip').innerHTML = `
      <div class="pdf-info-strip-item"><div class="l">Объект</div><div class="v" style="font-size:11px">${m.address.length>25?m.address.substring(0,25)+'...':m.address}</div></div>
      <div class="pdf-info-strip-item"><div class="l">Площадь</div><div class="value">${area.toFixed(1)} м²</div></div>
      <div class="pdf-info-strip-item"><div class="l">Слой</div><div class="value">${layer.toFixed(1)} см</div></div>
      <div class="pdf-info-strip-item"><div class="l">За м²</div><div class="value" style="color:#4b5563">${ppm.toFixed(0)} ₽</div></div>`;
    
    const totalMixKg = area * layer * s.mixDensity;
    document.getElementById('pdfCostRows').innerHTML = `
      <tr><td>Песок</td><td>${details.sandB} меш.</td><td>${s.sandPrice} ₽</td><td>${currentCalc.sand.toLocaleString()} ₽</td></tr>
      <tr><td>Цемент</td><td>${details.cemB} меш.</td><td>${s.cementPrice} ₽</td><td>${currentCalc.cement.toLocaleString()} ₽</td></tr>
      <tr><td>Фибра</td><td>${details.fibKg.toFixed(1)} кг</td><td>${s.fiberPrice} ₽</td><td>${currentCalc.fiber.toFixed(0)} ₽</td></tr>
      <tr><td>Плёнка</td><td>${area.toFixed(1)} м²</td><td>${s.filmPrice} ₽</td><td>${currentCalc.film.toFixed(0)} ₽</td></tr>
      <tr><td>Сетка</td><td>${area.toFixed(1)} м²</td><td>${s.meshPrice} ₽</td><td>${currentCalc.mesh.toFixed(0)} ₽</td></tr>
      <tr><td>Доставка</td><td>${details.trips} рейс.</td><td>${s.deliveryPrice} ₽</td><td>${currentCalc.delivery.toLocaleString()} ₽</td></tr>
      <tr><td>Подъём</td><td>${Math.ceil(details.totalTons)} т</td><td>${s.liftPrice} ₽</td><td>${currentCalc.lift.toLocaleString()} ₽</td></tr>
      <tr style="font-weight:600"><td>Работа</td><td>${area.toFixed(1)} м²</td><td>${s.laborPrice} ₽/м²</td><td>${currentCalc.labor.toLocaleString()} ₽</td></tr>`;
    document.getElementById('pdfCostTotal').textContent = total.toLocaleString('ru-RU') + ' ₽';
    document.getElementById('pdfCostGenDate').textContent = new Date().toLocaleString('ru-RU');
  }
  
  // Заполнение листа замера
  if(id){
    document.getElementById('pdfMeasDate').textContent = m.date || new Date().toLocaleDateString('ru-RU');
    document.getElementById('pdfMeasAddr').textContent = m.address;
    document.getElementById('pdfMeasClient').textContent = m.client || 'Не указан';
    document.getElementById('pdfMeasArea').textContent = m.totalArea.toFixed(2) + ' м²';
    document.getElementById('pdfMeasLayer').textContent = m.avgLayer.toFixed(2) + ' см';
    
    const c = m.corrections||{globalMm:0,perRoomMm:0,enabled:false};
    const cBlock = document.getElementById('pdfMeasCorrection'), cText = document.getElementById('pdfMeasCorrText');
    if(c.enabled && (c.globalMm!==0||c.perRoomMm!==0)){
      cBlock.style.display = 'block';
      let t = '';
      if(c.globalMm!==0) t += `Общая: ${c.globalMm>0?'+':''}${c.globalMm}мм. `;
      if(c.perRoomMm!==0) t += `К комнате: ${c.perRoomMm>0?'+':''}${c.perRoomMm}мм.`;
      cText.textContent = t;
    } else cBlock.style.display = 'none';
    
    const tb = document.getElementById('pdfMeasRows'); tb.innerHTML = '';
    let idx = 0;
    m.rooms.forEach(r => {
      const a = parseFloat(r.area)||0, base = parseFloat(r.layer)||0, eff = getEff(base, c), res = a*eff;
      idx += res;
      if(a>0) tb.innerHTML += `<tr><td>${r.name}</td><td>${a.toFixed(2)}</td><td>${eff.toFixed(1)}</td><td>${res.toFixed(2)}</td></tr>`;
    });
    document.getElementById('pdfMeasIndex').textContent = idx.toFixed(2);
    document.getElementById('pdfMeasGenDate').textContent = new Date().toLocaleString('ru-RU');
    
    // Логотип/подпись
    const logoArea = document.getElementById('pdfLogoArea');
    const logoUrl = getSettings().logoUrl || '', masterName = getSettings().masterName || '';
    if(logoUrl.trim() !== ''){
      if(logoUrl.startsWith('data:image') || logoUrl.startsWith('http')){
        logoArea.innerHTML = `<img src="${logoUrl}" style="max-width:150px;max-height:80px;object-fit:contain;" onerror="this.style.display='none'">` + (masterName?`<div style="font-size:10px;margin-top:2px;font-weight:600">${masterName}</div>`:'');
      } else logoArea.innerHTML = `<div style="font-size:12px;font-weight:600;color:#4b5563">${logoUrl}</div>` + (masterName?`<div style="font-size:10px;margin-top:2px">${masterName}</div>`:'');
    } else if(masterName){
      logoArea.innerHTML = `<div style="font-size:11px;font-weight:600;text-align:right;margin-bottom:2px">${masterName}</div><div class="sig-line">Подпись</div>`;
    } else {
      logoArea.innerHTML = '<div class="sig-line">Подпись мастера</div>';
    }
  }

  pdfData.name = `${baseName.replace(/[^a-zA-Zа-яА-Я0-9]/g,'_')}.pdf`;
  document.getElementById('modalActions').querySelectorAll('button').forEach(b=>b.disabled=true);
  Toast.show('⏳ Формирование PDF...');
  
  const tpl = document.getElementById(tplId); tpl.style.display = 'block';
  
  try{
    await new Promise(resolve => setTimeout(resolve, 300));
    pdfData.blob = await PDFService.generate(contId, pdfData.name);
    tpl.style.display = 'none';
    document.getElementById('modalText').textContent = '✅ Файл готов!';
    document.getElementById('modalActions').querySelectorAll('button').forEach(b=>b.disabled=false);
    Toast.show('✅ PDF сформирован');
  } catch(e){
    console.error('PDF Error:', e);
    tpl.style.display = 'none';
    Toast.show('⚠️ Ошибка: ' + e.message);
    Modal.close();
  }
}

// === PDF EXPORT (SHARE / DOWNLOAD) ===
window.startPDF = async function(action){
  if(!pdfData.blob) return Toast.show('⚠️ PDF ещё не готов');
  pdfData.pendingAction = action;
  
  // Запрос разрешений для скачивания
  if(action === 'download'){
    const hasPerm = await FileService.requestPermission();
    if(!hasPerm) action = 'share'; // fallback
  }
  
  try{
    const result = await PDFService.export(pdfData.blob, pdfData.name, action);
    
    if(action === 'download' && result.method === 'download'){
      // Попытка сохранить в Documents
      try{
        await FileService.save(pdfData.blob, pdfData.name);
        Toast.show(`✅ Сохранено в Documents/${Config.folderName}/`);
      } catch(e){
        Toast.show('✅ Скачан в Загрузки');
      }
    } else if(action === 'share'){
      Toast.show(result.method === 'share' ? '📤 Отправлено' : '✅ Скачан');
    }
    Modal.close();
  } catch(e){
    Toast.show('❌ Ошибка: ' + e.message);
  }
};

// === SETTINGS ===
function getSettings(){
  const g = id => parseFloat(document.getElementById(id).value)||0;
  const t = id => document.getElementById(id)?.value||'';
  return{
    sandBagW:g('sandBagW'),sandPrice:g('sandPrice'),
    cementBagW:g('cementBagW'),cementPrice:g('cementPrice'),
    ratio:g('ratio')||3,mixDensity:g('mixDensity')||20,
    truckCap:g('truckCap')||5,deliveryPrice:g('deliveryPrice')||4000,liftPrice:g('liftPrice')||800,
    fiberG:g('fiberG')||50,fiberPrice:g('fiberPrice')||450,
    filmPrice:g('filmPrice')||25,meshPrice:g('meshPrice')||80,
    laborPrice:g('laborPrice')||450,
    logoUrl:t('logoUrl'),masterName:t('masterName')
  };
}
window.saveSettings = function(){
  ['sandBagW','sandPrice','cementBagW','cementPrice','ratio','mixDensity','truckCap','deliveryPrice','liftPrice','fiberG','fiberPrice','filmPrice','meshPrice','laborPrice'].forEach(id=>localStorage.setItem(id,document.getElementById(id).value));
  localStorage.setItem('logoUrl',document.getElementById('logoUrl').value);
  localStorage.setItem('masterName',document.getElementById('masterName').value);
};
function loadSettings(){
  ['sandBagW','sandPrice','cementBagW','cementPrice','ratio','mixDensity','truckCap','deliveryPrice','liftPrice','fiberG','fiberPrice','filmPrice','meshPrice','laborPrice'].forEach(id=>{if(localStorage.getItem(id))document.getElementById(id).value=localStorage.getItem(id);});
  if(localStorage.getItem('logoUrl'))document.getElementById('logoUrl').value=localStorage.getItem('logoUrl');
  if(localStorage.getItem('masterName'))document.getElementById('masterName').value=localStorage.getItem('masterName');
}
window.clearAllData = function(){ if(!confirm('Удалить ВСЕ данные?'))return; localStorage.clear(); location.reload(); };
window.exportData = function(){
  const d = {v:'2.0',date:new Date().toISOString(),measurements:getDB(),settings:getSettings()};
  const b = new Blob([JSON.stringify(d,null,2)],{type:'application/json'});
  const a = document.createElement('a'); a.href=URL.createObjectURL(b); a.download=`ScreedBackup_${new Date().toISOString().split('T')[0]}.json`; a.click();
  Toast.show('📤 Экспорт готов');
};
window.importData = function(inp){
  const f = inp.files[0]; if(!f)return;
  const r = new FileReader();
  r.onload = e => {
    try{
      const d = JSON.parse(e.target.result);
      if(d.measurements) localStorage.setItem(Config.storageKey, JSON.stringify(d.measurements));
      if(d.settings){ Object.keys(d.settings).forEach(k=>{if(document.getElementById(k))document.getElementById(k).value=d.settings[k]}); saveSettings(); }
      renderHistory(); filterForCost();
      Toast.show('📥 Импорт успешен');
    } catch(err){ Toast.show('⚠️ Ошибка файла'); }
  };
  r.readAsText(f); inp.value='';
};

// === TOAST ===
window.showToast = Toast.show;
