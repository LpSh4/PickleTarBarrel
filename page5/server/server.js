const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const port = 3030;
app.use(cors());
app.use(express.json());
app.use(express.static("../public/"));

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "postgres",
  password: "8585",
  port: 5432,
});

app.get('/', function (req, res) {
  res.render('index.html', {});
});

pool.connect((err, client, release) => {
    if (err) {
        console.error('Database connection error:', err.stack);
        return;
    }
    console.log('Database connected successfully');
    release();
});

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

app.post('/api/register', async (req, res) => {
    const { firstname, lastname, email, password, phonenumber } = req.body;
    console.log('Register request:', req.body);
    if (!firstname || !lastname || !email || !password || !phonenumber) {
        console.log('Missing a lot of fields:', { firstname, lastname, email, password, phonenumber });
        console.log('And req.body is:', req.body)
        return res.status(400).json({
            success: false,
            message: 'Missing required fields!'
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
        console.log('Inserting user:', { firstname, lastname, email });
        await pool.query(
            'INSERT INTO my_users (firstname, lastname, email, password, phone_number, is_admin) VALUES ($1, $2, $3, $4, $5, $6)',
            [firstname, lastname, email, password, phonenumber, false]
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

app.get("/api/my_users", async (req, res) => {
  const { email } = req.query;
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

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
