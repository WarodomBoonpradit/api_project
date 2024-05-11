const express = require('express')
const cors = require('cors')
const mysql = require('mysql2')
require('dotenv').config()
const app = express()

app.use(cors())
app.use(express.json())

const connection = mysql.createConnection(process.env.DATABASE_URL)

app.get('/', (req, res) => {
    res.send('Hello world!!')
})

app.get('/users', (req, res) => {
    connection.query(
        'SELECT * FROM users',
        function (err, results, fields) {
            res.send(results)
        }
    )
})

app.post('/users/login', (req, res) => {
    const { email, password } = req.body;

    // ตรวจสอบการรับค่า email และ password
    if (!email || !password) {
        return res.status(400).send('Invalid request');
    }

    // ค้นหาผู้ใช้งานจากฐานข้อมูลโดยใช้อีเมล
    connection.query(
        'SELECT * FROM users WHERE email = ?',
        [email],
        (err, results) => {
            if (err) {
                console.error('Error fetching user data:', err);
                return res.status(500).send('Internal Server Error');
            }            
            if (results.length === 0) {
                return res.status(401).send('Invalid email or password');
            }

            const user = results[0]; 
            if (password !== user.password) {
                return res.status(401).send('Invalid email or password');
            }

            res.status(200).send({
                user: {
                    id: user.id,
                    fname: user.fname,
                    lname: user.lname,
                    address: user.address,
                    email: user.email,
                    password: user.password,
                    avatar: user.avatar,                    
                },
                message: 'Login successful! $user.fname',
            });
        }
    );
});


app.get('/users/:id', (req, res) => {
    const id = req.params.id;
    connection.query(
        'SELECT * FROM users WHERE id = ?', [id],
        (err, results) => {
            if (err) {
                console.error('Error fetching user data:', err);
                return res.status(500).send('Internal server error');
            }
            if (results.length === 0) {
                return res.status(404).send('User not found');
            }
            res.status(200).send(results[0]);
        }
    );
});

app.post('/users', (req, res) => {
    const { fname, lname, address, email, password, avatar } = req.body;

    if (!fname || !lname || !address || !email || !password || !avatar) {
        return res.status(400).send({ error: 'All fields are required' });
    }

    connection.query(
        'SELECT email FROM users WHERE email = ?',
        [email],
        (err, results) => {
            if (err) {
                console.error('Error in POST /users:', err);
                return res.status(500).send({ error: 'Internal server error' });
            }

            if (results.length > 0) { 
                return res.status(400).send({ error: 'Email already exists' });
            }

            connection.query(
                'INSERT INTO `users` (`fname`, `lname`, `address`, `email`, `password`, `avatar`) VALUES (?, ?, ?, ?, ?, ?)',
                [fname, lname, address, email, password, avatar],
                (err, results) => {
                    if (err) {
                        console.error('Error in POST /users:', err);
                        return res.status(500).send({ error: 'Internal server error' });
                    }

                    res.status(201).send({
                        message: 'User created successfully',
                        userId: results.insertId,
                    });
                }
            );
        }
    );
});


app.put('/users/:id', (req, res) => {
    const id = req.params.id;
    const { fname, lname, address, email, password, avatar } = req.body;

    // ตรวจสอบว่ามีข้อมูลที่จำเป็นทั้งหมดก่อนอัปเดต
    if (!fname || !lname || !address || !email || !password || !avatar) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // คำสั่ง SQL สำหรับอัปเดตข้อมูลผู้ใช้งาน
    const updateQuery = 
        `UPDATE users SET fname = ?, lname = ?, address = ?, email = ?, password = ?, avatar = ?
        WHERE id = ?`;

    connection.query(updateQuery, [fname, lname, address, email, password, avatar, id], (err, results) => {
        if (err) {
            console.error('Error updating user data:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({ message: 'User data updated successfully' });
    });
});

app.get('/products', (req, res) => {
    // คำสั่ง SQL สำหรับดึงข้อมูลทั้งหมดจากตาราง products
    const sqlQuery = 'SELECT * FROM products';
    
    // เรียกใช้คำสั่ง SQL
    connection.query(sqlQuery, (err, results) => {
        if (err) {
            console.error('Error fetching products data:', err);
            return res.status(500).send({ error: 'Internal server error' });
        }
        
        // ส่งผลลัพธ์กลับไปยังผู้ร้องขอ
        res.status(200).send(results);
    });
});

app.get('/products/:id', (req, res) => {
    const productId = req.params.id; // รับ product_id จาก URL

    // ดึงข้อมูลสินค้าจากฐานข้อมูลตาม product_id
    connection.query(
        'SELECT * FROM products WHERE product_id = ?',
        [productId],
        (err, results) => {
            if (err) {
                console.error('Error fetching product:', err);
                return res.status(500).send('Internal server error');
            }
            if (results.length === 0) {
                // ไม่พบสินค้าตาม product_id
                return res.status(404).send('Product not found');
            }
            // ส่งข้อมูลสินค้ากลับในรูปแบบ JSON
            res.status(200).json(results[0]);
        }
    );
});

app.get('/categorys/:category_id', (req, res) => {
    const categoryId = req.params.category_id; // รับ category_id จาก URL

    // ดึงข้อมูลสินค้าจากฐานข้อมูลตาม category_id
    connection.query(
        'SELECT * FROM products WHERE category_id = ?',
        [categoryId],
        (err, results) => {
            if (err) {
                console.error('Error fetching products:', err);
                return res.status(500).send({ error: 'Internal server error' });
            }
            
            if (results.length === 0) {
                // ไม่พบสินค้าตาม category_id
                return res.status(404).send('No products found for the specified category');
            }
            
            // ส่งข้อมูลสินค้ากลับในรูปแบบ JSON
            res.status(200).json(results);
        }
    );
});




app.listen(process.env.PORT || 3000, () => {
    console.log('CORS-enabled web server listening on port 3000')
})
