import { fetchJson } from './dom.js';

const MAPS_DATA_SRC = 'assets/data/maps.json';

function getLatLng(locations, key) {
  const loc = locations?.[key];
  if (!loc) return null;
  return [loc.lat, loc.lng];
}

function makeColorDotIcon(color) {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color:${color};width:12px;height:12px;border-radius:50%;border:2px solid white;"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
}

export async function initMaps() {
  if (!window.L) return;

  const mapData = await fetchJson(MAPS_DATA_SRC);
  const locations = mapData?.locations || {};

  const sydneyMapEl = document.getElementById('sydneyMap');
  const nzMapEl = document.getElementById('newZealandMap');
  if (!sydneyMapEl || !nzMapEl) return;

  // Sydney
  const sydCfg = mapData?.sydney;
  const sydCenter = sydCfg?.mapCenter;
  const sydneyMap = L.map('sydneyMap').setView([sydCenter.lat, sydCenter.lng], sydCenter.zoom);
  L.tileLayer(sydCfg.tileLayer.url, { attribution: sydCfg.tileLayer.attribution }).addTo(sydneyMap);

  (sydCfg?.days || []).forEach((day) => {
    const icon = makeColorDotIcon(day.markerColor);
    (day.locationKeys || []).forEach((key) => {
      const ll = getLatLng(locations, key);
      if (!ll) return;
      L.marker(ll, { icon }).addTo(sydneyMap).bindPopup(`${day.popupPrefix} ${locations[key].name}`);
    });

    const pathLatLngs = (day.locationKeys || [])
      .map((k) => getLatLng(locations, k))
      .filter(Boolean);
    if (pathLatLngs.length >= 2) {
      L.polyline(pathLatLngs, { color: day.pathColor, weight: 3, opacity: 0.8 }).addTo(sydneyMap);
    }
  });

  // New Zealand
  const nzCfg = mapData?.newZealand;
  const nzCenter = nzCfg?.mapCenter;
  const newZealandMap = L.map('newZealandMap').setView([nzCenter.lat, nzCenter.lng], nzCenter.zoom);
  L.tileLayer(nzCfg.tileLayer.url, { attribution: nzCfg.tileLayer.attribution }).addTo(newZealandMap);

  (nzCfg?.cityKeys || []).forEach((key) => {
    const ll = getLatLng(locations, key);
    if (!ll) return;
    const label = nzCfg?.cityDateLabels?.[key] || '';
    L.marker(ll).addTo(newZealandMap).bindPopup(`<strong>${label}:</strong> ${locations[key].name}`);
  });

  (nzCfg?.paths || []).forEach((p) => {
    const latLngs = (p.locationKeys || [])
      .map((k) => getLatLng(locations, k))
      .filter(Boolean);
    if (latLngs.length < 2) return;
    const options = {
      color: p.color,
      weight: p.weight,
      opacity: p.opacity
    };
    if (p.dashArray) options.dashArray = p.dashArray;
    L.polyline(latLngs, options).addTo(newZealandMap);
  });
}


