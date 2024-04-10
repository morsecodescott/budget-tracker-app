# ChaChing Budget Tracker

ChaChing is a budget and expense tracking web application designed to help users manage their finances more effectively. With a focus on simplicity and user experience, ChaChing allows users to easily track their income, expenses, and budget categories.

## Features

- **User Authentication**: Secure login and registration system to keep your financial data private.
- **Budget Management**: Create, update, and delete budget items to track your income and expenses.
- **Category Management**: Organize your budget items into categories for better tracking and analysis.
- **Expense Tracking**: Log your daily expenses and compare them against your set budget.
- **Dashboard Overview**: Get a quick overview of your financial health with the dashboard feature.

## Technology Stack

- **Front-End**: EJS, CSS, JavaScript
- **Back-End**: Node.js, Express.js
- **Database**: MongoDB
- **Session Management**: express-session with optional Redis for production
- **Authentication**: Passport.js

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Node.js
- MongoDB
- Redis (optional for session management in production)

### Installing

1. Clone the repository
   ```sh
   git clone https://github.com/yourusername/cha-ching.git
   cd cha-ching
   ```
2. Install NPM packages
    ```sh
    npm install
    ```
3. Set up your environment variables in a .env file at the root of the project:
    ```sh
    MONGO_URI=mongodb://localhost:27017/cha-ching
    REDIS_URL=redis://localhost:6379
    NODE_ENV=development
    ```
4. Start the application
    ```sh
    npm start
    ```
5. For development, with hot reload:
    ```sh
    npm run dev
    ```
