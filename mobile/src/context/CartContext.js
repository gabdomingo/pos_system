import React, { createContext, useContext, useMemo, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  function addItem(product) {
    setItems((prev) => {
      const existing = prev.find((p) => p.id === product.id);
      if (!existing) return [...prev, { ...product, quantity: 1 }];
      const nextQty = Math.min(existing.quantity + 1, product.stock || existing.quantity + 1);
      return prev.map((p) => (p.id === product.id ? { ...p, quantity: nextQty } : p));
    });
  }

  function updateQuantity(id, quantity) {
    setItems((prev) =>
      prev
        .map((p) => {
          if (p.id !== id) return p;
          const clamped = Math.max(1, Math.min(Number(quantity) || 1, p.stock || Number(quantity) || 1));
          return { ...p, quantity: clamped };
        })
    );
  }

  function removeItem(id) {
    setItems((prev) => prev.filter((p) => p.id !== id));
  }

  function clearCart() {
    setItems([]);
  }

  const subtotal = useMemo(() => items.reduce((sum, p) => sum + Number(p.price || 0) * Number(p.quantity || 0), 0), [items]);
  const totalItems = useMemo(() => items.reduce((sum, p) => sum + Number(p.quantity || 0), 0), [items]);

  const value = useMemo(
    () => ({ items, subtotal, totalItems, addItem, updateQuantity, removeItem, clearCart }),
    [items, subtotal, totalItems]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
