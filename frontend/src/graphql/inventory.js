import { gql } from "@apollo/client";

export const GET_INVENTORIES = gql`
  query GetInventories {
    inventories {
      id
      name
      stock
      unit
    }
  }
`;

export const CREATE_INVENTORY = gql`
  mutation CreateInventory($input: CreateInventoryInput!) {
    createInventory(input: $input) {
      id
      name
      stock
      unit
    }
  }
`;

export const UPDATE_INVENTORY = gql`
  mutation UpdateInventory($id: ID!, $input: UpdateInventoryInput!) {
    updateInventory(id: $id, input: $input) {
      id
      name
      stock
      unit
    }
  }
`;

