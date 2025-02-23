import { Test, TestingModule } from '@nestjs/testing';
import { ethers } from 'ethers';
import { BaseChainService } from './base-chain.service';
import * as IERC20MinimalABI from '../../abis/Erc20Mock.json';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from '../../configuration';

describe('BaseProtocol', () => {
  let module: TestingModule;
  let baseProtocol: BaseChainService;
  let provider: ethers.providers.JsonRpcProvider;
  let configService: ConfigService;
  let chainId: number;

  // Using actual addresses from Ethereum mainnet
  const testWalletAddress = '0x481894De7D62add238f60C3018D2cA6Af92AD64c';
  const gmacTokenAddress = '0xD96e84DDBc7CbE1D73c55B6fe8c64f3a6550deea'; // GMAC token
  const nullAddress = '0x0000000000000000000000000000000000000000';

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [configuration],
        }),
      ],
      providers: [BaseChainService, ConfigService],
    }).compile();

    configService = module.get<ConfigService>(ConfigService);

    // Initialize actual provider with config
    const rpcUrl = configService.get<string>('ethereumRpcUrl');
    provider = new ethers.providers.JsonRpcProvider(rpcUrl);

    baseProtocol = module.get<BaseChainService>(BaseChainService);
    baseProtocol.provider = provider;
    baseProtocol.chainId = 1; // Mainnet
    chainId = baseProtocol.chainId;
  });

  afterEach(async () => {
    await module.close();
  });

  describe('getTokenTransferTransaction', () => {
    it('should create native token transfer transaction', async () => {
      const amount = '0.0001'; // Small amount for testing
      const amountInWei = ethers.utils.parseEther(amount);

      const toAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';

      const tx = await baseProtocol['getTokenTransferTransaction'](
        nullAddress,
        testWalletAddress,
        toAddress,
        amount,
        chainId,
      );

      // Verify the transaction structure
      expect(tx).toHaveProperty('from', testWalletAddress);
      expect(tx).toHaveProperty('to', toAddress);
      expect(tx).toHaveProperty('value', amountInWei.toString());
      expect(tx).toHaveProperty('data', '0x');
      expect(tx).toHaveProperty('chainId', chainId);
      expect(tx).toHaveProperty('gas');
      expect(tx).toHaveProperty('maxFeePerGas');
      expect(tx).toHaveProperty('maxPriorityFeePerGas');

      // // Verify gas estimation is a reasonable number
      const gasLimit = ethers.BigNumber.from(tx.gas);
      expect(gasLimit.eq(21000)).toBeTruthy();
      expect(gasLimit.lt(30000)).toBeTruthy(); // Should be less than 30000 for simple transfer
    });

    it('should create token transfer transaction', async () => {
      const amount = '1.0';
      const toAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';

      const tx = await baseProtocol['getTokenTransferTransaction'](
        gmacTokenAddress,
        testWalletAddress,
        toAddress,
        amount,
        1,
      );
      // Verify the transaction structure
      expect(tx).toHaveProperty('data');
      expect(typeof tx.data === 'string').toBeTruthy();
      expect(tx.data.toString().startsWith('0x')).toBeTruthy();
      expect(tx).toHaveProperty('gas');
      expect(tx).toHaveProperty('value', '0');
      expect(tx).toHaveProperty('chainId', chainId);
      expect(tx).toHaveProperty('maxFeePerGas');
      expect(tx).toHaveProperty('maxPriorityFeePerGas');

      // Verify gas estimation is a reasonable number for ERC20 transfer
      const gasLimit = ethers.BigNumber.from(tx.gas);
      expect(gasLimit.gt(30000)).toBeTruthy(); // ERC20 transfers typically use more gas than native transfers
      expect(gasLimit.lt(100000)).toBeTruthy(); // Should be less than 100000 for simple ERC20 transfer
    });
  });

  describe('getTokenAllowance', () => {
    it('should return token allowance', async () => {
      const spenderAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';

      const allowance = await baseProtocol['getTokenAllowance'](
        gmacTokenAddress,
        testWalletAddress,
        spenderAddress,
      );

      expect(ethers.BigNumber.isBigNumber(allowance)).toBeTruthy();
    });
  });

  describe('isNullAddress', () => {
    it('should return true for null address', () => {
      const result = baseProtocol['isNullAddress'](nullAddress);
      expect(result).toBe(true);
    });

    it('should return false for non-null address', () => {
      const result = baseProtocol['isNullAddress'](gmacTokenAddress);
      expect(result).toBe(false);
    });

    it('should handle case-insensitive comparison', () => {
      const upperCaseNull = nullAddress.toUpperCase();
      const result = baseProtocol['isNullAddress'](upperCaseNull);
      expect(result).toBe(true);
    });
  });

  describe('getApproveTokenTransaction', () => {
    it('should return approve transaction data with gas estimation', async () => {
      const amount = ethers.utils.parseEther('1.0');
      const spenderAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';

      const tx = await baseProtocol['getApproveTokenTransaction'](
        testWalletAddress,
        gmacTokenAddress,
        spenderAddress,
        amount,
        chainId,
      );

      // Verify basic transaction structure
      expect(tx).toHaveProperty('from', testWalletAddress);
      expect(tx).toHaveProperty('to', gmacTokenAddress);
      expect(tx).toHaveProperty('value', '0');
      expect(tx).toHaveProperty('chainId', chainId);

      // Verify data field contains approve function signature
      expect(tx).toHaveProperty('data');
      expect(typeof tx.data === 'string').toBeTruthy();
      expect(tx.data.toString().startsWith('0x095ea7b3')).toBeTruthy(); // approve function signature

      // Verify gas and fee properties
      expect(tx).toHaveProperty('gas');
      expect(tx).toHaveProperty('maxFeePerGas');
      expect(tx).toHaveProperty('maxPriorityFeePerGas');

      // Verify gas values are reasonable
      const gasLimit = ethers.BigNumber.from(tx.gas);
      expect(gasLimit.gt(30000)).toBeTruthy(); // Approve typically uses more than 30k gas
      expect(gasLimit.lt(100000)).toBeTruthy(); // Should be less than 100k for approve

      // Verify fee values are reasonable
      const maxFeePerGas = ethers.BigNumber.from(tx.maxFeePerGas);
      const maxPriorityFeePerGas = ethers.BigNumber.from(
        tx.maxPriorityFeePerGas,
      );
      expect(maxFeePerGas.gt(0)).toBeTruthy();
      expect(maxPriorityFeePerGas.gt(0)).toBeTruthy();
      expect(maxFeePerGas.gte(maxPriorityFeePerGas)).toBeTruthy();
    });

    it('should handle gas estimation failure', async () => {
      const amount = ethers.utils.parseEther('1.0');
      // Using an invalid spender address to force gas estimation failure
      const invalidSpender = '0x0000000000000000000000000000000000000000';

      await expect(
        baseProtocol['getApproveTokenTransaction'](
          testWalletAddress,
          gmacTokenAddress,
          invalidSpender,
          amount,
          chainId,
        ),
      ).rejects.toThrow('Failed to estimate gas for approve transaction');
    });
  });

  describe('getTokenBalance', () => {
    it('should return native token balance', async () => {
      const balance = await baseProtocol['getTokenBalance'](
        nullAddress,
        testWalletAddress,
      );

      expect(ethers.BigNumber.isBigNumber(balance)).toBeTruthy();
    });

    it('should return ERC20 token balance', async () => {
      const balance = await baseProtocol['getTokenBalance'](
        gmacTokenAddress,
        testWalletAddress,
      );

      expect(ethers.BigNumber.isBigNumber(balance)).toBeTruthy();
    });
  });

  describe('estimateTransactionFee', () => {
    it('should estimate fee for native transfer', async () => {
      const tx = {
        from: testWalletAddress,
        to: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        value: ethers.utils.parseEther('0.0001').toString(),
        data: '0x',
        chainId: chainId,
      };

      const result = await baseProtocol['estimateTransactionFee'](tx);

      expect(result).toHaveProperty('gasLimit');
      expect(result).toHaveProperty('gasPrice');
      expect(result).toHaveProperty('txFee');

      // Verify the values are reasonable
      expect(ethers.BigNumber.from(result.gasLimit).gte(21000)).toBeTruthy();
      expect(ethers.BigNumber.from(result.gasPrice).gt(0)).toBeTruthy();
      expect(parseFloat(result.txFee)).toBeGreaterThan(0);
    });
  });

  describe('validateBalance', () => {
    it('should validate sufficient native token balance', async () => {
      const smallAmount = '0.0001';

      await expect(
        baseProtocol['validateBalance'](
          nullAddress,
          testWalletAddress,
          smallAmount,
        ),
      ).resolves.not.toThrow();
    });

    it('should validate sufficient token balance', async () => {
      const smallAmount = '0.0001';

      await expect(
        baseProtocol['validateBalance'](
          gmacTokenAddress,
          testWalletAddress,
          smallAmount,
        ),
      ).resolves.not.toThrow();
    });

    it('should throw error for insufficient native token balance', async () => {
      const largeAmount = '999999999';

      await expect(
        baseProtocol['validateBalance'](
          nullAddress,
          testWalletAddress,
          largeAmount,
        ),
      ).rejects.toThrow('Insufficient input native token balance');
    });
  });

  describe('prepareTransactionObject', () => {
    it('should prepare transaction object with gas estimation', async () => {
      const tx = {
        from: testWalletAddress,
        to: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        value: ethers.utils.parseEther('0.0001').toString(),
        data: '0x',
        chainId: chainId,
      };

      const result = await baseProtocol['prepareTransactionObject'](tx);

      expect(result).toHaveProperty('transactionObject');
      expect(result).toHaveProperty('estimateGasResult');
      expect(result.feeEstimationError).toBeUndefined();

      const { transactionObject } = result;
      expect(transactionObject).toHaveProperty('nonce');
      expect(transactionObject).toHaveProperty('maxFeePerGas');
      expect(transactionObject).toHaveProperty('maxPriorityFeePerGas');
      expect(transactionObject).toHaveProperty('gas');

      // Verify the values are reasonable
      expect(typeof transactionObject.nonce).toBe('number');
      expect(
        ethers.BigNumber.from(transactionObject.maxFeePerGas).gt(0),
      ).toBeTruthy();
      expect(
        ethers.BigNumber.from(transactionObject.maxPriorityFeePerGas).gt(0),
      ).toBeTruthy();
      expect(
        ethers.BigNumber.from(transactionObject.gas).gte(21000),
      ).toBeTruthy();
    });
  });
});
