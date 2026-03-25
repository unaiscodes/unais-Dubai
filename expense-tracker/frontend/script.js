const API_URL = 'http://localhost:5000';

// State
let expenses = [];
let categoryChartInstance = null;
let monthlyChartInstance = null;

// DOM Elements
const expenseForm = document.getElementById('expense-form');
const expenseList = document.getElementById('expense-list');
const totalSpendingEl = document.getElementById('total-spending');
const monthlySpendingEl = document.getElementById('monthly-spending');
const topCategoryEl = document.getElementById('top-category');
const filterCategory = document.getElementById('filter-category');
const transactionCount = document.getElementById('transaction-count');
const loadingSpinner = document.getElementById('loading-spinner');
const emptyState = document.getElementById('empty-state');
const toastContainer = document.getElementById('toast-container');
const themeToggle = document.getElementById('theme-toggle');
const submitBtn = document.getElementById('submit-btn');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Set default date to today
    document.getElementById('date').valueAsDate = new Date();
    
    // Load theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    
    // Fetch initial data
    loadExpenses();
});

// --- Theme Toggling ---
themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
});

function updateThemeIcon(theme) {
    const icon = themeToggle.querySelector('i');
    if (theme === 'dark') {
        icon.className = 'fas fa-sun';
    } else {
        icon.className = 'fas fa-moon';
    }
}

// --- API Calls ---
async function loadExpenses() {
    showLoading(true);
    
    try {
        const category = filterCategory.value;
        let url = `${API_URL}/expenses`;
        
        if (category && category !== 'All') {
            // Only add query param if we're filtering
            // Note: Our dropdown values have emojis in HTML text but strictly strings in value attribute.
            url += `?category=${encodeURIComponent(category)}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Failed to fetch expenses');
        }
        
        expenses = await response.json();
        
        renderExpenses();
        updateSummary();
        
        // Load Analytics Charts
        loadCategoryChart();
        loadMonthlyChart();
        
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function addExpense(expenseData) {
    setButtonState(true);
    
    try {
        const response = await fetch(`${API_URL}/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(expenseData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to add expense');
        }
        
        showToast('Expense added successfully!', 'success');
        expenseForm.reset();
        document.getElementById('date').valueAsDate = new Date(); // Reset date
        
        // Reload data
        await loadExpenses();
        
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        setButtonState(false);
    }
}

async function deleteExpense(id) {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    
    try {
        const response = await fetch(`${API_URL}/delete/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to delete expense');
        }
        
        showToast('Expense deleted', 'success');
        await loadExpenses();
        
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// --- Event Listeners ---
expenseForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const amount = document.getElementById('amount').value;
    const category = document.getElementById('category').value;
    const description = document.getElementById('description').value;
    const date = document.getElementById('date').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    
    if (!amount || !category || !date || !paymentMethod) {
        showToast('Please fill all required fields', 'error');
        return;
    }
    
    addExpense({
        amount: parseFloat(amount),
        category,
        description,
        date,
        paymentMethod
    });
});

filterCategory.addEventListener('change', () => {
    loadExpenses();
});

// --- UI Rendering ---
function renderExpenses() {
    expenseList.innerHTML = '';
    transactionCount.textContent = `${expenses.length} item${expenses.length !== 1 ? 's' : ''}`;
    
    if (expenses.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    expenses.forEach(expense => {
        const item = document.createElement('div');
        item.className = 'expense-item';
        
        // Icon logic based on category
        let iconHtml = '<i class="fas fa-tag"></i>';
        const catStr = expense.category || '';
        if (catStr.includes('Food')) iconHtml = '<i class="fas fa-utensils"></i>';
        else if (catStr.includes('Transportation')) iconHtml = '<i class="fas fa-car"></i>';
        else if (catStr.includes('Shopping')) iconHtml = '<i class="fas fa-shopping-bag"></i>';
        else if (catStr.includes('Entertainment')) iconHtml = '<i class="fas fa-film"></i>';
        else if (catStr.includes('Bills')) iconHtml = '<i class="fas fa-bolt"></i>';
        else if (catStr.includes('Health')) iconHtml = '<i class="fas fa-medkit"></i>';
        
        // Date formatting
        const dateObj = new Date(expense.date);
        const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        item.innerHTML = `
            <div class="expense-main">
                <div class="expense-icon">${iconHtml}</div>
                <div class="expense-details">
                    <h4>${expense.description || expense.category}</h4>
                    <p>${expense.category} • ${dateStr} • ${expense.paymentMethod}</p>
                </div>
            </div>
            <div class="expense-meta">
                <span class="expense-amount">$${expense.amount.toFixed(2)}</span>
                <button class="icon-action-btn delete" onclick="deleteExpense('${expense._id}')" aria-label="Delete">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
        expenseList.appendChild(item);
    });
}

function updateSummary() {
    let total = 0;
    let monthly = 0;
    const categoryTotals = {};
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    expenses.forEach(exp => {
        // Total
        total += exp.amount;
        
        // Monthly
        const expDate = new Date(exp.date);
        // Note: Months in JS Date are 0-indexed, but here `expDate.getMonth()` will safely map 0-11
        if (expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear) {
            monthly += exp.amount;
        }
        
        // Category - tallying correctly
        if (!categoryTotals[exp.category]) {
            categoryTotals[exp.category] = 0;
        }
        categoryTotals[exp.category] += exp.amount;
    });
    
    // Top Category Calculation
    let topCat = '-';
    let maxAmount = 0;
    
    for (const [cat, amt] of Object.entries(categoryTotals)) {
        if (amt > maxAmount) {
            maxAmount = amt;
            topCat = cat;
        }
    }
    
    // Update DOM safely
    totalSpendingEl.textContent = `$${total.toFixed(2)}`;
    monthlySpendingEl.textContent = `$${monthly.toFixed(2)}`;
    
    // Clean string (e.g. remove emojis if added)
    const cleanCatName = topCat.replace(/[\u1000-\uFFFF]+/g, '').trim();
    topCategoryEl.textContent = cleanCatName || '-';
}

// --- Helpers ---
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    
    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 3s
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showLoading(isLoading) {
    if (isLoading) {
        loadingSpinner.classList.remove('hidden');
        expenseList.classList.add('hidden');
        emptyState.classList.add('hidden');
    } else {
        loadingSpinner.classList.add('hidden');
        expenseList.classList.remove('hidden');
    }
}

function setButtonState(isSubmitting) {
    if (isSubmitting) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Adding...</span>';
    } else {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Add Expense</span><i class="fas fa-arrow-right"></i>';
    }
}

// --- Analytics Charts ---
async function loadCategoryChart() {
    try {
        const response = await fetch(`${API_URL}/category-summary`);
        if (!response.ok) throw new Error('Failed to fetch category summary');
        const data = await response.json();

        const ctx = document.getElementById('categoryChart').getContext('2d');
        
        if (categoryChartInstance) {
            categoryChartInstance.destroy();
        }

        if (data.length === 0) return;

        const labels = data.map(item => item.category);
        const amounts = data.map(item => item.total);
        const backgroundColors = [
            '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#ec4899'
        ];

        categoryChartInstance = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: amounts,
                    backgroundColor: backgroundColors.slice(0, Math.max(data.length, backgroundColors.length)),
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: 'var(--text-secondary)' }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading category chart:', error);
    }
}

async function loadMonthlyChart() {
    try {
        const response = await fetch(`${API_URL}/monthly-summary`);
        if (!response.ok) throw new Error('Failed to fetch monthly summary');
        const data = await response.json();

        const ctx = document.getElementById('monthlyChart').getContext('2d');
        
        if (monthlyChartInstance) {
            monthlyChartInstance.destroy();
        }

        if (data.length === 0) return;

        const labels = data.map(item => item.month);
        const amounts = data.map(item => item.total);

        monthlyChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total Spending ($)',
                    data: amounts,
                    backgroundColor: '#6366f1',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { 
                        beginAtZero: true,
                        ticks: { color: 'var(--text-secondary)' },
                        grid: { color: 'var(--border-color)' }
                    },
                    x: {
                        ticks: { color: 'var(--text-secondary)' },
                        grid: { display: false }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    } catch (error) {
        console.error('Error loading monthly chart:', error);
    }
}
