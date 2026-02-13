const MAX_N = 22;

const arrayInput = document.getElementById('arrayInput');
const thresholdInput = document.getElementById('thresholdInput');
const goButton = document.getElementById('goButton');
const downloadButton = document.getElementById('downloadButton');
const errorEl = document.getElementById('error');
const summaryText = document.getElementById('summaryText');
const resultsBody = document.getElementById('resultsBody');

let latestRows = [];

function parseArray(raw) {
  const tokens = raw.split(/[\s,]+/).filter(Boolean);
  if (tokens.length === 0) {
    throw new Error('Please enter at least one positive integer for A.');
  }

  return tokens.map((t, i) => {
    const value = Number(t);
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`A[${i}] = "${t}" is invalid. Use only positive integers.`);
    }
    return value;
  });
}

function findSubsetsAtOrAbove(values, threshold) {
  const totalMasks = 1 << values.length;
  const rows = [];

  for (let mask = 1; mask < totalMasks; mask += 1) {
    let sum = 0;
    const subset = [];

    for (let i = 0; i < values.length; i += 1) {
      if (mask & (1 << i)) {
        const v = values[i];
        sum += v;
        subset.push(v);
      }
    }

    if (sum >= threshold) {
      rows.push({ subset, sum, length: subset.length });
    }
  }

  rows.sort((a, b) => b.sum - a.sum || a.length - b.length || a.subset.join(',').localeCompare(b.subset.join(',')));
  return rows;
}

function renderRows(rows) {
  if (rows.length === 0) {
    resultsBody.innerHTML = '<tr><td colspan="4" class="empty">No subsets satisfy the threshold.</td></tr>';
    return;
  }

  const frag = document.createDocumentFragment();
  rows.forEach((row, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>{${row.subset.join(', ')}}</td>
      <td>${row.sum}</td>
      <td>${row.length}</td>
    `;
    frag.appendChild(tr);
  });

  resultsBody.innerHTML = '';
  resultsBody.appendChild(frag);
}

function toCsv(rows) {
  const header = 'index,subset,sum,length';
  const lines = rows.map((row, idx) => {
    const subsetText = `{${row.subset.join(' ')}}`;
    return `${idx + 1},"${subsetText}",${row.sum},${row.length}`;
  });
  return [header, ...lines].join('\n');
}

function run() {
  errorEl.textContent = '';
  downloadButton.disabled = true;

  try {
    const values = parseArray(arrayInput.value.trim());
    if (values.length > MAX_N) {
      throw new Error(`N is ${values.length}. For responsiveness, please keep N ≤ ${MAX_N}.`);
    }

    const threshold = Number(thresholdInput.value);
    if (!Number.isInteger(threshold) || threshold <= 0) {
      throw new Error('M must be a positive integer.');
    }

    const rows = findSubsetsAtOrAbove(values, threshold);
    latestRows = rows;
    renderRows(rows);

    const totalSubsets = (1 << values.length) - 1;
    summaryText.textContent = `Found ${rows.length} subset(s) with sum ≥ ${threshold} out of ${totalSubsets} non-empty subset(s).`;
    downloadButton.disabled = rows.length === 0;
  } catch (err) {
    latestRows = [];
    renderRows([]);
    summaryText.textContent = 'No results yet.';
    errorEl.textContent = err.message;
  }
}

function downloadCsv() {
  if (latestRows.length === 0) {
    return;
  }

  const csv = toCsv(latestRows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'subset-results.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

goButton.addEventListener('click', run);
downloadButton.addEventListener('click', downloadCsv);
