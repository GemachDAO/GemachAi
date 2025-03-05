# Gemach AI Protocol Interface

Gemach AI is a powerful DeFi protocol interface that enables natural language interactions with various blockchain protocols. It simplifies complex DeFi operations by translating user intentions into executable on-chain actions.

## Adding New Protocols

To add a new protocol to the system, use the `add-protocol.sh` script:

```bash
$ ./scripts/add-protocol.sh <protocol_name> <description> <chain_ids> <actions>
```

Example:
```bash
$ ./scripts/add-protocol.sh 'myprotocol' 'My protocol description' '1,2,3' 'SWAP,BRIDGE'
```

Parameters:
- `protocol_name`: The name of your protocol (e.g., 'myprotocol')
- `description`: A description of what your protocol does
- `chain_ids`: Comma-separated list of chain IDs your protocol supports (e.g., '1,2,3')
- `actions`: Comma-separated list of actions your protocol supports

Available actions:
- BORROW
- BRIDGE
- CLAIM
- CLOSE
- DEPOSIT
- LEND
- LOCK
- LONG
- REPAY
- SHORT
- STAKE
- SWAP
- UNLOCK
- UNSTAKE
- VOTE
- WITHDRAW
- TRANSFER
- FULL_REPAY
- REMOVE_COLLATERAL
- ADD_COLLATERAL
- LEVERAGE
- DELEVERAGE
- OPEN

The script will:
1. Create a new protocol service file in `src/protocols/<protocol_name>/<protocol_name>.service.ts`
2. Create a new protocol module file in `src/protocols/<protocol_name>/<protocol_name>.module.ts`
3. Update the main protocols module to include the new protocol

After running the script, you'll need to:
1. Implement the required methods in your new protocol service
2. Add any specific protocol logic and functionality
3. Test your implementation

## Supported Protocols

### Stryke
Stryke is a DeFi protocol specializing in advanced options trading, built on Dopex's foundation. It leverages Concentrated Liquidity Automated Market Making (CLAMM) to streamline onchain options trading across multiple chains.

**Supported Actions:**
- `OPEN`: Open option positions
- `CLOSE`: Close option positions

**Supported Networks:**
- Arbitrum
- Base
- Sonnen

### Symbiosis
Symbiosis is a decentralized exchange that pools together liquidity from different blockchains. It enables seamless token trading and cross-chain transfers in a single transaction.

**Supported Actions:**
- `SWAP`: Token swaps
- `BRIDGE`: Cross-chain asset transfers

**Supported Networks:**
- Ethereum
- BSC
- Polygon
- Optimism
- Arbitrum
- Base
- Avalanche
- Sonnen

### Transfer
A basic protocol for transferring assets between addresses.

**Supported Actions:**
- `TRANSFER`: Transfer tokens between addresses

**Supported Networks:**
- Ethereum
- BSC
- Polygon
- Optimism
- Arbitrum
- Base
- Avalanche
- Sonnen

## Architecture

The system is built with a modular architecture that includes:

- Protocol Registry: Manages protocol integrations and their supported actions
- Action Service: Handles action execution and validation
- Base Chain Service: Provides blockchain interaction capabilities
- Tool Registry: Manages protocol-specific tools and utilities

## Key Features

- Natural Language Processing: Convert user intentions into executable actions
- Multi-Protocol Support: Interact with multiple DeFi protocols
- Cross-Chain Operations: Execute actions across different blockchain networks
- Transaction Management: Create, validate, and execute transaction sequences
- Portfolio Tracking: Monitor balances and positions across protocols

## Technical Stack

- Backend: NestJS
- Database: PostgreSQL with Prisma ORM
- Caching: Redis
- Queue Management: Bull
- AI Integration: GPT-4

## System Components

- Chat System: Handles user interactions and message processing
- Protocol Registry: Manages protocol integrations
- Action Service: Executes protocol actions
- Transaction Service: Handles transaction sequences
- Tool Registry: Manages protocol-specific tools

## Development

The project uses a modular architecture with decorators for protocol and action registration:

```typescript
@Protocol({
name: 'protocol_name',
description: 'Protocol description',
supportedChainIds: [/ chain IDs /],
})
@SupportedActions(/ action types /)
export class ProtocolService extends BaseProtocol {
// Implementation
}
```


## Action Types

The system supports various DeFi actions including:
- BORROW
- BRIDGE
- CLAIM
- CLOSE
- DEPOSIT
- LEND
- LOCK/UNLOCK
- LONG/SHORT
- REPAY
- STAKE/UNSTAKE
- SWAP
- TRANSFER
- LEVERAGE/DELEVERAGE
- OPEN

## Contributing

Contributions are welcome! To add a new protocol:

1. Create a new service extending `BaseProtocol`
2. Implement required actions using `@Action` decorator
3. Register the protocol in `ProtocolsModule`
4. Add protocol documentation
5. Submit a pull request
