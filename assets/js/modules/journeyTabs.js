import { setLazyAttrsForImages } from './dom.js';

function renderHighlights(cityData) {
  if (cityData?.highlightsMode === 'cards') {
    const cards = Array.isArray(cityData.highlightsCards) ? cityData.highlightsCards : [];
    return `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        ${cards
          .map(
            (c) => `
          <div class="bg-stone-50 rounded-lg p-4">
            <img src="${c.img}" alt="${c.alt ?? ''}" class="w-full h-48 object-cover rounded-lg mb-3"/>
            <h4 class="font-semibold text-teal-700 mb-2">${c.title}</h4>
            <p class="text-sm text-stone-700">${c.desc}</p>
          </div>
        `
          )
          .join('')}
      </div>
    `;
  }

  const bullets = Array.isArray(cityData?.highlights) ? cityData.highlights : [];
  return `
    <ul class="space-y-3 list-disc list-inside text-stone-700">
      ${bullets.map((b) => `<li><strong>${b.label}:</strong> ${b.text}</li>`).join('')}
    </ul>
  `;
}

function renderLabeledList(items) {
  const list = Array.isArray(items) ? items : [];
  return `
    <ul class="space-y-3 list-disc list-inside text-stone-700">
      ${list.map((it) => `<li><strong>${it.label}:</strong> ${it.text}</li>`).join('')}
    </ul>
  `;
}

export function setupJourneyTabs(journeyData) {
  const journeyContent = document.getElementById('journeyContent');
  if (!journeyContent) return;

  const cities = journeyData?.cities || {};

  const cityButtons = Array.from(document.querySelectorAll('.city-tab-button'));
  const cityTabList = cityButtons[0]?.parentElement;
  if (cityTabList) {
    cityTabList.setAttribute('role', 'tablist');
    cityTabList.setAttribute('aria-label', '지역 선택');
  }

  cityButtons.forEach((btn) => {
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', 'false');
    btn.setAttribute('tabindex', '-1');
  });

  const detailTabButtonsContainer = document.createElement('div');
  detailTabButtonsContainer.className = 'flex flex-wrap gap-2 border-b border-stone-200 pb-4 mb-6';
  detailTabButtonsContainer.setAttribute('role', 'tablist');
  detailTabButtonsContainer.setAttribute('aria-label', '상세 카테고리');

  const detailContentContainer = document.createElement('div');
  detailContentContainer.setAttribute('role', 'tabpanel');

  function updateJourneyContent(cityKey) {
    const cityData = cities[cityKey];
    if (!cityData) return;

    journeyContent.innerHTML = `
      <div class="mb-6">
        <h3 class="text-2xl font-bold text-teal-700">${cityData.heading ?? ''}</h3>
        <p class="text-sm font-medium text-stone-500 mb-2">${cityData.duration}</p>
        <p class="text-stone-700 leading-relaxed">${cityData.description}</p>
      </div>
    `;

    detailTabButtonsContainer.innerHTML = `
      <button data-category="highlights" class="tab-button px-3 py-2 text-xs sm:text-sm font-semibold rounded-md bg-stone-100 hover:bg-teal-600 hover:text-white" role="tab" aria-selected="false">⭐ 하이라이트</button>
      <button data-category="activities" class="tab-button px-3 py-2 text-xs sm:text-sm font-semibold rounded-md bg-stone-100 hover:bg-teal-600 hover:text-white" role="tab" aria-selected="false">🏃 액티비티</button>
      <button data-category="dining" class="tab-button px-3 py-2 text-xs sm:text-sm font-semibold rounded-md bg-stone-100 hover:bg-teal-600 hover:text-white" role="tab" aria-selected="false">🍽️ 다이닝</button>
      <button data-category="lodging" class="tab-button px-3 py-2 text-xs sm:text-sm font-semibold rounded-md bg-stone-100 hover:bg-teal-600 hover:text-white" role="tab" aria-selected="false">🏨 추천 숙소</button>
    `;

    journeyContent.appendChild(detailTabButtonsContainer);
    journeyContent.appendChild(detailContentContainer);

    const detailTabButtons = Array.from(detailTabButtonsContainer.querySelectorAll('.tab-button'));

    function updateDetailContent(category) {
      if (category === 'highlights') {
        detailContentContainer.innerHTML = `<div class="prose-custom">${renderHighlights(cityData)}</div>`;
      } else if (category === 'activities') {
        detailContentContainer.innerHTML = `<div class="prose-custom">${renderLabeledList(cityData.activities)}</div>`;
      } else if (category === 'dining') {
        detailContentContainer.innerHTML = `<div class="prose-custom">${renderLabeledList(cityData.dining)}</div>`;
      } else if (category === 'lodging') {
        detailContentContainer.innerHTML = `<div class="prose-custom">${renderLabeledList(cityData.lodging)}</div>`;
      } else {
        detailContentContainer.innerHTML = '';
      }

      setLazyAttrsForImages(detailContentContainer);

      detailTabButtons.forEach((btn) => {
        const active = btn.dataset.category === category;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-selected', active ? 'true' : 'false');
        btn.setAttribute('tabindex', active ? '0' : '-1');
        if (!active) {
          btn.classList.remove('bg-teal-700', 'text-white');
          btn.classList.add('bg-stone-100');
        }
      });
    }

    detailTabButtons.forEach((button) => {
      button.addEventListener('click', () => updateDetailContent(button.dataset.category));
    });

    updateDetailContent('highlights');
  }

  function selectCityButton(btn) {
    cityButtons.forEach((b) => {
      b.classList.remove('bg-teal-600', 'text-white', 'active');
      b.classList.add('text-stone-600');
      b.setAttribute('aria-selected', 'false');
      b.setAttribute('tabindex', '-1');
    });

    btn.classList.add('bg-teal-600', 'text-white', 'active');
    btn.classList.remove('text-stone-600');
    btn.setAttribute('aria-selected', 'true');
    btn.setAttribute('tabindex', '0');

    updateJourneyContent(btn.dataset.city);
  }

  cityButtons.forEach((button) => {
    button.addEventListener('click', () => selectCityButton(button));
  });

  const defaultBtn = document.querySelector('.city-tab-button[data-city="sydney"]');
  if (defaultBtn) selectCityButton(defaultBtn);
}


