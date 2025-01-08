const fs = require('fs');
const path = require('path');

const envExampleContent = `# Environment
NODE_ENV=development

# API Configuration
REACT_APP_API_BASE_URL=
REACT_APP_WS_URL=

# Plaid Configuration
REACT_APP_PLAID_ENV=

# Error Tracking
REACT_APP_SENTRY_DSN=

# Analytics
REACT_APP_GA_TRACKING_ID=

# Feature Flags
REACT_APP_ENABLE_EXPERIMENTAL_FEATURES=

# Security
REACT_APP_CSRF_TOKEN_HEADER=

# Performance
REACT_APP_ENABLE_PERFORMANCE_MONITORING=
`;

function generateEnvExample() {
    const envExamplePath = path.join(__dirname, '../.env.example');
    fs.writeFileSync(envExamplePath, envExampleContent);
    console.log('✅ .env.example file generated successfully');
}

generateEnvExample();
