import { gql } from "@apollo/client";

export const GET_PAYMENTS = gql`
  query GetPayments {
    payments {
      id
      invoiceNumber
      supplierName
      items
      amount
      status
      dueDate
      paidAt
      createdAt
    }
  }
`;

export const PAY_PAYMENT = gql`
  mutation PayPayment($id: ID!) {
    payPayment(id: $id) {
      message
      payment {
        id
        invoiceNumber
        supplierName
        items
        amount
        status
        paidAt
        createdAt
      }
      inventoryUpdates {
        action
        name
        previousStock
        addedStock
        newStock
        stock
        unit
        error
      }
    }
  }
`;

