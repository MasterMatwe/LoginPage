const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'User Information',
  password: '179328',
  port: 5432,
});

// Test the connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to the database', err);
  } else {
    console.log('Connected to PostgreSQL');
  }
});

// Register route
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    let query, values;

    if (role === 'customer') {
      query = 'INSERT INTO KHACHHANG(ten, tai_khoan, mat_khau) VALUES($1, $2, $3) RETURNING id';
      values = [username, email, hashedPassword];
    } else if (role === 'employee') {
      query = 'INSERT INTO NHAN_VIEN(ten, tai_khoan, mat_khau) VALUES($1, $2, $3) RETURNING id_nhan_vien';
      values = [username, email, hashedPassword];
    } else {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const result = await pool.query(query, values);
    res.status(201).json({ message: 'User registered successfully', userId: result.rows[0].id || result.rows[0].id_nhan_vien });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error registering user' });
  }
});

// Login route
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const query = 'SELECT * FROM Tai_khoan WHERE tai_khoan = $1';
    const result = await pool.query(query, [username]);

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.mat_khau);

    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.tai_khoan, role: user.quyen }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ message: 'Login successful', token, role: user.quyen });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error during login' });
  }
});

// Google login route
app.post('/api/google-login', async (req, res) => {
  try {
    const { token } = req.body;
    const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const { email, name, sub: googleId } = response.data;

    // Check if the user already exists in your database
    const userQuery = 'SELECT * FROM Tai_khoan WHERE tai_khoan = $1';
    const userResult = await pool.query(userQuery, [email]);

    let user;
    if (userResult.rows.length === 0) {
      // User doesn't exist, create a new one
      const hashedPassword = await bcrypt.hash(googleId, 10); // Use googleId as password
      const insertQuery = 'INSERT INTO Tai_khoan(tai_khoan, mat_khau, ten, quyen) VALUES($1, $2, $3, $4) RETURNING *';
      const insertResult = await pool.query(insertQuery, [email, hashedPassword, name, 2]); // Assuming 2 is the role for customers
      user = insertResult.rows[0];
    } else {
      user = userResult.rows[0];
    }

    const jwtToken = jwt.sign({ id: user.tai_khoan, role: user.quyen }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ message: 'Google login successful', token: jwtToken, role: user.quyen });
  } catch (error) {
    console.error('Error during Google login:', error);
    res.status(500).json({ message: 'Error during Google login' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});