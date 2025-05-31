const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 Magnetica Visual Discovery Engine - Simple Server Starting...');

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0-SIMPLE'
  });
});

// Demo endpoint
app.get('/api/v1/demo', (req, res) => {
  res.json({
    message: '🚀 Magnetica VDE - Simple Backend API',
    version: '1.0.0-SIMPLE',
    timestamp: new Date().toISOString(),
    status: 'WORKING'
  });
});

// Configuration status
app.get('/api/v1/config/status', (req, res) => {
  res.json({
    success: true,
    data: {
      configured: true,
      environment: process.env.NODE_ENV || 'development',
      openai_configured: !!process.env.OPENAI_API_KEY,
      pinecone_configured: !!process.env.PINECONE_API_KEY
    },
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    available_endpoints: [
      'GET /health',
      'GET /api/v1/demo',
      'GET /api/v1/config/status'
    ],
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Magnetica Simple Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Demo: http://localhost:${PORT}/api/v1/demo`);
  console.log(`🔧 Config: http://localhost:${PORT}/api/v1/config/status`);
});

module.exports = app; 