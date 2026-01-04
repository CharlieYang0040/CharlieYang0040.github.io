const STORAGE_KEY = 'honeymoon_checklists_ui:open';

function setOpen(panel, toggleBtn, open) {
  panel.classList.toggle('hidden', !open);
  toggleBtn.textContent = open ? '체크리스트 접기' : '체크리스트 펼치기';
  toggleBtn.classList.toggle('bg-teal-600', !open);
  toggleBtn.classList.toggle('hover:bg-teal-700', !open);
  toggleBtn.classList.toggle('bg-stone-600', open);
  toggleBtn.classList.toggle('hover:bg-stone-700', open);
  localStorage.setItem(STORAGE_KEY, open ? '1' : '0');
}

export function setupChecklistsLazy({
  toggleId = 'checklistsToggle',
  panelId = 'checklistsPanel'
} = {}) {
  const toggleBtn = document.getElementById(toggleId);
  const panel = document.getElementById(panelId);
  if (!toggleBtn || !panel) return;

  let initialized = false;

  async function ensureInit() {
    if (initialized) return;
    initialized = true;
    const mod = await import('./checklistsTabs.js');
    await mod.setupChecklistsTabs();
  }

  // default: 접힘 (필요할 때만 로드)
  const shouldOpen = localStorage.getItem(STORAGE_KEY) === '1';
  setOpen(panel, toggleBtn, false);

  toggleBtn.addEventListener('click', async () => {
    const openNow = panel.classList.contains('hidden');
    if (openNow) await ensureInit();
    setOpen(panel, toggleBtn, openNow);
  });

  // 사용자가 마지막에 열어둔 상태라면, 자동으로 열고 초기화
  if (shouldOpen) {
    ensureInit().then(() => setOpen(panel, toggleBtn, true));
  }
}


