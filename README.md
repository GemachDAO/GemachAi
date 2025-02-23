# Gemach OnChain AI

A modern web3 application that combines AI capabilities with blockchain transactions, enabling smart contract interactions and cross-chain operations through an intuitive chat interface.

## 🌟 Features

- **AI-Powered Chat Interface**: Natural language interaction for blockchain operations
- **Cross-Chain Operations**: Support for multiple blockchain networks and cross-chain transactions
- **Smart Contract Integration**: Seamless interaction with smart contracts
- **Wallet Management**: Secure wallet integration and transaction handling
- **Transaction Monitoring**: Real-time transaction status tracking and history
- **User Authentication**: Secure login and user management

## 🚀 Tech Stack

### Frontend
- Next.js 13+
- TypeScript
- Tailwind CSS
- shadcn/ui
- Web3 Libraries

### Backend
- NestJS
- Prisma
- TypeScript
- LiFi Protocol Integration
- AI/LLM Integration

## 📦 Installation

### Prerequisites
- Node.js 18+
- pnpm
- PostgreSQL

### Backend Setup
```bash
cd api
pnpm install
cp .env.example .env  # Configure your environment variables
pnpm prisma generate
pnpm prisma db push
pnpm run start:dev
```

### Frontend Setup
```bash
cd frontend
pnpm install
cp .env.local.example .env.local  # Configure your environment variables
pnpm run dev
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
- Database configuration
- JWT secrets
- Blockchain RPC endpoints
- AI service keys

#### Frontend (.env.local)
- API endpoint
- Web3 configuration
- UI settings

## 🛠️ Development

### Running Tests
```bash
# Backend
cd api
pnpm run test

# Frontend
cd frontend
pnpm run test
```

### Building for Production
```bash
# Backend
cd api
pnpm run build

# Frontend
cd frontend
pnpm run build
```

## 🔐 Security

For security concerns and vulnerability reports, please refer to our [Security Policy](SECURITY.md).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.
