"use strict";

const app = require('./app');
const { PORT } = require('./config');

// Start the server on port 5000
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
