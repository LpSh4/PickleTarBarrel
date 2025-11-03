const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("../public"));

// PostgreSQL connection
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "postgres",
  password: "8585",
  port: 5432,
});

pool.connect((err, client, release) => {
    if (err) {
        console.error('Database connection error:', err.stack);
        return;
    }
    console.log('Database connected successfully');
    release();
});

// Login endpoint
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      "SELECT * FROM my_users WHERE email = $1 AND password = $2",
      [email, password]
    );
    if (result.rows.length > 0) {
      const user = result.rows[0];
      res.json({
        success: true,
        isAdmin: user.is_admin,
        message: "Login successful",
      });
    } else {
      res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Register endpoint
app.post('/api/register', async (req, res) => {
    console.log('Register request:', req.body);
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
        console.log('Missing fields:', { fullName, email, password });
        return res.status(400).json({
            success: false,
            message: 'Missing required fields: fullName, email, or password'
        });
    }
    try {
        console.log('Checking email:', email);
        const emailCheck = await pool.query('SELECT * FROM my_users WHERE email = $1', [email]);
        if (emailCheck.rows.length > 0) {
            console.log('Email exists:', email);
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }
        // const hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log('Inserting user:', { fullName, email });
        await pool.query(
            'INSERT INTO my_users (full_name, email, password, is_admin) VALUES ($1, $2, $3, $4)',
            [fullName, email, password, false]
        );
        res.json({
            success: true,
            message: 'Registration successful'
        });
    } catch (error) {
        console.error('Registration error:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Admin-only endpoint to fetch all my_users
app.get("/api/my_users", async (req, res) => {
  const { email } = req.query; // Assume admin email is passed for verification
  try {
    const adminCheck = await pool.query(
      "SELECT is_admin FROM my_users WHERE email = $1",
      [email]
    );
    if (adminCheck.rows.length === 0 || !adminCheck.rows[0].is_admin) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Admin access required",
      });
    }
    const result = await pool.query("SELECT email, password FROM my_users");
    res.json(result.rows);
  } catch (error) {
    console.error("Admin fetch error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
