import { prisma } from "@/lib/prisma";
import { getReleaseStatusLabel, getReleaseStatusValue } from "@/modules/releases/utils";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen2.5:7b";

type OllamaGenerateResponse = {
  response?: string;
  error?: string;
};

function sum(values: number[]) {
  return values.reduce((acc, value) => acc + value, 0);
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

async function callOllama(system: string, prompt: string) {
  let response: Response;

  try {
    response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        system,
        prompt,
      }),
      cache: "no-store",
    });
  } catch {
    throw new Error(
      "Локальная модель недоступна. Установите и запустите Ollama, затем выполните `ollama pull qwen2.5:7b`.",
    );
  }

  const data = (await response.json()) as OllamaGenerateResponse;

  if (!response.ok || !data.response) {
    throw new Error(data.error || "Не удалось получить ответ от локальной модели.");
  }

  return data.response.trim();
}

async function getReleaseAiContext(releaseId: string) {
  const release = await prisma.release.findUnique({
    where: { id: releaseId },
    include: {
      products: {
        include: {
          orderItems: {
            include: {
              order: {
                include: {
                  payments: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!release) {
    throw new Error("Релиз не найден.");
  }

  const books = release.products.filter((product) => product.type === "BOOK");
  const merch = release.products.filter((product) => product.type === "MERCH");
  const releaseOrdersMap = new Map<
    string,
    {
      createdAt: Date;
      preorderPaid: boolean;
      finalPaid: boolean;
      deliveryPaid: boolean;
      totalPaid: number;
      booksCount: number;
      trackNumber: string | null;
    }
  >();

  for (const product of books) {
    for (const orderItem of product.orderItems) {
      const existing = releaseOrdersMap.get(orderItem.orderId);

      if (existing) {
        existing.booksCount += orderItem.quantity;
        continue;
      }

      releaseOrdersMap.set(orderItem.orderId, {
        createdAt: orderItem.order.createdAt,
        preorderPaid: orderItem.order.preorderPaid,
        finalPaid: orderItem.order.finalPaid,
        deliveryPaid: orderItem.order.deliveryPaid,
        totalPaid: sum(orderItem.order.payments.map((payment) => payment.amount)),
        booksCount: orderItem.quantity,
        trackNumber: orderItem.order.trackNumber,
      });
    }
  }

  const releaseOrders = Array.from(releaseOrdersMap.values());
  const booksOrdered = sum(releaseOrders.map((order) => order.booksCount));
  const totalOrders = releaseOrders.length;
  const preorderPaid = releaseOrders.filter((order) => order.preorderPaid).length;
  const finalPaid = releaseOrders.filter((order) => order.finalPaid).length;
  const deliveryPaid = releaseOrders.filter((order) => order.deliveryPaid).length;
  const shipped = releaseOrders.filter((order) => Boolean(order.trackNumber)).length;
  const waitingFinal = releaseOrders.filter((order) => order.preorderPaid && !order.finalPaid).length;
  const waitingDelivery = releaseOrders.filter((order) => order.finalPaid && !order.deliveryPaid).length;
  const waitingShipment = releaseOrders.filter((order) => order.deliveryPaid && !order.trackNumber).length;
  const minPrintRun = books.reduce((maxValue, product) => Math.max(maxValue, product.minPrintRun ?? 0), 0);
  const remainingToMinPrintRun = Math.max(minPrintRun - booksOrdered, 0);
  const droppedAfterPreorder = Math.max(preorderPaid - finalPaid, 0);
  const statusLabel = getReleaseStatusLabel(getReleaseStatusValue(release));
  const booksRevenue = sum(
    books.flatMap((product) => product.orderItems.map((item) => item.unitPrice * item.quantity)),
  );
  const merchRevenue = sum(
    merch.flatMap((product) => product.orderItems.map((item) => item.unitPrice * item.quantity)),
  );
  const totalPaid = sum(releaseOrders.map((order) => order.totalPaid));

  const booksPerDay = new Map<string, number>();

  for (const order of releaseOrders) {
    const key = formatDate(order.createdAt);
    booksPerDay.set(key, (booksPerDay.get(key) ?? 0) + order.booksCount);
  }

  const dailyBooks = Array.from(booksPerDay.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, count]) => ({ date, count }));

  const lastThreeDays = dailyBooks.slice(-3);
  const averageDailyBooks =
    dailyBooks.length > 0 ? Number((booksOrdered / dailyBooks.length).toFixed(2)) : 0;
  const recentDailyBooks =
    lastThreeDays.length > 0
      ? Number((sum(lastThreeDays.map((day) => day.count)) / lastThreeDays.length).toFixed(2))
      : averageDailyBooks;
  const forecastForFiveDays = Number((booksOrdered + recentDailyBooks * 5).toFixed(1));

  return {
    release,
    statusLabel,
    booksOrdered,
    totalOrders,
    preorderPaid,
    finalPaid,
    deliveryPaid,
    shipped,
    waitingFinal,
    waitingDelivery,
    waitingShipment,
    minPrintRun,
    remainingToMinPrintRun,
    droppedAfterPreorder,
    booksRevenue,
    merchRevenue,
    totalPaid,
    averageDailyBooks,
    recentDailyBooks,
    forecastForFiveDays,
    dailyBooks,
  };
}

export async function generateReleaseDigest(releaseId: string) {
  const context = await getReleaseAiContext(releaseId);

  const system = `Ты помощник администратора издательства фанатских книг. Отвечай по-русски, коротко и по делу. Не фантазируй. Используй только данные из контекста. Формат:
1. Краткий вывод
2. Риски
3. Что сделать сегодня
Каждый пункт в 1-3 коротких абзацах или списках.`;

  const prompt = `Контекст релиза:
Название: ${context.release.title}
Статус: ${context.statusLabel}
Заказов: ${context.totalOrders}
Заказано книг: ${context.booksOrdered}
Минимальный тираж: ${context.minPrintRun}
Не хватает до тиража: ${context.remainingToMinPrintRun}
Оплатили предоплату: ${context.preorderPaid}
Оплатили постоплату: ${context.finalPaid}
Оплатили доставку: ${context.deliveryPaid}
Отправлено: ${context.shipped}
Ждут постоплату: ${context.waitingFinal}
Ждут оплату доставки: ${context.waitingDelivery}
Ждут отправку: ${context.waitingShipment}
Отказались после предоплаты: ${context.droppedAfterPreorder}
Собрано денег: ${context.totalPaid} ₽
Выручка книг: ${context.booksRevenue} ₽
Выручка мерча: ${context.merchRevenue} ₽

Сделай админскую сводку по этому релизу.`;

  return callOllama(system, prompt);
}

export async function generateReleaseForecast(releaseId: string) {
  const context = await getReleaseAiContext(releaseId);

  const system = `Ты помощник по прогнозу продаж релизов. Отвечай по-русски. Не выдавай фантазии за факт. Прогноз должен опираться на числовые данные из контекста. Формат:
1. Вероятный сценарий
2. На чем основан вывод
3. Рекомендация админу
Пиши кратко, без воды.`;

  const prompt = `Контекст релиза:
Название: ${context.release.title}
Статус: ${context.statusLabel}
Заказано книг сейчас: ${context.booksOrdered}
Минимальный тираж: ${context.minPrintRun}
Не хватает до минимального тиража: ${context.remainingToMinPrintRun}
Средний темп заявок в день: ${context.averageDailyBooks}
Средний темп заявок за последние 3 дня: ${context.recentDailyBooks}
Прогноз книг через 5 дней при текущем темпе: ${context.forecastForFiveDays}
Дневная динамика заявок: ${context.dailyBooks.map((day) => `${day.date} — ${day.count}`).join("; ") || "нет данных"}

Сделай осторожный прогноз и скажи, стоит ли продлевать сбор заявок или усиливать анонс.`;

  return callOllama(system, prompt);
}

export async function generateReleaseMailingDraft(args: {
  releaseId: string;
  purpose: "preorder" | "final" | "delivery" | "reminder";
  tone: "friendly" | "neutral" | "urgent";
}) {
  const context = await getReleaseAiContext(args.releaseId);

  const purposeLabel = {
    preorder: "анонс или продление предзаказа",
    final: "открытие постоплаты",
    delivery: "открытие оплаты доставки",
    reminder: "напоминание тем, кто ещё не оплатил следующий этап",
  }[args.purpose];

  const toneLabel = {
    friendly: "дружелюбный",
    neutral: "спокойный деловой",
    urgent: "мягко-срочный",
  }[args.tone];

  const system = `Ты помощник издательства фанатских книг. Пиши по-русски. Текст нужен для Telegram-рассылки. Он должен быть живым, понятным и без канцелярита. Не добавляй фактов, которых нет в контексте. Верни только готовый текст сообщения без пояснений.`;

  const prompt = `Сделай текст рассылки.
Цель: ${purposeLabel}
Тон: ${toneLabel}

Контекст:
Релиз: ${context.release.title}
Статус: ${context.statusLabel}
Заказано книг: ${context.booksOrdered}
Минимальный тираж: ${context.minPrintRun}
Не хватает до тиража: ${context.remainingToMinPrintRun}
Оплатили предоплату: ${context.preorderPaid}
Оплатили постоплату: ${context.finalPaid}
Оплатили доставку: ${context.deliveryPaid}
Ждут постоплату: ${context.waitingFinal}
Ждут оплату доставки: ${context.waitingDelivery}

Сделай сообщение для подписчиков/покупателей.`;

  return callOllama(system, prompt);
}
