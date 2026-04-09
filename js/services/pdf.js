export const PDFService = {
  // Генерация PDF из HTML-элемента
  generate: async (elementId, options = {}) => {
    if (typeof html2pdf === 'undefined') {
      throw new Error('html2pdf библиотека не загружена');
    }
    
    const defaultOpt = {
      margin: [5, 5, 5, 5],
      filename: 'document.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true }
    };
    
    const opt = { ...defaultOpt, ...options };
    const el = document.getElementById(elementId);
    if (!el) throw new Error(`Элемент #${elementId} не найден`);
    
    // Показываем элемент для рендеринга
    el.style.display = 'block';
    await new Promise(resolve => setTimeout(resolve, 300)); // Ждём рендер
    
    try {
      const blob = await html2pdf().set(opt).from(el).outputPdf('blob');
      el.style.display = 'none';
      return blob;
    } catch (e) {
      el.style.display = 'none';
      throw e;
    }
  },
  
  // Экспорт: скачать или поделиться
  export: async (blob, fileName, action = 'download') => {
    const file = new File([blob], fileName, { type: 'application/pdf' });
    
    // Попытка системного шаринга
    if (action === 'share' && navigator.share?.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: fileName });
        return { success: true, method: 'share' };
      } catch(e) {
        console.log('Share cancelled');
      }
    }
    
    // Fallback: скачивание
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = fileName;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return { success: true, method: 'download' };
  }
};
console.log('✅ PDFService loaded');
