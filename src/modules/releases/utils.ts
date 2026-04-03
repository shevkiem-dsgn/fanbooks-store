type ReleasePhaseSource = {
  status?: string | null;
  preorderOpen?: boolean | null;
  finalPaymentOpen?: boolean | null;
  deliveryOpen?: boolean | null;
  finalPrice?: number | null;
};

const TERMINAL_RELEASE_STATUSES = new Set(["COMPLETED", "CANCELLED"]);

export function getReleaseStatusValue(release: ReleasePhaseSource) {
  if (release.status && TERMINAL_RELEASE_STATUSES.has(release.status)) {
    return release.status;
  }

  if (release.deliveryOpen) {
    return "SHIPPING";
  }

  if (release.finalPaymentOpen) {
    return "PAYMENT";
  }

  if (release.preorderOpen) {
    return "APPLICATIONS_OPEN";
  }

  if (release.finalPrice !== null && release.finalPrice !== undefined) {
    return "PRINTING_WAIT";
  }

  return release.status || "ANNOUNCEMENT";
}

export function getReleaseStatusLabel(status: string) {
  switch (status) {
    case "ANNOUNCEMENT":
      return "Анонс";
    case "APPLICATIONS_OPEN":
      return "Предзаказ открыт";
    case "PRINTING_WAIT":
      return "Подготовка к печати";
    case "PAYMENT":
      return "Постоплата открыта";
    case "SHIPPING":
      return "Оплата доставки и отправка";
    case "COMPLETED":
      return "Завершён";
    case "CANCELLED":
      return "Отменён";
    default:
      return status;
  }
}

export function getReleasePaymentStageLabel(isOpen: boolean, openedLabel: string) {
  return isOpen ? openedLabel : "Закрыта";
}
