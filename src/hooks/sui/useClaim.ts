import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { getAmount } from "@/game/utils/sui";
import { PACKAGE_ID, POOL_ID, CLOCK_ID } from "@/components/config/suiConstant";

