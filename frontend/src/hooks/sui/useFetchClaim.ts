import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useState } from "react";
import { getAmount } from "@/game/utils/sui";
import { PACKAGE_ID, POOL_ID, CLOCK_ID } from "@/components/config/suiConstant";

interface ClaimResult {
    toClaimMooncl: number;
    toClaimSui: number;
    isLoading: boolean;
    error: Error | null;
}

export const useClaim = () => {
    const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
    const [result, setResult] = useState<ClaimResult>({
        toClaimMooncl: 0,
        toClaimSui: 0,
        isLoading: false,
        error: null,
    });

    const publish = async (
        chain: `${string}:${string}` = "sui:testnet"
    ) => {
      setResult((prev) => ({ ...prev, isLoading: true, error: null }));
      const amount = await getAmount();
      const tx = new Transaction();
      const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amount)]);
      tx.moveCall({
        target: `${PACKAGE_ID}::pool::out_pool`,
        arguments: [
          tx.object(POOL_ID),
        ],
      })
      signAndExecuteTransaction({
          transaction: tx,
          chain
      },
      {
        onSuccess: (data) => {
          setResult({
            digest: data.digest,
            isLoading: false,
            error: null,
          });
        },
        onError: (error) => {
          setResult({
            digest: "",
            isLoading: false,
            error: error,
          });
        }
      });
  };

  return {
      publish,
      digest: result.digest,
      isLoading: result.isLoading,
      error: result.error,
  };
};
