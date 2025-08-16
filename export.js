// Export and import functionality
const exportModal = new bootstrap.Modal($('exportModal'));
const importModal = new bootstrap.Modal($('importModal'));

// Set up event listeners for Export/Import buttons
document.addEventListener('DOMContentLoaded', () => {
    // Set up Export and Import button event listeners
    if ($('exportBtn')) {
        $('exportBtn').addEventListener('click', () => {
            exportModal.show();
        });
    }
    
    if ($('importBtn')) {
        $('importBtn').addEventListener('click', () => {
            importModal.show();
        });
    }
});

// CSV Export Function
function exportExpensesCSV() {
    fetch('/api/export/csv')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.blob();
        })
        .then(blob => {
            // Create a link and trigger download
            downloadFile(blob, 'expenses.csv');
            // Close the modal
            exportModal.hide();
            // Show success notification
            showNotification('Your expenses have been successfully exported to CSV format.');
        })
        .catch(error => {
            console.error('Error exporting expenses as CSV:', error);
            showNotification('Failed to export expenses as CSV. Please try again.', 'danger');
        });
}

// Excel Export Function
function exportExpensesExcel() {
    fetch('/api/export/excel')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.blob();
        })
        .then(blob => {
            // Create a link and trigger download
            downloadFile(blob, 'expenses.xlsx');
            // Close the modal
            exportModal.hide();
            // Show success notification
            showNotification('Your expenses have been successfully exported to Excel format.');
        })
        .catch(error => {
            console.error('Error exporting expenses as Excel:', error);
            showNotification('Failed to export expenses as Excel. Please try again.', 'danger');
        });
}

// Helper function to download a file
function downloadFile(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// Trigger the file input dialog
function triggerImportDialog() {
    $('importFile').click();
}

// Handle file import (CSV or Excel)
function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check file extension
    const fileExt = file.name.split('.').pop().toLowerCase();
    
    if (fileExt === 'csv') {
        importFile(file, 'csv');
    } else if (fileExt === 'xlsx' || fileExt === 'xls') {
        importFile(file, 'excel');
    } else {
        showNotification('Unsupported file format. Please use CSV or Excel file.', 'danger');
    }
    
    // Clear the file input
    event.target.value = '';
    
    // Close the import modal
    importModal.hide();
}

// Import file (CSV or Excel)
function importFile(file, type) {
    const formData = new FormData();
    formData.append('file', file);
    
    const endpoint = type === 'csv' ? '/api/import/csv' : '/api/import/excel';
    
    fetch(endpoint, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(`Successfully imported ${data.importedCount} expenses totaling ₹${data.totalAmount.toFixed(2)}`);
            
            // Update balance and budget progress
            // Handle balance - might be a number or an object
            if (typeof data.balance === 'number') {
                userData.balance = { amount: data.balance };
            } else {
                userData.balance = data.balance;
            }
            userData.budgetProgress = data.budgetProgress;
            
            // Update UI directly
            updateBalanceDisplay();
            updateBudgetDisplay();
            
            // Get all expenses after import
            fetch('/api/expenses')
                .then(response => response.json())
                .then(expenses => {
                    userData.expenses = expenses;
                    updateExpenseTable();
                    updateAllCharts();
                })
                .catch(error => {
                    console.error('Error loading expenses after import:', error);
                });
        } else {
            showNotification('Import failed: ' + (data.error || 'Unknown error'), 'danger');
        }
    })
    .catch(error => {
        console.error('Error importing expenses:', error);
        showNotification(`Failed to import expenses from ${type.toUpperCase()} file. Please try again.`, 'danger');
    });
}
