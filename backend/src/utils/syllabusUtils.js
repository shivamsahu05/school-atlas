/**
 * Calculate start and end dates based on month and week.
 * Week 1: 1-7
 * Week 2: 8-14
 * Week 3: 15-21
 * Week 4: 22-28
 * Week 5: 29-end of month
 * @param {string} monthName - e.g., "May"
 * @param {string} weekStr - e.g., "Week 1 (1-7)" or "Week 2"
 * @returns { {startDate: Date, endDate: Date} }
 */
function calculateDates(monthName, weekStr) {
    if (!monthName || !weekStr) return { startDate: null, endDate: null };

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    
    const monthIndex = months.findIndex(m => m.toLowerCase() === monthName.toLowerCase());
    if (monthIndex === -1) return { startDate: null, endDate: null };

    const year = new Date().getFullYear(); 
    
    // Extract week number: matches "Week 1", "Week 1 (1-7)", "W1", etc.
    let weekNum = 1;
    const weekMatch = weekStr.match(/(\d+)/);
    if (weekMatch) {
        weekNum = parseInt(weekMatch[1]);
    }

    let startDay, endDay;
    switch (weekNum) {
        case 1: startDay = 1; endDay = 7; break;
        case 2: startDay = 8; endDay = 14; break;
        case 3: startDay = 15; endDay = 21; break;
        case 4: startDay = 22; endDay = 28; break;
        case 5: 
            startDay = 29;
            endDay = new Date(year, monthIndex + 1, 0).getDate(); 
            break;
        default:
            startDay = 1;
            endDay = 7;
    }

    try {
        const startDate = new Date(year, monthIndex, startDay);
        const endDate = new Date(year, monthIndex, endDay);
        return { startDate, endDate };
    } catch (e) {
        return { startDate: null, endDate: null };
    }
}

/**
 * Converts undefined or empty strings to null for MySQL safety.
 */
function sanitize(val) {
    if (val === undefined || val === '') return null;
    return val;
}

module.exports = { calculateDates, sanitize };
