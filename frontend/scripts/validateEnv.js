const fs = require('fs');
const path = require('path');

const requiredEnvVars = [
    'REACT_APP_API_BASE_URL',
    'REACT_APP_WS_URL',
    'REACT_APP_PLAID_ENV',
    'REACT_APP_SENTRY_DSN'
];

function validateEnv() {
    const envPath = path.join(__dirname, '../.env');
    if (!fs.existsSync(envPath)) {
        console.error('❌ .env file not found');
        process.exit(1);
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const missingVars = requiredEnvVars.filter(varName =>
        !envContent.includes(varName)
    );

    if (missingVars.length > 0) {
        console.error('❌ Missing required environment variables:');
        missingVars.forEach(varName => console.error(`- ${varName}`));
        process.exit(1);
    }

    console.log('✅ Environment variables validated successfully');
}

validateEnv();
