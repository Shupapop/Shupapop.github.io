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

function deviceCardHTML(d) {
   const qs = d.quickspec ? Object.entries(d.quickspec).map(([k, v]) => `${k}: ${v}`).join(' · ') : '';
  const inCompare = getCompareList().includes(d.id);
  return `
  <div class="device-card">
    <a href="device.html?id=${d.id}" style="display:flex;flex-direction:column;gap:8px;flex:1;">
      <div class="device-thumb">${d.img ? `<img src="${d.img}" alt="${d.name}">` : 'No image'}</div>
      <div class="device-name">${d.name}</div>
      <div class="device-quickspec">${qs}</div>
      <div class="device-price">${d.price_my}</div>
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
  const slotsEl = document.getElementById('traySlots');
  if (!tray || !slotsEl) return;
  const list = getCompareList();
  if (!list.length) { tray.classList.remove('active'); return; }
  const devices = await loadDevices();
  slotsEl.innerHTML = list.map(id => {
    const d = devices.find(x => x.id === id);
    if (!d) return '';
    return `<div class="compare-slot">${d.name}<span class="x" onclick="toggleCompare('${id}')">×</span></div>`;
  }).join('');
  tray.classList.add('active');
}

function setupSearch() {
  const input = document.getElementById('searchInput');
  if (!input) return;
  input.addEventListener('input', async (e) => {
    const q = e.target.value.trim().toLowerCase();
    if (!q) { renderDeviceGrid('deviceGrid'); return; }
    await loadDevices();
    renderDeviceGrid('deviceGrid', d =>
      d.name.toLowerCase().includes(q) || d.brand.toLowerCase().includes(q)
    );
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderDeviceGrid('deviceGrid');
  renderDeviceGrid('popularGrid', d => ['iphone-17-pro', 'samsung-galaxy-s26-ultra'].includes(d.id));
  renderCompareTray();
  setupSearch();
});
