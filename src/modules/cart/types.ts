export type CartItem = {
  productId: string;
  slug: string;
  title: string;
  type: "BOOK" | "MERCH";
  price: number | null;
  imageUrl: string | null;
  quantity: number;
  releaseId: string | null;
};