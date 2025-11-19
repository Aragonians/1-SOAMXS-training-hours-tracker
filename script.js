// Key for storing data in the browser's local storage
const STORAGE_KEY = 'instructorHoursLogV4'; // Changed key again for fresh data
let typeChart = null; // Variable to hold the Type Chart.js instance
let instructorChart = null; // Variable to hold the Instructor Chart.js instance

// Load data and draw charts on page load
document.addEventListener('DOMContentLoaded', () => {
    loadSessions();
    const totals = updateSummary();
    renderTypeChart(totals); // Render the two charts
    renderInstructorChart(totals);
});

// Function to log a new session
function logSession() {
    const nameInput = document.getElementById('instructor-name');
    const classInput = document.getElementById('class-taught');
    const dateInput = document.getElementById('session-date');
    const typeInput = document.getElementById('session-type');
    const startInput = document.getElementById('start-time');
    const endInput = document.getElementById('end-time');
    const errorDisplay = document.getElementById('error-message');

    // Basic validation
    if (!nameInput.value || !classInput.value || !dateInput.value || !typeInput.value || !startInput.value || !endInput.value) {
        errorDisplay.textContent = 'Please select a value for all fields.';
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

    // Calculate duration in milliseconds and convert to hours
    const durationMs = end - start;
    const durationHours = durationMs / (1000 * 60 * 60);

    const session = {
        name: nameInput.value,
        class: classInput.value,
        date: dateInput.value,
        type: typeInput.value,
        start: startInput.value,
        end: endInput.value,
        duration: durationHours
    };

    saveSession(session);
    loadSessions(); 
    const totals = updateSummary(); 
    renderTypeChart(totals); // Update both charts
    renderInstructorChart(totals);
    
    // Clear form inputs
    dateInput.value = '';
    typeInput.value = '';
    startInput.value = '';
    endInput.value = '';
}

// Function to save a session to Local Storage (UNCHANGED)
function saveSession(session) {
    let sessions = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    sessions.push(session);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

// Function to load all sessions and render the log list (UNCHANGED)
function loadSessions() {
    const sessions = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const logList = document.getElementById('log-list');
    logList.innerHTML = ''; 

    sessions.reverse().forEach((session, index) => {
        const listItem = document.createElement('li');
        const durationFormatted = session.duration.toFixed(2);
        
        const typeDisplay = session.type === 'instructional' ? 'Instructional' : 'Non-Instructional';
        
        listItem.innerHTML = `
            <p>
                <strong>${session.name}</strong> taught 
                <span style="background-color: #ffe0b2; padding: 2px 5px; border-radius: 3px;">
                    ${session.class} 
                </span>
            </p>
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

// Function to calculate and update the total hours summary (UPDATED)
function updateSummary() {
    const sessions = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    let totalInstructional = 0;
    let totalNonInstructional = 0;
    let instructorTotals = {}; // NEW: Object to store instructor hours

    // Initialize instructor totals based on dropdown options for consistency
    const instructors = ['Aragon', 'Morrison', 'Howard'];
    instructors.forEach(name => instructorTotals[name] = 0);

    sessions.forEach(session => {
        // Calculate Type Totals
        if (session.type === 'instructional') {
            totalInstructional += session.duration;
        } else if (session.type === 'non-instructional') {
            totalNonInstructional += session.duration;
        }
        
        // Calculate Instructor Totals
        if (session.name && instructorTotals.hasOwnProperty(session.name)) {
            instructorTotals[session.name] += session.duration;
        }
    });

    document.getElementById('total-instructional').textContent = totalInstructional.toFixed(2) + ' hours';
    document.getElementById('total-non-instructional').textContent = totalNonInstructional.toFixed(2) + ' hours';
    
    return { 
        instructional: totalInstructional, 
        nonInstructional: totalNonInstructional,
        instructor: instructorTotals // Return instructor totals
    };
}

// Function to render the total hours (Instructional vs Non-Instructional) as a Donut Chart
function renderTypeChart(totals) {
    const ctx = document.getElementById('typeHoursChart').getContext('2d');

    // Destroy existing chart if it exists
    if (typeChart) {
        typeChart.destroy();
    }

    typeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Instructional Hours', 'Non-Instructional Hours'],
            datasets: [{
                data: [totals.instructional.toFixed(2), totals.nonInstructional.toFixed(2)],
                backgroundColor: [
                    '#007bff', 
                    '#fd7e14'  
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
                    text: 'Total Hours Distribution (Type)'
                }
            }
        }
    });
}

// NEW FUNCTION: Renders total hours per instructor as a Bar Chart
function renderInstructorChart(totals) {
    const ctx = document.getElementById('instructorHoursChart').getContext('2d');
    
    // Prepare data for Chart.js
    const labels = Object.keys(totals.instructor);
    const data = Object.values(totals.instructor).map(h => h.toFixed(2));
    
    if (instructorChart) {
        instructorChart.destroy();
    }

    instructorChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Hours Logged',
                data: data,
                backgroundColor: 'rgba(40, 167, 69, 0.8)', // Green color
                borderColor: 'rgba(40, 167, 69, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            indexAxis: 'y', // Make it a horizontal bar chart
            plugins: {
                legend: {
                    display: false // Hide legend for single dataset
                },
                title: {
                    display: true,
                    text: 'Hours Logged Per Instructor'
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Total Hours'
                    }
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
        const totals = updateSummary();
        renderTypeChart(totals); 
        renderInstructorChart(totals); // Redraw both charts with zero data
    }
}
