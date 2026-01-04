import { initMaps } from './maps.js';
import { initCharts } from './charts.js';

export function setupLazySectionInit() {
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


