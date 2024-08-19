const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const shifts = [
    { title: 'First Shift', time: '6AM-2:30 PM' },
    { title: 'Second Shift', time: '8 AM-5:30 PM' },
    { title: 'Third Shift', time: '3 PM - 11:00 PM' },
    { title: 'Fourth Shift', time: '4 PM - 12:30 PM' }
];
let editors = [];
let schedule = {};

function saveToLocalStorage() {
    localStorage.setItem('editors', JSON.stringify(editors));
    localStorage.setItem('schedule', JSON.stringify(schedule));
}

function loadFromLocalStorage() {
    const storedEditors = localStorage.getItem('editors');
    const storedSchedule = localStorage.getItem('schedule');
    
    if (storedEditors) {
        editors = JSON.parse(storedEditors);
    } else {
        editors = ['Shibin', 'Jidhin', 'Gokul', 'Vishnu G'];
    }

    if (storedSchedule) {
        schedule = JSON.parse(storedSchedule);
    } else {
        initializeSchedule();
    }
}

function initializeSchedule() {
    schedule = days.reduce((acc, day) => ({
        ...acc,
        [day]: {
            shifts: shifts.reduce((shiftAcc, shift) => ({ ...shiftAcc, [shift.title]: '' }), {}),
            off: ''
        }
    }), {});
}

function createScheduler() {
    const scheduler = document.getElementById('scheduler');
    scheduler.innerHTML = '<div></div>' + shifts.map(shift => `
        <div>
            <div class="shift-title">${shift.title}</div>
            <div class="shift-time">${shift.time}</div>
        </div>
    `).join('') + '<div>Off</div>';

    days.forEach((day, dayIndex) => {
        const rowHTML = `<div>${day}</div>` + 
        shifts.map((shift, shiftIndex) => `
            <div>
                <select id="select-${dayIndex}-${shiftIndex}" data-day="${day}" data-shift="${shift.title}">
                    <option value=""></option>
                    ${editors.map(editor => `<option value="${editor}">${editor}</option>`).join('')}
                </select>
            </div>
        `).join('') + 
        `<div class="autocomplete">
            <input type="text" id="off-${dayIndex}" placeholder="Editors off (comma-separated)" data-day="${day}">
        </div>`;

        scheduler.insertAdjacentHTML('beforeend', rowHTML);
    });

    // Set values from the schedule object
    days.forEach(day => {
        shifts.forEach(shift => {
            const select = document.querySelector(`select[data-day="${day}"][data-shift="${shift.title}"]`);
            select.value = schedule[day].shifts[shift.title];
        });
        const offInput = document.querySelector(`input[data-day="${day}"]`);
        offInput.value = schedule[day].off;
    });

    document.querySelectorAll('select, input[type="text"][id^="off-"]').forEach(element => {
        element.addEventListener('change', updateSchedule);
    });

    // Setup autocomplete for off inputs
    document.querySelectorAll('input[type="text"][id^="off-"]').forEach(input => {
        setupAutocomplete(input);
    });
}

function setupAutocomplete(inp) {
    let currentFocus;
    inp.addEventListener("input", function(e) {
        let a, b, i, val = this.value;
        closeAllLists();
        if (!val) { return false; }
        currentFocus = -1;
        a = document.createElement("DIV");
        a.setAttribute("id", this.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        this.parentNode.appendChild(a);
        for (i = 0; i < editors.length; i++) {
            if (editors[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
                b = document.createElement("DIV");
                b.innerHTML = "<strong>" + editors[i].substr(0, val.length) + "</strong>";
                b.innerHTML += editors[i].substr(val.length);
                b.innerHTML += "<input type='hidden' value='" + editors[i] + "'>";
                b.addEventListener("click", function(e) {
                    inp.value = this.getElementsByTagName("input")[0].value;
                    closeAllLists();
                    updateSchedule({target: inp});
                });
                a.appendChild(b);
            }
        }
    });
    inp.addEventListener("keydown", function(e) {
        var x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) {
            currentFocus++;
            addActive(x);
        } else if (e.keyCode == 38) {
            currentFocus--;
            addActive(x);
        } else if (e.keyCode == 13) {
            e.preventDefault();
            if (currentFocus > -1) {
                if (x) x[currentFocus].click();
            }
        }
    });
    function addActive(x) {
        if (!x) return false;
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        x[currentFocus].classList.add("autocomplete-active");
    }
    function removeActive(x) {
        for (var i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }
    function closeAllLists(elmnt) {
        var x = document.getElementsByClassName("autocomplete-items");
        for (var i = 0; i < x.length; i++) {
            if (elmnt != x[i] && elmnt != inp) {
                x[i].parentNode.removeChild(x[i]);
            }
        }
    }
    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });
}

function updateSchedule(event) {
    const day = event.target.dataset.day;
    if (event.target.tagName === 'SELECT') {
        const shift = event.target.dataset.shift;
        const newEditor = event.target.value;
        
        // Check if the editor is already assigned to another shift on the same day
        const isEditorAssignedToday = Object.values(schedule[day].shifts).includes(newEditor);
        
        if (newEditor === "" || !isEditorAssignedToday) {
            schedule[day].shifts[shift] = newEditor;
        } else {
            alert("This editor is already assigned to another shift on this day. Please choose a different editor.");
            event.target.value = ""; // Reset the select to empty
        }
    } else {
        schedule[day].off = event.target.value;
    }
    saveToLocalStorage();
    updateShiftOptions(event);
}

function updateShiftOptions(event) {
    const day = event.target.dataset.day;
    const offEditors = schedule[day].off.split(',').map(e => e.trim()).filter(e => e);
    
    const daySelects = document.querySelectorAll(`select[data-day="${day}"]`);
    daySelects.forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '<option value=""></option>' + 
            editors
                .filter(editor => !offEditors.includes(editor))
                .map(editor => `<option value="${editor}">${editor}</option>`)
                .join('');
        select.value = currentValue;
        
        if (offEditors.includes(currentValue)) {
            select.value = "";
            const shift = select.dataset.shift;
            schedule[day].shifts[shift] = "";
        }
    });
    saveToLocalStorage();
}

function resetSchedule() {
    initializeSchedule();
    saveToLocalStorage();
    createScheduler();
}

function autoAssignShifts() {
    const editorWorkloads = Object.fromEntries(editors.map(editor => [editor, 0]));
    
    days.forEach(day => {
        const offEditors = schedule[day].off.split(',').map(e => e.trim()).filter(e => e);
        let availableEditors = editors.filter(editor => !offEditors.includes(editor));
        
        // Prioritize First and Third shifts
        ['First Shift', 'Third Shift', 'Second Shift', 'Fourth Shift'].forEach(shiftTitle => {
            if (schedule[day].shifts[shiftTitle] === "" && availableEditors.length > 0) {
                const leastBusyEditor = availableEditors.reduce((a, b) => 
                    editorWorkloads[a] <= editorWorkloads[b] ? a : b
                );
                schedule[day].shifts[shiftTitle] = leastBusyEditor;
                editorWorkloads[leastBusyEditor]++;
                availableEditors = availableEditors.filter(editor => editor !== leastBusyEditor);
            }
        });
    });
    saveToLocalStorage();
    createScheduler();
}

function shuffleSchedule() {
    let availableEditors = [...editors];
    
    days.forEach(day => {
        shifts.forEach(shift => {
            schedule[day].shifts[shift.title] = '';
        });
    });

    for (let i = availableEditors.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableEditors[i], availableEditors[j]] = [availableEditors[j], availableEditors[i]];
    }

    days.forEach(day => {
        const offEditors = schedule[day].off.split(',').map(e => e.trim()).filter(e => e);
        let dayEditors = availableEditors.filter(editor => !offEditors.includes(editor));
        
        shifts.forEach(shift => {
            if (dayEditors.length > 0) {
                const assignedEditor = dayEditors.pop();
                schedule[day].shifts[shift.title] = assignedEditor;
            }
        });
    });

    saveToLocalStorage();
    createScheduler();
}

function updateEditorList() {
    const editorList = document.getElementById('editorList');
    editorList.innerHTML = editors.map(editor => `
        <div class="editor-item">
            ${editor}
            <span class="remove-editor" data-editor="${editor}">&times;</span>
        </div>
    `).join('');

    document.querySelectorAll('.remove-editor').forEach(btn => {
        btn.addEventListener('click', removeEditor);
    });
}

function addEditor() {
    const newEditorName = document.getElementById('newEditorName').value.trim();
    if (newEditorName && !editors.includes(newEditorName)) {
        editors.push(newEditorName);
        saveToLocalStorage();
        updateEditorList();
        document.getElementById('newEditorName').value = '';
        createScheduler();
    }
}

function removeEditor(event) {
    const editorToRemove = event.target.dataset.editor;
    editors = editors.filter(editor => editor !== editorToRemove);
    
    days.forEach(day => {
        shifts.forEach(shift => {
            if (schedule[day].shifts[shift.title] === editorToRemove) {
                schedule[day].shifts[shift.title] = '';
            }
        });
        schedule[day].off = schedule[day].off
            .split(',')
            .filter(e => e.trim() !== editorToRemove)
            .join(', ');
    });
    
    saveToLocalStorage();
    updateEditorList();
    createScheduler();
}

function printSchedule() {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Weekly Shift Schedule</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                }
                .print-container {
                    width: 100%;
                    max-width: 1000px;
                    margin: 0 auto;
                }
                h1 {
                    text-align: center;
                    color: #2c3e50;
                    margin-bottom: 20px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 12px;
                    text-align: left;
                }
                th {
                    background-color: #f2f2f2;
                    font-weight: bold;
                    color: #2c3e50;
                }
                .shift-title {
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                .shift-time {
                    font-size: 0.8em;
                    color: #666;
                }
                tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
                .day-column {
                    font-weight: bold;
                    background-color: #e9e9e9;
                }
                .off-column {
                    font-style: italic;
                    color: #777;
                }
            </style>
        </head>
        <body>
            <div class="print-container">
                <h1>Weekly Shift Schedule</h1>
                <table>
                    <tr>
                        <th>Day</th>
                        ${shifts.map(shift => `
                            <th>
                                <div class="shift-title">${shift.title}</div>
                                <div class="shift-time">${shift.time}</div>
                            </th>
                        `).join('')}
                        <th>Off</th>
                    </tr>
                    ${days.map(day => `
                        <tr>
                            <td class="day-column">${day}</td>
                            ${shifts.map(shift => `
                                <td>${schedule[day].shifts[shift.title] || ''}</td>
                            `).join('')}
                            <td class="off-column">${schedule[day].off}</td>
                        </tr>
                    `).join('')}
                </table>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
}

document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    createScheduler();
    updateEditorList();
    document.getElementById('resetButton').addEventListener('click', resetSchedule);
    document.getElementById('autoAssignButton').addEventListener('click', autoAssignShifts);
    document.getElementById('shuffleButton').addEventListener('click', shuffleSchedule);
    document.getElementById('printButton').addEventListener('click', printSchedule);
    document.getElementById('addEditorButton').addEventListener('click', addEditor);
});
