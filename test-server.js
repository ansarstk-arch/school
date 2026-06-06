// Simple test server
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Serve frontend
app.use(express.static(path.join(__dirname, 'Client/dist')));

// API test
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend working!' });
});

// Serve frontend for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'Client/dist/index.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Test server running on http://localhost:${PORT}`);
  console.log(`📱 Access from phone: http://192.168.43.215:${PORT}`);
});
