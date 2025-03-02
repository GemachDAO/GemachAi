import 'dotenv/config';

export default (isTest = false) => {
  const {
    PORT,
    ALCHEMY_API_KEY,
    ETHEREUM_RPC_URL,
    POLYGON_RPC_URL,
    OPTIMISM_RPC_URL,
    ARBITRUM_RPC_URL,
    AVALANCHE_RPC_URL,
    SONIC_RPC_URL,
    FRAXTAL_RPC_URL,
    BASE_RPC_URL,
    BINANCE_RPC_URL,
    NIBIRU_RPC_URL,
    CIRCLE_API_KEY_MAINNET,
    CIRCLE_ENTITY_SECRET,
    THIRDWEB_SECRET_KEY,
    NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
    NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN,
    THIRDWEB_ADMIN_PRIVATE_KEY,
    COVALENT_API_KEY,
    REDIS_HOST,
    REDIS_PORT,
    REDIS_PASSWORD,
    REDIS_DB,
    REDIS_USERNAME,
    JWT_SECRET,
    SEARCH_ENGINE_ID,
    GOOGLE_API_KEY
  } = process.env;

  if (!NIBIRU_RPC_URL) {
    console.error('NIBIRU_RPC_URL is not set');
    process.exit(1);
  }
  if (!SEARCH_ENGINE_ID) {
    console.error('SEARCH_ENGINE_ID is not set');
    process.exit(1);
  }
  if (!GOOGLE_API_KEY) {
    console.error('GOOGLE_API_KEY is not set');
    process.exit(1);
  }
  if (!JWT_SECRET) {
    console.error('JWT_SECRET is not set');
    process.exit(1);
  }
  if (!REDIS_HOST) {
    console.error('REDIS_HOST is not set');
    process.exit(1);
  }

  if (!REDIS_USERNAME) {
    console.error('REDIS_USERNAME is not set');
    process.exit(1);
  }
  if (!REDIS_PORT) {
    console.error('REDIS_PORT is not set');
    process.exit(1);
  }
  if (!BASE_RPC_URL) {
    console.error('BASE_RPC_URL is not set');
    process.exit(1);
  }
  if (!BINANCE_RPC_URL) {
    console.error('BINANCE_RPC_URL is not set');
    process.exit(1);
  }
  if (!FRAXTAL_RPC_URL) {
    console.error('FRAXTAL_RPC_URL is not set');
    process.exit(1);
  }
  if (!REDIS_PASSWORD) {
    console.error('REDIS_PASSWORD is not set');
    process.exit(1);
  }
  if (!REDIS_DB) {
    console.error('REDIS_DB is not set');
    process.exit(1);
  }
  if (!COVALENT_API_KEY) {
    console.error('COVALENT_API_KEY is not set');
    process.exit(1);
  }
  if (!THIRDWEB_ADMIN_PRIVATE_KEY) {
    console.error('THIRDWEB_ADMIN_PRIVATE_KEY is not set');
    process.exit(1);
  }
  if (!NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN) {
    console.error('NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN is not set');
    process.exit(1);
  }
  if (!NEXT_PUBLIC_THIRDWEB_CLIENT_ID) {
    console.error('NEXT_PUBLIC_THIRDWEB_CLIENT_ID is not set');
    process.exit(1);
  }
  if (!ALCHEMY_API_KEY) {
    console.error('ALCHEMY_API_KEY is not set');
    process.exit(1);
  }
  if (!PORT) {
    console.error('PORT is not set');
    process.exit(1);
  }
  if (!ETHEREUM_RPC_URL) {
    console.error('ETHEREUM_RPC_URL is not set');
    process.exit(1);
  }

  if (!POLYGON_RPC_URL) {
    console.error('POLYGON_RPC_URL is not set');
    process.exit(1);
  }

  if (!ARBITRUM_RPC_URL) {
    console.error('ARBITRUM_RPC_URL is not set');
    process.exit(1);
  }

  if (!AVALANCHE_RPC_URL) {
    console.error('AVALANCHE_RPC_URL is not set');
    process.exit(1);
  }

  if (!CIRCLE_API_KEY_MAINNET) {
    console.error('CIRCLE_API_KEY_MAINNET is not set');
    process.exit(1);
  }
  if (!CIRCLE_ENTITY_SECRET) {
    console.error('CIRCLE_ENTITY_SECRET is not set');
    process.exit(1);
  }
  if (!THIRDWEB_SECRET_KEY) {
    console.error('THIRDWEB_SECRET_KEY is not set');
    process.exit(1);
  }
  if (!OPTIMISM_RPC_URL) {
    console.error('OPTIMISM_RPC_URL is not set');
    process.exit(1);
  }
  if (!SONIC_RPC_URL) {
    console.error('SONIC_RPC_URL is not set');
    process.exit(1);
  }
  return {
    alchemyApiKey: ALCHEMY_API_KEY,
    port: PORT,
    ethereumRpcUrl: ETHEREUM_RPC_URL,
    polygonRpcUrl: POLYGON_RPC_URL,
    arbitrumRpcUrl: ARBITRUM_RPC_URL,
    avalancheRpcUrl: AVALANCHE_RPC_URL,
    baseRpcUrl: BASE_RPC_URL,
    fraxtalRpcUrl: FRAXTAL_RPC_URL,
    sonicRpcUrl: SONIC_RPC_URL,
    circleApiKeyMainnet: CIRCLE_API_KEY_MAINNET,
    circleEntitySecret: CIRCLE_ENTITY_SECRET,
    thirdwebSecretKey: THIRDWEB_SECRET_KEY,
    nextPublicThirwebAuthDomain: NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN,
    nextPublicThirwebClientId: NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
    thirdwebAdminPrivateKey: THIRDWEB_ADMIN_PRIVATE_KEY,
    optimismRpcUrl: OPTIMISM_RPC_URL,
    covalentApiKey: COVALENT_API_KEY,
    redisHost: REDIS_HOST,
    redisPort: REDIS_PORT,
    redisPassword: REDIS_PASSWORD,
    redisDb: REDIS_DB,
    redisUsername: REDIS_USERNAME,
    binanceRpcUrl: BINANCE_RPC_URL,
    jwtSecret: JWT_SECRET,
    searchEngineId: SEARCH_ENGINE_ID,
    googleApiKey: GOOGLE_API_KEY,
    nibiruRpcUrl: NIBIRU_RPC_URL
  };
};
