# Investment Dashboard 🏆

[![Build Status](https://img.shields.io/github/workflow/status/username/gold-stash-tracker/CI)](https://github.com/username/gold-stash-tracker/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Firebase](https://img.shields.io/badge/Backend-Firebase-orange)](https://firebase.google.com/)
[![React](https://img.shields.io/badge/Frontend-React-blue)](https://react.dev/)

---

> **A comprehensive dashboard for tracking and analyzing all your investments—gold, silver, stocks, mutual funds, fixed deposits, and recurring deposits—in one place.**

---

## 📑 Table of Contents
- [Features](#features)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Available Scripts](#available-scripts)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [FAQ](#faq)
- [License](#license)
- [Support](#support)
- [Version History](#version-history)
- [Acknowledgments](#acknowledgments)

---

## 🚀 Features
- **Unified Multi-Asset Portfolio**: Track gold, silver, stocks, mutual funds, FDs, and RDs in a single dashboard
- **Global Overview**: Real-time analytics and interactive charts for your entire portfolio
- **Transaction Management**: Add, edit, and delete transactions for every asset class
- **Performance Analytics**: Calculate returns, profit/loss, and ROI for each investment type
- **Built-in Calculators**: FD & RD maturity and interest calculators
- **Secure Authentication**: Firebase Auth for user management
- **Cloud Storage**: Persistent data with Firebase Firestore
- **Responsive Design**: Works on desktop and mobile
- **Data Migration & Export**: Tools for onboarding and exporting your data

## 🧠 Core Logic & Calculation Modules
This dashboard uses modular calculation utilities for each asset class:
- **Gold & Silver**: Tracks quantity, market rates, leftover cash, and calculates current value and profit/loss
- **Stocks**: Manages buy/sell transactions, average price, current value, and performance analytics
- **Mutual Funds**: Tracks units, NAV, charges, and computes holdings, returns, and distribution
- **FDs & RDs**: Calculates maturity, accrued interest, and completion percentage using accurate financial formulas
- **Global Dashboard**: Aggregates all assets for a holistic view and actionable insights

## 📸 Screenshots
| Dashboard | Add Transaction | Analytics |
|-----------|----------------|-----------|
| ![Dashboard](public/placeholder.svg) | ![Add Transaction](public/placeholder.svg) | ![Analytics](public/placeholder.svg) |

> Replace `public/placeholder.svg` with actual screenshots for better presentation.

## 🛠️ Tech Stack
- **Frontend**: React 18 with TypeScript
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **State Management**: React Query for server state
- **Authentication**: Firebase Authentication
- **Database**: Firebase Firestore
- **Build Tool**: Vite
- **Charts**: Recharts for data visualization
- **Form Handling**: React Hook Form with Zod validation

## 📦 Installation

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager
- Firebase project with Firestore enabled

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/username/investment-dashboard.git
   cd investment-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the project root:
   ```env
   # Firebase Configuration
   VITE_FIREBASE_API_KEY="your-api-key"
   VITE_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
   VITE_FIREBASE_PROJECT_ID="your-project-id"
   VITE_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
   VITE_FIREBASE_MESSAGING_SENDER_ID="your-messaging-sender-id"
   VITE_FIREBASE_APP_ID="your-app-id"
   ```

4. **Firebase Setup**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Firestore database
   - Enable Authentication with email/password
   - Copy your Firebase configuration to the `.env` file

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 🎯 Usage

### Getting Started

1. **Registration**: Create a new account or login with existing credentials
2. **Dashboard**: View your investment portfolio overview
3. **Add Investments**: Navigate to specific asset dashboards to add transactions
4. **Track Performance**: Monitor your portfolio performance with real-time updates

### Investment Modules

- **Gold Dashboard**: Track gold purchases with current market rates
- **Silver Dashboard**: Monitor silver investments
- **Stocks Dashboard**: Manage equity portfolio
- **Mutual Funds Dashboard**: Track mutual fund investments
- **FD Dashboard**: Monitor fixed deposits with maturity calculations
- **RD Dashboard**: Track recurring deposit investments

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── Dashboard.tsx   # Main dashboard component
│   ├── TransactionForm.tsx
│   └── ...
├── context/            # React contexts
│   └── AuthContext.tsx
├── dashboard/          # Global dashboard
├── gold/              # Gold-specific components
├── silver/            # Silver-specific components
├── fd/                # Fixed deposit components
├── rd/                # Recurring deposit components
├── stocks/            # Stock-specific components
├── mutualfunds/       # Mutual fund components
├── hooks/             # Custom React hooks
├── lib/               # Utility functions and services
├── pages/             # Route pages
└── App.tsx            # Main application component
```

## 🔧 Configuration

### Firebase Security Rules

Update your Firestore security rules in `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/transactions/{transactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 📱 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## 🚀 Deployment

The application can be deployed to various platforms:

### Vercel/Netlify
1. Build the project: `npm run build`
2. Deploy the `dist` folder
3. Configure environment variables in the hosting platform

### Firebase Hosting
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting`
4. Deploy: `firebase deploy`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## ❓ FAQ
**Q: Is my data secure?**
A: All data is stored securely in Firebase Firestore with strict security rules.

**Q: Can I export my portfolio data?**
A: Export functionality is planned for future releases.

**Q: How do I report a bug or request a feature?**
A: Please open an issue on the [GitHub Issues](https://github.com/username/gold-stash-tracker/issues) page.

## 🌍 Accessibility & Internationalization
- Follows accessibility best practices (WCAG)
- Internationalization support planned for future updates

## 💬 Community & Feedback
- Join discussions on [GitHub Discussions](https://github.com/username/gold-stash-tracker/discussions)
- For feedback, email support@investmentdashboard.com

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@investmentdashboard.com or create an issue in the GitHub repository.

## 🔄 Version History

- **v1.0.0**: Initial release with multi-asset portfolio tracking
- More updates coming soon...

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Firebase](https://firebase.google.com/) for backend services
- [Recharts](https://recharts.org/) for data visualization
- [Lucide React](https://lucide.dev/) for icons

---

Made with ❤️ by [Abir Mahanta](https://github.com/username)
