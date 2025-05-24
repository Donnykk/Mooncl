import { POOL_ID } from '@/components/config/suiConstant';
import { graphql } from '@mysten/sui/graphql/schemas/latest';

export const queryTable = graphql(`
  query ($id: SuiAddress!) {
    owner(address: $id) {
      dynamicFields {
        nodes {
          name {
            type {
              repr
            }
            json
          }
          value {
            __typename
            ... on MoveValue {
              type {
                repr
              }
              json
            }
            ... on MoveObject {
              contents {
                type {
                  repr
                }
                json
              }
            }
          }
        }
      }
    }
  }
`);

export const queryPool = graphql(`
  query {
      object(address: "${POOL_ID}") {
        asMoveObject {
          contents {
            json
          }
        }
      }
    }
`);