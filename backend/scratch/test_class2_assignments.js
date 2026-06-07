require('dotenv').config();
const jwt = require('jsonwebtoken');
const http = require('http');

const token = jwt.sign(
  { id: 1, email: 'admin@sams.com', role: 'admin' },
  process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production_min_32_chars',
  { expiresIn: '7d' }
);

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/teacher/schedule/assignments',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      const assignments = parsed.data.assignments;
      const class2 = assignments.filter(a => String(a.className) === '2' || String(a.classId) === '9');
      console.log("CLASS 2 ASSIGNMENTS IN API RESPONSE:");
      console.log(JSON.stringify(class2, null, 2));
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error("HTTP REQUEST ERROR:", e);
});

req.end();
