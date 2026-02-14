const MAX_N = 22;
const SVG_NS = 'http://www.w3.org/2000/svg';

const arrayInput = document.getElementById('arrayInput');
const thresholdInput = document.getElementById('thresholdInput');
const goButton = document.getElementById('goButton');
const downloadButton = document.getElementById('downloadButton');
const errorEl = document.getElementById('error');
const summaryText = document.getElementById('summaryText');
const resultsBody = document.getElementById('resultsBody');
const histogramPlot = document.getElementById('histogramPlot');
const histogramSummary = document.getElementById('histogramSummary');

let latestRows = [];

function parseArray(raw) {
  const tokens = raw.split(/[\s,]+/).filter(Boolean);
  if (tokens.length === 0) {
    throw new Error('Please enter at least one positive integer for A.');
  }

  return tokens.map(function mapToken(t, i) {
    const value = Number(t);
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`A[${i}] = "${t}" is invalid. Use only positive integers.`);
    }
    return value;
  });
}

function enumerateSubsets(values) {
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

    rows.push({ subset: subset, sum: sum, length: subset.length });
  }

  return rows;
}

function findSubsetsAtOrAbove(allSubsets, threshold) {
  return allSubsets
    .filter(function byThreshold(row) {
      return row.sum >= threshold;
    })
    .sort(function sortRows(a, b) {
      return b.sum - a.sum || a.length - b.length || a.subset.join(',').localeCompare(b.subset.join(','));
    });
}

function groupSubsetsBySum(allSubsets) {
  const bins = new Map();

  allSubsets.forEach(function eachSubset(row) {
    const existing = bins.get(row.sum);
    if (existing) {
      existing.push(row);
    } else {
      bins.set(row.sum, [row]);
    }
  });

  return bins;
}

function renderRows(rows) {
  if (rows.length === 0) {
    resultsBody.innerHTML = '<tr><td colspan="4" class="empty">No subsets satisfy the threshold.</td></tr>';
    return;
  }

  const frag = document.createDocumentFragment();
  rows.forEach(function eachRow(row, idx) {
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

function clearHistogram(message) {
  histogramPlot.replaceChildren();
  histogramSummary.textContent = message;
}

function colorForLength(length, arrayLength) {
  const safeArrayLength = Math.max(arrayLength, 1);
  const clampedLength = Math.min(Math.max(length, 1), safeArrayLength);
  const t = (clampedLength - 1) / Math.max(safeArrayLength - 1, 1);
  const lightness = 88 - t * 50;
  return `hsl(218 85% ${lightness}%)`;
}

function renderHistogram(sumBins, threshold, arrayLength) {
  const sums = Array.from(sumBins.keys()).sort(function sortSums(a, b) {
    return a - b;
  });

  if (sums.length === 0) {
    clearHistogram('No subset data to plot.');
    return;
  }

  const counts = sums.map(function mapCount(sum) {
    return sumBins.get(sum).length;
  });
  const maxCount = Math.max(...counts);

  const width = 900;
  const height = 320;
  const margin = { top: 20, right: 20, bottom: 62, left: 55 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;
  const barW = plotW / sums.length;
  const unitH = plotH / maxCount;

  histogramPlot.setAttribute('viewBox', `0 0 ${width} ${height}`);
  histogramPlot.replaceChildren();

  const axisColor = '#334155';
  const thresholdColor = '#dc2626';

  const xAxis = document.createElementNS(SVG_NS, 'line');
  xAxis.setAttribute('x1', String(margin.left));
  xAxis.setAttribute('y1', String(margin.top + plotH));
  xAxis.setAttribute('x2', String(margin.left + plotW));
  xAxis.setAttribute('y2', String(margin.top + plotH));
  xAxis.setAttribute('stroke', axisColor);
  histogramPlot.appendChild(xAxis);

  const yAxis = document.createElementNS(SVG_NS, 'line');
  yAxis.setAttribute('x1', String(margin.left));
  yAxis.setAttribute('y1', String(margin.top));
  yAxis.setAttribute('x2', String(margin.left));
  yAxis.setAttribute('y2', String(margin.top + plotH));
  yAxis.setAttribute('stroke', axisColor);
  histogramPlot.appendChild(yAxis);

  sums.forEach(function eachSum(sum, idx) {
    const rows = sumBins.get(sum).slice().sort(function sortByLength(a, b) {
      return a.length - b.length;
    });
    const baseX = margin.left + idx * barW;

    rows.forEach(function eachStack(row, stackIndex) {
      const rectHeight = Math.max(unitH - 1, 1);
      const y = margin.top + plotH - (stackIndex + 1) * unitH;

      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', String(baseX + 1));
      rect.setAttribute('y', String(y));
      rect.setAttribute('width', String(Math.max(barW - 2, 1)));
      rect.setAttribute('height', String(rectHeight));
      rect.setAttribute('fill', colorForLength(row.length, arrayLength));
      rect.setAttribute('class', sum >= threshold ? 'bar-over-threshold' : 'bar-under-threshold');

      const titleEl = document.createElementNS(SVG_NS, 'title');
      titleEl.textContent = `sum=${row.sum}, length=${row.length}, subset={${row.subset.join(', ')}}`;
      rect.appendChild(titleEl);
      histogramPlot.appendChild(rect);
    });
  });

  const minSum = sums[0];
  const maxSum = sums[sums.length - 1];
  const span = Math.max(maxSum - minSum, 1);
  const thresholdX = margin.left + ((threshold - minSum) / span) * plotW;
  const clampedX = Math.min(margin.left + plotW, Math.max(margin.left, thresholdX));

  const thresholdLine = document.createElementNS(SVG_NS, 'line');
  thresholdLine.setAttribute('x1', String(clampedX));
  thresholdLine.setAttribute('y1', String(margin.top));
  thresholdLine.setAttribute('x2', String(clampedX));
  thresholdLine.setAttribute('y2', String(margin.top + plotH));
  thresholdLine.setAttribute('stroke', thresholdColor);
  thresholdLine.setAttribute('stroke-width', '2');
  thresholdLine.setAttribute('stroke-dasharray', '6 4');
  histogramPlot.appendChild(thresholdLine);

  const thresholdLabel = document.createElementNS(SVG_NS, 'text');
  thresholdLabel.setAttribute('x', String(Math.min(clampedX + 6, margin.left + plotW - 90)));
  thresholdLabel.setAttribute('y', String(margin.top + 14));
  thresholdLabel.setAttribute('fill', thresholdColor);
  thresholdLabel.setAttribute('font-size', '12');
  thresholdLabel.textContent = `M = ${threshold}`;
  histogramPlot.appendChild(thresholdLabel);

  const xLabelMin = document.createElementNS(SVG_NS, 'text');
  xLabelMin.setAttribute('x', String(margin.left));
  xLabelMin.setAttribute('y', String(height - 34));
  xLabelMin.setAttribute('fill', axisColor);
  xLabelMin.setAttribute('font-size', '12');
  xLabelMin.textContent = `min sum: ${minSum}`;
  histogramPlot.appendChild(xLabelMin);

  const xLabelMax = document.createElementNS(SVG_NS, 'text');
  xLabelMax.setAttribute('x', String(margin.left + plotW - 90));
  xLabelMax.setAttribute('y', String(height - 34));
  xLabelMax.setAttribute('fill', axisColor);
  xLabelMax.setAttribute('font-size', '12');
  xLabelMax.textContent = `max sum: ${maxSum}`;
  histogramPlot.appendChild(xLabelMax);

  const legend = document.createElementNS(SVG_NS, 'text');
  legend.setAttribute('x', String(margin.left));
  legend.setAttribute('y', String(height - 14));
  legend.setAttribute('fill', axisColor);
  legend.setAttribute('font-size', '12');
  legend.textContent = `Color encodes subset length vs N=${arrayLength} (length 1 is light, length ${arrayLength} is dark).`;
  histogramPlot.appendChild(legend);

  histogramSummary.textContent = `Histogram bins: ${sums.length} unique sum value(s), max frequency: ${maxCount}. Each stacked rectangle is one subset; red line marks threshold M.`;
}

function toCsv(rows) {
  const maxLen = rows.reduce(function reduceMax(m, r) {
    return Math.max(m, r.subset.length);
  }, 0);

  const elementHeaders = Array.from({ length: maxLen }, function buildHeader(_, i) {
    return `e${i + 1}`;
  });
  const header = ['index', 'sum', 'length'].concat(elementHeaders).join(',');

  const lines = rows.map(function mapCsvRow(row, idx) {
    const elems = row.subset.map(String);
    while (elems.length < maxLen) {
      elems.push('');
    }
    return [idx + 1, row.sum, row.length].concat(elems).join(',');
  });

  return [header].concat(lines).join('\n');
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

    const allSubsets = enumerateSubsets(values);
    const sumBins = groupSubsetsBySum(allSubsets);
    renderHistogram(sumBins, threshold, values.length);

    const rows = findSubsetsAtOrAbove(allSubsets, threshold);
    latestRows = rows;
    renderRows(rows);

    const totalSubsets = (1 << values.length) - 1;
    summaryText.textContent = `Found ${rows.length} subset(s) with sum ≥ ${threshold} out of ${totalSubsets} non-empty subset(s).`;
    downloadButton.disabled = rows.length === 0;
  } catch (err) {
    latestRows = [];
    renderRows([]);
    clearHistogram('Run the search to generate a histogram.');
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
