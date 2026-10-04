import './style.css';
import Dexie from 'dexie';
import './style.css';
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

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Weight</th>
                            <th>Waist</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody id="measurements-table">
                    </tbody>
                </table>
            </div>
        </section>

        <section class="card">
            <h2>Weight trend</h2>
            <div class="chart-container">
                <canvas id="weight-chart"></canvas>
            </div>
        </section>

        <section class="card">
            <h2>Waist trend</h2>
            <div class="chart-container">
                <canvas id="waist-chart"></canvas>
            </div>
        </section>

    </div>
`;

const form = document.querySelector('#measurement-form');
const dateInput = document.querySelector('#date');
const weightInput = document.querySelector('#weight');
const waistInput = document.querySelector('#waist');
const tableBody = document.querySelector('#measurements-table');

const formTitle = document.querySelector('#form-title');
const saveButton = document.querySelector('#save-button');
const cancelButton = document.querySelector('#cancel-button');

let editingId = null;
let weightChart = null;
let waistChart = null;


// Set today's date
dateInput.value = new Date().toISOString().split('T')[0];

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
            <td>${measurement.weight.toFixed(1)} kg</td>
            <td>${measurement.waist.toFixed(1)} cm</td>
            <td>
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

    updateCharts(measurements);
}

function updateCharts(measurements) {
    const sortedMeasurements = [...measurements].sort(
        (a, b) => a.date.localeCompare(b.date)
    );

    const labels = sortedMeasurements.map(
        measurement => measurement.date
    );

    const weights = sortedMeasurements.map(
        measurement => measurement.weight
    );

    const waists = sortedMeasurements.map(
        measurement => measurement.waist
    );

    // Destroy previous charts before creating new ones
    if (weightChart) {
        weightChart.destroy();
    }

    if (waistChart) {
        waistChart.destroy();
    }

    const weightCanvas = document.querySelector('#weight-chart');
    const waistCanvas = document.querySelector('#waist-chart');

    weightChart = new Chart(weightCanvas, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Weight (kg)',
                    data: weights,
                    tension: 0.2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Weight (kg)'
                    }
                }
            }
        }
    });

    waistChart = new Chart(waistCanvas, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Waist (cm)',
                    data: waists,
                    tension: 0.2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Waist (cm)'
                    }
                }
            }
        }
    });
}

function resetForm() {
    form.reset();

    dateInput.value = new Date().toISOString().split('T')[0];

    editingId = null;

    formTitle.textContent = 'Add measurement';
    saveButton.textContent = 'Save measurement';
    cancelButton.hidden = true;
}

async function editMeasurement(id) {
    const measurement = await db.measurements.get(id);

    if (!measurement) {
        return;
    }

    editingId = id;

    dateInput.value = measurement.date;
    weightInput.value = measurement.weight;
    waistInput.value = measurement.waist;

    formTitle.textContent = 'Edit measurement';
    saveButton.textContent = 'Update measurement';
    cancelButton.hidden = false;

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

async function deleteMeasurement(id) {
    const measurement = await db.measurements.get(id);

    if (!measurement) {
        return;
    }

    const confirmed = confirm(
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

form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const date = dateInput.value;
    const weight = Number(weightInput.value);
    const waist = Number(waistInput.value);

    if (editingId === null) {
        // Add new measurement
        await db.measurements.add({
            date,
            weight,
            waist
        });
    } else {
        // Update existing measurement
        await db.measurements.update(editingId, {
            date,
            weight,
            waist
        });
    }

    resetForm();

    await loadMeasurements();
});

cancelButton.addEventListener('click', () => {
    resetForm();
});

tableBody.addEventListener('click', async (event) => {
    const button = event.target.closest('button');

    if (!button) {
        return;
    }

    const id = Number(button.dataset.id);

    if (button.classList.contains('edit-button')) {
        await editMeasurement(id);
    }

    if (button.classList.contains('delete-button')) {
        await deleteMeasurement(id);
    }
});

// Load existing measurements when application starts
loadMeasurements();