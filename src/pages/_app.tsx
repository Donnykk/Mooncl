import "@/styles/globals.css";
import { networkConfig } from "@/components/config/networkConfig";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AppProps } from "next/app";
import { WalletProvider } from "@mysten/dapp-kit";
import { SuiClientProvider } from "@mysten/dapp-kit";

// 创建全局的 QueryClient 实例
const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <WalletProvider autoConnect>
          <Component {...pageProps} />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
