// === FILE SERVICE - работа с файловой системой ===
const FileService = {
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

  // Сохранение файла с fallback-цепочкой
  save: async (blob, fileName) => {
    const F = Capacitor.Plugins?.Filesystem;
    if (!F) throw new Error('Filesystem плагин не загружен');
    
    const D = F.Directory || { Documents: 'DOCUMENTS', Data: 'DATA', Cache: 'CACHE' };
    const b64 = await FileService.toBase64(blob);
    const folder = Config.folderName;
    
    const targets = [
      { n: 'Documents', d: D.Documents, v: true },
      { n: 'Data', d: D.Data, v: false },
      { n: 'Cache', d: D.Cache, v: false }
    ];

    for (const t of targets) {
      try {
        await F.mkdir({ path: folder, directory: t.d, recursive: true }).catch(()=>{});
        await F.writeFile({ path: `${folder}/${fileName}`,  b64, directory: t.d });
        const uri = await F.getUri({ path: `${folder}/${fileName}`, directory: t.d });
        return { path: uri.uri, visible: t.v, name: t.n };
      } catch (e) { console.warn(`Save ${t.n} failed:`, e.message); }
    }
    throw new Error('Нет доступа к хранилищу. Проверьте разрешения.');
  },

  // Чтение файла
  read: async (fileName) => {
    const F = Capacitor.Plugins?.Filesystem;
    if (!F) throw new Error('Filesystem не загружен');
    const D = F.Directory || { Documents: 'DOCUMENTS' };
    const res = await F.readFile({ path: `${Config.folderName}/${fileName}`, directory: D.Documents });
    return res.data;
  },

  // Удаление файла
  delete: async (fileName) => {
    const F = Capacitor.Plugins?.Filesystem;
    if (!F) throw new Error('Filesystem не загружен');
    const D = F.Directory || { Documents: 'DOCUMENTS' };
    await F.deleteFile({ path: `${Config.folderName}/${fileName}`, directory: D.Documents });
  }
};
console.log('✅ FileService loaded');
