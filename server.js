"use strict";

const app = require('./app');
const { PORT } = require('./config');

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'build')));

// Catch-all for React client-side routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start the server on port 5000
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
