"use client";

import { useEffect, useState } from "react";
import { EventBus } from "../EventBus";
import { WalletModal } from "@/components/WalletModal";
import { useCurrentWallet, useSignPersonalMessage } from "@mysten/dapp-kit";
import { getSuiBalance } from "./sui";
import { usePost } from "@/hooks/usePost";

export function ReactPhaserBridge() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { currentWallet } = useCurrentWallet();
  const { mutate: signPersonalMessage } = useSignPersonalMessage();

  useEffect(() => {
    const loginHandler = async () => {
      try {
        setIsModalOpen(true);
      } catch (error) {
        console.error("Failed to open wallet selector:", error);
      }
    };

    EventBus.on("phaser_loginRequest", loginHandler);

    return () => {
      EventBus.removeListener("phaser_loginRequest", loginHandler);
    };
  }, []);

  const { trigger: loginTrigger } = usePost("/login");
  const { trigger: verifyTrigger } = usePost("/login_signature");

  const handleGameStart = async () => {
    if (!currentWallet || !currentWallet.accounts.length) {
      console.error("❌ Wallet not connected!");
      alert("Please connect your wallet first!");
      return;
    }

    const address = currentWallet.accounts[0].address;

    try {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        const suiBalance = await getSuiBalance(address);
        EventBus.emit("phaser_loginResponse", {
          success: true,
          data: {
            suiBalance,
            walletName: currentWallet?.name,
            walletAddress: address,
            token: storedToken,
          },
        });
        setIsModalOpen(false);
        return;
      }

      const challengeResp = await loginTrigger({ address });
      const challenge = challengeResp?.challenge;
      if (!challenge) throw new Error("No challenge found");

      const signature = await new Promise<string>((resolve, reject) => {
        signPersonalMessage(
          { message: new TextEncoder().encode(challenge) },
          { onSuccess: (result) => resolve(result.signature), onError: (error) => reject(error) }
        );
      });

      const verifyResp = await verifyTrigger({
        address,
        signature,
        challenge,
      });

      if (verifyResp?.success && verifyResp.token) {
        const suiBalance = await getSuiBalance(address);
        EventBus.emit("phaser_loginResponse", {
          success: true,
          data: {
            suiBalance,
            walletName: currentWallet?.name,
            walletAddress: address,
            token: verifyResp.token,
            user: verifyResp.user,
            userState: verifyResp.userState,
          },
        });

        setIsModalOpen(false);

        localStorage.setItem("token", verifyResp.token);
        sessionStorage.setItem("token", verifyResp.token);
      } else {
        console.error("❌ Login failed:", verifyResp?.reason || "未知错误");
      }
    } catch (error) {
      console.error("❌ Failed to login:", error);
    }
  };

  return (
    <>
      {isModalOpen && <WalletModal onClose={() => setIsModalOpen(false)} onGameStart={handleGameStart} />}
    </>
  );
}