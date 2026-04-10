const serverless = require('serverless-http');
const app = require('../sams-backend/src/app');

module.exports = serverless(app);


// const app = require('../sams-backend/src/app');

// // Vercel serverless handler (IMPORTANT)
// module.exports = (req, res) => {
//   return app(req, res);
// };