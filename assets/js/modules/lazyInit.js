import { initMaps } from './maps.js';

export function setupLazySectionInit() {
  let mapsInitialized = false;

  const mapSection = document.getElementById('map-route');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        if (entry.target === mapSection && !mapsInitialized) {
          mapsInitialized = true;
          initMaps();
        }
      });
    },
    { rootMargin: '200px 0px' }
  );

  if (mapSection) observer.observe(mapSection);
}


