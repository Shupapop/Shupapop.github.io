async function renderComparePage() {
  const devices = await loadDevices();
  const list = getCompareList();
  const picked = list.map(id => devices.find(d => d.id === id)).filter(Boolean);

  // Picker row: always show 3 slots
  const pickerEl = document.getElementById('pickerRow');
  pickerEl.innerHTML = [0, 1, 2].map(i => {
    const d = picked[i];
    return `
    <div class="sidebar-box" style="flex:1;min-width:180px;margin-bottom:0;">
      <select onchange="setSlot(${i}, this.value)" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:6px;font-family:var(--sans);">
        <option value="">— choose device —</option>
        ${devices.map(dev => `<option value="${dev.id}" ${d && d.id === dev.id ? 'selected' : ''}>${dev.name}</option>`).join('')}
      </select>
    </div>`;
  }).join('');

  const tableEl = document.getElementById('compareTableEl');
  if (!picked.length) {
    tableEl.innerHTML = `<tr><td style="padding:24px;color:var(--muted);">Choose up to 3 devices above to compare their full specifications.</td></tr>`;
    return;
  }

  // Helper: normalize any device's specs into flat { category: { key: value } } format
  function normalizeSpecs(d) {
    if (!d.specs) return {};
    const firstVal = Object.values(d.specs)[0];
    if (typeof firstVal === 'object' && firstVal !== null) {
      // Already nested format — return as-is
      return d.specs;
    }
    // Flat format — wrap everything under one "Specifications" category
    return { 'Specifications': d.specs };
  }

  // Collect all spec categories & keys across picked devices
  const allCats = {};
  picked.forEach(d => {
    const normalized = normalizeSpecs(d);
    Object.entries(normalized).forEach(([cat, rows]) => {
      allCats[cat] = allCats[cat] || new Set();
      if (rows && typeof rows === 'object') {
        Object.keys(rows).forEach(k => allCats[cat].add(k));
      }
    });
  });

  let html = `<tr><th>Spec</th>${picked.map(d => `<th>${d.name}</th>`).join('')}</tr>`;
  html += `<tr><td>Price (MY)</td>${picked.map(d => `<td>${d.price_my || '—'}</td>`).join('')}</tr>`;

  Object.entries(allCats).forEach(([cat, keysSet]) => {
    html += `<tr><td colspan="${picked.length + 1}" style="background:var(--ink);color:var(--amber);font-weight:800;text-transform:uppercase;font-size:12px;letter-spacing:0.05em;">${cat}</td></tr>`;
    Array.from(keysSet).forEach(key => {
      const values = picked.map(d => {
        const normalized = normalizeSpecs(d);
        return (normalized[cat] && normalized[cat][key]) || '—';
      });
      const differs = new Set(values).size > 1;
      html += `<tr class="${differs ? 'compare-diff' : ''}"><td>${key}</td>${values.map(v => `<td>${v}</td>`).join('')}</tr>`;
    });
  });

  tableEl.innerHTML = html;
}

function setSlot(index, deviceId) {
  let list = getCompareList();
  while (list.length <= index) list.push(null);
  if (deviceId) list[index] = deviceId; else list[index] = null;
  list = list.filter(Boolean);
  setCompareList(list);
  renderComparePage();
}

document.addEventListener('DOMContentLoaded', renderComparePage);
