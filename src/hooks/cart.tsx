import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storageProducts = await AsyncStorage.getItem('market:cartproducts');
      if (storageProducts) {
        setProducts(JSON.parse(storageProducts));
      }
      await AsyncStorage.removeItem('market:cartproducts');
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const productAlreadyAdd = products.find(item => item.id === product.id);
      if (productAlreadyAdd) {
        const productsUpdated = products.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
        setProducts([...productsUpdated]);
      } else {
        setProducts([...products, { ...product, quantity: 1 }]);
      }
      await AsyncStorage.setItem(
        'market:cartproducts',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const productsUpdated = products.map(item =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
      );
      setProducts([...productsUpdated]);
      await AsyncStorage.setItem(
        'market:cartproducts',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productCheck = products.find(item => item.id === id);
      if (productCheck && productCheck.quantity < 2) {
        const productsReduced = products.filter(item => item.id !== id);
        setProducts([...productsReduced]);
        await AsyncStorage.setItem(
          'market:cartproducts',
          JSON.stringify(products),
        );
      } else {
        const productsLessQuantity = products.map(item =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item,
        );
        setProducts([...productsLessQuantity]);
        await AsyncStorage.setItem(
          'market:cartproducts',
          JSON.stringify(products),
        );
      }
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
