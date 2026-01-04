export function setupPrepAccordion(prepData) {
  const prepAccordion = document.getElementById('prepAccordion');
  if (!prepAccordion) return;

  prepAccordion.innerHTML = '';

  const items = Array.isArray(prepData?.items) ? prepData.items : [];

  items.forEach((item, idx) => {
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
        <p>${item.contentHtml}</p>
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


