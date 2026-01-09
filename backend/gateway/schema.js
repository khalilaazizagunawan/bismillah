const { gql } = require("apollo-server-express");

const typeDefs = gql`
  # ===== SCALAR TYPES =====
  scalar JSON

  # ===== ADMIN AUTH =====
  type Admin {
    id: ID!
    email: String!
  }

  type AuthPayload {
    token: String!
    admin: Admin!
  }

  # ===== CAKES TYPES (mapped from products) =====
  type Cake {
    id: ID!
    name: String!
    description: String
    price: Int!
    stock: Int!
    image_url: String
    is_active: Boolean!
    created_at: String
    updated_at: String
  }

  input AddCakeInput {
    name: String!
    description: String
    price: Int!
    stock: Int!
    image_url: String
    is_active: Boolean = true
  }

  input UpdateCakeInput {
    name: String
    description: String
    price: Int
    stock: Int
    image_url: String
    is_active: Boolean
  }

  # ===== PRODUCT TYPES =====
  type Product {
    id: ID!
    name: String!
    stock: Int!
    unit: String!
  }

  input CreateProductInput {
    name: String!
    stock: Int!
    unit: String!
  }

  input UpdateProductInput {
    name: String
    stock: Int
    unit: String
  }

  # ===== INVENTORY TYPES =====
  type Inventory {
    id: ID!
    name: String!
    stock: Int!
    unit: String!
  }

  input CreateInventoryInput {
    name: String!
    stock: Int!
    unit: String!
  }

  input UpdateInventoryInput {
    name: String
    stock: Int
    unit: String
  }

  # ===== INTEGRASI TELLYOU =====
  type TellyouOrderResponse {
    success: Boolean!
    transaction_id: String
    order_id: String
    total_cost: Float
    payment_status: String
    message: String
  }

  input TellyouOrderItemInput {
    id: ID!
    name: String
    qty: Int!
    price: Float!
  }

  # Webhook dari Tellyou: Update Inventory
  type InventoryUpdateResult {
    name: String!
    action: String!
    previousStock: Int
    change: Int
    newStock: Int
    error: String
  }

  type InventoryUpdateResponse {
    success: Boolean!
    message: String!
    source: String
    notes: String
    results: [InventoryUpdateResult!]!
  }

  input InventoryUpdateItemInput {
    name: String!
    quantityChange: Int!
    unit: String
  }

  # Webhook dari Tellyou: Invoice
  type InvoiceWebhookResponse {
    success: Boolean!
    message: String!
  }

  input InvoiceItemInput {
    name: String!
    qty: Int!
    unit: String!
    price: Float
  }

  # ===== ORDER TYPES (Pesanan dari Customer) =====
  type OrderItem {
    id: ID
    cake_id: Int
    name: String!
    qty: Int!
    price: Int!
    subtotal: Int
  }

  type Order {
    id: ID!
    customer_name: String!
    customer_phone: String
    customer_address: String
    total: Int
    status: String!
    created_at: String
    items: [OrderItem!]!
  }

  input OrderItemInput {
    cake_id: Int
    name: String!
    qty: Int!
    price: Int!
  }

  input CreateOrderInput {
    customer_name: String!
    customer_phone: String
    customer_address: String
    items: [OrderItemInput!]!
  }

  type CreateOrderPayload {
    order: Order!
  }

  input UpdateOrderInput {
    customer_name: String
    customer_phone: String
    customer_address: String
    status: String
    items: [OrderItemInput!]
  }

  # ===== PAYMENT TYPES (Tagihan dari Supplier) =====
  type PaymentItem {
    name: String!
    qty: Int!
    unit: String!
    price: Float
  }

  type Payment {
    id: ID!
    invoiceNumber: String
    supplierName: String
    items: JSON
    amount: Float!
    status: String!
    dueDate: String
    paidAt: String
    createdAt: String
  }

  type InventoryUpdate {
    action: String!
    name: String!
    previousStock: Int
    addedStock: Int
    newStock: Int
    stock: Int
    unit: String
    error: String
  }

  type PaymentPayResponse {
    message: String!
    payment: Payment!
    inventoryUpdates: [InventoryUpdate!]
  }

  input PaymentItemInput {
    name: String!
    qty: Int!
    unit: String!
    price: Float
  }

  input CreatePaymentInput {
    invoiceNumber: String!
    supplierName: String
    items: [PaymentItemInput!]
    amount: Float!
    dueDate: String
  }

  input UpdatePaymentInput {
    invoiceNumber: String
    supplierName: String
    items: [PaymentItemInput!]
    amount: Float
    status: String
    dueDate: String
  }

  # ===== PROCUREMENT / PURCHASE ORDER TYPES =====
  type PurchaseOrderItem {
    name: String!
    qty: Int!
    unit: String!
  }

  type PurchaseOrder {
    id: ID!
    supplier: String!
    status: String!
    items: JSON
    createdAt: String
  }

  input PurchaseOrderItemInput {
    name: String!
    qty: Int!
    unit: String!
  }

  input CreatePurchaseOrderInput {
    supplier: String!
    items: [PurchaseOrderItemInput!]!
  }

  input UpdatePurchaseOrderInput {
    supplier: String
    status: String
    items: [PurchaseOrderItemInput!]
  }

  # ===== DELETE RESPONSE =====
  type DeleteResponse {
    success: Boolean!
    message: String!
  }

  # ===== SUPPLIER INTEGRATION TYPES =====
  type SupplierCatalogItem {
    id: ID
    name: String!
    stock: Int
    unit: String
    price: Float
  }

  type SupplierCatalogResponse {
    success: Boolean!
    message: String
    error: String
    data: [SupplierCatalogItem!]
  }

  type SupplierOrder {
    id: ID!
    items: JSON!
    totalAmount: Float!
    status: String!
    supplierInvoice: String
    notes: String
    paidAt: String
    receivedAt: String
    createdAt: String
  }

  type SupplierOrderResponse {
    success: Boolean!
    message: String
    error: String
    data: SupplierOrder
  }

  type ReceivedInvoice {
    id: ID!
    invoiceNumber: String!
    amount: Float!
    status: String!
    dueDate: String
    paidAt: String
    createdAt: String
  }

  type IntegrationLog {
    id: ID!
    direction: String!
    endpoint: String!
    method: String!
    requestBody: JSON
    responseBody: JSON
    statusCode: Int
    createdAt: String
  }

  input SupplierOrderItemInput {
    name: String!
    qty: Int!
    unit: String!
    price: Float!
  }

  # ===== QUERIES =====
  type Query {
    hello: String
    _health: String

    # Cake queries (mapped from products for frontend compatibility)
    cakes(activeOnly: Boolean = true): [Cake!]!
    cake(id: ID!): Cake

    # Product queries (Produk Kue yang dijual)
    products: [Product!]!
    product(id: ID!): Product

    # Inventory queries (Stok bahan kue yang dimiliki)
    inventories: [Inventory!]!
    inventory(id: ID!): Inventory

    # Order queries (Order dari customer)
    orders: [Order!]!
    order(id: ID!): Order

    # Payment queries (Tagihan dari Supplier)
    payments: [Payment!]!
    payment(id: ID!): Payment

    # Purchase Order queries (internal)
    purchaseOrders: [PurchaseOrder!]!
    purchaseOrder(id: ID!): PurchaseOrder

    # ===== SUPPLIER INTEGRATION QUERIES =====
    supplierCatalog: SupplierCatalogResponse!
    supplierInventory: SupplierCatalogResponse!
    supplierOrders: [SupplierOrder!]!
    supplierOrder(id: ID!): SupplierOrder
    receivedInvoices: [ReceivedInvoice!]!
    integrationLogs: [IntegrationLog!]!
  }

  # ===== MUTATIONS =====
  type Mutation {
    # Mutation untuk Toko Kue pesan ke Tellyou
    createOrderToTellyou(
      externalOrderId: String
      totalAmount: Float!
      items: [TellyouOrderItemInput!]!
    ): TellyouOrderResponse!

    # Admin authentication
    loginAdmin(email: String!, password: String!): AuthPayload!

    # Cake mutations (mapped from products for frontend compatibility)
    addCake(input: AddCakeInput!): Cake!
    updateCake(id: ID!, input: UpdateCakeInput!): Cake!
    deleteCake(id: ID!): Boolean!

    # Product mutations
    createProduct(input: CreateProductInput!): Product!
    updateProduct(id: ID!, input: UpdateProductInput!): Product!
    deleteProduct(id: ID!): DeleteResponse!

    # Inventory mutations
    createInventory(input: CreateInventoryInput!): Inventory!
    updateInventory(id: ID!, input: UpdateInventoryInput!): Inventory!
    deleteInventory(id: ID!): DeleteResponse!

    # Order mutations (dari customer)
    createOrder(input: CreateOrderInput!): CreateOrderPayload!
    updateOrder(id: ID!, input: UpdateOrderInput!): Order!
    updateOrderStatus(id: ID!, status: String!): Order!
    deleteOrder(id: ID!): DeleteResponse!

    # Payment mutations (tagihan dari Supplier)
    createPayment(input: CreatePaymentInput!): Payment!
    updatePayment(id: ID!, input: UpdatePaymentInput!): Payment!
    # Bayar tagihan → otomatis update inventory
    payPayment(id: ID!): PaymentPayResponse!
    deletePayment(id: ID!): DeleteResponse!

    # Purchase Order mutations
    createPurchaseOrder(input: CreatePurchaseOrderInput!): PurchaseOrder!
    updatePurchaseOrder(id: ID!, input: UpdatePurchaseOrderInput!): PurchaseOrder!
    # Supplier-only: Update purchase order status (called via webhook)
    updatePurchaseOrderStatus(id: ID!, status: String!): PurchaseOrder!
    deletePurchaseOrder(id: ID!): DeleteResponse!

    # ===== SUPPLIER INTEGRATION MUTATIONS =====
    orderFromSupplier(
      items: [SupplierOrderItemInput!]!
      notes: String
    ): SupplierOrderResponse!



    paySupplier(
      orderId: ID!
      invoiceNumber: String!
      amount: Float!
      paymentMethod: String
    ): SupplierOrderResponse!

    receiveFromSupplier(id: ID!, notes: String): SupplierOrderResponse!

    # ===== TELLYOU WEBHOOK SIMULATIONS =====
    # Simulasi Tellyou kirim update inventory ke Toko Kue
    simulateTellyouInventoryUpdate(
      items: [InventoryUpdateItemInput!]!
      source: String
      notes: String
    ): InventoryUpdateResponse!

    # Simulasi Tellyou kirim invoice ke Toko Kue
    simulateTellyouInvoice(
      invoiceNumber: String!
      supplierName: String
      orderId: String
      amount: Float!
      dueDate: String
      items: [InvoiceItemInput!]!
    ): InvoiceWebhookResponse!
  }
`;



module.exports = { typeDefs };
