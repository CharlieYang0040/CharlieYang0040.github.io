import { loadAndRenderTimeline } from './timelineRenderer.js';

function setLazyAttrsForImages(container) {
  if (!container) return;
  container.querySelectorAll('img').forEach((img) => {
    if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
    if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async');
  });
}

function setupPrepAccordion(prepData) {
  const prepAccordion = document.getElementById('prepAccordion');
  if (!prepAccordion) return;

  Object.keys(prepData).forEach((key, idx) => {
    const item = prepData[key];
    const accordionItem = document.createElement('div');
    accordionItem.className = 'bg-white rounded-lg shadow-sm border border-stone-200 overflow-hidden';

    const contentId = `prepAccordionContent_${idx}`;
    accordionItem.innerHTML = `
      <button class="accordion-button w-full text-left flex justify-between items-center font-semibold text-base sm:text-lg hover:bg-stone-50 transition-colors duration-200"
        aria-expanded="false" aria-controls="${contentId}">
        <span>${item.title}</span>
        <span class="transform transition-transform duration-300 text-teal-600" aria-hidden="true">▼</span>
      </button>
      <div id="${contentId}" class="px-5 pb-5 text-sm sm:text-base text-stone-600 leading-relaxed hidden prose-custom">
        <p>${item.content}</p>
      </div>
    `;

    prepAccordion.appendChild(accordionItem);

    const button = accordionItem.querySelector('button');
    const content = accordionItem.querySelector(`#${contentId}`);
    const arrow = accordionItem.querySelector('span[aria-hidden="true"]');

    button.addEventListener('click', () => {
      const isHidden = content.classList.contains('hidden');
      if (isHidden) {
        content.classList.remove('hidden');
        arrow.classList.add('rotate-180');
        button.setAttribute('aria-expanded', 'true');
      } else {
        content.classList.add('hidden');
        arrow.classList.remove('rotate-180');
        button.setAttribute('aria-expanded', 'false');
      }
    });
  });
}

function setupJourneyTabs(journeyData) {
  const journeyContent = document.getElementById('journeyContent');
  if (!journeyContent) return;

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
    const cityData = journeyData[cityKey];
    if (!cityData) return;

    journeyContent.innerHTML = `
      <div class="mb-6">
        <h3 class="text-2xl font-bold text-teal-700">${
          {
            sydney: '시드니',
            christchurch: '크라이스트처치',
            tekapo: '테카포 & 마운트쿡',
            queenstown: '퀸스타운',
            auckland: '오클랜드'
          }[cityKey]
        }</h3>
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
      detailContentContainer.innerHTML = `<div class="prose-custom">${cityData[category]}</div>`;
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

function setupNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('.content-card');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      if (window.pageYOffset >= sectionTop - 80) current = section.getAttribute('id') || '';
    });

    navLinks.forEach((link) => {
      link.classList.remove('active');
      if (link.getAttribute('href')?.substring(1) === current) link.classList.add('active');
    });
  });

  navLinks.forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const href = this.getAttribute('href');
      if (!href) return;
      const targetElement = document.querySelector(href);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

function initMaps() {
  if (!window.L) return;

  const locations = {
    sydney_airport: { lat: -33.9461, lng: 151.1772, name: '시드니 공항 (SYD)' },
    sydney_cbd: { lat: -33.8651, lng: 151.2099, name: '시드니 CBD' },
    world_square: { lat: -33.8769, lng: 151.2071, name: 'World Square' },
    hyde_park: { lat: -33.8737, lng: 151.2135, name: '하이드 파크' },
    paddys_market: { lat: -33.8796, lng: 151.203, name: '패디스 마켓' },
    chinatown: { lat: -33.8782, lng: 151.2053, name: '차이나타운' },
    darling_harbour: { lat: -33.8737, lng: 151.1989, name: '달링 하버' },
    sydney_bondi: { lat: -33.8915, lng: 151.2767, name: '본다이 비치' },
    bondi_icebergs: { lat: -33.8943, lng: 151.2747, name: '본다이 아이스버그' },
    sydney_watsons: { lat: -33.8431, lng: 151.2825, name: '왓슨스 베이' },
    gap_park: { lat: -33.8411, lng: 151.2803, name: '갭팍 (Gap Park)' },
    sydney_quay: { lat: -33.861, lng: 151.2109, name: '서큘러 키' },
    opera_house: { lat: -33.8568, lng: 151.2153, name: '오페라 하우스' },
    harbour_bridge: { lat: -33.8523, lng: 151.2108, name: '하버 브리지' },
    the_rocks: { lat: -33.859, lng: 151.2076, name: '더 록스' },
    sydney_uni: { lat: -33.8886, lng: 151.1873, name: '시드니 대학교' },
    sydney_observatory: { lat: -33.859, lng: 151.2052, name: '천문대 언덕' },
    barangaroo: { lat: -33.8597, lng: 151.2014, name: '바랑가루' },
    christchurch: { lat: -43.5321, lng: 172.6362, name: '크라이스트처치' },
    tekapo: { lat: -44.0046, lng: 170.4771, name: '테카포 호수' },
    mountcook: { lat: -43.7335, lng: 170.0962, name: '마운트쿡' },
    queenstown: { lat: -45.0312, lng: 168.6626, name: '퀸스타운' },
    auckland: { lat: -36.8485, lng: 174.7633, name: '오클랜드' }
  };

  const sydneyMapEl = document.getElementById('sydneyMap');
  const nzMapEl = document.getElementById('newZealandMap');
  if (!sydneyMapEl || !nzMapEl) return;

  // 시드니 지도
  const sydneyMap = L.map('sydneyMap').setView([-33.8651, 151.2099], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(sydneyMap);

  const day1Locations = ['sydney_airport', 'sydney_cbd', 'world_square', 'hyde_park', 'paddys_market', 'chinatown', 'darling_harbour'];
  const day2Locations = ['sydney_bondi', 'bondi_icebergs', 'sydney_watsons', 'gap_park', 'sydney_quay'];
  const day3Locations = ['opera_house', 'harbour_bridge', 'the_rocks', 'sydney_uni', 'sydney_observatory', 'barangaroo'];

  day1Locations.forEach((key) => {
    const redIcon = L.divIcon({
      className: 'custom-div-icon',
      html: "<div style='background-color:#dc2626;width:12px;height:12px;border-radius:50%;border:2px solid white;'></div>",
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
    L.marker([locations[key].lat, locations[key].lng], { icon: redIcon })
      .addTo(sydneyMap)
      .bindPopup(`<strong>1일차 (1/19):</strong> ${locations[key].name}`);
  });

  day2Locations.forEach((key) => {
    const blueIcon = L.divIcon({
      className: 'custom-div-icon',
      html: "<div style='background-color:#2563eb;width:12px;height:12px;border-radius:50%;border:2px solid white;'></div>",
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
    L.marker([locations[key].lat, locations[key].lng], { icon: blueIcon })
      .addTo(sydneyMap)
      .bindPopup(`<strong>2일차 (1/20):</strong> ${locations[key].name}`);
  });

  day3Locations.forEach((key) => {
    const greenIcon = L.divIcon({
      className: 'custom-div-icon',
      html: "<div style='background-color:#16a34a;width:12px;height:12px;border-radius:50%;border:2px solid white;'></div>",
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
    L.marker([locations[key].lat, locations[key].lng], { icon: greenIcon })
      .addTo(sydneyMap)
      .bindPopup(`<strong>3일차 (1/21):</strong> ${locations[key].name}`);
  });

  L.polyline(
    [
      [locations.sydney_airport.lat, locations.sydney_airport.lng],
      [locations.sydney_cbd.lat, locations.sydney_cbd.lng],
      [locations.world_square.lat, locations.world_square.lng],
      [locations.hyde_park.lat, locations.hyde_park.lng],
      [locations.paddys_market.lat, locations.paddys_market.lng],
      [locations.chinatown.lat, locations.chinatown.lng],
      [locations.darling_harbour.lat, locations.darling_harbour.lng]
    ],
    { color: '#dc2626', weight: 3, opacity: 0.8 }
  ).addTo(sydneyMap);

  L.polyline(
    [
      [locations.sydney_cbd.lat, locations.sydney_cbd.lng],
      [locations.sydney_bondi.lat, locations.sydney_bondi.lng],
      [locations.bondi_icebergs.lat, locations.bondi_icebergs.lng],
      [locations.sydney_watsons.lat, locations.sydney_watsons.lng],
      [locations.gap_park.lat, locations.gap_park.lng],
      [locations.sydney_quay.lat, locations.sydney_quay.lng]
    ],
    { color: '#2563eb', weight: 3, opacity: 0.8 }
  ).addTo(sydneyMap);

  L.polyline(
    [
      [locations.sydney_quay.lat, locations.sydney_quay.lng],
      [locations.opera_house.lat, locations.opera_house.lng],
      [locations.harbour_bridge.lat, locations.harbour_bridge.lng],
      [locations.the_rocks.lat, locations.the_rocks.lng],
      [locations.sydney_uni.lat, locations.sydney_uni.lng],
      [locations.sydney_observatory.lat, locations.sydney_observatory.lng],
      [locations.barangaroo.lat, locations.barangaroo.lng]
    ],
    { color: '#16a34a', weight: 3, opacity: 0.8 }
  ).addTo(sydneyMap);

  // 뉴질랜드 지도
  const newZealandMap = L.map('newZealandMap').setView([-41.5, 172], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(newZealandMap);

  const nzCities = ['christchurch', 'tekapo', 'mountcook', 'queenstown', 'auckland'];
  const nzDates = {
    christchurch: '5일차 (1/23)',
    tekapo: '6일차 (1/24)',
    mountcook: '7일차 (1/25)',
    queenstown: '8-9일차 (1/26-27)',
    auckland: '10-11일차 (1/28-29)'
  };

  nzCities.forEach((key) => {
    L.marker([locations[key].lat, locations[key].lng])
      .addTo(newZealandMap)
      .bindPopup(`<strong>${nzDates[key]}:</strong> ${locations[key].name}`);
  });

  L.polyline(
    [
      [locations.sydney_airport.lat, locations.sydney_airport.lng],
      [locations.christchurch.lat, locations.christchurch.lng]
    ],
    { color: '#0d9488', weight: 3, opacity: 0.7, dashArray: '8, 12' }
  ).addTo(newZealandMap);

  L.polyline(
    [
      [locations.christchurch.lat, locations.christchurch.lng],
      [locations.tekapo.lat, locations.tekapo.lng],
      [locations.mountcook.lat, locations.mountcook.lng],
      [locations.queenstown.lat, locations.queenstown.lng]
    ],
    { color: '#f97316', weight: 4 }
  ).addTo(newZealandMap);

  L.polyline(
    [
      [locations.queenstown.lat, locations.queenstown.lng],
      [locations.auckland.lat, locations.auckland.lng]
    ],
    { color: '#0d9488', weight: 3, opacity: 0.7, dashArray: '8, 12' }
  ).addTo(newZealandMap);
}

function initCharts() {
  if (!window.Chart) return;
  const barCanvas = document.getElementById('costBarChart');
  const doughnutCanvas = document.getElementById('costDoughnutChart');
  if (!barCanvas || !doughnutCanvas) return;

  const costBarCtx = barCanvas.getContext('2d');
  new Chart(costBarCtx, {
    type: 'bar',
    data: {
      labels: ['항공료', '숙박비', '투어/액티비티', '특별 다이닝', '렌터카'],
      datasets: [
        {
          label: '예상 비용 (만원, 2인 기준)',
          data: [320, 360, 237, 102, 75],
          backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'],
          borderColor: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'],
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(context) {
              return `${context.parsed.y}만원`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#e7e5e4' },
          ticks: {
            callback(value) {
              return `${value}만원`;
            }
          }
        },
        x: { grid: { display: false } }
      }
    }
  });

  const costDoughnutCtx = doughnutCanvas.getContext('2d');
  new Chart(costDoughnutCtx, {
    type: 'doughnut',
    data: {
      labels: [
        '항공료 (19.5%)',
        '숙박비 (21.9%)',
        '일반 식비 (20.7%)',
        '투어/액티비티 (14.4%)',
        '특별 다이닝 (6.2%)',
        '렌터카 (4.6%)',
        '교통 & 기타 (11.0%)'
      ],
      datasets: [
        {
          data: [3200, 3600, 3400, 2370, 1020, 750, 1800],
          backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444', '#6b7280'],
          hoverOffset: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { size: 10 },
            padding: 15
          }
        },
        tooltip: {
          callbacks: {
            label(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((context.parsed / total) * 100).toFixed(1);
              return `${context.label.split(' (')[0]}: ₩${context.parsed.toLocaleString()}만원 (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

function setupLazySectionInit() {
  let mapsInitialized = false;
  let chartsInitialized = false;

  const mapSection = document.getElementById('map-route');
  const budgetSection = document.getElementById('budget');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        if (entry.target === mapSection && !mapsInitialized) {
          mapsInitialized = true;
          initMaps();
        }
        if (entry.target === budgetSection && !chartsInitialized) {
          chartsInitialized = true;
          initCharts();
        }
      });
    },
    { rootMargin: '200px 0px' }
  );

  if (mapSection) observer.observe(mapSection);
  if (budgetSection) observer.observe(budgetSection);
}

document.addEventListener('DOMContentLoaded', async () => {
  const prepData = {
    visa: {
      title: '✈️ 입국 비자 (ETA / NZeTA)',
      content:
        "<strong>호주 (ETA):</strong> 대한민국 여권 소지자는 관광 목적 방문 시 전자여행허가(ETA)가 필수입니다. 반드시 정부 공식 'Australian ETA' 앱을 통해서만 신청해야 합니다. 출국 전 발급을 완료하세요.<br><br><strong>뉴질랜드 (NZeTA):</strong> 비자 면제 국가이지만, 입국 전 뉴질랜드 전자여행허가(NZeTA)를 발급받아야 합니다. 신청 시 국제 관광객 보존 및 관광 부담금(IVL)도 함께 결제됩니다."
    },
    car: {
      title: '🚗 렌터카 예약 (남섬 필수)',
      content:
        '<strong>필요성:</strong> 남섬의 광활한 풍경을 자유롭게 즐기기 위한 최적의 방법입니다.<br><br><strong>예약 시점:</strong> 1월은 최성수기이므로 최소 2~3개월 전, 최대한 빨리 예약하는 것이 좋습니다.<br><br><strong>추천 업체:</strong> Pegasus, RaD Car Hire 등 현지 업체는 경쟁력 있는 가격을 제공합니다. <strong>크라이스트처치 픽업 → 퀸스타운 반납</strong> 편도 대여 가능 여부를 확인하세요.<br><br><strong>보험:</strong> 만약을 대비해 완전 면책 보험(Full Cover/Zero Excess) 가입을 강력히 권장합니다.<br><br><strong>면허:</strong> 유효한 영문 운전면허증 또는 국제운전면허증을 반드시 소지해야 합니다.'
    },
    info: {
      title: '💡 날씨, 준비물 및 기타',
      content:
        '<strong>1월 날씨:</strong> 따뜻하고 화창한 여름이지만, 산악 지역은 서늘할 수 있어 변화무쌍한 날씨에 대비해야 합니다. 레이어드 착용이 가능한 옷(가벼운 여름 옷, 긴팔, 방수 자켓)을 준비하세요.<br><br><strong>필수품:</strong> 자외선 차단 지수가 높은 선크림, 선글라스, 모자는 뉴질랜드의 강한 햇볕에 필수적입니다.<br><br><strong>투어 예약:</strong> 테카포 별 관측 투어, 퀸스타운 온센 핫풀 등 인기가 많은 액티비티는 수개월 전 예약이 필요할 수 있으므로 최대한 빨리 예약하세요.'
    }
  };

  const journeyData = {
    sydney: {
      duration: '4박 5일 (1/19 월 ~ 1/23 금)',
      description:
        '시드니의 상징적인 랜드마크, 아름다운 동부 해안, 트렌디한 맛집과 쇼핑을 모두 아우르는 맞춤형 플랜입니다. 도시의 활기와 자연의 아름다움, 현지 감성을 모두 느껴보세요.',
      highlights: `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div class="bg-stone-50 rounded-lg p-4">
            <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop" alt="시드니 하버" class="w-full h-48 object-cover rounded-lg mb-3"/>
            <h4 class="font-semibold text-teal-700 mb-2">왓슨스 베이 페리</h4>
            <p class="text-sm text-stone-700">페리에서 바라보는 하버 브리지와 오페라 하우스의 일몰 풍경. 일몰 시간 탑승, 우측 좌석 추천.</p>
          </div>
          <div class="bg-stone-50 rounded-lg p-4">
            <img src="https://images.unsplash.com/photo-1566130292607-0ba1ce7ef2e7?w=400&h=250&fit=crop" alt="본다이 비치" class="w-full h-48 object-cover rounded-lg mb-3"/>
            <h4 class="font-semibold text-teal-700 mb-2">본다이 아이스버그</h4>
            <p class="text-sm text-stone-700">바다와 이어진 인피니티 풀에서 시드니의 '힙'한 감성을 담은 인생 사진을 남겨보세요.</p>
          </div>
          <div class="bg-stone-50 rounded-lg p-4">
            <img src="https://images.unsplash.com/photo-1540904854851-9b02f7155d8b?w=400&h=250&fit=crop" alt="천문대 언덕" class="w-full h-48 object-cover rounded-lg mb-3"/>
            <h4 class="font-semibold text-teal-700 mb-2">천문대 언덕 선셋</h4>
            <p class="text-sm text-stone-700">하버 브리지 너머로 물드는 시드니 노을 감상. 최고의 로맨틱 스팟으로 피크닉 매트 준비 권장.</p>
          </div>
          <div class="bg-stone-50 rounded-lg p-4">
            <img src="https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=250&fit=crop" alt="블루마운틴" class="w-full h-48 object-cover rounded-lg mb-3"/>
            <h4 class="font-semibold text-teal-700 mb-2">블루마운틴 & 동물원</h4>
            <p class="text-sm text-stone-700">대자연의 경이로움과 코알라, 캥거루 만남을 하루에 경험. 링컨스 락 포함 투어 확인 필수.</p>
          </div>
        </div>
      `,
      activities: `
        <ul class="space-y-3 list-disc list-inside text-stone-700">
          <li><strong>시티 중심부 탐방 (1일차):</strong> 공항 도착 후, 하이드 파크 산책, 월드 스퀘어에서 피터 알렉산더 잠옷 쇼핑, Stussy 매장 방문 후 패디스 마켓에서 기념품을 쇼핑하는 코스입니다. 패디스 마켓은 일찍 닫으니 시간을 확인하세요.</li>
          <li><strong>동부 해안 정복 (2일차):</strong> 시티 중심부에서 333번 급행 버스를 이용해 본다이 비치까지 약 45분간 이동합니다. 오전에는 해변의 활기를 느끼고, 오후에는 왓슨스 베이로 넘어가 갭팍의 절경을 감상합니다.</li>
          <li><strong>시드니 아이콘 탐방 (3일차):</strong> 오페라 하우스 주변을 산책하고, 하버 브리지 파일런 전망대에 오르면 클라이밍보다 저렴하게 멋진 뷰를 즐길 수 있습니다.</li>
          <li><strong>대학교 & 선셋 투어 (3일차):</strong> 영화 속 한 장면 같은 시드니 대학교에서 사진을 찍고, 해질녘에는 천문대 언덕으로 이동해 최고의 선셋을 감상하는 로맨틱 코스입니다.</li>
        </ul>
      `,
      dining: `
        <ul class="space-y-3 list-disc list-inside text-stone-700">
          <li><strong>Macchiato Wood Fire Pizza:</strong> 시드니 도착 후 첫 식사로 추천하는 맛있는 화덕피자 맛집.</li>
          <li><strong>Hurricane's Grill Circular Quay:</strong> 시그니처 메뉴인 폭립을 즐길 수 있는 곳. 환상적인 뷰를 위해 창가 좌석으로 예약 요청하는 것이 좋습니다.</li>
          <li><strong>The Rocks의 펍:</strong> The Fortune of War, The Glenmore 등 유서 깊은 펍에서 피쉬 앤 칩스와 함께 시원한 맥주 한 잔의 여유를 즐겨보세요.</li>
          <li><strong>Barangaroo 다이닝:</strong> 천문대 선셋 감상 후 저녁 식사를 즐기기 좋은 곳. 모던한 분위기의 고급 레스토랑이 많습니다.</li>
        </ul>
      `,
      lodging: `
        <ul class="space-y-3 list-disc list-inside text-stone-700">
          <li><strong>초반 2박 (호텔):</strong> 시티 중심부(CBD)인 Town Hall, Wynyard, Circular Quay 근처를 추천합니다. 공항 및 주요 관광지 접근성이 매우 좋습니다.</li>
          <li><strong>후반 2박 (에어비앤비):</strong> 현지 감성을 느낄 수 있는 Surry Hills, Paddington, Newtown 지역을 추천합니다. 예쁜 카페, 맛집, 편집샵이 많아 색다른 경험을 할 수 있습니다.</li>
          <li><strong>참고:</strong> 록스 마켓은 주말(토,일)에만 열리므로 월-금 일정상 방문은 어렵습니다. 하지만 록스 지역 자체의 매력은 여전하니 산책 코스로는 좋습니다.</li>
        </ul>
      `
    },
    christchurch: {
      duration: '1박 2일 (1/23 금 ~ 1/24 토)',
      description:
        '뉴질랜드 남섬의 관문이자 재건의 상징인 크라이스트처치에서 여정을 시작합니다. 영국적인 매력의 정원과 현대적으로 재탄생한 도심을 탐험하며 편안한 첫날을 보내세요.',
      highlights: `
        <ul class="space-y-3 list-disc list-inside text-stone-700">
          <li><strong>크라이스트처치 식물원:</strong> 아름답게 가꿔진 정원을 거닐며 장시간 비행의 피로를 푸는 평화로운 시간을 가집니다. 입장료는 무료이며, 1월에는 저녁 9시까지 개장합니다.</li>
          <li><strong>카드보드 대성당:</strong> 지진 이후 희망의 상징으로 지어진 독특한 종이 대성당의 건축미를 감상합니다. 소정의 가이드 투어($5)로 그 역사를 더 깊이 이해할 수 있습니다.</li>
          <li><strong>트램웨이 레스토랑:</strong> 빈티지 트램 안에서 즐기는 파인 다이닝은 허니문의 첫날 밤을 위한 특별하고 로맨틱한 경험입니다. 36석 한정으로 예약은 필수입니다.</li>
        </ul>
      `,
      activities: `
        <ul class="space-y-3 list-disc list-inside text-stone-700">
          <li><strong>렌터카 인수:</strong> 공항 도착 후 바로 렌터카를 인수하여 남섬 여행의 기동성을 확보합니다. Pegasus나 RaD Car Hire는 공항 셔틀을 제공합니다.</li>
          <li><strong>시내 워킹 투어:</strong> 식물원부터 뉴 리젠트 스트리트까지 걸으며 도시의 재건 과정과 새로운 활기를 느껴봅니다. 강변을 따라 걷는 길도 아름답습니다.</li>
        </ul>
      `,
      dining: `
        <ul class="space-y-3 list-disc list-inside text-stone-700">
          <li><strong>Christchurch Tramway Restaurant:</strong> 반드시 사전 예약이 필요한 독특한 다이닝 경험. 1인당 $149부터 시작 (변동 가능).</li>
          <li><strong>The Curator's House:</strong> 식물원 내에 위치한 아름다운 스페인 레스토랑으로 타파스와 빠에야가 유명합니다.</li>
          <li><strong>The Priory Restaurant:</strong> 프랑스풍 비스트로에서 즐기는 아늑한 저녁.</li>
        </ul>
      `,
      lodging: `
        <ul class="space-y-3 list-disc list-inside text-stone-700">
          <li><strong>시내 중심가 호텔:</strong> 식물원, 레스토랑 등 주요 명소에 대한 접근성이 좋은 곳. The George, Sudima Christchurch City 등을 고려해볼 수 있습니다.</li>
          <li><strong>공항 근처 호텔:</strong> 늦은 도착이나 이른 출발 시 편리한 옵션. Novotel Christchurch Airport가 좋은 선택입니다.</li>
        </ul>
      `
    },
    tekapo: {
      duration: '2박 3일 (1/24 토 ~ 1/26 월)',
      description:
        '빙하가 만들어낸 청록색 호수와 세계적인 밤하늘 보호구역이 있는 맥켄지 분지의 심장부로 떠납니다. 낮에는 대자연의 경이로움을, 밤에는 쏟아지는 별들의 향연을 만끽하세요.',
      highlights: `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div class="bg-stone-50 rounded-lg p-4">
            <img src="https://images.unsplash.com/photo-1419833479618-c595710249f3?w=400&h=250&fit=crop" alt="테카포 별밤" class="w-full h-48 object-cover rounded-lg mb-3"/>
            <h4 class="font-semibold text-teal-700 mb-2">Dark Sky Project 별 관측 투어</h4>
            <p class="text-sm text-stone-700">Summit Experience: 성인 NZ$209, 어린이 NZ$169 / Crater Experience: 성인 NZ$129, 어린이 NZ$95. 세계에서 가장 큰 국제 밤하늘 보호구역에서 16인치 망원경 체험. 예약 필수.</p>
          </div>
          <div class="bg-stone-50 rounded-lg p-4">
            <img src="https://images.unsplash.com/photo-1544550285-4c9b94bb6137?w=400&h=250&fit=crop" alt="후커 밸리" class="w-full h-48 object-cover rounded-lg mb-3"/>
            <h4 class="font-semibold text-teal-700 mb-2">후커 밸리 트랙</h4>
            <p class="text-sm text-stone-700">아오라키/마운트쿡을 바라보며 걷는 왕복 3시간 트레킹. 빙하 조각이 떠있는 후커 호수가 최종 목적지.</p>
          </div>
          <div class="bg-stone-50 rounded-lg p-4">
            <img src="https://images.unsplash.com/photo-1552733407-6c4fb1353681?w=400&h=250&fit=crop" alt="푸카키 호수" class="w-full h-48 object-cover rounded-lg mb-3"/>
            <h4 class="font-semibold text-teal-700 mb-2">푸카키 호수 전망</h4>
            <p class="text-sm text-stone-700">마운트쿡 배경의 밀키블루 호수. 남섬 여행의 상징적 장면이며 방문객센터에서 신선한 연어회 맛보기 가능.</p>
          </div>
          <div class="bg-stone-50 rounded-lg p-4">
            <img src="https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=400&h=250&fit=crop" alt="테카포 온천" class="w-full h-48 object-cover rounded-lg mb-3"/>
            <h4 class="font-semibold text-teal-700 mb-2">테카포 스타게이징 핫풀</h4>
            <p class="text-sm text-stone-700">성인 NZ$119, 어린이 NZ$79. 1시간 30분 야외/실내 별 관측과 온천에서의 별자리 감상. 빨간 조명의 온천에서 은하수를 감상하는 특별한 경험.</p>
          </div>
        </div>
      `,
      activities: `
        <ul class="space-y-3 list-disc list-inside text-stone-700">
          <li><strong>경치 좋은 드라이브:</strong> 크라이스트처치에서 테카포, 테카포에서 마운트쿡으로 이어지는 여정 자체가 하나의 액티비티입니다. 곳곳의 전망대에서 멈춰 풍경을 즐기세요.</li>
          <li><strong>트레킹:</strong> 후커 밸리 트랙 외에도 태즈먼 빙하 뷰 트랙 등 다양한 난이도의 트레킹 코스를 즐길 수 있습니다. 항상 편안한 신발과 물, 간식을 준비하세요.</li>
          <li><strong>사진 촬영:</strong> 선한 목자의 교회, 푸카키 호수 등 모든 곳이 포토 스팟입니다. 특히 해질녘과 새벽 시간의 빛이 아름답습니다.</li>
        </ul>
      `,
      dining: `
        <ul class="space-y-3 list-disc list-inside text-stone-700">
          <li><strong>Kohan Restaurant:</strong> 신선한 연어 덮밥 등 맛있는 일식을 제공하는 테카포의 인기 맛집. 창가 자리는 호수 뷰가 좋습니다.</li>
          <li><strong>Dark Sky Diner:</strong> 멋진 호수 전망과 함께 현대적인 뉴질랜드 요리를 즐길 수 있는 곳.</li>
          <li><strong>Astro Cafe:</strong> 마운트 존 정상에서 탁 트인 전망과 함께 커피 한 잔의 여유를 즐길 수 있습니다 (운영 시간 및 도로 개방 여부 확인 필수).</li>
        </ul>
      `,
      lodging: `
        <ul class="space-y-3 list-disc list-inside text-stone-700">
          <li><strong>테카포 호수:</strong> Peppers Bluewater Resort, Mantra Lake Tekapo 등 호수 전망의 리조트.</li>
          <li><strong>마운트쿡 빌리지:</strong> Aoraki Court Motel, The Hermitage Hotel 등 산악 전망의 숙소.</li>
          <li><strong>✨ 특별한 경험:</strong> Skylark Cabin (트와이젤), Mt Cook Lakeside Retreat 등 프라이빗하고 럭셔리한 숙소는 최고의 허니문 경험을 선사합니다 (수개월 전 예약 필수).</li>
        </ul>
      `
    },
    queenstown: {
      duration: '2박 3일 (1/26 월 ~ 1/28 수)',
      description:
        "남반구의 '모험 수도' 퀸스타운에서 스릴과 평온을 동시에 경험합니다. 짜릿한 액티비티와 그림 같은 풍경, 그리고 로맨틱한 순간들이 완벽한 조화를 이룹니다.",
      highlights: `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div class="bg-stone-50 rounded-lg p-4">
            <img src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=400&h=250&fit=crop" alt="온센 핫풀" class="w-full h-48 object-cover rounded-lg mb-3"/>
            <h4 class="font-semibold text-teal-700 mb-2">온센 핫풀 (Onsen Hot Pools)</h4>
            <p class="text-sm text-stone-700">오리지널 온센: 2인 NZ$175 (1시간), 세레니티 소크: 2인 NZ$185 (1시간). 궁극의 릴랙세이션 체험: 45분 온천 + 트리트먼트 NZ$255~420. 쇼토버 강 파노라마 뷰.</p>
          </div>
          <div class="bg-stone-50 rounded-lg p-4">
            <img src="https://images.unsplash.com/photo-1580296775351-8c2eead4e5d5?w=400&h=250&fit=crop" alt="퀸스타운 전망" class="w-full h-48 object-cover rounded-lg mb-3"/>
            <h4 class="font-semibold text-teal-700 mb-2">스카이라인 곤돌라 & 루지</h4>
            <p class="text-sm text-stone-700">봅스 피크 정상에서 와카티푸 호수와 리마커블스 산맥의 압도적 전경. 루지 2~3회 탑승 추천.</p>
          </div>
          <div class="bg-stone-50 rounded-lg p-4">
            <img src="https://images.unsplash.com/photo-1464822759844-d150331fc707?w=400&h=250&fit=crop" alt="크라운 레인지 로드" class="w-full h-48 object-cover rounded-lg mb-3"/>
            <h4 class="font-semibold text-teal-700 mb-2">크라운 레인지 로드</h4>
            <p class="text-sm text-stone-700">뉴질랜드에서 가장 높은 도로. 와나카에서 퀸스타운으로 가는 최고의 드라이브 경험.</p>
          </div>
          <div class="bg-stone-50 rounded-lg p-4">
            <img src="https://images.unsplash.com/photo-1595147389795-37094173bfd8?w=400&h=250&fit=crop" alt="와나카 라벤더" class="w-full h-48 object-cover rounded-lg mb-3"/>
            <h4 class="font-semibold text-teal-700 mb-2">와나카 라벤더 팜</h4>
            <p class="text-sm text-stone-700">1월 만개하는 보랏빛 라벤더 밭. 로맨틱한 사진 촬영지로 라벤더 아이스크림도 맛보기 가능.</p>
          </div>
        </div>
      `,
      activities: `
        <ul class="space-y-3 list-disc list-inside text-stone-700">
          <li><strong>어드벤처:</strong> 번지점프(카와라우 다리), 쇼토버 젯보트, 협곡 스윙 등 세계적으로 유명한 액티비티에 도전해볼 수 있습니다. (사전 예약 권장)</li>
          <li><strong>휴식:</strong> TSS 언슬로 증기선을 타고 월터 피크 하이 컨트리 팜을 방문하거나, 퀸스타운 가든을 산책하며 여유로운 시간을 보냅니다.</li>
          <li><strong>#ThatWanakaTree:</strong> 와나카 호수 속 버드나무는 놓칠 수 없는 포토 스팟입니다. 시간대에 따라 다른 분위기를 연출합니다.</li>
        </ul>
      `,
      dining: `
        <ul class="space-y-3 list-disc list-inside text-stone-700">
          <li><strong>Rātā:</strong> 미슐랭 스타 셰프 조쉬 에멧의 레스토랑으로, 현대적인 뉴질랜드 요리의 정수를 맛볼 수 있습니다. (예약 필수)</li>
          <li><strong>Botswana Butchery:</strong> 호숫가 아름다운 오두막에서 즐기는 최상급 육류 요리. 로맨틱한 분위기로 허니문에 적합합니다.</li>
          <li><strong>Stratosfare Restaurant & Bar:</strong> 스카이라인 정상에서 환상적인 전망과 함께 즐기는 뷔페. 창가 좌석 보장을 위해 프리미엄 다이닝 업그레이드를 고려해보세요.</li>
          <li><strong>Fergburger:</strong> 퀸스타운의 명물, 거대한 수제 버거를 맛보기 위해 긴 줄을 설 가치가 있습니다. 비교적 줄이 짧은 시간대를 노려보세요.</li>
        </ul>
      `,
      lodging: `
        <ul class="space-y-3 list-disc list-inside text-stone-700">
          <li><strong>호숫가 럭셔리 호텔:</strong> Eichardt's Private Hotel, Sofitel Queenstown Hotel & Spa 등에서 최고의 서비스를 경험할 수 있습니다.</li>
          <li><strong>서비스 아파트:</strong> 주방 시설이 있어 편리하며, 넓은 공간을 제공합니다. The Rees Hotel & Luxury Apartments 등이 좋은 평을 받습니다.</li>
          <li><strong>시내 중심가 호텔:</strong> 모든 편의시설과 레스토랑이 가까워 편리합니다.</li>
        </ul>
      `
    },
    auckland: {
      duration: '2박 3일 (1/28 수 ~ 1/30 금)',
      description:
        "'항해의 도시' 오클랜드에서 여정의 마지막을 장식합니다. 세련된 도시의 매력과 아름다운 섬, 그리고 최고의 다이닝을 즐기며 허니문의 대미를 장식하세요.",
      highlights: `
        <ul class="space-y-3 list-disc list-inside text-stone-700">
          <li><strong>와이헤케 섬:</strong> '와인의 섬'으로 불리는 아름다운 곳. 페리를 타고 당일치기로 와이너리 투어와 해변에서의 휴식을 즐겨보세요. 투어 상품을 이용하면 편리합니다.</li>
          <li><strong>바이아덕트 하버:</strong> 활기찬 해안가에서 허니문의 마지막 밤을 위한 특별한 저녁 식사를 하기에 완벽한 장소입니다. 요트가 정박한 항구의 야경이 아름답습니다.</li>
          <li><strong>마운트 이든:</strong> 화산 분화구에 올라 오클랜드 시내와 항만의 탁 트인 360도 파노라마 뷰를 감상하세요. 일몰 시간에 맞춰 방문하는 것도 좋습니다.</li>
        </ul>
      `,
      activities: `
        <ul class="space-y-3 list-disc list-inside text-stone-700">
          <li><strong>와인 투어:</strong> 와이헤케 섬의 Stonyridge, Mudbrick 등 유명 와이너리를 방문하며 다양한 와인을 시음합니다.</li>
          <li><strong>시티 탐방:</strong> 스카이 타워, 폰손비 로드, 데번포트 등 오클랜드의 다양한 명소를 둘러봅니다. 데번포트에서는 오클랜드 시티의 멋진 스카이라인을 조망할 수 있습니다.</li>
          <li><strong>해안가 산책:</strong> 바이아덕트 하버에서 윈야드 쿼터까지 이어지는 길을 따라 걸으며 세련된 도시 풍경을 즐겨보세요.</li>
        </ul>
      `,
      dining: `
        <ul class="space-y-3 list-disc list-inside text-stone-700">
          <li><strong>Soul Bar & Bistro:</strong> 바이아덕트 하버의 아이코닉한 레스토랑. 해산물과 멋진 분위기로 유명하며, 예약하는 것이 좋습니다.</li>
          <li><strong>Oyster & Chop:</strong> 신선한 굴과 최상급 스테이크를 맛볼 수 있는 곳.</li>
          <li><strong>Ponsonby Road:</strong> 개성 있는 카페, 바, 레스토랑이 즐비한 오클랜드의 핫플레이스. 캐주얼한 식사를 즐기기에 좋습니다.</li>
          <li><strong>Esther (QT 오클랜드):</strong> 지중해의 풍미를 느낄 수 있는 트렌디한 다이닝.</li>
        </ul>
      `,
      lodging: `
        <ul class="space-y-3 list-disc list-inside text-stone-700">
          <li><strong>바이아덕트 하버:</strong> Park Hyatt Auckland, Hilton Auckland 등 럭셔리 호텔에서 항구의 멋진 전망을 즐길 수 있습니다.</li>
          <li><strong>CBD / 브리토마트:</strong> The Hotel Britomart, SO/ Auckland 등 교통, 쇼핑, 다이닝 모두 편리한 스타일리시한 호텔이 많습니다.</li>
        </ul>
      `
    }
  };

  setupPrepAccordion(prepData);
  setupNavigation();
  setupLazySectionInit();
  await loadAndRenderTimeline({ tbodyId: 'timelineTbody', src: 'assets/data/timeline.json' });
  setupJourneyTabs(journeyData);
});


