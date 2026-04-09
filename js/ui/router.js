export const Router = {
  current: 'pageMeasurements',
  
  navigate: (pageId, btnEl) => {
    // Скрываем все страницы
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    // Показываем нужную
    const target = document.getElementById(pageId);
    if (target) {
      target.classList.add('active');
      Router.current = pageId;
      // Обновляем навигацию
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      if (btnEl) btnEl.classList.add('active');
      // Хуки для страниц
      Router._onPageEnter(pageId);
    }
  },
  
  _onPageEnter: (pageId) => {
    // Здесь можно вызывать инициализацию для каждой страницы
    if (pageId === 'pageHistory' && typeof renderHistory === 'function') renderHistory();
    if (pageId === 'pageCost' && typeof showCostList === 'function') showCostList();
  }
};
console.log('✅ Router loaded');
