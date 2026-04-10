import { Config } from '../config.js';

export const FileService = {
  toBase64: async (blob) => {
    if (!blob || blob.size === 0) throw new Error('Пустой файл');
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result;
        if (typeof res === 'string' && res.includes(',')) {
          const pure = res.split(',')[1];
          if (pure.length < 50) reject(new Error('Данные повреждены'));
          resolve(pure);
        } else reject(new Error('Неверный формат'));
      };
      reader.onerror = () => reject(new Error('Ошибка чтения'));
      reader.readAsDataURL(blob);
    });
  },
  
  save: async (blob, fileName) => {
    const F = Capacitor.Plugins?.Filesystem;
    if (!F) throw new Error('Filesystem плагин не загружен');
    
    const D = F.Directory || { Documents: 'DOCUMENTS', Data: 'DATA' };
    const b64 = await FileService.toBase64(blob);
    const folder = Config.folderName;
    
    const targets = [
      { n: 'Documents', d: D.Documents, visible: true },
      { n: 'Data', d: D.Data, visible: false }
    ];
    
    for (const t of targets) {
      try {
        await F.mkdir({ path: folder, directory: t.d, recursive: true }).catch(()=>{});
        await F.writeFile({ path: `${folder}/${fileName}`,  b64, directory: t.d });
        const uri = await F.getUri({ path: `${folder}/${fileName}`, directory: t.d });
        return { path: uri.uri, visible: t.visible, name: t.n };
      } catch (e) { console.warn(`Save ${t.n} failed:`, e.message); }
    }
    throw new Error('Нет доступа к хранилищу');
  },
  
  requestPermission: async () => {
    if (typeof Capacitor === 'undefined' || !Capacitor.isNativePlatform()) return true;
    try {
      const { Permissions } = Capacitor.Plugins;
      const status = await Permissions.request({ permissions: ['storage'] });
      return status.storage === 'granted';
    } catch(e) { return true; }
  }
};
console.log('✅ FileService loaded');
