import { SuiGraphQLClient } from '@mysten/sui/graphql';

import { PACKAGE_ID, POOL_ID, POOL_CAP_ID, TABLE_ID } from '@/components/config/suiConstant';
import { graphql } from '@mysten/sui/graphql/schemas/latest';
import { queryPool, queryTable } from '@/lib/query';
 
const gqlClient = new SuiGraphQLClient({
	url: 'https://sui-testnet.mystenlabs.com/graphql',
});

const getPool = async()=>{
  const result = await gqlClient.query({ query: queryPool });
  return result.data?.object?.asMoveObject?.contents?.json as Record<string, any>;
}

export const gettable = async (id: string) => {
  const result = await gqlClient.query({
    query: queryTable,
    variables: {
      id: id
    }
  });
  return result.data?.owner?.dynamicFields?.nodes as Record<string, any>[];
  // return JSON.stringify(result.data?.owner?.dynamicFields?.nodes, null, 2)
}

export const getAmount = async()=>{
  const pool = await getPool();
  let amount = pool?.cur_currency_amount;
  return amount;
}

export const fetchBalance = async(address: string)=>{
  const query = graphql(`
    {
      address(
        address: "${address}"
      ) {
        address
        balance(type: "0x2::sui::SUI") {
          coinType {
            repr
          }
          coinObjectCount
          totalBalance
        }
        defaultSuinsName
      }
    }
  `);
  const result = await gqlClient.query({ query });
  return result.data?.address?.balance?.totalBalance;
}

export const toClaim = async(address: string)=>{
  const table = await gettable(TABLE_ID);
  const claim_amount = table.find(item => item.name.json.addr === address);
  return claim_amount
}