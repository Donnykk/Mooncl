import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useState } from "react";

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
    const fetchAmount = async ()=>{
        
    }
    const tx = ()=>{
        const tx = new Transaction();
        tx.moveCall({
            function: "publish",
            arguments: [],
        });
    }
    const publish = async (
        chain: `${string}:${string}` = "sui:testnet"
    ) => {
        setResult((prev) => ({ ...prev, isLoading: true, error: null }));

        signAndExecuteTransaction({
            transaction,
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
        });
    };

    return {
        publish,
        digest: result.digest,
        isLoading: result.isLoading,
        error: result.error,
    };
};
