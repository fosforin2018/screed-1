export const FilesystemService = {
  // Конвертация Blob → чистый Base64
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

  // Сохранение с fallback-цепочкой
  save: async (blob, fileName) => {
    const F = Capacitor.Plugins?.Filesystem;
    if (!F) throw new Error('Filesystem плагин не загружен');
    
    const D = F.Directory || { Documents: 'DOCUMENTS', Data: 'DATA', Cache: 'CACHE' };
    const b64 = await FilesystemService.toBase64(blob);
    const folder = Config.folderName;
    
    const targets = [
      { n: 'Documents', d: D.Documents, v: true },
      { n: 'Data', d: D.Data, v: false }
    ];

    for (const t of targets) {
      try {
        await F.mkdir({ path: folder, directory: t.d, recursive: true }).catch(()=>{});
        await F.writeFile({ path: `${folder}/${fileName}`,  b64, directory: t.d });
        const uri = await F.getUri({ path: `${folder}/${fileName}`, directory: t.d });
        return { path: uri.uri, visible: t.v, name: t.n };
      } catch (e) { console.warn(`Save ${t.n} failed:`, e.message); }
    }
    throw new Error('Нет доступа к хранилищу');
  },

  // Запрос разрешений (Android)
  requestPermission: async () => {
    if (typeof Capacitor === 'undefined' || !Capacitor.isNativePlatform()) return true;
    try {
      const { Permissions } = Capacitor.Plugins;
      const status = await Permissions.request({ permissions: ['storage'] });
      return status.storage === 'granted';
    } catch(e) {
      console.log('Permission request skipped');
      return true;
    }
  }
};
console.log('✅ FilesystemService loaded');
