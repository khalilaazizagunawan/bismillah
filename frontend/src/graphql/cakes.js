import { gql } from "@apollo/client";

export const GET_CAKES = gql`
  query GetCakes($activeOnly: Boolean = true) {
    cakes(activeOnly: $activeOnly) {
      id
      name
      description
      price
      stock
      image_url
      is_active
      created_at
      updated_at
    }
  }
`;

export const GET_CAKE = gql`
  query GetCake($id: ID!) {
    cake(id: $id) {
      id
      name
      description
      price
      stock
      image_url
      is_active
      created_at
      updated_at
    }
  }
`;

export const ADD_CAKE = gql`
  mutation AddCake($input: AddCakeInput!) {
    addCake(input: $input) {
      id
      name
      price
      stock
      image_url
      is_active
    }
  }
`;

export const UPDATE_CAKE = gql`
  mutation UpdateCake($id: ID!, $input: UpdateCakeInput!) {
    updateCake(id: $id, input: $input) {      
      id
      name
      price
      stock
      image_url
      is_active
    }
  }
`;

export const DELETE_CAKE = gql`
  mutation DeleteCake($id: ID!) {
    deleteCake(id: $id)
  }
`;
