// Chart objects
let categoryChart = null;
let trendChart = null;
let categoryBarChart = null;
let budgetChart = null;

function initializeCharts() {
    // Initialize empty charts
    initializeCategoryChart();
    initializeTrendChart();
    initializeCategoryBarChart();
    initializeBudgetChart();
}

function updateAllCharts() {
    updateCategoryChart();
    updateTrendChart();
    updateCategoryBarChart();
    updateBudgetChart();
    // Recurring expenses table removed
}

// Category Pie Chart
function initializeCategoryChart() {
    const ctx = $('categoryChart');
    if (!ctx) return;
    
    const ctxObj = ctx.getContext('2d');
    categoryChart = new Chart(ctxObj, {
        type: 'pie',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    'rgba(121,82,179,0.8)',  // Purple (Food)
                    'rgba(13,110,253,0.8)',  // Blue (Transport)
                    'rgba(214,51,132,0.8)',  // Pink (Entertainment)
                    'rgba(32,201,151,0.8)',  // Teal (Shopping)
                    'rgba(253,126,20,0.8)',  // Orange (Utilities)
                    'rgba(220,53,69,0.8)',   // Red (Rent)
                    'rgba(13,202,240,0.8)',  // Cyan (Medical)
                    'rgba(25,135,84,0.8)',   // Green (Education)
                    'rgba(108,117,125,0.8)'  // Gray (Other)
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#e5e5e5'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `₹${value.toFixed(2)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function updateCategoryChart() {
    if (!categoryChart) return;
    
    // Group expenses by category
    const categoryTotals = {};
    userData.expenses.forEach(expense => {
        const category = expense.category;
        if (categoryTotals[category]) {
            categoryTotals[category] += expense.amount;
        } else {
            categoryTotals[category] = expense.amount;
        }
    });
    
    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    
    if (data.length === 0) {
        if ($('noCategoryData')) $('noCategoryData').classList.remove('d-none');
        return;
    }
    
    if ($('noCategoryData')) $('noCategoryData').classList.add('d-none');
    
    categoryChart.data.labels = labels;
    categoryChart.data.datasets[0].data = data;
    categoryChart.update();
}

// Monthly Trend Line Chart
function initializeTrendChart() {
    const ctx = $('trendChart');
    if (!ctx) return;
    
    const ctxObj = ctx.getContext('2d');
    trendChart = new Chart(ctxObj, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Monthly Expenses',
                data: [],
                borderColor: 'rgba(13,110,253,0.8)',
                backgroundColor: 'rgba(13,110,253,0.1)',
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#e5e5e5',
                        callback: function(value) {
                            return '₹' + value;
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#e5e5e5'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#e5e5e5'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return '₹' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}

function updateTrendChart() {
    if (!trendChart) return;
    
    // Group expenses by month
    const monthlyTotals = {};
    const months = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    userData.expenses.forEach(expense => {
        const date = new Date(expense.date);
        const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
        const displayMonth = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        
        if (!months.includes(displayMonth)) {
            months.push(displayMonth);
        }
        
        if (monthlyTotals[monthYear]) {
            monthlyTotals[monthYear].total += expense.amount;
        } else {
            monthlyTotals[monthYear] = {
                total: expense.amount,
                display: displayMonth
            };
        }
    });
    
    // Sort months chronologically
    const sortedMonths = Object.keys(monthlyTotals).sort();
    const labels = sortedMonths.map(month => monthlyTotals[month].display);
    const data = sortedMonths.map(month => monthlyTotals[month].total);
    
    if (labels.length < 2) {
        if ($('noTrendData')) $('noTrendData').classList.remove('d-none');
        return;
    }
    
    if ($('noTrendData')) $('noTrendData').classList.add('d-none');
    
    trendChart.data.labels = labels;
    trendChart.data.datasets[0].data = data;
    trendChart.update();
}

// Category Bar Chart
function initializeCategoryBarChart() {
    const ctx = $('categoryBarChart');
    if (!ctx) return;
    
    const ctxObj = ctx.getContext('2d');
    categoryBarChart = new Chart(ctxObj, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Category Total',
                data: [],
                backgroundColor: [
                    'rgba(121,82,179,0.8)',  // Purple (Food)
                    'rgba(13,110,253,0.8)',  // Blue (Transport)
                    'rgba(214,51,132,0.8)',  // Pink (Entertainment)
                    'rgba(32,201,151,0.8)',  // Teal (Shopping)
                    'rgba(253,126,20,0.8)',  // Orange (Utilities)
                    'rgba(220,53,69,0.8)',   // Red (Rent)
                    'rgba(13,202,240,0.8)',  // Cyan (Medical)
                    'rgba(25,135,84,0.8)',   // Green (Education)
                    'rgba(108,117,125,0.8)'  // Gray (Other)
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#e5e5e5',
                        callback: function(value) {
                            return '₹' + value;
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#e5e5e5'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return '₹' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}

function updateCategoryBarChart() {
    if (!categoryBarChart) return;
    
    // Same data as category pie chart
    const categoryTotals = {};
    userData.expenses.forEach(expense => {
        const category = expense.category;
        if (categoryTotals[category]) {
            categoryTotals[category] += expense.amount;
        } else {
            categoryTotals[category] = expense.amount;
        }
    });
    
    // Sort categories by amount
    const sortedCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .map(entry => ({ category: entry[0], amount: entry[1] }));
    
    const labels = sortedCategories.map(item => item.category);
    const data = sortedCategories.map(item => item.amount);
    
    if (data.length === 0) {
        if ($('noCategoryBarData')) $('noCategoryBarData').classList.remove('d-none');
        return;
    }
    
    if ($('noCategoryBarData')) $('noCategoryBarData').classList.add('d-none');
    
    categoryBarChart.data.labels = labels;
    categoryBarChart.data.datasets[0].data = data;
    categoryBarChart.update();
}

// Budget Utilization Gauge Chart
function initializeBudgetChart() {
    const ctx = $('budgetChart');
    if (!ctx) return;
    
    const ctxObj = ctx.getContext('2d');
    budgetChart = new Chart(ctxObj, {
        type: 'doughnut',
        data: {
            labels: ['Used', 'Remaining'],
            datasets: [{
                data: [0, 100],
                backgroundColor: [
                    'rgba(25,135,84,0.8)',   // Green (Used)
                    'rgba(255, 255, 255, 0.1)'   // Light Gray (Remaining)
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            circumference: 180,
            rotation: 270,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#e5e5e5'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            return context.label + ': ' + value + '%';
                        }
                    }
                }
            }
        }
    });
}

function updateBudgetChart() {
    if (!budgetChart) return;
    
    if (!userData.budget || userData.budget <= 0) {
        if ($('noBudgetData')) $('noBudgetData').classList.remove('d-none');
        return;
    }
    
    if ($('noBudgetData')) $('noBudgetData').classList.add('d-none');
    
    const usedPercentage = userData.budgetProgress || 0;
    const remainingPercentage = 100 - usedPercentage;
    
    // Update chart data
    budgetChart.data.datasets[0].data = [usedPercentage, remainingPercentage];
    
    // Change color based on utilization - same logic as progress bar
    if (usedPercentage >= 90) {
        budgetChart.data.datasets[0].backgroundColor[0] = 'rgba(220,53,69,0.8)'; // Red
    } else if (usedPercentage >= 75) {
        budgetChart.data.datasets[0].backgroundColor[0] = 'rgba(255,193,7,0.8)'; // Yellow
    } else if (usedPercentage >= 50) {
        budgetChart.data.datasets[0].backgroundColor[0] = 'rgba(255,193,7,0.8)'; // Yellow
    } else {
        budgetChart.data.datasets[0].backgroundColor[0] = 'rgba(25,135,84,0.8)'; // Green
    }
    
    budgetChart.update();
}

// Recurring Expenses Table functionality removed