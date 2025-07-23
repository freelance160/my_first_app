const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Data file path
const DATA_FILE = path.join(__dirname, 'expenses.json');

// Initialize data file if it doesn't exist
async function initializeDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch (error) {
    await fs.writeFile(DATA_FILE, JSON.stringify([]));
  }
}

// Helper functions
async function readExpenses() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function writeExpenses(expenses) {
  await fs.writeFile(DATA_FILE, JSON.stringify(expenses, null, 2));
}

// Routes
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Expense Tracker</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 20px;
            }
            
            .container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                border-radius: 15px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            
            .header {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                padding: 30px;
                text-align: center;
            }
            
            .header h1 {
                font-size: 2.5rem;
                margin-bottom: 10px;
            }
            
            .content {
                padding: 30px;
            }
            
            .form-section {
                background: #f8f9fa;
                padding: 25px;
                border-radius: 10px;
                margin-bottom: 30px;
            }
            
            .form-row {
                display: flex;
                gap: 15px;
                margin-bottom: 15px;
                flex-wrap: wrap;
            }
            
            .form-group {
                flex: 1;
                min-width: 200px;
            }
            
            label {
                display: block;
                margin-bottom: 5px;
                font-weight: 600;
                color: #333;
            }
            
            input, select, textarea {
                width: 100%;
                padding: 12px;
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                font-size: 16px;
                transition: border-color 0.3s ease;
            }
            
            input:focus, select:focus, textarea:focus {
                outline: none;
                border-color: #667eea;
            }
            
            button {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                padding: 12px 30px;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                cursor: pointer;
                transition: transform 0.3s ease;
            }
            
            button:hover {
                transform: translateY(-2px);
            }
            
            .stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .stat-card {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                padding: 20px;
                border-radius: 10px;
                text-align: center;
            }
            
            .stat-value {
                font-size: 2rem;
                font-weight: bold;
                margin-bottom: 5px;
            }
            
            .expenses-list {
                background: #f8f9fa;
                border-radius: 10px;
                padding: 20px;
            }
            
            .expense-item {
                background: white;
                padding: 15px;
                margin-bottom: 10px;
                border-radius: 8px;
                border-left: 4px solid #667eea;
                display: flex;
                justify-content: space-between;
                align-items: center;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            
            .expense-details h3 {
                margin-bottom: 5px;
                color: #333;
            }
            
            .expense-meta {
                color: #666;
                font-size: 0.9rem;
            }
            
            .expense-amount {
                font-size: 1.2rem;
                font-weight: bold;
                color: #e74c3c;
            }
            
            .delete-btn {
                background: #e74c3c;
                padding: 8px 15px;
                margin-left: 10px;
                font-size: 14px;
            }
            
            .delete-btn:hover {
                background: #c0392b;
            }
            
            @media (max-width: 768px) {
                .form-row {
                    flex-direction: column;
                }
                
                .expense-item {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 10px;
                }
                
                .expense-actions {
                    align-self: flex-end;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>💰 Expense Tracker</h1>
                <p>Keep track of your expenses effortlessly</p>
            </div>
            
            <div class="content">
                <div class="form-section">
                    <h2>Add New Expense</h2>
                    <form id="expenseForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="description">Description</label>
                                <input type="text" id="description" name="description" required placeholder="e.g., Lunch at restaurant">
                            </div>
                            <div class="form-group">
                                <label for="amount">Amount ($)</label>
                                <input type="number" id="amount" name="amount" step="0.01" required placeholder="0.00">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="category">Category</label>
                                <select id="category" name="category" required>
                                    <option value="">Select Category</option>
                                    <option value="Food">Food & Dining</option>
                                    <option value="Transportation">Transportation</option>
                                    <option value="Entertainment">Entertainment</option>
                                    <option value="Shopping">Shopping</option>
                                    <option value="Bills">Bills & Utilities</option>
                                    <option value="Healthcare">Healthcare</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="date">Date</label>
                                <input type="date" id="date" name="date" required>
                            </div>
                        </div>
                        <button type="submit">Add Expense</button>
                    </form>
                </div>
                
                <div class="stats" id="stats">
                    <!-- Stats will be loaded here -->
                </div>
                
                <div class="expenses-list">
                    <h2>Recent Expenses</h2>
                    <div id="expensesList">
                        <!-- Expenses will be loaded here -->
                    </div>
                </div>
            </div>
        </div>
        
        <script>
            // Set today's date as default
            document.getElementById('date').valueAsDate = new Date();
            
            // Load expenses on page load
            document.addEventListener('DOMContentLoaded', loadExpenses);
            
            // Handle form submission
            document.getElementById('expenseForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(e.target);
                const expense = Object.fromEntries(formData.entries());
                
                try {
                    const response = await fetch('/api/expenses', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(expense)
                    });
                    
                    if (response.ok) {
                        e.target.reset();
                        document.getElementById('date').valueAsDate = new Date();
                        loadExpenses();
                    }
                } catch (error) {
                    alert('Error adding expense: ' + error.message);
                }
            });
            
            async function loadExpenses() {
                try {
                    const response = await fetch('/api/expenses');
                    const expenses = await response.json();
                    
                    displayStats(expenses);
                    displayExpenses(expenses);
                } catch (error) {
                    console.error('Error loading expenses:', error);
                }
            }
            
            function displayStats(expenses) {
                const total = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
                const thisMonth = expenses.filter(exp => {
                    const expDate = new Date(exp.date);
                    const now = new Date();
                    return expDate.getMonth() === now.getMonth() && 
                           expDate.getFullYear() === now.getFullYear();
                });
                const monthlyTotal = thisMonth.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
                
                const categories = {};
                expenses.forEach(exp => {
                    categories[exp.category] = (categories[exp.category] || 0) + parseFloat(exp.amount);
                });
                
                const topCategory = Object.keys(categories).reduce((a, b) => 
                    categories[a] > categories[b] ? a : b, 'None'
                );
                
                document.getElementById('stats').innerHTML = \`
                    <div class="stat-card">
                        <div class="stat-value">$\${total.toFixed(2)}</div>
                        <div>Total Expenses</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">$\${monthlyTotal.toFixed(2)}</div>
                        <div>This Month</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">\${expenses.length}</div>
                        <div>Total Transactions</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">\${topCategory}</div>
                        <div>Top Category</div>
                    </div>
                \`;
            }
            
            function displayExpenses(expenses) {
                const sortedExpenses = expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
                
                const expensesHTML = sortedExpenses.map(expense => \`
                    <div class="expense-item">
                        <div class="expense-details">
                            <h3>\${expense.description}</h3>
                            <div class="expense-meta">
                                \${expense.category} • \${new Date(expense.date).toLocaleDateString()}
                            </div>
                        </div>
                        <div class="expense-actions">
                            <span class="expense-amount">$\${parseFloat(expense.amount).toFixed(2)}</span>
                            <button class="delete-btn" onclick="deleteExpense(\${expense.id})">Delete</button>
                        </div>
                    </div>
                \`).join('');
                
                document.getElementById('expensesList').innerHTML = expensesHTML || '<p>No expenses recorded yet.</p>';
            }
            
            async function deleteExpense(id) {
                if (confirm('Are you sure you want to delete this expense?')) {
                    try {
                        const response = await fetch(\`/api/expenses/\${id}\`, {
                            method: 'DELETE'
                        });
                        
                        if (response.ok) {
                            loadExpenses();
                        }
                    } catch (error) {
                        alert('Error deleting expense: ' + error.message);
                    }
                }
            }
        </script>
    </body>
    </html>
  `);
});

// API Routes
app.get('/api/expenses', async (req, res) => {
  try {
    const expenses = await readExpenses();
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read expenses' });
  }
});

app.post('/api/expenses', async (req, res) => {
  try {
    const { description, amount, category, date } = req.body;
    
    if (!description || !amount || !category || !date) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const expenses = await readExpenses();
    const newExpense = {
      id: Date.now(),
      description,
      amount: parseFloat(amount),
      category,
      date,
      createdAt: new Date().toISOString()
    };
    
    expenses.push(newExpense);
    await writeExpenses(expenses);
    
    res.status(201).json(newExpense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add expense' });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const expenses = await readExpenses();
    const filteredExpenses = expenses.filter(expense => expense.id !== id);
    
    if (expenses.length === filteredExpenses.length) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    await writeExpenses(filteredExpenses);
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// Start server
async function startServer() {
  await initializeDataFile();
  app.listen(PORT, () => {
    console.log(`Expense Tracker running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to start tracking expenses`);
  });
}

startServer().catch(console.error);