"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/modules/cart/types";

type CartState = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  changeQuantity: (productId: string, quantity: number) => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (cartItem) => cartItem.productId === item.productId,
          );

          if (existing) {
            if (existing.type === "BOOK") {
              return state;
            }

            return {
              items: state.items.map((cartItem) =>
                cartItem.productId === item.productId
                  ? {
                      ...cartItem,
                      quantity: cartItem.quantity + 1,
                    }
                  : cartItem,
              ),
            };
          }

          return {
            items: [
              ...state.items,
              {
                ...item,
                quantity: item.type === "BOOK" ? 1 : item.quantity || 1,
              },
            ],
          };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        })),

      clearCart: () => set({ items: [] }),

      changeQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items.map((item) => {
            if (item.productId !== productId) return item;

            if (item.type === "BOOK") {
              return {
                ...item,
                quantity: 1,
              };
            }

            return {
              ...item,
              quantity: quantity < 1 ? 1 : quantity,
            };
          }),
        })),
    }),
    {
      name: "fanbooks-cart",
    },
  ),
);