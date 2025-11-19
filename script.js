// Key for storing data in the browser's local storage
const STORAGE_KEY = 'instructorHoursLogV5'; 
let typeChart = null; 
let instructorChart = null; 

// Define the instructors array for easy iteration
const INSTRUCTORS = ['Aragon', 'Morrison', 'Howard'];

// Load data and draw charts on page load
document.addEventListener('DOMContentLoaded', () => {
    loadSessions();
    const totals = updateSummary();
    renderTypeChart(totals); 
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
    renderTypeChart(totals); 
    renderInstructorChart(totals);
    
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
    
    // NEW STRUCTURE: Tracks instructional and non-instructional hours per instructor
    let instructorTotals = INSTRUCTORS.reduce((acc, name) => {
        acc[name] = { instructional: 0, nonInstructional: 0 };
        return acc;
    }, {});
    
    sessions.forEach(session => {
        // Calculate Type Totals
        if (session.type === 'instructional') {
            totalInstructional += session.duration;
            // Instructor Instructional Total
            if (instructorTotals.hasOwnProperty(session.name)) {
                instructorTotals[session.name].instructional += session.duration;
            }
        } else if (session.type === 'non-instructional') {
            totalNonInstructional += session.duration;
            // Instructor Non-Instructional Total
            if (instructorTotals.hasOwnProperty(session.name)) {
                instructorTotals[session.name].nonInstructional += session.duration;
            }
        }
    });

    document.getElementById('total-instructional').textContent = totalInstructional.toFixed(2) + ' hours';
    document.getElementById('total-non-instructional').textContent = totalNonInstructional.toFixed(2) + ' hours';
    
    return { 
        instructional: totalInstructional, 
        nonInstructional: totalNonInstructional,
        instructor: instructorTotals
    };
}

// Function to render the total hours (Instructional vs Non-Instructional) as a Donut Chart
function renderTypeChart(totals) {
    const ctx = document.getElementById('typeHoursChart').getContext('2d');

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

// NEW FUNCTION: Renders total hours per instructor as a STACKED Bar Chart
function renderInstructorChart(totals) {
    const ctx = document.getElementById('instructorHoursChart').getContext('2d');
    
    // Prepare data arrays
    const labels = INSTRUCTORS;
    const instructionalData = INSTRUCTORS.map(name => totals.instructor[name].instructional.toFixed(2));
    const nonInstructionalData = INSTRUCTORS.map(name => totals.instructor[name].nonInstructional.toFixed(2));
    
    if (instructorChart) {
        instructorChart.destroy();
    }

    instructorChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Instructional Hours',
                    data: instructionalData,
                    backgroundColor: '#007bff', // Blue
                    borderColor: '#007bff',
                    borderWidth: 1
                },
                {
                    label: 'Non-Instructional Hours',
                    data: nonInstructionalData,
                    backgroundColor: '#fd7e14', // Orange
                    borderColor: '#fd7e14',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            indexAxis: 'y', // Horizontal bar chart
            plugins: {
                legend: {
                    position: 'bottom',
                },
                title: {
                    display: true,
                    text: 'Hours Breakdown Per Instructor'
                }
            },
            scales: {
                x: {
                    stacked: true, // Key to stacking bars
                    title: {
                        display: true,
                        text: 'Total Hours'
                    }
                },
                y: {
                    stacked: true // Key to stacking bars
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
        renderInstructorChart(totals); 
    }
}
