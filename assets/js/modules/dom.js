export function setLazyAttrsForImages(container) {
  if (!container) return;
  container.querySelectorAll('img').forEach((img) => {
    if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
    if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async');
  });
}

export async function fetchJson(src) {
  const res = await fetch(src, { cache: 'no-store' });
  if (!res.ok) throw new Error(`fetch failed: ${src} (${res.status})`);
  return res.json();
}


