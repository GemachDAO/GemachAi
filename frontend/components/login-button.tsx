import { ConnectButton, } from "thirdweb/react";
import { client } from "@/lib/client";
import { getServerUrl } from "@/lib/utils";
import { arbitrum, base, bsc, optimism, avalanche, polygon, ethereum ,} from "thirdweb/chains";
import { isLoggedIn, login } from "@/lib/auth";
import { deleteSession, getSession } from "@/lib/auth/session";
import { authFetch } from "@/lib/auth/authFetch";

export default function LoginButton() {
  const serverUrl = getServerUrl();
  return (
    <div className="w-full ">
      <ConnectButton
        detailsButton={{
          style: {
            width: "100%",
          }
        }}
        chains={
          [ethereum, base, bsc, optimism, avalanche, polygon, arbitrum,]
        }

        client={client}
        connectButton={{
          className: "connect-button",
          label: "Connect Wallet",
        }}
        autoConnect={true}
        auth={{
          isLoggedIn: async () => {
            try {
              const session = await getSession()
              return !!session

            } catch (error) {
              console.error('Error checking login status:', error);
              return false;
            }
          },

          doLogin: async (params) => {
            await login(params);
          },

          getLoginPayload: async ({ address, chainId }) => {
            try {
              const request = await fetch(`${serverUrl}/auth/get-login-payload`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ address, chainId }),
              });
              const data = await request.json();
              return data;
            } catch (error) {
              console.error("Error fetching login payload:", error);
            }
          },

          doLogout: async () => {
            await deleteSession();

          },
        }}
      />
    </div>
  );
}
