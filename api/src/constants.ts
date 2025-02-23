
export const SUPPORTED_CHAINS: ChainMetadata[] = [
  {
    key: 'ETH',
    explorerUrl: 'https://etherscan.io',
    name: 'Ethereum',
    nativeToken: {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'ETH',
      decimals: 18,
      name: 'ETH',
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
    },
    id: 1,
  },
  {
    key: 'BSC',
    explorerUrl: 'https://bscscan.com',
    name: 'BSC',
    nativeToken: {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'BNB',
      decimals: 18,
      name: 'BNB',
      logoURI:
        'https://assets.coingecko.com/coins/images/825/small/binance-coin-logo.png?1547034615',
    },
    id: 56,
  },
  {
    key: 'ARB',
    explorerUrl: 'https://arbiscan.io',
    name: 'Arbitrum',
    nativeToken: {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'ETH',
      decimals: 18,
      name: 'ETH',
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
    },
    id: 42161,
  },
  {
    key: 'BAS',
    name: 'Base',
    explorerUrl: 'https://basescan.org',
    nativeToken: {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'ETH',
      decimals: 18,
      name: 'ETH',
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
    },
    id: 8453,
  },
  // {
  //     "key": "BLS",
  //     "name": "Blast",
  //     "nativeToken": {
  //         "address": "0x0000000000000000000000000000000000000000",
  //         "symbol": "ETH",
  //         "decimals": 18,
  //         "name": "ETH",
  //         "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png"
  //     },
  //     "id": 81457
  // },
  {
    key: 'AVA',
    explorerUrl: 'https://snowtrace.io',
    name: 'Avalanche',
    nativeToken: {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'AVAX',
      decimals: 18,
      name: 'AVAX',
      logoURI:
        'https://static.debank.com/image/avax_token/logo_url/avax/0b9c84359c84d6bdd5bfda9c2d4c4a82.png',
    },
    id: 43114,
  },
  {
    key: 'POL',
    explorerUrl: 'https://polygonscan.com',
    name: 'Polygon',
    nativeToken: {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'POL',
      decimals: 18,
      name: 'Polygon Ecosystem Token',
      logoURI:
        'https://static.debank.com/image/matic_token/logo_url/matic/6f5a6b6f0732a7a235131bd7804d357c.png',
    },
    id: 137,
  },
  // {
  //     "key": "SCL",
  //     "name": "Scroll",
  //     "nativeToken": {
  //         "address": "0x0000000000000000000000000000000000000000",
  //         "symbol": "ETH",
  //         "decimals": 18,
  //         "name": "ETH",
  //         "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png"
  //     },
  //     "id": 534352
  // },
  {
    key: 'OPT',
    explorerUrl: 'https://optimistic.etherscan.io',
    name: 'Optimism',
    nativeToken: {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'ETH',
      decimals: 18,
      name: 'ETH',
      logoURI:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
    },
    id: 10,
  },
  {
    explorerUrl: "https://sonicscan.org",
    "key": "SON",
    "name": "Sonic",
    "nativeToken": {
      "address": "0x0000000000000000000000000000000000000000",
      "symbol": "S",
      "decimals": 18,
      "name": "S",
      "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/sonic/info/logo.png"
    },
    "id": 146
  },
  // {
  //     "key": "LNA",
  //     "name": "Linea",
  //     "nativeToken": {
  //         "address": "0x0000000000000000000000000000000000000000",
  //         "symbol": "ETH",
  //         "decimals": 18,
  //         "name": "ETH",
  //         "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png"
  //     },
  //     "id": 59144
  // },
  // {
  //     "key": "ERA",
  //     "name": "zkSync",
  //     "nativeToken": {
  //         "address": "0x0000000000000000000000000000000000000000",
  //         "symbol": "ETH",
  //         "decimals": 18,
  //         "name": "ETH",
  //         "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png"
  //     },
  //     "id": 324
  // },
  // {
  //     "key": "PZE",
  //     "name": "Polygon zkEVM",
  //     "nativeToken": {
  //         "address": "0x0000000000000000000000000000000000000000",
  //         "symbol": "ETH",
  //         "decimals": 18,
  //         "name": "ETH",
  //         "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png"
  //     },
  //     "id": 1101
  // },
  // {
  //     "key": "DAI",
  //     "name": "Gnosis",
  //     "nativeToken": {
  //         "address": "0x0000000000000000000000000000000000000000",
  //         "symbol": "xDAI",
  //         "decimals": 18,
  //         "name": "xDAI Native Token",
  //         "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png"
  //     },
  //     "id": 100
  // },
  // {
  //     "key": "FTM",
  //     "name": "Fantom",
  //     "nativeToken": {
  //         "address": "0x0000000000000000000000000000000000000000",
  //         "symbol": "FTM",
  //         "decimals": 18,
  //         "name": "FTM",
  //         "logoURI": "https://static.debank.com/image/ftm_token/logo_url/ftm/33fdb9c5067e94f3a1b9e78f6fa86984.png"
  //     },
  //     "id": 250
  // },
  // {
  //     "key": "MOR",
  //     "name": "Moonriver",
  //     "nativeToken": {
  //         "address": "0x0000000000000000000000000000000000000000",
  //         "symbol": "MOVR",
  //         "decimals": 18,
  //         "name": "MOVR",
  //         "logoURI": "https://assets.coingecko.com/coins/images/17984/small/9285.png"
  //     },
  //     "id": 1285
  // },
  // {
  //     "key": "MOO",
  //     "name": "Moonbeam",
  //     "nativeToken": {
  //         "address": "0x0000000000000000000000000000000000000000",
  //         "symbol": "GLMR",
  //         "decimals": 18,
  //         "name": "GLMR",
  //         "logoURI": "https://s2.coinmarketcap.com/static/img/coins/64x64/6836.png"
  //     },
  //     "id": 1284
  // },
  // {
  //     "key": "FUS",
  //     "name": "FUSE",
  //     "nativeToken": {
  //         "address": "0x0000000000000000000000000000000000000000",
  //         "symbol": "FUSE",
  //         "decimals": 18,
  //         "name": "FUSE",
  //         "logoURI": "https://s2.coinmarketcap.com/static/img/coins/64x64/5634.png"
  //     },
  //     "id": 122
  // },
  // {
  //     "key": "BOB",
  //     "name": "Boba",
  //     "nativeToken": {
  //         "address": "0x0000000000000000000000000000000000000000",
  //         "symbol": "ETH",
  //         "decimals": 18,
  //         "name": "ETH",
  //         "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png"
  //     },
  //     "id": 288
  // },
  // {
  //     "key": "MOD",
  //     "name": "Mode",
  //     "nativeToken": {
  //         "address": "0x0000000000000000000000000000000000000000",
  //         "symbol": "ETH",
  //         "decimals": 18,
  //         "name": "ETH",
  //         "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png"
  //     },
  //     "id": 34443
  // },
  // {
  //     "key": "MAM",
  //     "name": "Metis",
  //     "nativeToken": {
  //         "address": "0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000",
  //         "symbol": "METIS",
  //         "decimals": 18,
  //         "name": "METIS",
  //         "logoURI": "https://s2.coinmarketcap.com/static/img/coins/64x64/9640.png"
  //     },
  //     "id": 1088
  // },
  // {
  //     "key": "LSK",
  //     "name": "Lisk",
  //     "nativeToken": {
  //         "address": "0x0000000000000000000000000000000000000000",
  //         "symbol": "ETH",
  //         "decimals": 18,
  //         "name": "ETH",
  //         "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png"
  //     },
  //     "id": 1135
  // },
  // {
  //     "key": "AUR",
  //     "name": "Aurora",
  //     "nativeToken": {
  //         "address": "0x0000000000000000000000000000000000000000",
  //         "symbol": "AETH",
  //         "decimals": 18,
  //         "name": "AETH",
  //         "logoURI": "https://static.debank.com/image/aurora_token/logo_url/aurora/d61441782d4a08a7479d54aea211679e.png"
  //     },
  //     "id": 1313161554
  // },
  // {
  //     "key": "SEI",
  //     "name": "Sei",
  //     "nativeToken": {
  //         "address": "0x0000000000000000000000000000000000000000",
  //         "symbol": "SEI",
  //         "decimals": 18,
  //         "name": "SEI",
  //         "logoURI": "https://cdn.sei.io/sei-app/sei-icon.png"
  //     },
  //     "id": 1329
  // },
  // {
  //     "key": "IMX",
  //     "name": "Immutable zkEVM",
  //     "nativeToken": {
  //         "address": "0x0000000000000000000000000000000000000000",
  //         "symbol": "IMX",
  //         "decimals": 18,
  //         "name": "IMX",
  //         "logoURI": "https://static.debank.com/image/eth_token/logo_url/0xf57e7e7c23978c3caec3c3548e3d615c346e79ff/7a875818146ec0508d3e5f5b14f1b4eb.png"
  //     },
  //     "id": 13371
  // },
  // {
  //     "key": "GRA",
  //     "name": "Gravity",
  //     "nativeToken": {
  //         "address": "0x0000000000000000000000000000000000000000",
  //         "symbol": "G",
  //         "decimals": 18,
  //         "name": "G",
  //         "logoURI": "https://assets.gravity.xyz/token_logo.png"
  //     },
  //     "id": 1625
  // },
  // {
  //     "key": "TAI",
  //     "name": "Taiko",
  //     "nativeToken": {
  //         "address": "0x0000000000000000000000000000000000000000",
  //         "symbol": "ETH",
  //         "decimals": 18,
  //         "name": "ETH",
  //         "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png"
  //     },
  //     "id": 167000
  // },
  // {
  //     "key": "CRO",
  //     "name": "Cronos",
  //     "nativeToken": {
  //         "address": "0x0000000000000000000000000000000000000000",
  //         "symbol": "CRO",
  //         "decimals": 18,
  //         "name": "CRO",
  //         "logoURI": "https://s2.coinmarketcap.com/static/img/coins/64x64/3635.png"
  //     },
  //     "id": 25
  // },
  {
    key: 'FRA',
    name: 'Fraxtal',
    explorerUrl: 'https://fraxscan.com',
    nativeToken: {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'frxETH',
      decimals: 18,
      name: 'frxETH',
      logoURI:
        'https://assets.coingecko.com/coins/images/28284/standard/frxETH_icon.png',
    },
    id: 252,
  },
  // {
  //     "key": "RSK",
  //     "name": "Rootstock",
  //     "nativeToken": {
  //         "address": "0x0000000000000000000000000000000000000000",
  //         "symbol": "RBTC",
  //         "decimals": 18,
  //         "name": "Rootstock Smart Bitcoin",
  //         "logoURI": "https://static.debank.com/image/rsk_token/logo_url/0x542fda317318ebf1d3deaf76e0b632741a7e677d/4785a26ef5bb5df987e67ad49fc62137.png"
  //     },
  //     "id": 30
  // },
  // {
  //     "key": "CEL",
  //     "name": "Celo",
  //     "nativeToken": {
  //         "address": "0x471EcE3750Da237f93B8E339c536989b8978a438",
  //         "symbol": "CELO",
  //         "decimals": 18,
  //         "name": "Celo native asset",
  //         "logoURI": "https://s2.coinmarketcap.com/static/img/coins/64x64/5567.png"
  //     },
  //     "id": 42220
  // },
  // {
  //     "key": "WCC",
  //     "name": "World Chain",
  //     "nativeToken": {
  //         "address": "0x0000000000000000000000000000000000000000",
  //         "symbol": "ETH",
  //         "decimals": 18,
  //         "name": "ETH",
  //         "logoURI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png"
  //     },
  //     "id": 480
  // },
  // {
  //     "key": "MNT",
  //     "name": "Mantle",
  //     "nativeToken": {
  //         "address": "0x0000000000000000000000000000000000000000",
  //         "symbol": "MNT",
  //         "decimals": 18,
  //         "name": "MNT",
  //         "logoURI": "https://static.debank.com/image/mnt_token/logo_url/0x78c1b0c915c4faa5fffa6cabf0219da63d7f4cb8/a443c78c33704d48f06e5686bb87f85e.png"
  //     },
  //     "id": 5000
  // }
];
