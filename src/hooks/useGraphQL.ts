import { SuiGraphQLClient } from '@mysten/sui/graphql';
import { graphql } from '@mysten/sui/graphql/schemas/latest';
 
const gqlClient = new SuiGraphQLClient({
	url: 'https://sui-testnet.mystenlabs.com/graphql',
});
 
const chainIdentifierQuery = graphql(`
	query {
		chainIdentifier
	}
`);
 
async function getChainIdentifier() {
	const result = await gqlClient.query({
		query: chainIdentifierQuery,
	});
 
	return result.data?.chainIdentifier;
}