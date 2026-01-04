import { fetchJson } from './dom.js';

const BOOKINGS_SRC = 'assets/data/bookings.json';

function createEl(tag, className, html) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (html !== undefined) el.innerHTML = html;
  return el;
}

export async function loadAndRenderBookingsTable({ tbodyId = 'bookingsTbody', totalId = 'bookingsTotalCost' } = {}) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  tbody.innerHTML = '';
  const loadingRow = document.createElement('tr');
  loadingRow.className = 'border-b border-stone-200';
  loadingRow.appendChild(createEl('td', 'px-4 py-3 text-stone-500', '불러오는 중...'));
  loadingRow.lastChild.colSpan = 5;
  tbody.appendChild(loadingRow);

  try {
    const data = await fetchJson(BOOKINGS_SRC);
    const groups = Array.isArray(data?.groups) ? data.groups : [];

    tbody.innerHTML = '';

    groups.forEach((group) => {
      const items = Array.isArray(group.items) ? group.items : [];
      const rowspan = items.length || 1;

      items.forEach((it, idx) => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-stone-200';

        if (idx === 0) {
          const tdCat = document.createElement('td');
          tdCat.className = `px-4 py-3 font-semibold ${group.categoryClass || ''}`.trim();
          tdCat.rowSpan = rowspan;
          tdCat.textContent = group.categoryLabel || '';
          tr.appendChild(tdCat);
        }

        const tdItem = document.createElement('td');
        tdItem.className = 'px-4 py-3';
        tdItem.textContent = it.item || '';

        const tdWhen = document.createElement('td');
        tdWhen.className = 'px-4 py-3 text-center';
        tdWhen.textContent = it.when ?? '-';

        const tdCost = document.createElement('td');
        tdCost.className = `px-4 py-3 text-right ${it.costClass || ''}`.trim();
        tdCost.textContent = it.cost || '';

        const tdNote = document.createElement('td');
        tdNote.className = `px-4 py-3 text-center ${it.noteClass || ''}`.trim();
        tdNote.textContent = it.note ?? '-';

        tr.appendChild(tdItem);
        tr.appendChild(tdWhen);
        tr.appendChild(tdCost);
        tr.appendChild(tdNote);

        tbody.appendChild(tr);
      });
    });

    const totalEl = document.getElementById(totalId);
    if (totalEl && data?.totalCostText) totalEl.textContent = data.totalCostText;
  } catch (e) {
    tbody.innerHTML = '';
    const tr = document.createElement('tr');
    tr.className = 'border-b border-stone-200';
    const td = document.createElement('td');
    td.className = 'px-4 py-3 text-red-600';
    td.colSpan = 5;
    td.textContent = '예약 항목 표를 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.';
    tr.appendChild(td);
    tbody.appendChild(tr);
    // eslint-disable-next-line no-console
    console.error(e);
  }
}


