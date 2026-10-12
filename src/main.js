import './style.css';
import Dexie from 'dexie';
import Chart from 'chart.js/auto';

const db = new Dexie('MeasurementsDatabase');

db.version(1).stores({
    measurements: '++id, date'
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

    </div>
`;


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


// --------------------------------------------------
// Variables
// --------------------------------------------------

let editingId = null;

let bodyChart = null;


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
// JSON Export
// --------------------------------------------------

async function exportData() {

    const measurements =
        await db.measurements.toArray();

    const data = {

        version: 1,

        exportedAt:
            new Date().toISOString(),

        measurements

    };

    const json =
        JSON.stringify(data, null, 2);

    const blob =
        new Blob(
            [json],
            {
                type: 'application/json'
            }
        );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement('a');

    link.href = url;

    link.download =
        `measurements-${
            new Date()
                .toISOString()
                .split('T')[0]
        }.json`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
}


// --------------------------------------------------
// JSON Import
// --------------------------------------------------

async function importData(file) {

    try {

        const text =
            await file.text();

        const data =
            JSON.parse(text);


        if (
            !data.measurements ||
            !Array.isArray(data.measurements)
        ) {
            throw new Error(
                'Invalid file format.'
            );
        }


        let imported = 0;
        let skipped = 0;


        for (
            const measurement
            of data.measurements
        ) {

            if (
                typeof measurement.date !== 'string' ||
                typeof measurement.weight !== 'number' ||
                typeof measurement.waist !== 'number'
            ) {
                skipped++;
                continue;
            }


            if (
                measurement.id !== undefined
            ) {

                const existing =
                    await db.measurements.get(
                        measurement.id
                    );

                if (existing) {
                    skipped++;
                    continue;
                }
            }


            await db.measurements.add({

                date:
                    measurement.date,

                weight:
                    measurement.weight,

                waist:
                    measurement.waist

            });

            imported++;
        }


        await loadMeasurements();


        alert(
            `Import completed.\n\n` +
            `Imported: ${imported}\n` +
            `Skipped: ${skipped}`
        );


    } catch (error) {

        console.error(error);

        alert(
            'Could not import the file.\n\n' +
            'Please make sure it is a valid ' +
            'measurements JSON file.'
        );
    }
}


// --------------------------------------------------
// CSV Export
// --------------------------------------------------

async function exportCsv() {

    const measurements =
        await db.measurements
            .orderBy('date')
            .toArray();


    const header =
        'Date,Weight (kg),Waist (cm)';


    const rows =
        measurements.map(measurement => {

            return [
                measurement.date,
                measurement.weight,
                measurement.waist
            ].join(',');

        });


    const csv =
        [header, ...rows].join('\n');


    const blob =
        new Blob(
            ['\uFEFF' + csv],
            {
                type:
                    'text/csv;charset=utf-8;'
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement('a');

    link.href = url;

    link.download =
        `measurements-${
            new Date()
                .toISOString()
                .split('T')[0]
        }.csv`;


    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
}


// --------------------------------------------------
// CSV Import
// --------------------------------------------------

async function importCsv(file) {

    try {

        const text =
            await file.text();


        const lines =
            text
                .replace(/^\uFEFF/, '')
                .split(/\r?\n/)
                .filter(
                    line => line.trim() !== ''
                );


        if (lines.length < 2) {
            throw new Error(
                'CSV file is empty.'
            );
        }


        const dataLines =
            lines.slice(1);


        let imported = 0;
        let skipped = 0;


        for (const line of dataLines) {

            const columns =
                line.split(',');


            if (columns.length < 3) {
                skipped++;
                continue;
            }


            const date =
                columns[0].trim();

            const weight =
                Number(columns[1].trim());

            const waist =
                Number(columns[2].trim());


            if (
                !date ||
                !Number.isFinite(weight) ||
                !Number.isFinite(waist)
            ) {
                skipped++;
                continue;
            }


            const existing =
                await db.measurements
                    .where('date')
                    .equals(date)
                    .filter(
                        measurement =>
                            measurement.weight === weight &&
                            measurement.waist === waist
                    )
                    .first();


            if (existing) {
                skipped++;
                continue;
            }


            await db.measurements.add({

                date,
                weight,
                waist

            });

            imported++;
        }


        await loadMeasurements();


        alert(
            `CSV import completed.\n\n` +
            `Imported: ${imported}\n` +
            `Skipped: ${skipped}`
        );


    } catch (error) {

        console.error(error);

        alert(
            'Could not import the CSV file.\n\n' +
            'Please make sure it has the correct format.'
        );
    }
}


// --------------------------------------------------
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

loadMeasurements();