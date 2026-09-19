// ===== SpecShelf shared app logic =====
// Data source: devices.json (local sample data).
// To go live with a real feed, replace loadDevices() with a fetch()
// call to a licensed spec API (e.g. mobileapi.dev) and map its
// response shape onto the same fields used below.

let DEVICES = [];

async function loadDevices() {
  if (DEVICES.length) return DEVICES;
  const res = await fetch('devices.json');
  const data = await res.json();
  DEVICES = data.devices;
  return DEVICES;
}

function getCompareList() {
  return JSON.parse(localStorage.getItem('compareList') || '[]');
}
function setCompareList(list) {
  localStorage.setItem('compareList', JSON.stringify(list));
  renderCompareTray();
}
function toggleCompare(id) {
  let list = getCompareList();
  if (list.includes(id)) {
    list = list.filter(x => x !== id);
  } else {
    if (list.length >= 3) list.shift();
    list.push(id);
  }
  setCompareList(list);
}

function signalBars(level) {
  return `<span class="signal-rating" data-level="${level}"><span></span><span></span><span></span><span></span><span></span></span>`;
}

function getDevicePrice(d) {
  if (d.price_my) return d.price_my;
  if (d.price) return 'RM ' + d.price.toLocaleString();
  return '';
}

function getDeviceQuickspec(d) {
  if (d.quickspec) return Object.entries(d.quickspec).map(([k, v]) => `${k}: ${v}`).join(' · ');
  const parts = [];
  if (d.display) parts.push(d.display);
  if (d.processor) parts.push(d.processor);
  if (d.ram) parts.push(d.ram + ' RAM');
  if (d.battery) parts.push(d.battery);
  return parts.slice(0, 3).join(' · ');
}

function deviceCardHTML(d) {
  const qs = getDeviceQuickspec(d);
  const price = getDevicePrice(d);
  const inCompare = getCompareList().includes(d.id);
  return `
  <div class="device-card">
    <a href="device.html?id=${d.id}" style="display:flex;flex-direction:column;gap:8px;flex:1;">
      <div class="device-thumb">${d.img ? `<img src="${d.img}" alt="${d.name}">` : 'No image'}</div>
      <div class="device-name">${d.name}</div>
      <div class="device-quickspec">${qs}</div>
      <div class="device-price">${price}</div>
    </a>
    <label class="compare-check">
      <input type="checkbox" ${inCompare ? 'checked' : ''} onchange="toggleCompare('${d.id}')">
      Add to compare
    </label>
  </div>`;
}

async function renderDeviceGrid(targetId, filterFn) {
  const el = document.getElementById(targetId);
  if (!el) return;
  const devices = await loadDevices();
  const list = filterFn ? devices.filter(filterFn) : devices;
  el.innerHTML = list.map(deviceCardHTML).join('');
}

async function renderCompareTray() {
  const tray = document.getElementById('compareTray');
  if (!tray) return;
  const slotsEl = document.getElementById('traySlots');
  const list = getCompareList();
  const devices = await loadDevices();
  slotsEl.innerHTML = list.map(id => {
    const d = devices.find(x => x.id === id);
    return d ? `<span>${d.name}</span>` : '';
  }).join('');
  tray.style.display = list.length ? 'flex' : 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    renderDeviceGrid('popularGrid', null);
  renderCompareTray();

  const searchInput = document.querySelector('.search-input, [placeholder*="Search"]');
  if (searchInput) {
    searchInput.addEventListener('input', async e => {
      const q = e.target.value.toLowerCase();
      const devices = await loadDevices();
      const filtered = devices.filter(d =>
        d.name.toLowerCase().includes(q) ||
        (d.brand && d.brand.toLowerCase().includes(q))
      );
      const grid = document.getElementById('popularGrid');
      if (grid) grid.innerHTML = filtered.map(deviceCardHTML).join('');
    });
  }
});
