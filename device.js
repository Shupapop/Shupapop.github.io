function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function ratingRow(label, level) {
  return `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;">
    <span style="font-size:13px;color:var(--muted);">${label}</span>
    ${signalBars(level)}
  </div>`;
}

function getDevicePagePrice(d) {
  if (d.price_my) return d.price_my;
  if (d.price_myr) return 'RM ' + Number(d.price_myr).toLocaleString();
  if (d.price) return 'RM ' + Number(d.price).toLocaleString();
  return 'Check retailer';
}

function getDevicePagePriceGlobal(d) {
  if (d.price_global) return d.price_global;
  return 'Check retailer';
}

function getDeviceReleased(d) {
  if (d.released) return d.released;
  if (d.releaseYear) return d.releaseYear;
  if (d.year) return d.year;
  return 'N/A';
}

function getDevicePageQuickspec(d) {
  if (d.quickspec && typeof d.quickspec === 'object') {
    return Object.entries(d.quickspec).map(([k, v]) => `
      <div class="quickspec-item">
        <div class="quickspec-label">${k}</div>
        <div class="quickspec-value">${v}</div>
      </div>`).join('');
  }
  // Format B: flat specs inside d.specs
  if (d.specs && typeof d.specs === 'object') {
    const firstVal = Object.values(d.specs)[0];
    if (typeof firstVal !== 'object') {
      return Object.entries(d.specs).slice(0, 4).map(([k, v]) => `
        <div class="quickspec-item">
          <div class="quickspec-label">${k}</div>
          <div class="quickspec-value">${v}</div>
        </div>`).join('');
    }
    // Format A: nested specs — pick first key from each category
    return Object.entries(d.specs).slice(0, 4).map(([cat, rows]) => {
      const firstEntry = Object.entries(rows)[0];
      return `
        <div class="quickspec-item">
          <div class="quickspec-label">${cat}</div>
          <div class="quickspec-value">${firstEntry ? firstEntry[1] : ''}</div>
        </div>`;
    }).join('');
  }
  // Format C: top-level fields
  const keys = ['display', 'processor', 'ram', 'battery'];
  return keys.filter(k => d[k]).map(k => `
    <div class="quickspec-item">
      <div class="quickspec-label">${k.charAt(0).toUpperCase() + k.slice(1)}</div>
      <div class="quickspec-value">${d[k]}</div>
    </div>`).join('');
}

function getDeviceSpecTable(d) {
  if (!d.specs) {
    // Format C: build table from top-level fields
    const keys = ['display','processor','ram','storage','camera','battery','os','connectivity'];
    const rows = keys.filter(k => d[k]).map(k =>
      `<tr><td>${k.charAt(0).toUpperCase() + k.slice(1)}</td><td>${d[k]}</td></tr>`
    ).join('');
    return `<div class="spec-cat">Specifications</div>
      <table class="spec-table">${rows}</table>`;
  }
  const firstVal = Object.values(d.specs)[0];
  if (typeof firstVal === 'object' && firstVal !== null) {
    // Format A: nested
    return Object.entries(d.specs).map(([cat, rows]) => `
      <div class="spec-cat">${cat}</div>
      <table class="spec-table">
        ${Object.entries(rows).map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}
      </table>`).join('');
  }
  // Format B: flat
  return `<div class="spec-cat">Specifications</div>
    <table class="spec-table">
      ${Object.entries(d.specs).map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}
    </table>`;
}

async function renderDevicePage() {
  const id = getParam('id');
  const devices = await loadDevices();
  const d = devices.find(x => x.id === id) || devices[0];
  if (!d) return;

  document.getElementById('pageTitle').textContent = `${d.name} — full specifications | SpecShelf`;

  const quickHTML = getDevicePageQuickspec(d);
  const specTablesHTML = getDeviceSpecTable(d);
  const ratingsHTML = d.ratings ? Object.entries(d.ratings).map(([k, v]) =>
    ratingRow(k.charAt(0).toUpperCase() + k.slice(1), v)).join('') : '';
  const inCompare = getCompareList().includes(d.id);
  const price = getDevicePagePrice(d);
  const priceGlobal = getDevicePagePriceGlobal(d);
  const released = getDeviceReleased(d);

  document.getElementById('deviceMain').innerHTML = `
    <div class="spec-hero">
      <div class="spec-hero-img">${d.img ? `<img src="${d.img}" alt="${d.name}">` : 'No image available'}</div>
      <div>
        <h1 class="spec-title">${d.name}</h1>
        <div class="spec-sub">${d.brand} · ${d.type} · Released ${released}</div>
        <div class="quickspec-grid">${quickHTML}</div>
        <div style="margin:14px 0;">${ratingsHTML}</div>
        <div class="price-box">
          <div>
            <div class="amt">${price}</div>
            <div class="label">Malaysia estimate (incl. SST)</div>
          </div>
          <div style="margin-left:auto; text-align:right;">
            <div class="amt" style="color:var(--paper);font-size:15px;">${priceGlobal}</div>
            <div class="label">Global reference</div>
          </div>
        </div>
        <div style="display:flex;gap:10px;margin-top:16px;">
          <button class="btn btn-primary" onclick="toggleCompare('${d.id}'); this.textContent = getCompareList().includes('${d.id}') ? 'Added ✓' : 'Add to compare'">
            ${inCompare ? 'Added ✓' : 'Add to compare'}
          </button>
          <a class="btn btn-outline" href="compare.html">Go to compare</a>
        </div>
      </div>
    </div>

    <div class="ad-slot ad-inline"><!-- AdSense: in-content native --> Ad space — in-content native</div>

    <div class="spec-table-wrap">
      <h2 class="section-title">Full specifications</h2>
      ${specTablesHTML}
    </div>
  `;

  // Related devices sidebar
  const related = devices.filter(x => x.id !== d.id && x.type === d.type).slice(0, 4);
  document.getElementById('relatedList').innerHTML = related.map(r => `
    <li><a href="device.html?id=${r.id}" class="name" style="color:inherit;">${r.name}</a><span class="val">${getDevicePagePrice(r)}</span></li>
  `).join('') || '<li>No related devices</li>';
}

document.addEventListener('DOMContentLoaded', renderDevicePage);
