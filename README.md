
# TRP - Trading Robot Platform

A comprehensive cryptocurrency trading platform for automated trading on PancakeSwap and other DEXes.

## 🚀 Overview

TRP is a modular trading bot system that enables automated cryptocurrency trading on Binance Smart Chain. The platform includes multiple components for price tracking, trade execution, wallet management, and user interface.

## 🧩 Components

- **PancakeSwap Trader UI** - Web interface for configuring and monitoring trades
- **Hot Swap Bot** - Hot wallet management system with frontend/backend
- **CoinGecko Service** - Microservice for reliable cryptocurrency price data
- **CoinGecko Price Service** - Additional price API integration for redundancy

## ⚙️ Architecture

- Trading components communicate through local HTTP APIs
- Token pricing uses caching and fallback mechanisms
- Winston-based logging for comprehensive monitoring
- Configuration-driven design for easy customization

## 🔧 Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/trp.git
cd trp

# Install dependencies for main components
npm install

# Install dependencies for other components
cd pancakeswap-trader-ui
npm install
cd ../coingecko-service
npm install
cd ../hot-swap-bot
npm install
```

## 🔌 Configuration

Create a `.env` file in the hot-swap-bot directory and add:

```
BSC_RPC=https://bsc-dataseed1.binance.org/
WALLET_PRIVATE_KEY=your_private_key_here  # Never share or commit this
```

## 🚀 Usage

```bash
# Start the CoinGecko price service
cd coingecko-service
npm start  # Runs on port 4053

# Start the PancakeSwap trader UI
cd pancakeswap-trader-ui
npm start  # Runs on port 4052

# Start the hot swap bot
cd hot-swap-bot
npm start
```

## 📊 Features

- **Automated Trading**: Configure rules for buying and selling tokens
- **Price Monitoring**: Real-time tracking with caching and fallback mechanisms
- **Multi-wallet Support**: Manage multiple trading wallets
- **Token Price Tracking**: Efficient price data from CoinGecko
- **Slippage Control**: Customize trading parameters
- **Detailed Logging**: Track all trading activities

## ⚠️ Security Notes

- Never share private keys or API keys
- Use separate wallets for testing and production
- Regularly audit trading rules and limits

## 🔄 PM2 Service Management

```bash
# Start all services with PM2
pm2 start ecosystem.config.js

# Check service status
pm2 status
```

## 📜 License

MIT License
