// @ts-nocheck
import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { queryField, queryTable } from "./query";
import { graphql } from "@mysten/sui/graphql/schemas/latest";
import { PACKAGE_ID, RPC_URL } from "@/components/config/suiConstant";

const gqlClient = new SuiGraphQLClient({ url: RPC_URL });

const getDynamicField = async (objectid: string, field: any, type: string) => {
  const result = await gqlClient.query({
    query: queryField,
    variables: {
      address: objectid,
      type: type,
      bcs: field
    }
  });
  return result.data?.object?.dynamicField?.value?.data.Struct
}
export const getClaimSui = async (account: string) => {
  const result = await gqlClient.query({
    query: queryTable,
    variables: {
      id: PACKAGE_ID
    }
  });
  return result.data?.owner?.dynamicFields?.nodes
  // return JSON.stringify(result.data?.owner?.dynamicFields?.nodes, null, 2)
}

export const getClaimMooncl = async (id: string) => {
  const result = await gqlClient.query({
    query: query,
    variables: {
      id: id
    }
  });
  return result.data?.owner?.dynamicFields?.nodes
}