const axios = require('axios');
const logger = require('../src/utils/logger');

async function testConnections() {
  try {
    const response = await axios.get('http://localhost:3000/health');
    logger.info('Health Check Results:', response.data);
    
    Object.entries(response.data.checks).forEach(([service, status]) => {
      logger.info(`${service}: ${status}`);
    });
  } catch (error) {
    logger.error('Connection test failed:', error.message);
  }
}

testConnections();