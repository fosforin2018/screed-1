export const Toast = {
  show: (message, duration = 2500) => {
    const el = document.getElementById('toast');
    if (!el) return console.warn('Toast element not found');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), duration);
  }
};
console.log('✅ Toast component loaded');
