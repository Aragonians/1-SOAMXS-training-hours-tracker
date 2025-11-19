let typeChart = null; 
let instructorChart = null; 

const INSTRUCTORS = ['Aragon', 'Morrison', 'Howard'];
let currentSessions = []; // Global array to hold sessions fetched from the database

// Load data and draw charts on page load
document.addEventListener('DOMContentLoaded', () => {
    // Start listening for real-time updates from Firebase
    listenForSessions(); 
});

// NEW: Function to listen for real-time changes
function listenForSessions() {
    // This function subscribes to the database. Every time data changes, it updates the app.
    db.collection(SESSION_COLLECTION).orderBy('timestamp', 'desc')
        .onSnapshot((snapshot) => {
            currentSessions = [];
            snapshot.forEach(doc => {
                // Ensure we handle the timestamp correctly and spread the data
                const data = doc.data();
                currentSessions.push(data);
            });

            // After fetching all documents, update the UI
            loadSessions(currentSessions);
            const totals = updateSummary(currentSessions);
            renderTypeChart(totals); 
            renderInstructorChart(totals);
        }, error => {
            console.error("Error listening to sessions: ", error);
            // In a real app, you'd show a user-friendly error message here
        });
}


// Function to log a new session (UPDATED TO USE FIREBASE)
async function logSession() {
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
    
    if (end <= start) {
        errorDisplay.textContent = 'End time must be after the start time.';
        errorDisplay.classList.remove('hidden');
        return;
    }
    
    errorDisplay.classList.add('hidden');

    const durationMs = end - start;
    const durationHours = durationMs / (1000 * 60 * 60);

    const sessionData = {
        name: nameInput.value,
        class: classInput.value,
        date: dateInput.value,
        type: typeInput.value,
        start: startInput.value,
        end: endInput.value,
        duration: durationHours,
        // Use a Firestore timestamp for reliable sorting across all devices
        timestamp: firebase.firestore.FieldValue.serverTimestamp() 
    };

    try {
        // This writes the data to the central database
        await db.collection(SESSION_COLLECTION).add(sessionData);
        
        // Clearing inputs (UI updates handled by the 'listenForSessions' function)
        dateInput.value = '';
        typeInput.value = '';
        startInput.value = '';
        endInput.value = '';
    } catch (error) {
        console.error("Error adding document: ", error);
        alert("Failed to log session to the database.");
    }
}


// Function to load all sessions and render the log list (UPDATED to use fetched 'sessions')
function loadSessions(sessions) {
    const logList = document.getElementById('log-list');
    logList.innerHTML = ''; 

    sessions.forEach((session) => {
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

// Function to calculate and update the total hours summary (UPDATED to use fetched 'sessions')
function updateSummary(sessions) {
    let totalInstructional = 0;
    let totalNonInstructional = 0;
    
    let instructorTotals = INSTRUCTORS.reduce((acc, name) => {
        acc[name] = { instructional: 0, nonInstructional: 0 };
        return acc;
    }, {});
    
    sessions.forEach(session => {
        if (session.type === 'instructional') {
            totalInstructional += session.duration;
            if (instructorTotals.hasOwnProperty(session.name)) {
                instructorTotals[session.name].instructional += session.duration;
            }
        } else if (session.type === 'non-instructional') {
            totalNonInstructional += session.duration;
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

// Function to render the total hours (Instructional vs Non-Instructional) as a Donut Chart (UNCHANGED)
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

// Renders total hours per instructor as a STACKED Bar Chart (UNCHANGED)
function renderInstructorChart(totals) {
    const ctx = document.getElementById('instructorHoursChart').getContext('2d');
    
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
                    backgroundColor: '#007bff', 
                    borderColor: '#007bff',
                    borderWidth: 1
                },
                {
                    label: 'Non-Instructional Hours',
                    data: nonInstructionalData,
                    backgroundColor: '#fd7e14', 
                    borderColor: '#fd7e14',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            indexAxis: 'y', 
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
                    stacked: true, 
                    title: {
                        display: true,
                        text: 'Total Hours'
                    }
                },
                y: {
                    stacked: true 
                }
            }
        }
    });
}

// Function to clear all data (UPDATED to delete from FIREBASE)
async function clearAllData() {
    if (confirm('Are you sure you want to clear ALL logged data? This will clear the shared database for EVERYONE.')) {
        try {
            const batch = db.batch();
            const snapshot = await db.collection(SESSION_COLLECTION).get();
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            
            // The listenForSessions function handles the UI update automatically
        } catch (error) {
            console.error("Error clearing documents: ", error);
            alert("Failed to clear shared database.");
        }
    }
}
