export const Modal = {
  open: (title, text, actions) => {
    const modal = document.getElementById('pdfModal');
    if (!modal) return;
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalText').textContent = text;
    const actionsEl = document.getElementById('modalActions');
    if (actionsEl && Array.isArray(actions)) {
      actionsEl.innerHTML = actions.map(a => 
        `<button class="modal-btn ${a.class||''}" onclick="${a.onclick}">${a.text}</button>`
      ).join('');
    }
    modal.classList.add('show');
  },
  close: () => {
    const modal = document.getElementById('pdfModal');
    if (modal) modal.classList.remove('show');
  }
};
console.log('✅ Modal component loaded');
