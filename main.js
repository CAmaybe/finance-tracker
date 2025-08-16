// Core functionality and DOM references
const $ = id => document.getElementById(id);
const $currentBalance = $('currentBalance');
const $monthlyBudget = $('monthlyBudget');
const $spentAmount = $('spentAmount');
const $remainingBudget = $('remainingBudget');
const $budgetProgress = $('budgetProgress');
const $expenseAmount = $('expenseAmount');
const $expenseCategory = $('expenseCategory');
const $expenseDate = $('expenseDate');
const $expenseTable = $('expenseTable');
const $noExpenses = $('noExpenses');
const $speechFeedback = $('speechFeedback');
const $speechText = $('speechText');

// Set default date to today
if ($expenseDate) {
    $expenseDate.valueAsDate = new Date();
}

// Initialize tooltips
const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
  return new bootstrap.Tooltip(tooltipTriggerEl);
});

// Modals
const balanceWarningModal = new bootstrap.Modal($('balanceWarningModal'));
const deleteConfirmModal = new bootstrap.Modal($('deleteConfirmModal'));
const budgetAlertModal = new bootstrap.Modal($('budgetAlertModal'));

// Global state
let userData = {
    balance: { amount: 0 },
    budget: { amount: 0 },
    expenses: [],
    incomes: []
};

let tempDeletedExpenseId = null;

// Load user data on page load
document.addEventListener('DOMContentLoaded', () => {
    loadUserData();
    setupEventListeners();
    initializeSpeechRecognition();
    initializeCharts();
});

// Data management - API calls
function loadUserData() {
    fetch('/api/user-data')
        .then(response => response.json())
        .then(data => {
            // Initialize userData with proper structure
            userData = {
                balance: { amount: data.balance || 0 },
                budget: { amount: data.budget || 0 },
                expenses: data.expenses || [],
                incomes: data.incomes || [],
                budgetProgress: data.budgetProgress || 0
            };
            
            // Update UI with the loaded data
            updateUI();
        })
        .catch(error => {
            console.error('Error loading user data:', error);
            // Initialize with default values on error
            userData = {
                balance: { amount: 0 },
                budget: { amount: 0 },
                expenses: [],
                incomes: [],
                budgetProgress: 0
            };
            updateUI();
        });
}

function updateBalance(newBalance) {
    fetch('/api/balance', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ balance: newBalance })
    })
    .then(response => response.json())
    .then(data => {
        // If data.balance is a number, convert it to the proper object structure
        if (typeof data.balance === 'number') {
            userData.balance = { amount: data.balance };
        } else {
            userData.balance = data.balance;
        }
        updateBalanceDisplay();
        
        // Show success notification
        showNotification(`Balance successfully updated to ₹${newBalance.toFixed(2)}.`);
    })
    .catch(error => {
        console.error('Error updating balance:', error);
        showNotification('Failed to update balance. Please try again.', 'danger');
    });
}

function updateBudget(newBudget) {
    fetch('/api/budget', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ budget: newBudget })
    })
    .then(response => response.json())
    .then(data => {
        // If data.budget is a number, convert it to the proper object structure
        if (typeof data.budget === 'number') {
            userData.budget = { amount: data.budget };
        } else {
            userData.budget = data.budget;
        }
        userData.budgetProgress = data.budgetProgress;
        updateBudgetDisplay();
        
        // Show success notification
        showNotification(`Monthly budget successfully updated to ₹${newBudget.toFixed(2)}.`);
    })
    .catch(error => {
        console.error('Error updating budget:', error);
        showNotification('Failed to update budget. Please try again.', 'danger');
    });
}

function addExpense(amount, category, date) {
    // Validate each input field
    let errorMessage = '';
    
    if (!amount) {
        errorMessage += '• Amount is required\n';
    }
    
    if (!category) {
        errorMessage += '• Category is required\n';
    }
    
    if (!date) {
        errorMessage += '• Date is required\n';
    }
    
    // Show error message if any validation failed
    if (errorMessage) {
        showNotification('Please fill in all required fields:\n' + errorMessage, 'danger');
        return;
    }
    
    // Check if balance is sufficient
    if (userData.balance.amount < amount) {
        showBalanceWarning();
        return;
    }
    
    const expenseData = {
        amount: amount,
        category: category,
        date: date || new Date().toISOString().split('T')[0]
    };
    
    fetch('/api/expenses', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(expenseData)
    })
    .then(response => response.json())
    .then(data => {
        // Add to expenses array
        userData.expenses.unshift(data);
        
        // Handle balance - might be a number or an object
        if (typeof data.balance === 'number') {
            userData.balance = { amount: data.balance };
        } else {
            userData.balance = data.balance;
        }
        
        userData.budgetProgress = data.budgetProgress;
        
        // Update UI
        updateBalanceDisplay();
        updateBudgetDisplay();
        updateExpenseTable();
        
        // Check if budget exceeded
        if (userData.budgetProgress >= 100) {
            showBudgetAlert();
        }
        
        // Clear form
        clearExpenseForm();
        
        // Update charts
        updateAllCharts();
        
        // Show success message
        showNotification(`Expense of ₹${amount.toFixed(2)} for ${category} successfully added.`);
    })
    .catch(error => {
        console.error('Error adding expense:', error);
    });
}

function deleteExpense(expenseId) {
    tempDeletedExpenseId = expenseId;
    deleteConfirmModal.show();
}

function confirmDeleteExpense(returnToBalance) {
    if (tempDeletedExpenseId === null) return;
    
    fetch(`/api/expenses/${tempDeletedExpenseId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ returnToBalance: returnToBalance })
    })
    .then(response => response.json())
    .then(data => {
        // Remove expense from array
        userData.expenses = userData.expenses.filter(e => e.id !== tempDeletedExpenseId);
        
        // Handle balance - might be a number or an object
        if (typeof data.balance === 'number') {
            userData.balance = { amount: data.balance };
        } else {
            userData.balance = data.balance;
        }
        
        userData.budgetProgress = data.budgetProgress;
        
        // Update UI
        updateBalanceDisplay();
        updateBudgetDisplay();
        updateExpenseTable();
        
        // Update charts
        updateAllCharts();
        
        // Close modal and reset temp value
        if (deleteConfirmModal) {
            deleteConfirmModal.hide();
        }
        
        // Show success notification
        const message = returnToBalance ? 'Expense deleted and amount returned to balance.' : 'Expense deleted.';
        showNotification(message);
        
        tempDeletedExpenseId = null;
    })
    .catch(error => {
        console.error('Error deleting expense:', error);
        tempDeletedExpenseId = null;
    });
}

function addIncome(description, amount) {
    // Validate input
    if (!amount) {
        showNotification('Please enter an amount', 'danger');
        return;
    }
    
    const incomeData = {
        description: description || "Income",
        amount: amount
    };
    
    fetch('/api/income', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(incomeData)
    })
    .then(response => response.json())
    .then(data => {
        // Handle balance - might be a number or an object
        if (typeof data.balance === 'number') {
            userData.balance = { amount: data.balance };
        } else {
            userData.balance = data.balance;
        }
        
        // Add income to incomes array if returned
        if (data.income) {
            if (!userData.incomes) userData.incomes = [];
            userData.incomes.unshift(data.income);
        }
        
        // Update UI
        updateBalanceDisplay();
        
        // Clear form
        $('incomeDescription').value = '';
        $('incomeAmount').value = '';
        
        // Close modal
        const incomeModal = bootstrap.Modal.getInstance($('incomeModal'));
        incomeModal.hide();
        
        // Show success message
        showNotification(`Income of ₹${amount.toFixed(2)} successfully added. Your new balance is ₹${userData.balance.amount.toFixed(2)}.`);
    })
    .catch(error => {
        console.error('Error adding income:', error);
    });
}

function filterExpenses(category) {
    const filterParam = category === 'all' ? '' : `?category=${category}`;
    
    fetch(`/api/expenses${filterParam}`)
        .then(response => response.json())
        .then(data => {
            userData.expenses = data;
            updateExpenseTable();
        })
        .catch(error => {
            console.error('Error filtering expenses:', error);
        });
}

// UI updates
function updateUI() {
    updateBalanceDisplay();
    updateBudgetDisplay();
    updateExpenseTable();
    updateAllCharts();
}

function updateBalanceDisplay() {
    if (userData.balance && userData.balance.amount !== undefined) {
        $currentBalance.textContent = userData.balance.amount.toFixed(2);
    } else {
        $currentBalance.textContent = "0.00";
    }
}

function updateBudgetDisplay() {
    // Default values
    let budget = 0;
    let spent = 0;
    let remaining = 0;
    
    if (userData.budget && userData.budget.amount !== undefined) {
        $monthlyBudget.textContent = userData.budget.amount.toFixed(2);
        
        // Calculate spent and remaining amounts
        budget = userData.budget.amount || 0;
        spent = (budget * (userData.budgetProgress || 0)) / 100;
        remaining = budget - spent;
    } else {
        $monthlyBudget.textContent = "0.00";
    }
    
    // Update spent and remaining displays
    if ($spentAmount) $spentAmount.textContent = spent.toFixed(2);
    if ($remainingBudget) $remainingBudget.textContent = remaining.toFixed(2);
    
    // Update progress bar
    const progress = userData.budgetProgress || 0;
    $budgetProgress.style.width = `${progress}%`;
    $budgetProgress.textContent = `${Math.round(progress)}%`;
    
    // No tooltip needed
    
    // Update color based on progress with simple green-yellow-red transitions
    if (progress >= 75) {
        $budgetProgress.className = 'progress-bar bg-danger';
    } else if (progress >= 50) {
        $budgetProgress.className = 'progress-bar bg-warning';
    } else {
        $budgetProgress.className = 'progress-bar bg-success';
    }
}

function updateExpenseTable() {
    if (userData.expenses.length === 0) {
        $expenseTable.innerHTML = '';
        $noExpenses.classList.remove('d-none');
        return;
    }
    
    $noExpenses.classList.add('d-none');
    
    let html = '';
    userData.expenses.forEach(expense => {
        html += `
            <tr>
                <td>₹ ${expense.amount.toFixed(2)}</td>
                <td>${expense.category}</td>
                <td>${formatDate(expense.date)}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deleteExpense(${expense.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    $expenseTable.innerHTML = html;
}

// Helpers
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function clearExpenseForm() {
    $expenseAmount.value = '';
    $expenseCategory.selectedIndex = 0;
    $expenseDate.valueAsDate = new Date();
}

// Alerts and modals
function showBalanceWarning() {
    balanceWarningModal.show();
}

function showBudgetAlert() {
    budgetAlertModal.show();
}

// Custom notification system
function showNotification(message, type = 'success') {
    // Create notification element if it doesn't exist
    let notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.position = 'fixed';
        notificationContainer.style.top = '20px';
        notificationContainer.style.right = '20px';
        notificationContainer.style.zIndex = '9999';
        document.body.appendChild(notificationContainer);
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `toast align-items-center border-0 ${type === 'success' ? 'bg-success' : 'bg-danger'} text-white`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'assertive');
    notification.setAttribute('aria-atomic', 'true');
    
    // Add notification content
    notification.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Initialize toast
    const toast = new bootstrap.Toast(notification, {
        animation: true,
        autohide: true,
        delay: 3000
    });
    
    // Show toast
    toast.show();
    
    // Remove from DOM after hiding
    notification.addEventListener('hidden.bs.toast', function () {
        notification.remove();
    });
}

// Event listeners
function setupEventListeners() {
    // Update balance
    $('updateBalanceBtn').addEventListener('click', () => {
        const newBalance = parseFloat($('newBalance').value);
        if (!isNaN(newBalance)) {
            updateBalance(newBalance);
            $('newBalance').value = '';
            bootstrap.Modal.getInstance($('balanceModal')).hide();
        }
    });
    
    // Update budget
    $('updateBudgetBtn').addEventListener('click', () => {
        const newBudget = parseFloat($('newBudget').value);
        if (!isNaN(newBudget)) {
            updateBudget(newBudget);
            $('newBudget').value = '';
            bootstrap.Modal.getInstance($('budgetModal')).hide();
        }
    });
    
    // Add expense
    $('addExpenseBtn').addEventListener('click', () => {
        const amount = parseFloat($expenseAmount.value);
        const category = $expenseCategory.value;
        const date = $expenseDate.value;
        
        addExpense(amount, category, date);
    });
    
    // Add income
    $('addIncomeBtn').addEventListener('click', () => {
        const description = $('incomeDescription').value;
        const amount = parseFloat($('incomeAmount').value);
        
        addIncome(description, amount);
    });
    
    // Delete expense confirmation buttons
    $('deleteYesReturn').addEventListener('click', () => {
        confirmDeleteExpense(true);
    });
    
    $('deleteYesNoReturn').addEventListener('click', () => {
        confirmDeleteExpense(false);
    });
    
    // Clear All button removed
}
