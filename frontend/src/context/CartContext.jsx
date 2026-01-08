import { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addToCart = (product, { openSidebar = true } = {}) => {
    setCart((prev) => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });

    // Jangan otomatis buka sidebar di halaman admin (mencegah overlay menutupi tombol Edit)
    const isAdminPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
    if (openSidebar && !isAdminPath) {
      setIsCartOpen(true);
    }
  };

  const removeFromCart = (id, size = null) => {
    setCart((prev) => {
      if (size) {
        return prev.filter(item => {
          const itemKey = item.size ? `${item.id}-${item.size}` : item.id;
          const targetKey = `${id}-${size}`;
          return itemKey !== targetKey;
        });
      }
      return prev.filter(item => item.id !== id);
    });
  };

  const updateQuantity = (id, quantity, size = null) => {
    if (quantity === 0) {
      removeFromCart(id, size);
      return;
    }
    setCart((prev) => {
      if (size) {
        const itemKey = `${id}-${size}`;
        return prev.map(item => {
          const itemKey2 = item.size ? `${item.id}-${item.size}` : item.id;
          return itemKey2 === itemKey ? { ...item, quantity } : item;
        });
      }
      return prev.map(item => item.id === id ? { ...item, quantity } : item);
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart,
      cartCount,
      cartTotal,
      isCartOpen,
      setIsCartOpen,
      addToCart,
      removeFromCart,
      updateQuantity,
      setCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}