const axios = require('axios');

const notifySupplier = async (supplierUrl, po) => {
  try {
    const res = await axios.post(`${supplierUrl}/orders`, po);
    return res.data;
  } catch (err) {
    console.error("Error notifying supplier:", err.message);
  }
};

module.exports = { notifySupplier };
