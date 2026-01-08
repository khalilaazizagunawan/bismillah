import { gql } from "@apollo/client";

export const GET_PURCHASE_ORDERS = gql`
  query GetPurchaseOrders {
    purchaseOrders {
      id
      supplier
      status
      items
      createdAt
    }
  }
`;

export const GET_PURCHASE_ORDER = gql`
  query GetPurchaseOrder($id: ID!) {
    purchaseOrder(id: $id) {
      id
      supplier
      status
      items
      createdAt
    }
  }
`;

