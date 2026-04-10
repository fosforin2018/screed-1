export const PDFService = {
  generate: async (elementId, filename, options = {}) => {
    if (typeof html2pdf === 'undefined') throw new Error('html2pdf не загружен');
    
    const defaultOpt = {
      margin: [5, 5, 5, 5],
      filename: filename || 'document.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true }
    };
    
    const opt = { ...defaultOpt, ...options };
    const el = document.getElementById(elementId);
    if (!el) throw new Error(`Элемент #${elementId} не найден`);
    
    el.style.display = 'block';
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      const blob = await html2pdf().set(opt).from(el).outputPdf('blob');
      el.style.display = 'none';
      return blob;
    } catch (e) {
      el.style.display = 'none';
      throw e;
    }
  },
  
  // === ПРОФЕССИОНАЛЬНЫЙ ЭКСПОРТ С ОБРАБОТКОЙ ОШИБОК ===
  export: async (blob, fileName, action = 'download') => {
    console.log('PDFService.export called:', { fileName, action });
    
    try {
      // Попытка системного шаринга
      if (action === 'share' && navigator.share?.canShare?.({ files: [new File([blob], fileName, { type: 'application/pdf' })] })) {
        try {
          await navigator.share({ 
            files: [new File([blob], fileName, { type: 'application/pdf' })], 
            title: fileName 
          });
          console.log('✅ Shared via system dialog');
          return { success: true, method: 'share' };
        } catch(e) { console.log('Share cancelled'); }
      }
      
      // Fallback: скачивание через браузер
      console.log('Using browser download fallback');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('✅ Downloaded via browser');
      return { success: true, method: 'download' };
      
    } catch (error) {
      console.error('❌ Export error:', error);
      throw error;
    }
  }
};
console.log('✅ PDFService loaded');
