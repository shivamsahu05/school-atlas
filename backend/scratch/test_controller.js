const { getSyllabusPlan } = require('../src/controllers/syllabusController');

async function testController() {
  const req = { query: {} };
  const res = {
    json: (data) => console.log('RESPONSE JSON:', data),
    status: (code) => ({
      json: (data) => console.log(`RESPONSE ${code}:`, data)
    })
  };

  try {
    console.log('Calling getSyllabusPlan...');
    await getSyllabusPlan(req, res);
  } catch (err) {
    console.error('CONTROLLER CRASHED:', err);
  }
}

testController();
