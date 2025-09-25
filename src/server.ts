import initializeApp from './app';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    const app = await initializeApp();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 API base: http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();