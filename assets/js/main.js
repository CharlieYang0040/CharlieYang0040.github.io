import { loadAndRenderTimeline } from './timelineRenderer.js';
import { setupNavigation } from './modules/navigation.js';
import { setupLazySectionInit } from './modules/lazyInit.js';
import { setupChecklistsLazy } from './modules/checklistsLazy.js';

const TIMELINE_VIEW_KEY = 'timelineView';
const THEME_KEY = 'theme';

function setupTimelineViewToggle() {
  const timelineSection = document.getElementById('timeline');
  if (!timelineSection) return;

  const cardsBtn = document.getElementById('timelineViewCardsBtn');
  const tableBtn = document.getElementById('timelineViewTableBtn');
  if (!cardsBtn || !tableBtn) return;

  const setView = (view) => {
    const nextView = view === 'table' ? 'table' : 'cards';
    timelineSection.classList.toggle('timeline-view-table', nextView === 'table');

    cardsBtn.setAttribute('aria-selected', String(nextView === 'cards'));
    tableBtn.setAttribute('aria-selected', String(nextView === 'table'));
    cardsBtn.classList.toggle('active', nextView === 'cards');
    tableBtn.classList.toggle('active', nextView === 'table');

    try {
      localStorage.setItem(TIMELINE_VIEW_KEY, nextView);
    } catch (_) {
      // ignore
    }
  };

  const initialView = (() => {
    try {
      return localStorage.getItem(TIMELINE_VIEW_KEY) || 'cards';
    } catch (_) {
      return 'cards';
    }
  })();

  setView(initialView);

  cardsBtn.addEventListener('click', () => setView('cards'));
  tableBtn.addEventListener('click', () => setView('table'));
}

function getStoredTheme() {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === 'dark' || v === 'light' ? v : null;
  } catch (_) {
    return null;
  }
}

function setStoredTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (_) {
    // ignore
  }
}

function applyTheme(theme) {
  const html = document.documentElement;
  const isDark = theme === 'dark';
  html.classList.toggle('dark', isDark);
}

function setupThemeToggle() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;

  const updateLabel = (theme) => {
    // 버튼은 "현재 상태"를 표시 (혼동 방지)
    const resolved = theme === 'dark' ? 'dark' : 'light';
    btn.textContent = resolved === 'dark' ? '다크' : '라이트';
    btn.setAttribute('aria-label', resolved === 'dark' ? '현재 다크 모드. 클릭하여 라이트로 전환' : '현재 라이트 모드. 클릭하여 다크로 전환');
  };

  const stored = getStoredTheme();
  // 저장값이 없으면 라이트를 기본으로
  const initial = stored || 'light';
  applyTheme(initial);
  updateLabel(initial);

  btn.addEventListener('click', () => {
    const currentlyDark = document.documentElement.classList.contains('dark');
    const next = currentlyDark ? 'light' : 'dark';
    setStoredTheme(next);
    applyTheme(next);
    updateLabel(next);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  setupLazySectionInit();
  setupChecklistsLazy();
  setupTimelineViewToggle();
  setupThemeToggle();
  await loadAndRenderTimeline({ tbodyId: 'timelineTbody', src: 'assets/data/timeline.json' });
});


