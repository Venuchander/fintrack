# FinTrack

A comprehensive personal finance management web application that helps users track income and expenses while providing AI-powered financial insights and recommendations.

<table align="center">
    <thead align="center">
        <tr border: 2px;>
            <td><b>🌟 Stars</b></td>
            <td><b>🍴 Forks</b></td>
            <td><b>🐛 Issues</b></td>
            <td><b>🔔 Open PRs</b></td>
            <td><b>🔕 Close PRs</b></td>
        </tr>
     </thead>
    <tbody>
         <tr>
            <td><img alt="Stars" src="https://img.shields.io/github/stars/imsuryya/fintrack?style=flat&logo=github"/></td>
             <td><img alt="Forks" src="https://img.shields.io/github/forks/imsuryya/fintrack?style=flat&logo=github"/></td>
            <td><img alt="Issues" src="https://img.shields.io/github/issues/imsuryya/fintrack?style=flat&logo=github"/></td>
            <td><img alt="Open Pull Requests" src="https://img.shields.io/github/issues-pr/imsuryya/fintrack?style=flat&logo=github"/></td>
           <td><img alt="Close Pull Requests" src="https://img.shields.io/github/issues-pr-closed/imsuryya/fintrack?style=flat&color=green&logo=github"/></td>
        </tr>
    </tbody>
</table>

---

## 📚 Table of Contents

- [ Overview](#overview)
- [ Features](#features)
  - [ Core Financial Management](#core-financial-management)
  - [ AI-Powered Features](#ai-powered-features)
  - [ Data Management](#data-management)
- [ Technology Stack](#technology-stack)
  - [ Frontend](#frontend)
  - [ Backend & Services](#backend--services)
  - [ Data Visualization](#data-visualization)
  - [ Development Tools](#development-tools)
- [ Installation](#installation)
- [ Usage](#usage)
  - [ Getting Started](#getting-started)
  - [ AI Features](#ai-features)
  - [ Reports](#reports)
- [ Scripts](#scripts)
- [ Contributing](#contributing)
- [ Security](#security)
- [ License](#license)
- [ Support](#support)
- [ Documentation](#documentation)
- [ Contributors](#contributors)


---

## Overview

FinTrack enables users to manage their personal finances effectively through an intuitive interface combined with advanced AI capabilities. The platform offers comprehensive tracking, analysis, and reporting features to support informed financial decision-making.

---

## Features

### Core Financial Management
- **Multi-Source Income Tracking**: Add and manage income from various sources including salary, cash, card, and bank transfers
- **Expense Categorization**: Track daily expenses with detailed date-wise categorization
- **Financial Dashboard**: View comprehensive financial overview and trends visualization
- **Report Generation**: Export detailed financial reports in PDF and Excel formats

### AI-Powered Features
- **Financial Chatbot**: Interactive AI assistant to answer questions about your financial data
- **Voice AI Agent**: Make voice calls to financial AI agent powered by Bland.ai
- **AI Insights**: Automated analysis of financial data with personalized suggestions and recommendations

### Data Management
- **Secure Storage**: All financial data securely stored using Firebase
- **Real-time Sync**: Instant data synchronization across devices
- **Data Export**: Multiple export options for backup and analysis

---

## Technology Stack

### Frontend
- **React 18.3.1** with modern hooks and functional components
- **Vite** for fast development and optimized builds
- **React Router DOM** for client-side routing
- **Tailwind CSS** for modern, responsive styling
- **Radix UI** components for accessible UI elements

### Backend & Services
- **Firebase** for authentication and data storage
- **Google Generative AI** for intelligent financial insights
- **Bland.ai** for voice AI capabilities
- **Express.js** server implementation

### Data Visualization
- **Chart.js** and **React Chart.js 2** for interactive financial charts
- **Recharts** for additional charting capabilities

### Development Tools
- **ESLint** for code quality and consistency
- **Autoprefixer** for CSS compatibility
- **PostCSS** for advanced CSS processing

---

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Venuchander/fintrack.git
cd fintrack
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory and add your configuration:
```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_key
VITE_FIREBASE_PROJECT_ID=your_key
VITE_FIREBASE_STORAGE_BUCKET=your_key
VITE_FIREBASE_MESSAGING_SENDER_ID=your_key
VITE_FIREBASE_APP_ID=your_key
VITE_FIREBASE_MEASUREMENT_ID=your_key
VITE_GEN_AI_API_KEY=your_key
VITE_BLAND_API_KEY=your_key
```

4. Start the development server:
```bash
npm run dev
```
---

## Usage

### Getting Started
1. Create an account or sign in to your existing account
2. Set up your income sources in the dashboard
3. Begin tracking daily expenses with appropriate categories
4. Monitor your financial overview and trends

### AI Features
- Use the chatbot to ask questions about spending patterns
- Access AI insights for personalized financial recommendations
- Make voice calls to the AI agent for hands-free financial guidance

### Reports
- Generate comprehensive financial reports
- Export data in PDF or Excel format for external analysis
- View historical trends and spending patterns

---

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint for code quality checks

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Security

All financial data is encrypted and securely stored using Firebase security rules. The application follows industry best practices for handling sensitive financial information.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Support

For support and questions, please open an issue in the GitHub repository.

---

## Documentation

- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Contributing Guidelines](CONTRIBUTING.md)

---

## Contributors

![Contributors](https://contrib.rocks/image?repo=imsuryya/fintrack)
