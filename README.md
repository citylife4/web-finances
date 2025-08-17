# Financial Account Tracker

A Vue.js application for tracking your financial accounts and monitoring wealth progression over time.

## Features

- **Account Management**: Add and organize deposit and investment accounts with categories
- **Monthly Entries**: Record account balances on a monthly basis
- **Dashboard**: Visualize your wealth progression with interactive charts
- **Local Storage**: All data is stored locally in your browser

## Account Types & Categories

### Deposits
- Checking Account
- Savings Account
- Money Market
- Certificate of Deposit (CD)
- High Yield Savings

### Investments
- Stock Portfolio
- Mutual Funds
- ETFs
- Bonds
- 401(k)
- IRA
- Roth IRA
- Crypto
- Real Estate

## Getting Started

### Prerequisites
- Node.js (v20.19.0 or higher recommended)
- npm

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

### Development

Start the development server:
```bash
npm run dev
```
The application will be available at `http://localhost:5173/`

### Build for Production

```bash
npm run build
```

## Usage

1. **Add Accounts**: Go to "Manage Accounts" to add your deposit and investment accounts
2. **Monthly Entries**: Use "Monthly Entry" to record your account balances each month
3. **Dashboard**: View your financial progression and account breakdowns on the main dashboard

## Technology Stack

- Vue.js 3
- Vue Router 4
- Chart.js for data visualization
- Vite for build tooling
- CSS3 with modern styling

## Data Persistence

All data is stored in your browser's local storage. Your financial information never leaves your device.

## Contributing

This is a personal finance tracking tool. Feel free to fork and customize for your own needs.

## License

MIT License
