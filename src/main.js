import './style.css';
import Dexie from 'dexie';
import Chart from 'chart.js/auto';

const db = new Dexie('MeasurementsDatabase');

db.version(1).stores({
    measurements: '++id, date'
});

db.version(2).stores({
    measurements: '++id, date',
    appMeta: 'key'
});

const app = document.querySelector('#app');

app.innerHTML = `
    <div class="container">

        <header>
            <h1>My Measurements</h1>
            <p class="subtitle">Track your weight and waist</p>
        </header>

        <!-- Navigation -->
        <nav class="tabs">
            <button
                type="button"
                class="tab-button active"
                data-tab="measurements"
            >
                Measurements
            </button>

            <button
                type="button"
                class="tab-button"
                data-tab="charts"
            >
                Charts
            </button>

            <button
                type="button"
                class="tab-button"
                data-tab="data"
            >
                Data
            </button>
        </nav>

        <!-- Measurements tab -->
        <section id="measurements-tab" class="tab-content active">

            <section class="card">
                <h2 id="form-title">Add measurement</h2>

                <form id="measurement-form">

                    <div class="form-group">
                        <label for="date">Date</label>
                        <input
                            type="date"
                            id="date"
                            name="date"
                            required
                        >
                    </div>

                    <div class="form-group">
                        <label for="weight">Weight (kg)</label>
                        <input
                            type="number"
                            id="weight"
                            name="weight"
                            step="0.1"
                            min="0"
                            placeholder="82.4"
                            required
                        >
                    </div>

                    <div class="form-group">
                        <label for="waist">Waist (cm)</label>
                        <input
                            type="number"
                            id="waist"
                            name="waist"
                            step="0.1"
                            min="0"
                            placeholder="94"
                            required
                        >
                    </div>

                    <button type="submit" id="save-button">
                        Save measurement
                    </button>

                    <button
                        type="button"
                        id="cancel-button"
                        class="secondary-button"
                        hidden
                    >
                        Cancel
                    </button>

                </form>
            </section>

            <section class="card">
                <h2>Measurements</h2>

                <label class="visibility-switch">
        <span>Show Edit/Delete buttons</span>

        <input
            type="checkbox"
            id="show-actions-toggle"
            class="switch-input"
            role="switch"
            aria-checked="false"
        >

        <span class="switch-track" aria-hidden="true"></span>
        <span id="switch-status" class="switch-status">Off</span>
    </label>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Weight (kg)</th>
                                <th>Waist (cm)</th>
                                <th id="actions-header" hidden>Actions</th>
                            </tr>
                        </thead>

                        <tbody id="measurements-table">
                        </tbody>
                    </table>
                </div>
            </section>

        </section>

        <!-- Charts tab -->
        <section id="charts-tab" class="tab-content">

            <section class="card">
                
<div class="chart-header">
    <h2>Trends</h2>
    <div class="chart-period">
        <label for="chart-period-select">Period:</label>
        <select id="chart-period-select">
            <option value="30">Last 30 days</option>
            <option value="90" selected>Last 3 months</option>
            <option value="180">Last 6 months</option>
            <option value="365">Last year</option>
            <option value="all">All data</option>
        </select>
    </div>
</div>

                <div class="chart-container">
                    <canvas id="body-chart"></canvas>
                </div>
            </section>

        </section>

        <!-- Data tab -->
        <section id="data-tab" class="tab-content">

            <section class="card">
                <h2>
                    Change statistics
                    <span id="total-records-count"
                        style="font-size: 0.85em; color: #6b7280; font-weight: normal;">
                    Total: 0 records
                    </span>
                </h2>
                <p class="data-description" id="stats-baseline-label">
                    Changes since the latest import or export.
                </p>
                <div class="change-stats" aria-live="polite">
                    <div class="stat-item"><strong id="stat-added">0</strong><span>Added new</span></div>
                    <div class="stat-item"><strong id="stat-edited">0</strong><span>Edited</span></div>
                    <div class="stat-item"><strong id="stat-deleted">0</strong><span>Deleted</span></div>
                </div>
            </section>

            <section class="card">
                <h2>Data management</h2>

                <p class="data-description">
                    Backup your measurements or transfer them
                    to Excel or Google Sheets.
                </p>

                <div class="data-actions">

                    <button
                        type="button"
                        id="export-button"
                    >
                        Export JSON
                    </button>

                    <button
                        type="button"
                        id="export-csv-button"
                        class="secondary-button"
                    >
                        Export CSV
                    </button>

                    <button
                        type="button"
                        id="import-button"
                        class="secondary-button"
                    >
                        Import JSON
                    </button>

                    <button
                        type="button"
                        id="import-csv-button"
                        class="secondary-button"
                    >
                        Import CSV
                    </button>

                    <input
                        type="file"
                        id="import-file"
                        accept=".json,application/json"
                        hidden
                    >

                    <input
                        type="file"
                        id="import-csv-file"
                        accept=".csv,text/csv"
                        hidden
                    >

                </div>
            </section>

        </section>

        <div id="import-review-overlay" class="import-modal-overlay" hidden>
            <section class="import-modal card" role="dialog" aria-modal="true" aria-labelledby="import-review-title">
                <h2 id="import-review-title">Review import conflicts</h2>
                <p id="import-review-summary" class="data-description"></p>
                <div id="import-conflicts-list" class="import-conflicts-list"></div>
                <p class="data-description">
                    Records with dates not present in the app will be added automatically.
                    Existing records absent from the file will remain unchanged.
                    Empty imported fields keep existing values.
                </p>
                <div class="data-actions">
                    <button type="button" id="confirm-import-button">Confirm import</button>
                    <button type="button" id="cancel-import-review-button" class="secondary-button">Cancel</button>
                </div>
            </section>
        </div>

    </div>
`;

const importAndStatsStyles = document.createElement('style');
importAndStatsStyles.textContent = `
.change-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
}
.stat-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.85rem;
    border-radius: 0.65rem;
    background: var(--card-secondary, #f3f4f6);
    text-align: center;
}
.stat-item strong { font-size: 1.5rem; }
.stat-item span { font-size: 0.85rem; }
.import-modal-overlay[hidden] { display: none !important; }
.import-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.55);
}
.import-modal {
    width: min(760px, 100%);
    max-height: 90vh;
    overflow-y: auto;
    background: var(--card-background, #fff);
}
.import-conflicts-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin: 1rem 0;
}
.import-conflict {
    border: 1px solid #d1d5db;
    border-radius: 0.65rem;
    padding: 1rem;
}
.import-conflict h3 { margin-top: 0; margin-bottom: 0.35rem; }
.conflict-field { margin-top: 0.85rem; }
.conflict-options {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    margin-top: 0.4rem;
}
.conflict-option {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    font-weight: normal;
}
.conflict-option input { margin-top: 0.2rem; }
.import-modal .data-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
}
@media (max-width: 420px) {
    .change-stats { gap: 0.4rem; }
    .stat-item { padding: 0.65rem 0.3rem; }
    .stat-item strong { font-size: 1.25rem; }
    .stat-item span { font-size: 0.75rem; }
}
`;
document.head.appendChild(importAndStatsStyles);


// --------------------------------------------------
// DOM elements
// --------------------------------------------------

const form = document.querySelector('#measurement-form');

const dateInput = document.querySelector('#date');
const weightInput = document.querySelector('#weight');
const waistInput = document.querySelector('#waist');

const tableBody = document.querySelector('#measurements-table');
const chartPeriodSelect =
    document.querySelector('#chart-period-select');
const showActionsToggle =
    document.querySelector('#show-actions-toggle');

const actionsHeader =
    document.querySelector('#actions-header');

const switchStatus =
    document.querySelector('#switch-status');
const formTitle = document.querySelector('#form-title');
const saveButton = document.querySelector('#save-button');
const cancelButton = document.querySelector('#cancel-button');

const exportButton = document.querySelector('#export-button');
const importButton = document.querySelector('#import-button');
const importFile = document.querySelector('#import-file');

const exportCsvButton =
    document.querySelector('#export-csv-button');

const importCsvButton =
    document.querySelector('#import-csv-button');

const importCsvFile =
    document.querySelector('#import-csv-file');

const statAdded = document.querySelector('#stat-added');
const statEdited = document.querySelector('#stat-edited');
const statDeleted = document.querySelector('#stat-deleted');
const statsBaselineLabel = document.querySelector('#stats-baseline-label');
const importReviewOverlay = document.querySelector('#import-review-overlay');
const importReviewSummary = document.querySelector('#import-review-summary');
const importConflictsList = document.querySelector('#import-conflicts-list');
const confirmImportButton = document.querySelector('#confirm-import-button');
const cancelImportReviewButton = document.querySelector('#cancel-import-review-button');


// --------------------------------------------------
// Variables
// --------------------------------------------------

let editingId = null;

let bodyChart = null;
let pendingImport = null;


// --------------------------------------------------
// Tabs
// --------------------------------------------------

const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {

    button.addEventListener('click', () => {

        const selectedTab = button.dataset.tab;

        // Remove active state from all buttons
        tabButtons.forEach(tabButton => {
            tabButton.classList.remove('active');
        });

        // Remove active state from all sections
        tabContents.forEach(tabContent => {
            tabContent.classList.remove('active');
        });

        // Activate selected button
        button.classList.add('active');

        // Activate selected section
        document
            .querySelector(`#${selectedTab}-tab`)
            .classList.add('active');

        // Chart needs a resize after becoming visible
        if (selectedTab === 'charts') {

            if (bodyChart) {
                bodyChart.resize();
            }
        }
    });

});


// --------------------------------------------------
// Initial date
// --------------------------------------------------

dateInput.value =
    new Date().toISOString().split('T')[0];

// --------------------------------------------------
// Show / hide Edit and Delete buttons
// --------------------------------------------------

function updateActionVisibility() {

    const showActions = showActionsToggle.checked;

    actionsHeader.hidden = !showActions;

    tableBody
        .querySelectorAll('.actions-cell')
        .forEach(cell => {
            cell.hidden = !showActions;
        });

    switchStatus.textContent =
        showActions ? 'On' : 'Off';

    showActionsToggle.setAttribute(
        'aria-checked',
        String(showActions)
    );
}

showActionsToggle.addEventListener(
    'change',
    updateActionVisibility
);

// --------------------------------------------------
// Load measurements
// --------------------------------------------------

async function loadMeasurements() {

    const measurements = await db.measurements
        .orderBy('date')
        .reverse()
        .toArray();
    
        const totalRecordsCount = document.querySelector('#total-records-count');

        if (totalRecordsCount) {
            totalRecordsCount.textContent =
            `Total: ${measurements.length} records`;
        }

    tableBody.innerHTML = '';

    for (const measurement of measurements) {

        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${measurement.date}</td>

            <td>
                ${measurement.weight.toFixed(1)}
            </td>

            <td>
                ${measurement.waist.toFixed(1)}
            </td>

            
<td class="actions-cell" hidden>
    <button
        type="button"
        class="action-button edit-button"
        data-id="${measurement.id}"
    >
        Edit
    </button>

    <button
        type="button"
        class="action-button delete-button"
        data-id="${measurement.id}"
    >
        Delete
    </button>
</td>

        `;

        tableBody.appendChild(row);
    }

    updateActionVisibility();
    updateChart(measurements);
    await updateChangeStats();
}


// --------------------------------------------------
// Combined chart
// --------------------------------------------------

function updateChart(measurements) {

    const sortedMeasurements =
        [...measurements].sort(
            (a, b) => a.date.localeCompare(b.date)
        );

    const selectedPeriod = chartPeriodSelect.value;

let filteredMeasurements = sortedMeasurements;

if (selectedPeriod !== 'all') {
    const days = Number(selectedPeriod);

    const latestDate = new Date(
        `${sortedMeasurements[sortedMeasurements.length - 1]?.date}T00:00:00`
    );

    if (sortedMeasurements.length > 0) {
        const startDate = new Date(latestDate);
        startDate.setDate(startDate.getDate() - days);

        filteredMeasurements = sortedMeasurements.filter(
            measurement => {
                const measurementDate = new Date(
                    `${measurement.date}T00:00:00`
                );

                return (
                    measurementDate >= startDate &&
                    measurementDate <= latestDate
                );
            }
        );
    }
}

    const labels = filteredMeasurements.map(
    measurement => measurement.date
);

const weights = filteredMeasurements.map(
    measurement => measurement.weight
);

const waists = filteredMeasurements.map(
    measurement => measurement.waist
);


    // Destroy previous chart

    if (bodyChart) {
        bodyChart.destroy();
    }


    const canvas =
        document.querySelector('#body-chart');


    bodyChart = new Chart(canvas, {

        type: 'line',

        data: {
            labels,

            datasets: [

                // Weight
                {
                    label: 'Weight (kg)',
                    data: weights,

                    yAxisID: 'weight-axis',

                    borderColor: '#2563eb',
                    backgroundColor: '#2563eb',

                    borderWidth: 2,

                    pointRadius: 4,
                    pointHoverRadius: 6,

                    tension: 0.2,

                    fill: false
                },

                // Waist
                {
                    label: 'Waist (cm)',
                    data: waists,

                    yAxisID: 'waist-axis',

                    borderColor: '#dc2626',
                    backgroundColor: '#dc2626',

                    borderWidth: 2,

                    pointRadius: 4,
                    pointHoverRadius: 6,

                    tension: 0.2,

                    fill: false
                }

            ]
        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            interaction: {
                mode: 'index',
                intersect: false
            },

            plugins: {

                legend: {
                    display: true,
                    position: 'top'
                }

            },

            scales: {

                // Left axis - Weight
                'weight-axis': {

                    type: 'linear',

                    position: 'left',

                    title: {
                        display: true,
                        text: 'Weight (kg)'
                    }

                },

                // Right axis - Waist
                'waist-axis': {

                    type: 'linear',

                    position: 'right',

                    title: {
                        display: true,
                        text: 'Waist (cm)'
                    },

                    grid: {
                        drawOnChartArea: false
                    }

                }

            }

        }

    });
}

chartPeriodSelect.addEventListener('change', async () => {
    const measurements = await db.measurements
        .orderBy('date')
        .toArray();

    updateChart(measurements);
});

// --------------------------------------------------
// Reset form
// --------------------------------------------------

function resetForm() {

    form.reset();

    dateInput.value =
        new Date().toISOString().split('T')[0];

    editingId = null;

    formTitle.textContent =
        'Add measurement';

    saveButton.textContent =
        'Save measurement';

    cancelButton.hidden = true;
}


// --------------------------------------------------
// Edit measurement
// --------------------------------------------------

async function editMeasurement(id) {

    const measurement =
        await db.measurements.get(id);

    if (!measurement) {
        return;
    }

    editingId = id;

    dateInput.value = measurement.date;
    weightInput.value = measurement.weight;
    waistInput.value = measurement.waist;

    formTitle.textContent =
        'Edit measurement';

    saveButton.textContent =
        'Update measurement';

    cancelButton.hidden = false;

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}


// --------------------------------------------------
// Delete measurement
// --------------------------------------------------

async function deleteMeasurement(id) {

    const measurement =
        await db.measurements.get(id);

    if (!measurement) {
        return;
    }

    const confirmed =
        confirm(
            `Delete measurement from ${measurement.date}?`
        );

    if (!confirmed) {
        return;
    }

    await db.measurements.delete(id);

    if (editingId === id) {
        resetForm();
    }

    await loadMeasurements();
}


// --------------------------------------------------
// Add / Update measurement
// --------------------------------------------------

form.addEventListener('submit', async event => {

    event.preventDefault();

    const date = dateInput.value;

    const weight =
        Number(weightInput.value);

    const waist =
        Number(waistInput.value);


    if (editingId === null) {

        await db.measurements.add({
            date,
            weight,
            waist
        });

    } else {

        await db.measurements.update(
            editingId,
            {
                date,
                weight,
                waist
            }
        );
    }

    resetForm();

    await loadMeasurements();
});


// --------------------------------------------------
// Cancel editing
// --------------------------------------------------

cancelButton.addEventListener(
    'click',
    () => {
        resetForm();
    }
);


// --------------------------------------------------
// Edit / Delete buttons
// --------------------------------------------------

tableBody.addEventListener(
    'click',
    async event => {

        const button =
            event.target.closest('button');

        if (!button) {
            return;
        }

        const id =
            Number(button.dataset.id);


        if (
            button.classList.contains(
                'edit-button'
            )
        ) {
            await editMeasurement(id);
        }


        if (
            button.classList.contains(
                'delete-button'
            )
        ) {
            await deleteMeasurement(id);
        }

    }
);


// --------------------------------------------------
// Change statistics and baseline

function normalizeSnapshot(records) {
    return records
        .map(record => ({
            id: record.id,
            date: record.date,
            weight: record.weight,
            waist: record.waist
        }))
        .sort((a, b) => Number(a.id) - Number(b.id));
}

async function setCurrentBaseline(label) {
    const records = await db.measurements.toArray();
    await db.appMeta.put({
        key: 'baseline',
        label,
        timestamp: new Date().toISOString(),
        records: normalizeSnapshot(records)
    });
    await updateChangeStats();
}

async function ensureBaseline() {
    const baseline = await db.appMeta.get('baseline');
    if (!baseline) {
        const records = await db.measurements.toArray();
        await db.appMeta.put({
            key: 'baseline',
            label: 'Initial baseline',
            timestamp: new Date().toISOString(),
            records: normalizeSnapshot(records)
        });
    }
}

async function updateChangeStats() {
    const baseline = await db.appMeta.get('baseline');
    const baselineRecords = baseline?.records ?? [];
    const currentRecords = await db.measurements.toArray();

    const baselineById = new Map(baselineRecords.map(record => [String(record.id), record]));
    const currentById = new Map(currentRecords.map(record => [String(record.id), record]));

    let added = 0;
    let edited = 0;
    let deleted = 0;

    for (const record of currentRecords) {
        const original = baselineById.get(String(record.id));
        if (!original) {
            added++;
        } else if (
            original.date !== record.date ||
            original.weight !== record.weight ||
            original.waist !== record.waist
        ) {
            edited++;
        }
    }

    for (const record of baselineRecords) {
        if (!currentById.has(String(record.id))) deleted++;
    }

    statAdded.textContent = String(added);
    statEdited.textContent = String(edited);
    statDeleted.textContent = String(deleted);
    statAdded.style.color = added > 0 ? '#16a34a' : '';
    statEdited.style.color = edited > 0 ? '#2563eb' : '';
    statDeleted.style.color = deleted > 0 ? '#dc2626' : '';



    if (baseline) {
        const date = new Date(baseline.timestamp);
        const formattedDate = Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
        statsBaselineLabel.textContent =
            `Changes since ${baseline.label.toLowerCase()}${formattedDate ? ` (${formattedDate})` : ''}.`;
    }
}


// Export helper
function downloadTextFile(contents, mimeType, filename) {
    const blob = new Blob([contents], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
}


// JSON Export
async function exportData() {
    const measurements = await db.measurements.toArray();
    const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        measurements
    };

    const filename = `measurements-${new Date().toISOString().split('T')[0]}.json`;
    downloadTextFile(JSON.stringify(data, null, 2), 'application/json', filename);
    await setCurrentBaseline('JSON export');
}


// Import parsing and conflict review

function validDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    // Validate in UTC to avoid local time-zone shifts.
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day;
}

function parseOptionalNumber(value) {
    if (value === null || value === undefined || String(value).trim() === '') return null;
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : undefined;
}

function normalizeImportedRecord(record, rowNumber) {
    if (!record || !validDate(String(record.date ?? ''))) {
        return { error: `Row ${rowNumber}: invalid date.` };
    }

    const weight = parseOptionalNumber(record.weight);
    const waist = parseOptionalNumber(record.waist);

    if (weight === undefined || waist === undefined) {
        return { error: `Row ${rowNumber}: weight and waist must be non-negative numbers or empty.` };
    }
    if (weight === null && waist === null) {
        return { error: `Row ${rowNumber}: both measurements are empty.` };
    }

    return {
        record: {
            date: String(record.date),
            weight,
            waist,
            sourceRow: rowNumber
        }
    };
}

function parseJsonImport(text) {
    const data = JSON.parse(text);
    if (!data || !Array.isArray(data.measurements)) {
        throw new Error('Invalid JSON file: expected a measurements array.');
    }

    const records = [];
    const errors = [];
    data.measurements.forEach((item, index) => {
        const result = normalizeImportedRecord(item, index + 1);
        if (result.record) records.push(result.record);
        else errors.push(result.error);
    });
    return { records, errors };
}

function parseCsvImport(text) {
    const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) throw new Error('CSV file is empty or contains only a header.');

    const records = [];
    const errors = [];
    lines.slice(1).forEach((line, index) => {
        // The app's own CSV format contains no commas inside field values.
        const columns = line.split(',');
        if (columns.length < 3) {
            errors.push(`Row ${index + 2}: expected 3 columns.`);
            return;
        }

        const result = normalizeImportedRecord({
            date: columns[0].trim(),
            weight: columns[1].trim(),
            waist: columns[2].trim()
        }, index + 2);

        if (result.record) records.push(result.record);
        else errors.push(result.error);
    });
    return { records, errors };
}

function fieldCandidates(group, field) {
    const candidates = [];

    for (const existing of group.existing) {
        const value = existing[field];
        if (value !== null && value !== undefined && value !== '') {
            candidates.push({
                source: `Existing record${group.existing.length > 1 ? ` (ID ${existing.id})` : ''}`,
                kind: 'existing',
                value
            });
        }
    }

    for (const imported of group.imported) {
        const value = imported[field];
        if (value !== null && value !== undefined) {
            candidates.push({
                source: `Imported row ${imported.sourceRow}`,
                kind: 'imported',
                value
            });
        }
    }

    return candidates.filter((candidate, index, all) =>
        all.findIndex(item => item.value === candidate.value) === index
    );
}

async function prepareImport(records, errors, fileType) {
    const existingRecords = await db.measurements.toArray();
    const existingByDate = new Map();

    for (const record of existingRecords) {
        if (!existingByDate.has(record.date)) existingByDate.set(record.date, []);
        existingByDate.get(record.date).push(record);
    }

    const importedByDate = new Map();
    for (const record of records) {
        if (!importedByDate.has(record.date)) importedByDate.set(record.date, []);
        importedByDate.get(record.date).push(record);
    }

    const groups = [];
    const allDates = new Set([...existingByDate.keys(), ...importedByDate.keys()]);

    for (const date of [...allDates].sort()) {
        const existing = existingByDate.get(date) ?? [];
        const imported = importedByDate.get(date) ?? [];
        if (imported.length === 0) continue;

        const group = { date, existing, imported };
        group.weightCandidates = fieldCandidates(group, 'weight');
        group.waistCandidates = fieldCandidates(group, 'waist');

        
group.needsReview =
    group.weightCandidates.length > 1 ||
    group.waistCandidates.length > 1;

const hasWeight = group.weightCandidates.length > 0;
const hasWaist = group.waistCandidates.length > 0;

if (existing.length > 0 || (hasWeight && hasWaist)) {
    groups.push(group);
} else {
    errors.push(
        `Date ${date}: a new record needs both weight and waist; it will be skipped.`
    );
}

    }

    pendingImport = { groups, errors, fileType };
    renderImportReview();
}

function renderImportReview() {
    if (!pendingImport) return;

    const { groups, errors, fileType } = pendingImport;
    importConflictsList.innerHTML = '';

    const conflicts = groups.filter(group => group.needsReview);

    importReviewSummary.textContent =
        `${fileType} import: ${groups.length} date(s) to process, ` +
        `${conflicts.length} conflict(s), ${errors.length} skipped/invalid row(s). ` +
        'Choose the value to keep for each field.';

    for (const group of conflicts) {
        const groupIndex = groups.indexOf(group);
        const section = document.createElement('section');
        section.className = 'import-conflict';
        section.innerHTML = `
            <h3>${group.date}</h3>
            <p class="data-description">
                ${group.existing.length ? 'Date already exists in the app.' : 'Multiple imported rows have this date.'}
            </p>
            <div class="conflict-field"><strong>Weight (kg)</strong><div class="conflict-options" data-field="weight"></div></div>
            <div class="conflict-field"><strong>Waist (cm)</strong><div class="conflict-options" data-field="waist"></div></div>
        `;

        for (const field of ['weight', 'waist']) {
            const optionsContainer = section.querySelector(`[data-field="${field}"]`);
            const candidates = group[`${field}Candidates`];

            if (candidates.length === 0) {
                optionsContainer.textContent = 'No imported value; the existing value will be kept if available.';
                continue;
            }

            let defaultIndex = candidates.findIndex(candidate => candidate.kind === 'existing');
            if (defaultIndex < 0) defaultIndex = 0;

            candidates.forEach((candidate, candidateIndex) => {
                const label = document.createElement('label');
                label.className = 'conflict-option';

                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = `conflict-${groupIndex}-${field}`;
                radio.value = String(candidateIndex);
                radio.checked = candidateIndex === defaultIndex;

                const text = document.createElement('span');
                text.textContent = `${candidate.value} — ${candidate.source}`;
                label.append(radio, text);
                optionsContainer.appendChild(label);
            });
        }

        importConflictsList.appendChild(section);
    }

    if (conflicts.length === 0) {
        importConflictsList.innerHTML = '<p>No choices are needed. Records will be processed automatically.</p>';
    }

    if (errors.length > 0) {
        const details = document.createElement('details');
        const summary = document.createElement('summary');
        summary.textContent = `Skipped/invalid rows (${errors.length})`;
        const list = document.createElement('ul');

        errors.slice(0, 30).forEach(error => {
            const item = document.createElement('li');
            item.textContent = error;
            list.appendChild(item);
        });
        if (errors.length > 30) {
            const item = document.createElement('li');
            item.textContent = `…and ${errors.length - 30} more.`;
            list.appendChild(item);
        }

        details.append(summary, list);
        importConflictsList.appendChild(details);
    }

    confirmImportButton.disabled = groups.length === 0;
    importReviewOverlay.hidden = false;
}

function selectedCandidate(groupIndex, field) {
    const group = pendingImport.groups[groupIndex];
    const candidates = group[`${field}Candidates`];
    const radio = importConflictsList.querySelector(
        `input[name="conflict-${groupIndex}-${field}"]:checked`
    );

    if (radio) return candidates[Number(radio.value)] ?? null;
    return candidates.find(candidate => candidate.kind === 'existing') ?? candidates[0] ?? null;
}

async function confirmImport() {
    if (!pendingImport) return;

    const { groups, errors, fileType } = pendingImport;
    let added = 0;
    let edited = 0;
    let skipped = errors.length;

    try {
        await db.transaction('rw', db.measurements, db.appMeta, async () => {
            for (const [groupIndex, group] of groups.entries()) {
                
const existing = group.existing[0] ?? null;
const needsReview = group.needsReview;

const weightChoice = needsReview
    ? selectedCandidate(groupIndex, 'weight')
    : group.weightCandidates[0];

const waistChoice = needsReview
    ? selectedCandidate(groupIndex, 'waist')
    : group.waistCandidates[0];

const weight = weightChoice?.value ?? existing?.weight ?? null;
const waist = waistChoice?.value ?? existing?.waist ?? null;


                if (existing) {
                    const nextWeight = weight ?? existing.weight;
                    const nextWaist = waist ?? existing.waist;
                    if (nextWeight !== existing.weight || nextWaist !== existing.waist) {
                        await db.measurements.update(existing.id, {
                            weight: nextWeight,
                            waist: nextWaist
                        });
                        edited++;
                    }
                } else if (weight !== null && weight !== undefined &&
                           waist !== null && waist !== undefined) {
                    await db.measurements.add({ date: group.date, weight, waist });
                    added++;
                } else {
                    skipped++;
                }
            }

            const current = await db.measurements.toArray();
            await db.appMeta.put({
                key: 'baseline',
                label: `${fileType} import`,
                timestamp: new Date().toISOString(),
                records: normalizeSnapshot(current)
            });
        });

        pendingImport = null;
        importReviewOverlay.hidden = true;
        await loadMeasurements();

        alert(
            `${fileType} import completed.\n\n` +
            `Added: ${added}\nEdited: ${edited}\nSkipped/invalid: ${skipped}\n\n` +
            'Change statistics have been reset to this import baseline.'
        );
    } catch (error) {
        console.error(error);
        alert('Import failed. The database transaction was rolled back.');
    }
}

function cancelImportReview() {
    pendingImport = null;
    importReviewOverlay.hidden = true;
}

confirmImportButton.addEventListener('click', confirmImport);
cancelImportReviewButton.addEventListener('click', cancelImportReview);
importReviewOverlay.addEventListener('click', event => {
    if (event.target === importReviewOverlay) cancelImportReview();
});

async function importData(file) {
    try {
        const { records, errors } = parseJsonImport(await file.text());
        await prepareImport(records, errors, 'JSON');
    } catch (error) {
        console.error(error);
        alert('Could not read this JSON file. Please choose a valid measurements JSON export.');
    }
}


// CSV Export
async function exportCsv() {
    const measurements = await db.measurements.orderBy('date').toArray();
    const header = 'Date,Weight (kg),Waist (cm)';
    const rows = measurements.map(measurement =>
        [measurement.date, measurement.weight, measurement.waist].join(',')
    );
    const csv = [header, ...rows].join('\n');
    const filename = `measurements-${new Date().toISOString().split('T')[0]}.csv`;

    downloadTextFile('\uFEFF' + csv, 'text/csv;charset=utf-8;', filename);
    await setCurrentBaseline('CSV export');
}


// CSV Import
async function importCsv(file) {
    try {
        const { records, errors } = parseCsvImport(await file.text());
        await prepareImport(records, errors, 'CSV');
    } catch (error) {
        console.error(error);
        alert('Could not read this CSV file. Please make sure it has Date, Weight (kg), and Waist (cm) columns.');
    }
}


// Data buttons
// --------------------------------------------------

exportButton.addEventListener(
    'click',
    async () => {
        await exportData();
    }
);


importButton.addEventListener(
    'click',
    () => {
        importFile.click();
    }
);


importFile.addEventListener(
    'change',
    async () => {

        const file =
            importFile.files[0];

        if (!file) {
            return;
        }

        await importData(file);

        importFile.value = '';
    }
);


exportCsvButton.addEventListener(
    'click',
    async () => {
        await exportCsv();
    }
);


importCsvButton.addEventListener(
    'click',
    () => {
        importCsvFile.click();
    }
);


importCsvFile.addEventListener(
    'change',
    async () => {

        const file =
            importCsvFile.files[0];

        if (!file) {
            return;
        }

        await importCsv(file);

        importCsvFile.value = '';
    }
);


// --------------------------------------------------
// Start application
// --------------------------------------------------

ensureBaseline()
    .then(() => loadMeasurements())
    .catch(error => {
        console.error('Could not initialize change statistics:', error);
        loadMeasurements();
    });