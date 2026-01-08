import { useState } from 'react';
import { useCart } from '../../context/CartContext';
import Button from '../ui/Button';

function CheckoutForm({ onClose }) {
  const { cart, cartTotal, setCart, setIsCartOpen } = useCart();
  const [formData, setFormData] = useState({ name: '', address: '', email: '', phone: '', notes: '' });
  const [errors, setErrors] = useState({ email: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    const phoneError = validatePhone(formData.phone);
    const emailError = validateEmail(formData.email);
    if (phoneError || emailError) {
      setErrors({ ...errors, phone: phoneError, email: emailError });
      return;
    }
    setIsSubmitting(true);
    // Simulasi kirim pesanan (nanti bisa ganti dengan API email/backend)
    console.log('Pesanan dikirim:', { ...formData, cart, total: cartTotal });
    alert('Pesanan berhasil dikirim! Terima kasih.');
    setCart([]);
    setIsCartOpen(false);
    setIsSubmitting(false);
  };

  const formatPrice = (price) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  return (
    <div className="mt-6 border-t pt-4">
      <h3 className="text-xl font-bold mb-4">Form Pemesanan</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Nama Lengkap"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-3 border rounded mb-4"
          required
        />
        <input
          type="text"
          name="address"
          placeholder="Alamat Pengiriman"
          value={formData.address}
          onChange={handleChange}
          className="w-full p-3 border rounded mb-4"
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email (Gmail)"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-3 border rounded mb-2"
          required
          aria-invalid={errors.email ? 'true' : 'false'}
        />
        {errors.email && <p className="text-red-500 text-sm mb-4">{errors.email}</p>}
        <input
          type="tel"
          name="phone"
          placeholder="Nomor HP"
          value={formData.phone}
          onChange={handleChange}
          className="w-full p-3 border rounded mb-2"
          required
          aria-invalid={errors.phone ? 'true' : 'false'}
          inputMode="numeric"
          pattern="[0-9]*"
        />
        
        {errors.phone && <p className="text-red-500 text-sm mb-4">{errors.phone}</p>}
        <textarea
          name="notes"
          placeholder="Catatan Pesanan (misal: ukuran, rasa custom)"
          value={formData.notes}
          onChange={handleChange}
          className="w-full p-3 border rounded mb-4"
          rows={3}
        />
        <p className="text-lg font-bold mb-4">Total: {formatPrice(cartTotal)}</p>
        <Button
          type="submit"
          disabled={isSubmitting || !!errors.phone || !!errors.email || formData.phone.length < 10 || formData.email.trim().length === 0}
          className="w-full"
        >
          {isSubmitting ? 'Mengirim...' : 'Kirim Pesanan'}
        </Button>
        <button type="button" onClick={onClose} className="text-gray-500 mt-4 w-full text-center">
          Kembali
        </button>
      </form>
    </div>
  );
}

export default CheckoutForm;