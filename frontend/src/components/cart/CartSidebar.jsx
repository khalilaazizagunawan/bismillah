import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { useCart } from '../../context/CartContext';
import { CREATE_ORDER } from '../../graphql/orders';

function CartSidebar() {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, cartTotal, setCart } = useCart();
  const [isCheckout, setIsCheckout] = useState(false);
  const [createOrder, { loading: isSubmitting }] = useMutation(CREATE_ORDER);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [errors, setErrors] = useState({ email: '', phone: '' });

  const validatePhone = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 0) return 'Nomor HP harus diisi';
    if (!/^\d{10,15}$/.test(cleaned)) return 'Nomor HP harus terdiri dari 10-15 angka';
    return '';
  };

  const validateEmail = (value) => {
    const v = value.trim().toLowerCase();
    if (v.length === 0) return 'Email harus diisi';
    if (!/^[^\s@]+@gmail\.com$/i.test(v)) return 'Gunakan alamat Gmail (@gmail.com)';
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const cleaned = value.replace(/\D/g, '');
      setFormData({ ...formData, phone: cleaned });
      setErrors({ ...errors, phone: validatePhone(cleaned) });
    } else if (name === 'email') {
      const cleaned = value.trim();
      setFormData({ ...formData, email: cleaned });
      setErrors({ ...errors, email: validateEmail(cleaned) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const phoneError = validatePhone(formData.phone);
    const emailError = validateEmail(formData.email);
    if (phoneError || emailError) {
      setErrors({ ...errors, phone: phoneError, email: emailError });
      return;
    }

    try {
      // Validate cart is not empty
      if (cart.length === 0) {
        alert('Keranjang kosong. Silakan tambahkan produk terlebih dahulu.');
        return;
      }

      // Prepare order items - sesuai dengan OrderItemInput schema
      const items = cart.map(item => ({
        cake_id: Number(item.id) || null,
        name: item.size ? `${item.name} (${item.size})` : item.name, // Include size in name if exists
        qty: Number(item.quantity) || 1,
        price: Number(item.price) || 0,
      }));

      // Validate items
      if (items.length === 0) {
        alert('Tidak ada item dalam keranjang.');
        return;
      }

      // Validate all items have valid data
      for (const item of items) {
        if (!item.name || !item.qty || item.qty <= 0 || !item.price || item.price <= 0) {
          alert('Data produk tidak valid. Silakan refresh halaman dan coba lagi.');
          return;
        }
      }

      console.log('Creating order with data:', {
        customer_name: formData.name.trim(),
        customer_phone: formData.phone.trim(),
        customer_address: formData.address.trim(),
        items: items,
      });

      // Create order - sesuai dengan CreateOrderInput schema
      const result = await createOrder({
        variables: {
          input: {
            customer_name: formData.name.trim(),
            customer_phone: formData.phone.trim(),
            customer_address: formData.address.trim(),
            items: items,
          },
        },
      });

      // Success - clear cart and close sidebar
      setCart([]);
      setIsCartOpen(false);
      setIsCheckout(false);
      
      // Reset form
      setFormData({
        name: '',
        address: '',
        email: '',
        phone: '',
        notes: '',
      });
      
      alert('Pesanan berhasil dikirim! 🍰\n📧 Konfirmasi pesanan akan dikirim ke email Anda.');
    } catch (error) {
      console.error('Error creating order:', error);
      console.error('Error details:', {
        graphQLErrors: error.graphQLErrors,
        networkError: error.networkError,
        message: error.message,
        stack: error.stack
      });
      
      // Extract error message dengan detail lebih lengkap
      let errorMessage = 'Terjadi kesalahan saat mengirim pesanan.';
      let errorDetails = '';
      
      if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        errorMessage = 'Error dari server:';
        errorDetails = error.graphQLErrors.map(e => e.message).join('\n');
      } else if (error.networkError) {
        errorMessage = 'Koneksi ke server gagal.';
        if (error.networkError.message) {
          errorDetails = error.networkError.message;
        }
        if (error.networkError.statusCode) {
          errorDetails += ` (Status: ${error.networkError.statusCode})`;
        }
        // Check if it's a CORS or connection issue
        if (error.networkError.message && error.networkError.message.includes('Failed to fetch')) {
          errorDetails = 'Tidak dapat terhubung ke server. Pastikan backend berjalan di http://localhost:4000';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Show detailed error
      const fullMessage = errorDetails 
        ? `${errorMessage}\n\n${errorDetails}`
        : errorMessage;
      
      alert(`Terjadi kesalahan:\n${fullMessage}\n\nSilakan cek console browser (F12) untuk detail lebih lanjut.`);
    }
  }; 

  const formatPrice = (price) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end" onClick={() => setIsCartOpen(false)}>
      <div
        className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">Shopping Cart</h2>
          <button onClick={() => setIsCartOpen(false)} className="text-3xl text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>

        {/* Isi Cart atau Form */}
        <div className="p-6">
          {!isCheckout ? (
            <>
              {cart.length === 0 ? (
                <p className="text-center text-gray-500 py-10">Keranjang kosong</p>
              ) : (
                <>
                  <div className="space-y-6 mb-8">
                    {cart.map((item, index) => {
                      const itemKey = item.size ? `${item.id}-${item.size}` : item.id;
                      return (
                        <div key={itemKey || index} className="flex items-start space-x-4 pb-6 border-b">
                          {item.image_url || item.image ? (
                            <img src={item.image_url || item.image} alt={item.name} className="w-24 h-24 object-cover rounded-xl" />
                          ) : (
                            <div className="w-24 h-24 bg-gray-200 flex items-center justify-center text-gray-400 text-xs rounded-xl">
                              No Image
                            </div>
                          )}
                          <div className="flex-grow">
                            <h3 className="font-semibold text-lg">
                              {item.name}
                              {item.size && <span className="text-sm text-gray-500 ml-2 font-normal">({item.size})</span>}
                            </h3>
                            <p className="text-gray-700 mt-1">{formatPrice(item.price)}</p>
                            {/* Quantity */}
                            <div className="flex items-center space-x-3 mt-3">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1, item.size)}
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                              >
                                −
                              </button>
                              <span className="font-medium">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1, item.size)}
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                              >
                                +
                              </button>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.id, item.size)}
                              className="text-red-500 text-sm hover:underline mt-2 block"
                            >
                              REMOVE
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t pt-6">
                    <p className="text-xl font-bold text-right mb-8">
                      Total: {formatPrice(cartTotal)}
                    </p>
                    <button
                      onClick={() => setIsCheckout(true)}
                      className="w-full bg-primary text-white font-bold py-3 rounded-full hover:bg-secondary transition"
                    >
                      Proceed to Checkout
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            /* FORM PEMESANAN */
            <div>
              <h3 className="text-xl font-bold mb-8">Form Pemesanan</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <input
                  type="text"
                  name="name"
                  placeholder="Nama Lengkap"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-6 py-3 border border-gray-300 rounded-full text-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                <input
                  type="text"
                  name="address"
                  placeholder="Alamat Pengiriman"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-6 py-3 border border-gray-300 rounded-full text-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email (Gmail)"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-6 py-3 border border-gray-300 rounded-full text-lg focus:outline-none focus:ring-2 focus:ring-primary mb-1"
                  required
                  aria-invalid={errors.email ? 'true' : 'false'}
                />
                {errors.email && <p className="text-red-500 text-sm mb-3">{errors.email}</p>}
                <input
                  type="tel"
                  name="phone"
                  placeholder="Nomor HP"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-6 py-3 border border-gray-300 rounded-full text-lg focus:outline-none focus:ring-2 focus:ring-primary mb-1"
                  required
                  aria-invalid={errors.phone ? 'true' : 'false'}
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
                {errors.phone && <p className="text-red-500 text-sm mb-3">{errors.phone}</p>}
                <textarea
                  name="notes"
                  placeholder="Catatan Pesanan (opsional)"
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full px-6 py-3 border border-gray-300 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                />

                <p className="text-2xl font-bold text-center mt-8">
                  Total: {formatPrice(cartTotal)}
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting || !!errors.phone || !!errors.email || formData.phone.length < 10 || formData.email.trim().length === 0}
                  className="w-full bg-primary text-white font-bold py-4 rounded-full hover:bg-secondary transition text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Mengirim...' : 'Kirim Pesanan'}
                </button>

                <button
                  type="button"
                  onClick={() => setIsCheckout(false)}
                  className="w-full text-gray-600 font-medium py-3 hover:underline"
                >
                  Kembali
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CartSidebar;