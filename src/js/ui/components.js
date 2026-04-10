export const Toast = {
  show: (message, duration = 2500) => {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), duration);
  }
};

export const Modal = {
  open: (title, text) => {
    const modal = document.getElementById('pdfModal');
    if (!modal) return;
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalText').textContent = text;
    modal.classList.add('show');
  },
  close: () => document.getElementById('pdfModal')?.classList.remove('show')
};
console.log('✅ UI components loaded');
