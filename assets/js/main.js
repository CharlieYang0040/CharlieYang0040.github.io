import { loadAndRenderTimeline } from './timelineRenderer.js';
import { fetchJson } from './modules/dom.js';
import { setupPrepAccordion } from './modules/prepAccordion.js';
import { setupNavigation } from './modules/navigation.js';
import { setupJourneyTabs } from './modules/journeyTabs.js';
import { setupLazySectionInit } from './modules/lazyInit.js';
import { loadAndRenderBookingsTable } from './modules/bookingsTable.js';

document.addEventListener('DOMContentLoaded', async () => {
  const [prepData, journeyData] = await Promise.all([
    fetchJson('assets/data/prep.json'),
    fetchJson('assets/data/journey.json')
  ]);

  setupPrepAccordion(prepData);
  setupNavigation();
  setupLazySectionInit();
  await loadAndRenderBookingsTable({ tbodyId: 'bookingsTbody', totalId: 'bookingsTotalCost' });
  await loadAndRenderTimeline({ tbodyId: 'timelineTbody', src: 'assets/data/timeline.json' });
  setupJourneyTabs(journeyData);
});


