export function getOrderStatusLabel(status: string) {
  switch (status) {
    case "CREATED":
      return "Создан";
    case "ACTIVE":
      return "Активен";
    case "WAITING_FINAL_PAYMENT":
      return "Ожидает постоплату";
    case "WAITING_DELIVERY_PAYMENT":
      return "Ожидает оплату доставки";
    case "READY_TO_SHIP":
      return "Готов к отправке";
    case "SHIPPED":
      return "Отправлен";
    case "COMPLETED":
      return "Завершён";
    case "CANCELLED":
      return "Отменён";
    case "REFUND_REQUESTED":
      return "Запрошен возврат";
    case "REFUND_APPROVED":
      return "Возврат одобрен";
    case "REFUND_COMPLETED":
      return "Возврат выполнен";
    default:
      return status;
  }
}

export function getPaymentBooleanLabel(value: boolean) {
  return value ? "Да" : "Нет";
}