import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useState } from "react";
import { getAmount } from "@/game/utils/sui";
import { PACKAGE_ID, POOL_ID, CLOCK_ID } from "@/components/config/suiConstant";

interface PublishResult {
    digest: string;
    isLoading: boolean;
    error: Error | null;
}

export const usePublish = () => {
    const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
    const [result, setResult] = useState<PublishResult>({
        digest: "",
        isLoading: true,
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
        target: `${PACKAGE_ID}::pool::into_pool`,
        arguments: [
          tx.object(POOL_ID),
          coin,
          tx.object(CLOCK_ID)
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
