import "@/styles/globals.css";
import { networkConfig } from "@/components/config/networkConfig";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AppProps } from "next/app";
import { SuiClientProvider } from "@mysten/dapp-kit";
import dynamic from "next/dynamic";

// 创建全局的 QueryClient 实例
const queryClient = new QueryClient();

const WalletProvider = dynamic(
  () => import("@mysten/dapp-kit").then(mod => mod.WalletProvider),
  { ssr: false }
);

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
