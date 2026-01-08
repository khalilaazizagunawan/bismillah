import { gql } from "@apollo/client";

export const CREATE_ORDER = gql`
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      order {
        id
        customer_name
        customer_phone
        customer_address
        total
        status
        created_at
        items {
          cake_id
          name
          price
          qty
          subtotal
        }
      }
    }
  }
`;

export const GET_ORDERS = gql`
  query GetOrders {
    orders {
      id
      customer_name
      customer_phone
      customer_address
      total
      status
      created_at
      items {
        cake_id
        name
        price
        qty
        subtotal
      }
    }
  }
`;

export const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus($id: ID!, $status: String!) {
    updateOrderStatus(id: $id, status: $status) {
      id
      customer_name
      customer_phone
      customer_address
      total
      status
      created_at
      items {
        cake_id
        name
        price
        qty
        subtotal
      }
    }
  }
`;

export const LOGIN_ADMIN = gql`
  mutation LoginAdmin($email: String!, $password: String!) {
    loginAdmin(email: $email, password: $password) {
      token
      admin {
        id
        email
      }
    }
  }
`;
