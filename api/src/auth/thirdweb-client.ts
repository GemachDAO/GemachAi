import { createThirdwebClient } from 'thirdweb';
import { createAuth, type VerifyLoginPayloadParams } from 'thirdweb/auth';
const secretKey = process.env.THIRDWEB_SECRET_KEY!;
import { privateKeyToAccount } from 'thirdweb/wallets';

const thirdwebClient = createThirdwebClient({ secretKey });

export const thirdwebAuth = createAuth({
  domain: process.env.NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN!,
  client: thirdwebClient,
  adminAccount: privateKeyToAccount({
    client: thirdwebClient,
    privateKey: process.env.THIRDWEB_ADMIN_PRIVATE_KEY!,
  }),
});
