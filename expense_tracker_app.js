const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Data file paths
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const EXPENSES_FILE = path.join(__dirname, 'data', 'expenses.json');

// Initialize data directory and files
async function initializeData() {
  try {
    await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
    
    // Check if users.json exists, create if not
    try {
      await fs.access(USERS_FILE);
    } catch {
      await fs.writeFile(USERS_FILE, JSON.stringify([]));
    }
    
    // Check if expenses.json exists, create if not
    try {
      await fs.access(EXPENSES_FILE);
    } catch {
      await fs.writeFile(EXPENSES_FILE, JSON.stringify([]));
    }
  } catch (error) {
    console.error('Error initializing data:', error);
  }
}

// Helper functions for data management
async function readUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeUsers(users) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

async function readExpenses() {
  try {
    const data = await fs.readFile(EXPENSES_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeExpenses(expenses) {
  await fs.writeFile(EXPENSES_FILE, JSON.stringify(expenses, null, 2));
}

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

// Routes

// Register user
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const users = await readUsers();
    
    // Check if user already exists
    if (users.find(u => u.username === username)) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Add new user
    const newUser = {
      id: Date.now().toString(),
      username,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    await writeUsers(users);
    
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login user
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const users = await readUsers();
    const user = users.find(u => u.username === username);
    
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ token, username: user.username });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all expenses for authenticated user
app.get('/api/expenses', authenticateToken, async (req, res) => {
  try {
    const expenses = await readExpenses();
    const userExpenses = expenses.filter(e => e.userId === req.user.id);
    res.json(userExpenses);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add new expense
app.post('/api/expenses', authenticateToken, async (req, res) => {
  try {
    const { description, amount, category, date } = req.body;
    
    if (!description || !amount || !category) {
      return res.status(400).json({ error: 'Description, amount, and category required' });
    }

    const expenses = await readExpenses();
    
    const newExpense = {
      id: Date.now().toString(),
      userId: req.user.id,
      description,
      amount: parseFloat(amount),
      category,
      date: date || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };
    
    expenses.push(newExpense);
    await writeExpenses(expenses);
    
    res.status(201).json(newExpense);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update expense
app.put('/api/expenses/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { description, amount, category, date } = req.body;
    
    const expenses = await readExpenses();
    const expenseIndex = expenses.findIndex(e => e.id === id && e.userId === req.user.id);
    
    if (expenseIndex === -1) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    expenses[expenseIndex] = {
      ...expenses[expenseIndex],
      description: description || expenses[expenseIndex].description,
      amount: amount ? parseFloat(amount) : expenses[expenseIndex].amount,
      category: category || expenses[expenseIndex].category,
      date: date || expenses[expenseIndex].date,
      updatedAt: new Date().toISOString()
    };
    
    await writeExpenses(expenses);
    res.json(expenses[expenseIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete expense
app.delete('/api/expenses/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const expenses = await readExpenses();
    const filteredExpenses = expenses.filter(e => !(e.id === id && e.userId === req.user.id));
    
    if (filteredExpenses.length === expenses.length) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    await writeExpenses(filteredExpenses);
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get expense summary
app.get('/api/expenses/summary', authenticateToken, async (req, res) => {
  try {
    const expenses = await readExpenses();
    const userExpenses = expenses.filter(e => e.userId === req.user.id);
    
    const total = userExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const categoryTotals = userExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});
    
    res.json({
      total: total.toFixed(2),
      count: userExpenses.length,
      categories: categoryTotals
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Serve index.html for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Initialize data and start server
initializeData().then(() => {
  app.listen(PORT, () => {
    console.log(`Expense Tracker API running on port ${PORT}`);
  });
});

module.exports = app;