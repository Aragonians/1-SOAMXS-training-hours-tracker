// Key for storing data in the browser's local storage
const STORAGE_KEY = 'instructorHoursLogV2'; 
let myChart = null; // Variable to hold the Chart.js instance

// Load data and draw chart on page load
document.addEventListener('DOMContentLoaded', () => {
    loadSessions();
    updateSummary();
    renderChart();
});

// Function to log a new session
function logSession() {
    const nameInput = document.getElementById('instructor-name');
    const dateInput = document.getElementById('session-date');
    const typeInput = document.getElementById('session-type');
    const startInput = document.getElementById('start-time');
    const endInput = document.getElementById('end-time');
    const errorDisplay = document.getElementById('error-message');

    // Basic validation
    if (!nameInput.value.trim() || !dateInput.value || !typeInput.value || !startInput.value || !endInput.value) {
        errorDisplay.textContent = 'Please fill out all fields.';
        errorDisplay.classList.remove('hidden');
        return;
    }

    const start = new Date(`${dateInput.value}T${startInput.value}`);
    const end = new Date(`${dateInput.value}T${endInput.value}`);
    
    // Check if end time is before start time
    if (end <= start) {
        errorDisplay.textContent = 'End time must be after the start time.';
        errorDisplay.classList.remove('hidden');
        return;
    }
    
    // Clear error message if validation passes
    errorDisplay.classList.add('hidden');

    // Calculate duration in milliseconds
    const durationMs = end - start;
    // Convert to hours (1000ms * 60s * 60min)
    const durationHours = durationMs / (1000 * 60 * 60);

    const session = {
        name: nameInput.value.trim(), // New field
        date: dateInput.value,
        type: typeInput.value,
        start: startInput.value,
        end: endInput.value,
        duration: durationHours
    };

    saveSession(session);
    loadSessions(); 
    updateSummary(); 
    renderChart(); // Update the chart after logging
    
    // Clear form inputs except name for easy logging of multiple sessions by one person
    dateInput.value = '';
    typeInput.value = '';
    startInput.value = '';
    endInput.value = '';
}

// Function to save a session to Local Storage
function saveSession(session) {
    let sessions = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    sessions.push(session);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

// Function to load all sessions and render the log list
function loadSessions() {
    const sessions = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const logList = document.getElementById('log-list');
    logList.innerHTML = ''; // Clear existing list

    sessions.reverse().forEach((session, index) => { // Reverse to show latest first
        const listItem = document.createElement('li');
        const durationFormatted = session.duration.toFixed(2);
        
        const typeDisplay = session.type === 'instructional' ? 'Instructional' : 'Non-Instructional';
        
        listItem.innerHTML = `
            <p><strong>Instructor: ${session.name}</strong></p>
            <p>
                ${new Date(session.date).toLocaleDateString()} | 
                ${session.start} - ${session.end} 
            </p>
            <p class="${session.type}">
                ${typeDisplay}: <strong>${durationFormatted}</strong> hrs
            </p>
        `;
        
        logList.appendChild(listItem);
    });
}

// Function to calculate and update the total hours summary
function updateSummary() {
    const sessions = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    let totalInstructional = 0;
    let totalNonInstructional = 0;

    sessions.forEach(session => {
        if (session.type === 'instructional') {
            totalInstructional += session.duration;
        } else if (session.type === 'non-instructional') {
            totalNonInstructional += session.duration;
        }
    });

    document.getElementById('total-instructional').textContent = totalInstructional.toFixed(2) + ' hours';
    document.getElementById('total-non-instructional').textContent = totalNonInstructional.toFixed(2) + ' hours';
    
    // Return totals for use in rendering the chart
    return { instructional: totalInstructional, nonInstructional: totalNonInstructional };
}

// Function to render the total hours as a Donut Chart
function renderChart() {
    const totals = updateSummary();
    const ctx = document.getElementById('hoursChart').getContext('2d');

    // Destroy existing chart if it exists
    if (myChart) {
        myChart.destroy();
    }

    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Instructional Hours', 'Non-Instructional Hours'],
            datasets: [{
                data: [totals.instructional.toFixed(2), totals.nonInstructional.toFixed(2)],
                backgroundColor: [
                    '#007bff', // Blue for Instructional
                    '#fd7e14' // Orange for Non-Instructional
                ],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                },
                title: {
                    display: true,
                    text: 'Total Hours Distribution'
                }
            }
        }
    });
}

// Function to clear all data
function clearAllData() {
    if (confirm('Are you sure you want to clear ALL logged data? This cannot be undone.')) {
        localStorage.removeItem(STORAGE_KEY);
        loadSessions();
        updateSummary();
        renderChart(); // Redraw chart with zero data
    }
}
