const DEFAULT_TIMELINE_SRC = 'assets/data/timeline.json';

function createEl(tagName, { className, text, html, attrs } = {}) {
  const el = document.createElement(tagName);
  if (className) el.className = className;
  if (typeof text === 'string') el.textContent = text;
  if (typeof html === 'string') el.innerHTML = html;
  if (attrs && typeof attrs === 'object') {
    Object.entries(attrs).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      el.setAttribute(k, String(v));
    });
  }
  return el;
}

function normalizeTimelineJson(json) {
  if (!json || typeof json !== 'object') return { days: [] };
  const days = Array.isArray(json.days) ? json.days : [];
  return { days };
}

function renderTimelineRows(tbody, days) {
  tbody.innerHTML = '';

  if (!Array.isArray(days) || days.length === 0) {
    const tr = createEl('tr', { className: 'hover:bg-stone-50' });
    tr.appendChild(createEl('td', { className: 'px-6 py-4 text-stone-500', text: '일정 데이터가 없습니다.', attrs: { colspan: 6 } }));
    tbody.appendChild(tr);
    return;
  }

  days.forEach((day) => {
    const tr = createEl('tr', { className: 'hover:bg-stone-50' });

    tr.appendChild(createEl('td', { className: 'px-6 py-4 font-medium', text: `${day.dayNumber ?? ''}일` }));
    tr.appendChild(createEl('td', { className: 'px-6 py-4', text: day.dateLabel ?? '' }));
    tr.appendChild(createEl('td', { className: 'px-6 py-4 font-semibold', text: day.locationLabel ?? '' }));

    tr.appendChild(createEl('td', { className: 'px-6 py-4 prose-custom', html: day.planHtml ?? '' }));

    const tips = day.tipsHtml ?? '';
    tr.appendChild(
      createEl('td', {
        className: 'px-6 py-4',
        html: tips === '-' ? '-' : tips
      })
    );

    tr.appendChild(createEl('td', { className: 'px-6 py-4', text: day.lodging ?? '' }));

    tbody.appendChild(tr);
  });
}

export async function loadAndRenderTimeline({ tbodyId = 'timelineTbody', src = DEFAULT_TIMELINE_SRC } = {}) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  tbody.innerHTML = '';
  const loadingTr = createEl('tr', { className: 'hover:bg-stone-50' });
  loadingTr.appendChild(createEl('td', { className: 'px-6 py-4 text-stone-500', text: '일정표를 불러오는 중...', attrs: { colspan: 6 } }));
  tbody.appendChild(loadingTr);

  try {
    const res = await fetch(src, { cache: 'no-store' });
    if (!res.ok) throw new Error(`timeline fetch failed: ${res.status}`);
    const json = await res.json();
    const { days } = normalizeTimelineJson(json);
    renderTimelineRows(tbody, days);
  } catch (err) {
    tbody.innerHTML = '';
    const tr = createEl('tr', { className: 'hover:bg-stone-50' });
    tr.appendChild(
      createEl('td', {
        className: 'px-6 py-4 text-red-600',
        text: '일정표를 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.',
        attrs: { colspan: 6 }
      })
    );
    tbody.appendChild(tr);
    // eslint-disable-next-line no-console
    console.error(err);
  }
}


