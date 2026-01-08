const axios = require("axios");
const { GraphQLScalarType, Kind } = require("graphql");

// Custom JSON scalar for handling JSON data
const JSONScalar = new GraphQLScalarType({
  name: "JSON",
  description: "JSON custom scalar type",
  serialize(value) {
    return value;
  },
  parseValue(value) {
    return value;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return JSON.parse(ast.value);
    }
    return null;
  },
});

const resolvers = {
  JSON: JSONScalar,

  Query: {
    hello: () => "Hello from Toko Kue API!",
    _health: () => "ok",

    // ===== CAKES (mapped from products for frontend compatibility) =====
    cakes: async (_, { activeOnly = true }) => {
      const { data } = await axios.get("http://product:4001/products");
      // Map product fields to cake fields - use actual fields from product service
      return data.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description || "",
        price: product.price || 0,
        stock: product.stock,
        image_url: product.image_url || "",
        is_active: product.is_active !== false, // Default to true if not specified
        created_at: product.created_at || new Date().toISOString(),
        updated_at: product.updated_at || new Date().toISOString(),
      })).filter(cake => !activeOnly || cake.is_active);
    },

    cake: async (_, { id }) => {
      try {
        const { data } = await axios.get(`http://product:4001/products/${id}`);
        // Map product fields to cake fields - use actual fields from product service
        return {
          id: data.id,
          name: data.name,
          description: data.description || "",
          price: data.price || 0,
          stock: data.stock,
          image_url: data.image_url || "",
          is_active: data.is_active !== false,
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString(),
        };
      } catch (error) {
        if (error.response?.status === 404) return null;
        const errorMsg = error.response?.data?.error || error.message;
        throw new Error(errorMsg);
      }
    },

    // ===== PRODUCTS =====
    products: async () => {
      const { data } = await axios.get("http://product:4001/products");
      return data;
    },

    product: async (_, { id }) => {
      try {
        const { data } = await axios.get(`http://product:4001/products/${id}`);
        return data;
      } catch (error) {
        if (error.response?.status === 404) return null;
        const errorMsg = error.response?.data?.error || error.message;
        throw new Error(errorMsg);
      }
    },

    // ===== INVENTORY =====
    inventories: async () => {
      const { data } = await axios.get("http://inventory:4002/inventory");
      return data;
    },

    inventory: async (_, { id }) => {
      try {
        const { data } = await axios.get(`http://inventory:4002/inventory/${id}`);
        return data;
      } catch (error) {
        if (error.response?.status === 404) return null;
        const errorMsg = error.response?.data?.error || error.message;
        throw new Error(errorMsg);
      }
    },

    // ===== ORDERS =====
    orders: async () => {
      const { data } = await axios.get("http://order:4005/orders");
      return data;
    },

    order: async (_, { id }) => {
      try {
        const { data } = await axios.get(`http://order:4005/orders/${id}`);
        return data;
      } catch (error) {
        if (error.response?.status === 404) return null;
        const errorMsg = error.response?.data?.error || error.message;
        throw new Error(errorMsg);
      }
    },

    // ===== PAYMENTS (Tagihan dari Supplier) =====
    payments: async () => {
      const { data } = await axios.get("http://payment:4004/payments");
      return data;
    },

    payment: async (_, { id }) => {
      try {
        const { data } = await axios.get(`http://payment:4004/payments/${id}`);
        return data;
      } catch (error) {
        if (error.response?.status === 404) return null;
        const errorMsg = error.response?.data?.error || error.message;
        throw new Error(errorMsg);
      }
    },

    // ===== PURCHASE ORDERS =====
    purchaseOrders: async () => {
      try {
        const { data } = await axios.get("http://procurement:4003/pos");
        // Ensure items are parsed if they're JSON strings
        return Array.isArray(data) ? data.map(po => ({
          ...po,
          items: typeof po.items === 'string' ? JSON.parse(po.items) : po.items
        })) : [];
      } catch (error) {
        console.error("Error fetching purchase orders:", error.message);
        return [];
      }
    },

    purchaseOrder: async (_, { id }) => {
      try {
        console.log(`[Gateway] Fetching purchase order with ID: ${id} (type: ${typeof id})`);

        // Convert id to integer if it's a string
        let poId = typeof id === 'string' ? parseInt(id) : id;

        console.log(`[Gateway] Parsed ID: ${poId}`);

        // Validate ID - must be a valid integer and within PostgreSQL integer range
        if (isNaN(poId) || poId < 1 || poId >= 2147483647) {
          console.error(`[Gateway] Invalid purchase order ID: ${id} (parsed: ${poId})`);
          return null; // Return null instead of throwing error
        }

        console.log(`[Gateway] Calling procurement service: http://procurement:4003/pos/${poId}`);
        const { data } = await axios.get(`http://procurement:4003/pos/${poId}`);

        console.log(`[Gateway] Received data:`, data);

        // Parse items if it's a JSON string
        if (data && typeof data.items === 'string') {
          try {
            data.items = JSON.parse(data.items);
            console.log(`[Gateway] Parsed items from JSON string:`, data.items);
          } catch (e) {
            console.error('[Gateway] Error parsing items JSON:', e);
            data.items = [];
          }
        }

        console.log(`[Gateway] Returning purchase order:`, data);
        return data;
      } catch (error) {
        console.error(`[Gateway] Error fetching purchase order ${id}:`, error.message);
        if (error.response) {
          console.error(`[Gateway] Response status: ${error.response.status}`);
          console.error(`[Gateway] Response data:`, error.response.data);
        }
        if (error.response?.status === 404) {
          console.log(`[Gateway] Purchase order ${id} not found (404)`);
          return null;
        }
        // Return null instead of throwing to show "not found" message
        return null;
      }
    },

    // ===== SUPPLIER INTEGRATION QUERIES =====
    supplierCatalog: async () => {
      try {
        const { data } = await axios.get("http://integration:4006/api/supplier/catalog");
        return data;
      } catch (error) {
        return {
          success: false,
          message: "Gagal mengambil katalog dari supplier",
          error: error.message,
          data: []
        };
      }
    },

    supplierInventory: async () => {
      try {
        const { data } = await axios.get("http://integration:4006/api/supplier/inventory");
        return data;
      } catch (error) {
        return {
          success: false,
          message: "Gagal mengambil stok dari supplier",
          error: error.message,
          data: []
        };
      }
    },

    supplierOrders: async () => {
      try {
        const { data } = await axios.get("http://integration:4006/api/supplier/orders");
        return data.data || [];
      } catch (error) {
        console.error("Error fetching supplier orders:", error.message);
        return [];
      }
    },

    supplierOrder: async (_, { id }) => {
      try {
        const { data } = await axios.get(`http://integration:4006/api/supplier/orders/${id}`);
        return data.data;
      } catch (error) {
        if (error.response?.status === 404) return null;
        const errorMsg = error.response?.data?.error || error.message;
        throw new Error(errorMsg);
      }
    },

    receivedInvoices: async () => {
      try {
        const { data } = await axios.get("http://integration:4006/api/received-invoices");
        return data.data || [];
      } catch (error) {
        console.error("Error fetching invoices:", error.message);
        return [];
      }
    },

    integrationLogs: async () => {
      try {
        const { data } = await axios.get("http://integration:4006/api/integration-logs");
        return data.data || [];
      } catch (error) {
        console.error("Error fetching logs:", error.message);
        return [];
      }
    },
  },

  Mutation: {
    // ===== ADMIN AUTHENTICATION =====
    loginAdmin: async (_, { email, password }) => {
      // Simple hardcoded admin authentication for demo
      if (email === "admin@toko-kue.com" && password === "admin123") {
        const admin = { id: "1", email: "admin@toko-kue.com" };
        const token = "fake-jwt-token-" + Date.now(); // In production, use proper JWT
        return { token, admin };
      }
      throw new Error("Invalid credentials");
    },

    // ===== CAKE MUTATIONS (mapped to products) =====
    addCake: async (_, { input }) => {
      try {
        // Convert cake input to product input - include all fields
        const productInput = {
          name: input.name,
          description: input.description,
          price: input.price || 0,
          stock: input.stock,
          unit: "pcs", // Default unit for cakes
          image_url: input.image_url,
          is_active: input.is_active !== false
        };
        const { data } = await axios.post("http://product:4001/products", productInput);

        // Return as cake format - use actual data from product service
        return {
          id: data.id,
          name: data.name,
          description: data.description || "",
          price: data.price || 0,
          stock: data.stock,
          image_url: data.image_url || "",
          is_active: data.is_active !== false,
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString(),
        };
      } catch (error) {
        throw new Error(error.response?.data?.error || error.message);
      }
    },

    updateCake: async (_, { id, input }) => {
      try {
        // Convert cake input to product input - include all fields that can be updated
        const updateData = {};
        if (input.name !== undefined) updateData.name = input.name;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.price !== undefined) updateData.price = input.price;
        if (input.stock !== undefined) updateData.stock = input.stock;
        if (input.image_url !== undefined) updateData.image_url = input.image_url;
        if (input.is_active !== undefined) updateData.is_active = input.is_active;

        const { data } = await axios.put(`http://product:4001/products/${id}`, updateData);

        // Return as cake format - use actual data from product service
        return {
          id: data.id,
          name: data.name,
          description: data.description || "",
          price: data.price || 0,
          stock: data.stock,
          image_url: data.image_url || "",
          is_active: data.is_active !== false,
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString(),
        };
      } catch (error) {
        throw new Error(error.response?.data?.error || error.message);
      }
    },

    deleteCake: async (_, { id }) => {
      try {
        await axios.delete(`http://product:4001/products/${id}`);
        return true;
      } catch (error) {
        if (error.response?.status === 404) return false;
        throw error;
      }
    },

    // ===== PRODUCT MUTATIONS =====
    createProduct: async (_, { input }) => {
      const { data } = await axios.post("http://product:4001/products", input);
      return data;
    },

    updateProduct: async (_, { id, input }) => {
      const { data } = await axios.put(`http://product:4001/products/${id}`, input);
      return data;
    },

    deleteProduct: async (_, { id }) => {
      try {
        await axios.delete(`http://product:4001/products/${id}`);
        return { success: true, message: "Product deleted successfully" };
      } catch (error) {
        if (error.response?.status === 404) {
          return { success: false, message: "Product not found" };
        }
        throw error;
      }
    },

    // ===== INVENTORY MUTATIONS =====
    createInventory: async (_, { input }) => {
      const { data } = await axios.post("http://inventory:4002/inventory", input);
      return data;
    },

    updateInventory: async (_, { id, input }) => {
      const { data } = await axios.put(`http://inventory:4002/inventory/${id}`, input);
      return data;
    },

    deleteInventory: async (_, { id }) => {
      try {
        await axios.delete(`http://inventory:4002/inventory/${id}`);
        return { success: true, message: "Inventory item deleted successfully" };
      } catch (error) {
        if (error.response?.status === 404) {
          return { success: false, message: "Inventory item not found" };
        }
        throw error;
      }
    },

    // ===== ORDER MUTATIONS =====
    createOrder: async (_, { input }) => {
      const { data } = await axios.post("http://order:4005/orders", input);
      return { order: data };
    },

    updateOrder: async (_, { id, input }) => {
      const { data } = await axios.put(`http://order:4005/orders/${id}`, input);
      return data;
    },

    updateOrderStatus: async (_, { id, status }) => {
      const { data } = await axios.put(`http://order:4005/orders/${id}`, { status });
      return data;
    },

    deleteOrder: async (_, { id }) => {
      try {
        await axios.delete(`http://order:4005/orders/${id}`);
        return { success: true, message: "Order deleted successfully" };
      } catch (error) {
        if (error.response?.status === 404) {
          return { success: false, message: "Order not found" };
        }
        throw error;
      }
    },

    // ===== PAYMENT MUTATIONS (Tagihan dari Supplier) =====
    createPayment: async (_, { input }) => {
      const { data } = await axios.post("http://payment:4004/payments", input);
      return data;
    },

    updatePayment: async (_, { id, input }) => {
      const { data } = await axios.put(`http://payment:4004/payments/${id}`, input);
      return data;
    },

    // BAYAR TAGIHAN → OTOMATIS UPDATE INVENTORY
    payPayment: async (_, { id }) => {
      const { data } = await axios.post(`http://payment:4004/payments/${id}/pay`);
      return data;
    },

    deletePayment: async (_, { id }) => {
      try {
        await axios.delete(`http://payment:4004/payments/${id}`);
        return { success: true, message: "Payment deleted successfully" };
      } catch (error) {
        if (error.response?.status === 404) {
          return { success: false, message: "Payment not found" };
        }
        throw error;
      }
    },

    // ===== PURCHASE ORDER MUTATIONS =====
    createPurchaseOrder: async (_, { input }) => {
      try {
        const { data } = await axios.post("http://procurement:4003/pos", input);
        // Parse items if it's a JSON string
        if (data && typeof data.items === 'string') {
          data.items = JSON.parse(data.items);
        }
        return data;
      } catch (error) {
        const errorMsg = error.response?.data?.error || error.message;
        console.error("Error creating purchase order:", errorMsg);
        throw new Error(errorMsg);
      }
    },

    updatePurchaseOrder: async (_, { id, input }) => {
      const { data } = await axios.put(`http://procurement:4003/pos/${id}`, input);
      return data;
    },

    // Supplier-only: Update purchase order status (called via webhook from integration service)
    updatePurchaseOrderStatus: async (_, { id, status }) => {
      // This mutation is for supplier to update status via webhook
      // Frontend should not call this directly - it's for supplier integration
      const { data } = await axios.put(`http://procurement:4003/pos/${id}`, { status });
      return data;
    },

    deletePurchaseOrder: async (_, { id }) => {
      try {
        await axios.delete(`http://procurement:4003/pos/${id}`);
        return { success: true, message: "Purchase order deleted successfully" };
      } catch (error) {
        if (error.response?.status === 404) {
          return { success: false, message: "Purchase order not found" };
        }
        throw new Error(error.response?.data?.error || error.message);
      }
    },

    // ===== SUPPLIER INTEGRATION MUTATIONS =====
    orderFromSupplier: async (_, { items, notes }) => {
      try {
        const { data } = await axios.post("http://integration:4006/api/supplier/orders", {
          items,
          notes,
        });
        return data;
      } catch (error) {
        return {
          success: false,
          message: "Gagal membuat order ke supplier",
          error: error.message,
        };
      }
    },

    paySupplier: async (_, { orderId, invoiceNumber, amount, paymentMethod }) => {
      try {
        const { data } = await axios.post("http://integration:4006/api/supplier/payments", {
          orderId,
          invoiceNumber,
          amount,
          paymentMethod,
        });
        return data;
      } catch (error) {
        return {
          success: false,
          message: "Gagal membayar ke supplier",
          error: error.message,
        };
      }
    },

    receiveFromSupplier: async (_, { id, notes }) => {
      try {
        const { data } = await axios.post(`http://integration:4006/api/supplier/orders/${id}/receive`, {
          notes,
        });
        return data;
      } catch (error) {
        return {
          success: false,
          message: "Gagal konfirmasi penerimaan barang",
          error: error.message,
        };
      }
    },

    createOrderToTellyou: async (_, { externalOrderId, totalAmount, items }) => {
      console.log("📥 Incoming Mutation: createOrderToTellyou", { externalOrderId, totalAmount, items });
      try {
        const { data } = await axios.post("http://stock-payment-service:3000/graphql", {
          query: `
            mutation CreateTellyouTransaction($input: OrderInput!) {
              createTransaction(input: $input) {
                success
                transaction_id
                order_id
                total_cost
                payment_status
                message
              }
            }
          `,
          variables: {
            input: {
              external_order_id: externalOrderId || `TK-${Date.now()}`,
              source_system: "TOKO_KUE_GATEWAY",
              items: items.map(item => ({
                product_id: String(item.id),
                quantity: parseInt(item.qty),
                price: parseFloat(item.price)
              })),
              total_amount: parseFloat(totalAmount)
            }
          }
        });

        if (data.errors) {
          throw new Error(data.errors[0].message);
        }

        return data.data.createTransaction;
      } catch (error) {
        console.error("Tellyou Integration Error:", error.message);
        throw new Error("Gagal terhubung ke Tellyou: " + (error.response?.data?.message || error.message));
      }
    },

    // ===== TELLYOU WEBHOOK SIMULATIONS =====
    simulateTellyouInventoryUpdate: async (_, { items, source, notes }) => {
      try {
        const { data } = await axios.post("http://integration:4006/api/webhook/inventory-update", {
          items,
          source: source || "TELLYOU_GRAPHQL_TEST",
          notes
        });
        return data;
      } catch (error) {
        console.error("Failed to simulate inventory update:", error.message);
        throw new Error("Gagal simulasi update inventory dari Tellyou: " + error.message);
      }
    },

    simulateTellyouInvoice: async (_, { invoiceNumber, supplierName, orderId, amount, dueDate, items }) => {
      try {
        const { data } = await axios.post("http://integration:4006/api/webhook/invoice", {
          invoiceNumber,
          supplierName: supplierName || "Tellyou Supplier",
          orderId,
          amount,
          dueDate,
          items
        });
        return data;
      } catch (error) {
        console.error("Failed to simulate invoice webhook:", error.message);
        throw new Error("Gagal simulasi kirim invoice dari Tellyou: " + error.message);
      }
    },
  },
};

module.exports = resolvers;
