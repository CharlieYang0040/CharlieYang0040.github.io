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

function normalizeLooseListHtml(html) {
  if (typeof html !== 'string') return '';
  const trimmed = html.trim();
  if (trimmed === '-' || trimmed === '') return trimmed;

  // `tipsHtml` 등에 `<li>`만 단독으로 들어가면 DOM이 깨질 수 있어 루트 레벨의 orphan <li>를 <ul>로 감쌉니다.
  const wrapper = document.createElement('div');
  wrapper.innerHTML = trimmed;

  let node = wrapper.firstChild;
  while (node) {
    const next = node.nextSibling;

    if (node.nodeType === 1 && node.tagName === 'LI') {
      const ul = document.createElement('ul');
      wrapper.insertBefore(ul, node);

      // 연속된 root-level <li>들을 하나의 <ul>로 이동
      let cur = node;
      while (cur && cur.nodeType === 1 && cur.tagName === 'LI') {
        const curNext = cur.nextSibling;
        ul.appendChild(cur);
        cur = curNext;
      }

      node = cur;
      continue;
    }

    node = next;
  }

  return wrapper.innerHTML;
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

    const tips = normalizeLooseListHtml(day.tipsHtml ?? '');
    tr.appendChild(
      createEl('td', {
        className: 'px-6 py-4 prose-custom timeline-tips',
        html: tips === '-' ? '-' : tips
      })
    );

    tr.appendChild(createEl('td', { className: 'px-6 py-4', text: day.lodging ?? '' }));

    tbody.appendChild(tr);
  });
}

function renderTimelineCards(container, days) {
  container.innerHTML = '';

  if (!Array.isArray(days) || days.length === 0) {
    container.appendChild(
      createEl('div', {
        className: 'px-4 py-4 text-stone-500',
        text: '일정 데이터가 없습니다.'
      })
    );
    return;
  }

  days.forEach((day) => {
    const details = createEl('details', { className: 'timeline-card' });

    const summary = createEl('summary', { className: 'timeline-card__summary' });
    const main = createEl('div', { className: 'timeline-card__summaryMain' });
    main.appendChild(createEl('span', { className: 'timeline-card__day', text: `${day.dayNumber ?? ''}일` }));
    main.appendChild(createEl('span', { className: 'timeline-card__date', text: day.dateLabel ?? '' }));
    main.appendChild(createEl('span', { className: 'timeline-card__location', text: day.locationLabel ?? '' }));
    summary.appendChild(main);
    summary.appendChild(createEl('span', { className: 'timeline-card__chevron', attrs: { 'aria-hidden': 'true' } }));
    details.appendChild(summary);

    const body = createEl('div', { className: 'timeline-card__body' });

    // 상세 활동 (우선순위)
    const planSection = createEl('div', { className: 'timeline-card__section' });
    planSection.appendChild(createEl('div', { className: 'timeline-card__label', text: '상세 활동' }));
    planSection.appendChild(
      createEl('div', { className: 'timeline-card__content prose-custom', html: day.planHtml ?? '' })
    );
    body.appendChild(planSection);

    // 팁 (우선순위)
    const tips = normalizeLooseListHtml(day.tipsHtml ?? '');
    if (tips && tips !== '-') {
      const tipsSection = createEl('div', { className: 'timeline-card__section' });
      tipsSection.appendChild(createEl('div', { className: 'timeline-card__label', text: '팁 / 특이사항' }));
      tipsSection.appendChild(
        createEl('div', { className: 'timeline-card__content prose-custom timeline-tips', html: tips })
      );
      body.appendChild(tipsSection);
    }

    // 숙소 (낮은 우선순위지만 정보는 제공)
    const lodging = (day.lodging ?? '').trim?.() ? day.lodging.trim() : (day.lodging ?? '');
    if (lodging && lodging !== '-') {
      const lodgingSection = createEl('div', { className: 'timeline-card__section' });
      lodgingSection.appendChild(createEl('div', { className: 'timeline-card__label', text: '숙소' }));
      lodgingSection.appendChild(createEl('div', { className: 'timeline-card__content', text: lodging }));
      body.appendChild(lodgingSection);
    }

    details.appendChild(body);
    container.appendChild(details);
  });
}

export async function loadAndRenderTimeline({ tbodyId = 'timelineTbody', cardsId = 'timelineCards', src = DEFAULT_TIMELINE_SRC } = {}) {
  const tbody = document.getElementById(tbodyId);
  const cards = document.getElementById(cardsId);
  if (!tbody && !cards) return;

  if (tbody) {
    tbody.innerHTML = '';
    const loadingTr = createEl('tr', { className: 'hover:bg-stone-50' });
    loadingTr.appendChild(
      createEl('td', { className: 'px-6 py-4 text-stone-500', text: '일정표를 불러오는 중...', attrs: { colspan: 6 } })
    );
    tbody.appendChild(loadingTr);
  }

  if (cards) {
    cards.innerHTML = '';
    cards.appendChild(createEl('div', { className: 'px-4 py-4 text-stone-500', text: '일정표를 불러오는 중...' }));
  }

  try {
    const res = await fetch(src, { cache: 'no-store' });
    if (!res.ok) throw new Error(`timeline fetch failed: ${res.status}`);
    const json = await res.json();
    const { days } = normalizeTimelineJson(json);
    if (tbody) renderTimelineRows(tbody, days);
    if (cards) renderTimelineCards(cards, days);
  } catch (err) {
    if (tbody) {
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
    }

    if (cards) {
      cards.innerHTML = '';
      cards.appendChild(
        createEl('div', {
          className: 'px-4 py-4 text-red-600',
          text: '일정표를 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.'
        })
      );
    }
    // eslint-disable-next-line no-console
    console.error(err);
  }
}


