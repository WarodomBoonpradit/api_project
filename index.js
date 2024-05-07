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
    const { email, password } = req.body; // รับ email และ password จาก req.body
    
    // คำสั่ง SQL เพื่อเลือกผู้ใช้ที่ตรงกับ email
    connection.query(
        'SELECT id, email, password FROM users WHERE email = ?',
        [email],
        (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Internal Server Error');
            }
            
            // ตรวจสอบว่าพบผู้ใช้ที่ตรงกับ email หรือไม่
            if (results.length === 0) {
                return res.status(401).send('Invalid email or password');
            }
            
            const user = results[0];

            // เปรียบเทียบรหัสผ่านที่รับมา (plaintext) กับรหัสผ่านในฐานข้อมูล
            // โปรดทราบว่านี่เป็นการละเมิดความปลอดภัย คุณควรใช้ bcrypt เพื่อแฮชและเปรียบเทียบรหัสผ่านแทน
            if (password !== user.password) {
                return res.status(401).send('Invalid email or password');
            } else {
                // การเข้าสู่ระบบสำเร็จ
                res.status(200).send({ message: 'Login successful!' });
            }
        }
    );
});

app.get('/users/:id', (req, res) => {
    const id = req.params.id;
    connection.query(
        'SELECT * FROM users WHERE id = ?', [id],
        function (err, results, fields) {
            res.send(results)
        }
    )
})

app.post('/users', (req, res) => {
    connection.query(
        'INSERT INTO `users` (`fname`, `lname`, `address`, `email`, `password`, `avatar`) VALUES (?, ?, ?, ?, ?, ?)',
        [req.body.fname, req.body.lname, req.body.address,req.body.email, req.body.password, req.body.avatar],
         function (err, results, fields) {
            if (err) {
                console.error('Error in POST /users:', err);
                res.status(500).send('Error adding user');
            } else {
                res.status(201).send(results);
            }
        }
    )
})

app.put('/users', (req, res) => {
    connection.query(
        'UPDATE `users` SET `fname`=?, `lname`=?, `address`=?,`email`=?, `password`=?, `avatar`=? WHERE id =?',
        [req.body.fname, req.body.lname, req.body.address,req.body.email, req.body.password, req.body.avatar, req.body.id],
         function (err, results, fields) {
            res.send(results)
        }
    )
})

app.listen(process.env.PORT || 3000, () => {
    console.log('CORS-enabled web server listening on port 3000')
})
