import {
  getReleaseStatusLabel,
  getReleaseStatusValue,
} from "@/modules/releases/utils";

export function getProductStatusLabel(status: string) {
  switch (status) {
    case "ANNOUNCEMENT":
      return "Анонс";
    case "APPLICATIONS_OPEN":
      return "Сбор заявок";
    case "PRINTING_WAIT":
      return "Ожидание из типографии";
    case "PAYMENT":
      return "Оплата";
    case "SHIPPING":
      return "Рассылка";
    case "COMPLETED":
      return "Завершён";
    case "CANCELLED":
      return "Отменён";
    default:
      return status;
  }
}

export function getProductTypeLabel(type: string) {
  switch (type) {
    case "BOOK":
      return "Книга";
    case "MERCH":
      return "Мерч";
    default:
      return type;
  }
}

type ProductStatusSource = {
  status: string;
  release?: {
    status: string;
    preorderOpen: boolean;
    finalPaymentOpen: boolean;
    deliveryOpen: boolean;
    finalPrice: number | null;
  } | null;
};

export function getProductDisplayStatusValue(product: ProductStatusSource) {
  if (!product.release) {
    return product.status;
  }

  return getReleaseStatusValue(product.release);
}

export function getProductDisplayStatusLabel(product: ProductStatusSource) {
  if (!product.release) {
    return getProductStatusLabel(product.status);
  }

  return getReleaseStatusLabel(getProductDisplayStatusValue(product));
}
