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
  path: '/api/syllabus?class_id=9&section_id=6&subject_id=4',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log("STATUS CODE:", res.statusCode);
    console.log("RESPONSE DATA:");
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error("HTTP REQUEST ERROR:", e);
});

req.end();
