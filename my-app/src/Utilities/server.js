const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

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
    const isMatch = await bcrypt.compare(password, user.mat_khau);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.tai_khoan, role: user.quyen }, 'your_jwt_secret', { expiresIn: '1h' });
    res.json({ token, role: user.quyen });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Get all books
app.get('/api/books', async (req, res) => {
  try {
    const query = 'SELECT * FROM Sach';
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching books' });
  }
});

// Add a new book
app.post('/api/books', async (req, res) => {
  try {
    const { ten_sach, mo_ta, tac_gia, nam_xuat_ban } = req.body;
    const query = 'INSERT INTO Sach(ten_sach, mo_ta, tac_gia, nam_xuat_ban) VALUES($1, $2, $3, $4) RETURNING id';
    const values = [ten_sach, mo_ta, tac_gia, nam_xuat_ban];
    const result = await pool.query(query, values);
    res.status(201).json({ message: 'Book added successfully', bookId: result.rows[0].id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding book' });
  }
});

// Borrow a book
app.post('/api/borrow', async (req, res) => {
  try {
    const { id_khach_hang, id_sach_muon, id_nhan_vien, ngay_muon, ngay_tra_du_dinh } = req.body;
    const query = 'INSERT INTO TheMuon(id_khach_hang, id_sach_muon, id_nhan_vien, ngay_muon, ngay_tra_du_dinh) VALUES($1, $2, $3, $4, $5) RETURNING id';
    const values = [id_khach_hang, id_sach_muon, id_nhan_vien, ngay_muon, ngay_tra_du_dinh];
    const result = await pool.query(query, values);
    res.status(201).json({ message: 'Book borrowed successfully', borrowId: result.rows[0].id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error borrowing book' });
  }
});

// Return a book
app.put('/api/return/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { ngay_tra_thuc_te } = req.body;
    const query = 'UPDATE TheMuon SET ngay_tra_thuc_te = $1 WHERE id = $2';
    await pool.query(query, [ngay_tra_thuc_te, id]);
    res.json({ message: 'Book returned successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error returning book' });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));