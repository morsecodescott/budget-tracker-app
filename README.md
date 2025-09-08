# ChaChing Budget Tracker

ChaChing is a modern, full-stack budget and expense tracking web application designed to help users manage their finances effectively. It leverages Plaid for secure bank integration, allowing users to automatically sync their transactions and get a real-time view of their financial health.

## Features

- **Plaid Integration**: Securely connect your bank accounts to automatically import transactions.
- **User Authentication**: Secure login and registration system to keep your financial data private.
- **Dashboard Overview**: A comprehensive dashboard that provides a quick overview of your account balances, budget summaries, and recent transactions.
- **Budget Management**: Create, update, and delete monthly and ad-hoc budget items for both income and expenses.
- **Category Management**: Organize your transactions into customizable categories and subcategories.
- **Transaction Tracking**: View and filter your transactions by date, category, and type.
- **Real-time Updates**: Utilizes WebSockets for real-time notifications and data updates.
- **Onboarding Wizard**: A step-by-step wizard to help new users set up their accounts and link their bank accounts.

## Technology Stack

### Frontend

- **Framework**: React
- **UI Library**: Material-UI
- **Routing**: React Router
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Real-time Communication**: Socket.IO Client

### Backend

- **Framework**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: Passport.js
- **Bank Integration**: Plaid API
- **Session Management**: express-session with Redis for production
- **Real-time Communication**: Socket.IO

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Node.js (v14 or later)
- MongoDB
- Redis (optional, for session management in production)
- A Plaid API key (for development)

### Backend Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-github-username/cha-ching.git
    cd cha-ching/backend
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Set up environment variables:**

    Create a `.env.development` file in the `backend` directory and add the following variables:

    ```env
    # Server Configuration
    PORT=4000
    NODE_ENV=development

    # MongoDB Configuration
    MONGO_URI=mongodb://localhost:27017/cha-ching

    # Redis Configuration (optional)
    REDIS_URL=redis://localhost:6379

    # Plaid API Configuration
    PLAID_CLIENT_ID=<your_plaid_client_id>
    PLAID_SECRET=<your_plaid_secret>
    PLAID_ENV=sandbox
    PLAID_PRODUCTS=transactions
    PLAID_COUNTRY_CODES=US
    PLAID_WEBHOOK_URL=https://your-ngrok-url/plaid/webhook
    ```

4.  **Start the backend server:**
    ```sh
    npm run dev
    ```

    The backend server will be running on `http://localhost:4000`.

### Frontend Setup

1.  **Navigate to the frontend directory:**
    ```sh
    cd ../frontend
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Start the frontend development server:**
    ```sh
    npm start
    ```

    The frontend development server will be running on `http://localhost:3000`.

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.
