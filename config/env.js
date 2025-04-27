const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Determine which .env file to use based on NODE_ENV
function loadEnv() {
  const NODE_ENV = process.env.NODE_ENV || 'development';
  
  // Files to check, in order of precedence
  const envFiles = [
    // 1. .env.{NODE_ENV}.local (ignored by git) - for local overrides
    `.env.${NODE_ENV}.local`,
    // 2. .env.{NODE_ENV} - environment-specific settings
    `.env.${NODE_ENV}`,
    // 3. .env.local (ignored by git) - for local overrides
    '.env.local',
    // 4. .env - default fallback
    '.env'
  ];
  
  // Load the first file that exists
  for (const file of envFiles) {
    const envPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(envPath)) {
      const envConfig = dotenv.parse(fs.readFileSync(envPath));
      
      // Add to process.env
      for (const key in envConfig) {
        process.env[key] = envConfig[key];
      }
      
      console.log(`Environment loaded from ${file}`);
      break;
    }
  }
  
  // Always ensure NODE_ENV is set
  process.env.NODE_ENV = NODE_ENV;
  
  return process.env;
}

module.exports = { loadEnv };
