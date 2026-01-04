import { fetchJson } from './dom.js';

const DEFAULT_SRC = 'assets/data/checklists.json';
const STORAGE_PREFIX = 'honeymoon_checklists_v1';
const DEFAULT_DISPLAY_MODE = 'check';

function safeJsonParse(str, fallback) {
  try {
    const v = JSON.parse(str);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

function storageKeyFor(tabKey) {
  return `${STORAGE_PREFIX}:${tabKey}`;
}

function loadState(tabKey) {
  const raw = localStorage.getItem(storageKeyFor(tabKey));
  const parsed = safeJsonParse(raw, {});
  return parsed && typeof parsed === 'object' ? parsed : {};
}

function saveState(tabKey, state) {
  localStorage.setItem(storageKeyFor(tabKey), JSON.stringify(state));
}

function uniqItemsCount(group) {
  const items = Array.isArray(group?.items) ? group.items : [];
  const subs = Array.isArray(group?.subgroups) ? group.subgroups : [];
  const subItemsCount = subs.reduce((acc, sg) => acc + uniqItemsCount(sg), 0);
  return items.length + subItemsCount;
}

function flattenItems(group, out = []) {
  const items = Array.isArray(group?.items) ? group.items : [];
  items.forEach((it) => out.push(it));
  const subs = Array.isArray(group?.subgroups) ? group.subgroups : [];
  subs.forEach((sg) => flattenItems(sg, out));
  return out;
}

function createEl(tag, className) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  return el;
}

function inferEmoji(label = '') {
  const s = String(label);
  if (/[🧭🇦🇺🇳🇿🎁💡✈️]/.test(s)) return '✨';
  if (/초콜릿|Tim Tam|팀탐|Whittaker|휘태커스|Haigh|하이그/i.test(s)) return '🍫';
  if (/쿠키|Cookie/i.test(s)) return '🍪';
  if (/퍼지|Fudge/i.test(s)) return '🍬';
  if (/와인|Sauvignon|소비뇽|Cloudy Bay|Oyster Bay|Villa Maria/i.test(s)) return '🍷';
  if (/꿀|Manuka|마누카/i.test(s)) return '🍯';
  if (/비누|Soap/i.test(s)) return '🧼';
  if (/크림|Papaw|포포|Sudocrem|수도크림/i.test(s)) return '🧴';
  if (/영양제|비타민|Blackmores|Swisse|초록입홍합/i.test(s)) return '💊';
  if (/잠옷/i.test(s)) return '🩳';
  if (/UGG|어그/i.test(s)) return '👢';
  if (/모자|Helen Kaminski|헬렌 카민스키/i.test(s)) return '👒';
  if (/티|Tea|T2/i.test(s)) return '🍵';
  if (/머그|mug|맥주잔|beer/i.test(s)) return '🍺';
  if (/반지|절대반지/i.test(s)) return '💍';
  if (/마스크팩|머드/i.test(s)) return '🧖‍♀️';
  if (/인형|키링|쿼카|코알라/i.test(s)) return '🧸';
  if (/TRS|영수증|환급/i.test(s)) return '🧾';
  if (/수하물|캐리어|짐/i.test(s)) return '🧳';
  if (/면세/i.test(s)) return '🛃';
  if (/할인|회원가|Tourist Card/i.test(s)) return '💸';
  return '🛍️';
}

function renderProgressBar({ done, total }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const wrap = createEl('div', 'w-full');
  const meta = createEl('div', 'flex items-center justify-between text-xs text-stone-500 mb-2');
  meta.innerHTML = `<span>진행률</span><span><strong class="text-stone-700">${done}</strong> / ${total} (${pct}%)</span>`;

  const barBg = createEl('div', 'w-full h-2 bg-stone-200 rounded-full overflow-hidden');
  const bar = createEl('div', 'h-2 bg-teal-600 rounded-full');
  bar.style.width = `${pct}%`;
  barBg.appendChild(bar);

  wrap.appendChild(meta);
  wrap.appendChild(barBg);
  return wrap;
}

function renderReadItems(items) {
  const list = createEl('div', 'grid grid-cols-1 sm:grid-cols-2 gap-3');
  (Array.isArray(items) ? items : []).forEach((it) => {
    const card = createEl('div', 'flex gap-3 p-3 rounded-lg border border-stone-200 bg-white');

    const emoji = createEl(
      'div',
      'flex items-center justify-center w-9 h-9 rounded-full bg-stone-100 text-lg flex-shrink-0'
    );
    emoji.textContent = inferEmoji(it?.label ?? '');

    const text = createEl('div', 'text-sm sm:text-base text-stone-700 leading-relaxed');
    text.textContent = it?.label ?? '';

    card.appendChild(emoji);
    card.appendChild(text);
    list.appendChild(card);
  });
  return list;
}

function renderReadItemsText(items) {
  const list = createEl('ul', 'space-y-2');
  (Array.isArray(items) ? items : []).forEach((it) => {
    const li = createEl('li', 'text-sm sm:text-base text-stone-700 leading-relaxed');
    li.textContent = it?.label ?? '';
    list.appendChild(li);
  });
  return list;
}

function renderReadGroup({ group }) {
  const container = createEl('div', 'border border-stone-200 rounded-lg overflow-hidden bg-white');

  const header = createEl('div', 'bg-stone-50 px-4 py-4');
  const title = createEl('div', 'text-lg sm:text-xl font-bold text-stone-900');
  title.textContent = group?.title ?? '';
  header.appendChild(title);

  if (group?.tip) {
    const tip = createEl('div', 'text-sm sm:text-base text-stone-500 mt-1.5 leading-relaxed');
    tip.textContent = group.tip;
    header.appendChild(tip);
  }

  const body = createEl('div', 'px-4 py-5');
  const directItems = Array.isArray(group?.items) ? group.items : [];
  if (directItems.length) body.appendChild(renderReadItems(directItems));

  const subs = Array.isArray(group?.subgroups) ? group.subgroups : [];
  subs.forEach((sg) => {
    const subWrap = createEl('div', 'mt-6');
    const subTitle = createEl('div', 'text-base sm:text-lg font-bold text-stone-800 mb-3');
    subTitle.textContent = sg?.title ?? '';
    subWrap.appendChild(subTitle);
    if (sg?.tip) {
      const tip = createEl('div', 'text-sm sm:text-base text-stone-500 mb-3 leading-relaxed');
      tip.textContent = sg.tip;
      subWrap.appendChild(tip);
    }
    const sgItems = Array.isArray(sg?.items) ? sg.items : [];
    subWrap.appendChild(renderReadItems(sgItems));
    body.appendChild(subWrap);
  });

  container.appendChild(header);
  container.appendChild(body);
  return container;
}

function renderReadGroupText({ group }) {
  const container = createEl('div', 'space-y-3');

  const title = createEl('div', 'text-lg sm:text-xl font-bold text-stone-900');
  title.textContent = group?.title ?? '';
  container.appendChild(title);

  if (group?.tip) {
    const tip = createEl('div', 'text-sm sm:text-base text-stone-500 leading-relaxed');
    tip.textContent = group.tip;
    container.appendChild(tip);
  }

  const directItems = Array.isArray(group?.items) ? group.items : [];
  if (directItems.length) {
    const itemWrap = createEl('div', 'pt-1');
    itemWrap.appendChild(renderReadItemsText(directItems));
    container.appendChild(itemWrap);
  }

  const subs = Array.isArray(group?.subgroups) ? group.subgroups : [];
  subs.forEach((sg) => {
    const subWrap = createEl('div', 'mt-6 space-y-3');
    const subTitle = createEl('div', 'text-base sm:text-lg font-bold text-stone-800');
    subTitle.textContent = sg?.title ?? '';
    subWrap.appendChild(subTitle);
    if (sg?.tip) {
      const tip = createEl('div', 'text-sm sm:text-base text-stone-500 leading-relaxed');
      tip.textContent = sg.tip;
      subWrap.appendChild(tip);
    }
    const sgItems = Array.isArray(sg?.items) ? sg.items : [];
    if (sgItems.length) {
      const sgItemWrap = createEl('div', 'pt-1');
      sgItemWrap.appendChild(renderReadItemsText(sgItems));
      subWrap.appendChild(sgItemWrap);
    }
    container.appendChild(subWrap);
  });

  return container;
}

function renderGroup({ group, tabKey, state, onToggle }) {
  const container = createEl('div', 'border border-stone-200 rounded-lg overflow-hidden');

  const header = createEl('div', 'bg-stone-50 px-4 py-4');
  const title = createEl('div', 'text-lg sm:text-xl font-bold text-stone-900');
  title.textContent = group?.title ?? '';
  header.appendChild(title);

  if (group?.tip) {
    const tip = createEl('div', 'text-sm sm:text-base text-stone-500 mt-1.5 leading-relaxed');
    tip.textContent = group.tip;
    header.appendChild(tip);
  }

  const groupItems = flattenItems(group);
  const total = groupItems.length;
  const done = groupItems.reduce((acc, it) => acc + (state[it.id] ? 1 : 0), 0);
  const progressWrap = createEl('div', 'mt-3');
  progressWrap.appendChild(renderProgressBar({ done, total }));
  header.appendChild(progressWrap);

  const body = createEl('div', 'px-4 py-4 bg-white');

  function renderItemsList(items, indent = false) {
    const list = createEl('div', indent ? 'space-y-2 pl-3 border-l border-stone-200' : 'space-y-2');
    items.forEach((it) => {
      const row = createEl('label', 'flex gap-3 items-start p-2 rounded-md hover:bg-stone-50 cursor-pointer');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.className = 'mt-1 h-5 w-5 accent-teal-600';
      input.checked = Boolean(state[it.id]);
      input.addEventListener('change', () => onToggle(it.id, input.checked));

      const text = createEl('div', 'text-sm sm:text-base text-stone-700 leading-relaxed');
      text.textContent = it.label ?? '';

      row.appendChild(input);
      row.appendChild(text);
      list.appendChild(row);
    });
    return list;
  }

  const directItems = Array.isArray(group?.items) ? group.items : [];
  if (directItems.length) body.appendChild(renderItemsList(directItems));

  const subs = Array.isArray(group?.subgroups) ? group.subgroups : [];
  subs.forEach((sg) => {
    const subWrap = createEl('div', 'mt-6');
    const subTitle = createEl('div', 'text-base sm:text-lg font-bold text-stone-800 mb-3');
    subTitle.textContent = sg?.title ?? '';
    subWrap.appendChild(subTitle);
    if (sg?.tip) {
      const tip = createEl('div', 'text-sm sm:text-base text-stone-500 mb-3 leading-relaxed');
      tip.textContent = sg.tip;
      subWrap.appendChild(tip);
    }
    const sgItems = Array.isArray(sg?.items) ? sg.items : [];
    subWrap.appendChild(renderItemsList(sgItems, true));
    body.appendChild(subWrap);
  });

  container.appendChild(header);
  container.appendChild(body);
  return container;
}

export async function setupChecklistsTabs({
  src = DEFAULT_SRC,
  mountId = 'checklistsApp',
  tabsId = 'checklistsTabs'
} = {}) {
  const mount = document.getElementById(mountId);
  const tabsEl = document.getElementById(tabsId);
  if (!mount || !tabsEl) return;

  mount.innerHTML = '<div class="text-stone-500 text-center py-10">체크리스트를 불러오는 중...</div>';

  const data = await fetchJson(src);
  const tabs = Array.isArray(data?.tabs) ? data.tabs : [];
  const tabMap = Object.fromEntries(tabs.map((t) => [t.key, t]));

  function setTabButtonState(activeKey) {
    tabsEl.querySelectorAll('button[data-tab]').forEach((btn) => {
      const isActive = btn.getAttribute('data-tab') === activeKey;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      if (isActive) {
        btn.classList.add('bg-teal-700', 'text-white');
        btn.classList.remove('bg-stone-100');
      } else {
        btn.classList.remove('bg-teal-700', 'text-white');
        btn.classList.add('bg-stone-100');
      }
    });
  }

  function renderTab(activeKey) {
    const tab = tabMap[activeKey];
    if (!tab) return;

    const groups = Array.isArray(tab?.groups) ? tab.groups : [];
    const displayMode = tab?.displayMode || DEFAULT_DISPLAY_MODE;
    const readStyle = tab?.readStyle || 'cards';

    mount.innerHTML = '';

    const top = createEl('div', 'mb-8');
    const titleRow = createEl('div', 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6');
    const h3 = createEl('div', 'text-xl sm:text-2xl font-bold text-teal-900');
    h3.textContent = tab.label ?? '';

    if (displayMode === 'check') {
      const actions = createEl('div', 'flex items-center gap-2 justify-end');
      const resetBtn = createEl(
        'button',
        'px-3 py-2 text-xs sm:text-sm font-semibold rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700'
      );
      resetBtn.type = 'button';
      resetBtn.textContent = '현재 탭 전체 체크 해제';
      resetBtn.addEventListener('click', () => {
        if (!confirm('현재 탭의 체크를 모두 해제할까요?')) return;
        saveState(activeKey, {});
        renderTab(activeKey);
      });
      actions.appendChild(resetBtn);
      titleRow.appendChild(actions);
    }

    titleRow.appendChild(h3);
    top.appendChild(titleRow);
    mount.appendChild(top);

    const listWrap = createEl('div', readStyle === 'text' ? 'space-y-8' : 'space-y-6');

    if (displayMode === 'read') {
      groups.forEach((group) => {
        listWrap.appendChild(readStyle === 'text' ? renderReadGroupText({ group }) : renderReadGroup({ group }));
      });
    } else {
      const state = loadState(activeKey);
      const allItems = groups.flatMap((g) => flattenItems(g));
      const total = allItems.length;
      const done = allItems.reduce((acc, it) => acc + (state[it.id] ? 1 : 0), 0);

      top.appendChild(renderProgressBar({ done, total }));

      function onToggle(itemId, checked) {
        const next = { ...loadState(activeKey), [itemId]: checked };
        if (!checked) delete next[itemId];
        saveState(activeKey, next);
        renderTab(activeKey);
      }

      groups.forEach((group) => {
        listWrap.appendChild(renderGroup({ group, tabKey: activeKey, state, onToggle }));
      });
    }

    mount.appendChild(listWrap);
  }

  // events
  tabsEl.querySelectorAll('button[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-tab');
      if (!key) return;
      setTabButtonState(key);
      renderTab(key);
    });
  });

  const defaultKey =
    (tabsEl.querySelector('button[data-tab][aria-selected="true"]')?.getAttribute('data-tab') || 'packing');
  setTabButtonState(defaultKey);
  renderTab(defaultKey);
}


