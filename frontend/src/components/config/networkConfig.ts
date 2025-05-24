import { getFullnodeUrl } from "@mysten/sui/client";
import { createNetworkConfig } from "@mysten/dapp-kit";
import { PACKAGE_ID, POOL_ID, POOL_CAP_ID } from "./suiConstant";

const { networkConfig, useNetworkVariable, useNetworkVariables } =
    createNetworkConfig({
        devnet: {
            url: getFullnodeUrl("devnet"),
            variables: {
                counterPackageId: PACKAGE_ID,
                poolId: POOL_ID,
                poolCapId: POOL_CAP_ID,
            },
        },
        testnet: {
            url: getFullnodeUrl("testnet"),
            variables: {
                counterPackageId: PACKAGE_ID,
                poolId: POOL_ID,
                poolCapId: POOL_CAP_ID,
            },
        },
        mainnet: {
            url: getFullnodeUrl("mainnet"),
            variables: {
                counterPackageId: "",
            },
        },
    });

export { useNetworkVariable, useNetworkVariables, networkConfig };