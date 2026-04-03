"use client";

import { useActionState, useMemo, useState } from "react";
import { sendTelegramMailingAction, type MailingFormState } from "@/modules/telegram/server/mailing-actions";

type Option = {
  id: string;
  title: string;
};

type HistoryItem = {
  id: string;
  channel: string;
  target: string;
  text: string;
  imageUrl: string | null;
  recipients: number;
  sentCount: number;
  failedCount: number;
  status: "DRAFT" | "SENT" | "FAILED";
  errorMessage: string | null;
  createdAt: string;
  sentAt: string | null;
  release: {
    id: string;
    title: string;
  } | null;
  product: {
    id: string;
    title: string;
  } | null;
};

type Props = {
  releases: Option[];
  products: Option[];
  history: HistoryItem[];
  initialTarget?: string;
  initialReleaseId?: string;
  initialProductId?: string;
  initialTemplate?: string;
};

const initialState: MailingFormState = {};
const fieldClassName =
  "w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]";
const cardClassName =
  "overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--card)] shadow-[0_16px_40px_rgba(0,0,0,0.04)]";

function getTemplateText(template: string, releaseTitle?: string) {
  const safeTitle = releaseTitle || "вашему релизу";

  switch (template) {
    case "announce":
      return `Открыт предзаказ по релизу «${safeTitle}».\n\nЕсли давно ждали этот выпуск, сейчас самое время оформить заказ и внести предоплату.`;
    case "preorder-reminder":
      return `Напоминаем про предзаказ по релизу «${safeTitle}».\n\nЕсли вы планировали участвовать, пожалуйста, не откладывайте оформление заявки.`;
    case "final-payment":
      return `По релизу «${safeTitle}» открыта постоплата.\n\nПожалуйста, зайдите в личный кабинет и завершите оплату, чтобы ваш экземпляр остался за вами.`;
    case "delivery":
      return `По релизу «${safeTitle}» открыта оплата доставки.\n\nВыберите ПВЗ, оплатите доставку в личном кабинете и ждите трек-номер.`;
    case "final-unpaid":
      return `Напоминаем о постоплате по релизу «${safeTitle}».\n\nМы всё ещё ждём завершения оплаты в личном кабинете. После этого экземпляр останется за вами и перейдёт на следующий этап.`;
    case "delivery-unpaid":
      return `Напоминаем об оплате доставки по релизу «${safeTitle}».\n\nВыберите ПВЗ и завершите оплату доставки в личном кабинете, чтобы мы могли подготовить отправку и выдать трек-номер.`;
    default:
      return "";
  }
}

function getStatusLabel(status: HistoryItem["status"]) {
  if (status === "SENT") return "Отправлена";
  if (status === "FAILED") return "С ошибкой";
  return "Черновик";
}

function getTargetLabel(item: HistoryItem) {
  if (item.target === "all") return "Общая";
  if (item.target === "release") {
    return item.release ? `По релизу: ${item.release.title}` : "По релизу";
  }
  if (item.target === "product") {
    return item.product ? `По товару: ${item.product.title}` : "По товару";
  }
  if (item.target === "release-final-unpaid") {
    return item.release
      ? `Не оплатили постоплату: ${item.release.title}`
      : "Не оплатили постоплату";
  }
  if (item.target === "release-delivery-unpaid") {
    return item.release
      ? `Не оплатили доставку: ${item.release.title}`
      : "Не оплатили доставку";
  }
  return item.target;
}

export function MailingForm({
  releases,
  products,
  history,
  initialTarget,
  initialReleaseId,
  initialProductId,
  initialTemplate,
}: Props) {
  const defaultTarget =
    initialTarget === "release" ||
    initialTarget === "product" ||
    initialTarget === "release-final-unpaid" ||
    initialTarget === "release-delivery-unpaid"
      ? initialTarget
      : "all";
  const [target, setTarget] = useState(defaultTarget);
  const [channel, setChannel] = useState("telegram");
  const [selectedReleaseId, setSelectedReleaseId] = useState(initialReleaseId || "");
  const [selectedProductId, setSelectedProductId] = useState(initialProductId || "");
  const selectedRelease = useMemo(
    () => releases.find((release) => release.id === selectedReleaseId),
    [releases, selectedReleaseId],
  );
  const [text, setText] = useState(
    getTemplateText(initialTemplate || "", selectedRelease?.title),
  );
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(sendTelegramMailingAction, initialState);

  const helperText =
    target === "all"
      ? "Сообщение уйдёт всем пользователям с привязанным Telegram."
      : target === "release"
        ? "Сообщение уйдёт только тем, у кого есть заказы по выбранному релизу."
        : target === "release-final-unpaid"
          ? "Сообщение уйдёт тем, кто внёс предоплату по релизу, но ещё не оплатил постоплату."
          : target === "release-delivery-unpaid"
            ? "Сообщение уйдёт тем, кто оплатил книгу, но ещё не оплатил доставку."
        : "Сообщение уйдёт только покупателям выбранного товара.";

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <form
        action={formAction}
        className={`${cardClassName} min-w-0`}
      >
        <div className="border-b border-[var(--border)] bg-[linear-gradient(135deg,rgba(214,127,57,0.12),transparent_62%)] px-6 py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold">Рассылка</h2>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                Выберите канал, сегмент и отправьте одно сообщение сразу в нужную аудиторию.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1.5">
                Канал: {channel === "vk" ? "VK" : channel === "both" ? "Telegram + VK" : "Telegram"}
              </span>
              <span className="rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1.5">
                Сегмент: {getTargetLabel({
                  id: "preview",
                  channel: channel.toUpperCase(),
                  target,
                  text: "",
                  imageUrl: null,
                  recipients: 0,
                  sentCount: 0,
                  failedCount: 0,
                  status: "DRAFT",
                  errorMessage: null,
                  createdAt: new Date().toISOString(),
                  sentAt: null,
                  release: selectedReleaseId
                    ? { id: selectedReleaseId, title: selectedRelease?.title || "Релиз" }
                    : null,
                  product: selectedProductId
                    ? {
                        id: selectedProductId,
                        title:
                          products.find((product) => product.id === selectedProductId)?.title ||
                          "Товар",
                      }
                    : null,
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 px-6 py-6">
          <div className="grid gap-4 rounded-[24px] border border-[var(--border)] bg-[var(--background)]/80 p-5 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Канал отправки</label>
              <select
                name="channel"
                value={channel}
                onChange={(event) => setChannel(event.target.value)}
                className={fieldClassName}
              >
                <option value="telegram">Только Telegram</option>
                <option value="vk">Только VK</option>
                <option value="both">Telegram и VK</option>
              </select>
            </div>

            <select
              name="target"
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              className={fieldClassName}
            >
              <option value="all">Общая рассылка</option>
              <option value="release">По релизу</option>
              <option value="product">По товару</option>
              <option value="release-final-unpaid">Не оплатили постоплату</option>
              <option value="release-delivery-unpaid">Не оплатили доставку</option>
            </select>
          </div>

          <p className="rounded-2xl border border-[var(--border)] bg-[var(--muted)] px-4 py-3 text-sm text-[var(--muted-foreground)]">
            {helperText}
            <br />
            Для VK пока доступны только текстовые сообщения. Картинки работают только в Telegram.
          </p>

          <div className="grid gap-4 rounded-[24px] border border-[var(--border)] bg-[var(--background)]/80 p-5 md:grid-cols-2">
            <div className="grid gap-2 min-w-0">
              <label className="text-sm font-medium">Релиз</label>
              <select
                name="releaseId"
                value={selectedReleaseId}
                onChange={(event) => {
                  const nextId = event.target.value;
                  setSelectedReleaseId(nextId);
                  const nextRelease = releases.find((release) => release.id === nextId);
                  if (initialTemplate) {
                    setText(getTemplateText(initialTemplate, nextRelease?.title));
                  }
                }}
                className={fieldClassName}
              >
                <option value="">Выбери релиз</option>
                {releases.map((release) => (
                  <option key={release.id} value={release.id}>
                    {release.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2 min-w-0">
              <label className="text-sm font-medium">Товар</label>
              <select
                name="productId"
                value={selectedProductId}
                onChange={(event) => setSelectedProductId(event.target.value)}
                className={fieldClassName}
              >
                <option value="">Выбери товар</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-2 min-w-0">
            <label className="text-sm font-medium">Текст сообщения</label>
            <textarea
              name="text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Текст сообщения"
              className={`${fieldClassName} min-h-56 resize-y`}
            />
          </div>

          <div className="grid gap-4 rounded-[24px] border border-[var(--border)] bg-[var(--background)]/80 p-5 md:grid-cols-2">
            <div className="grid gap-2 min-w-0">
              <label className="text-sm font-medium">Ссылка на картинку</label>
              <input
                name="imageUrl"
                type="url"
                placeholder="https://..."
                className={fieldClassName}
              />
              <p className="text-xs text-[var(--muted-foreground)]">
                Можно оставить пустым и загрузить файл ниже.
              </p>
            </div>

            <div className="grid gap-2 min-w-0">
              <label className="text-sm font-medium">Или загрузить изображение</label>
              <input
                name="imageFile"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) {
                    setImagePreview(null);
                    return;
                  }

                  setImagePreview(URL.createObjectURL(file));
                }}
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none file:mr-3 file:rounded-xl file:border-0 file:bg-[var(--accent)] file:px-3 file:py-2 file:text-[var(--accent-foreground)]"
              />
            </div>
          </div>

          {imagePreview ? (
            <div className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--muted)] p-4">
              <div className="text-sm font-medium">Предпросмотр изображения</div>
              <img
                src={imagePreview}
                alt="Предпросмотр изображения рассылки"
                className="mt-3 max-h-64 w-full rounded-2xl object-contain"
              />
            </div>
          ) : null}

          {state.error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {state.error}
            </p>
          ) : null}
          {state.success ? (
            <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {state.success}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border)] pt-2">
            <p className="text-sm text-[var(--muted-foreground)]">
              Перед отправкой проверьте выбранный канал и сегмент.
            </p>

            <button
              type="submit"
              disabled={pending}
              className="rounded-2xl border border-transparent bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90 disabled:opacity-60"
            >
              {pending ? "Отправка..." : "Отправить рассылку"}
            </button>
          </div>
        </div>
      </form>

      <div className="flex min-w-0 flex-col gap-6">
        <section className={`${cardClassName} p-6`}>
          <h2 className="text-lg font-medium">Быстрые сценарии</h2>
          <div className="mt-4 grid gap-3 text-sm">
            <button
              type="button"
              onClick={() => setText(getTemplateText("announce", selectedRelease?.title))}
              className="rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-left transition hover:border-[var(--accent)] hover:bg-[var(--muted)]"
            >
              Анонс релиза
            </button>
            <button
              type="button"
              onClick={() =>
                setText(getTemplateText("preorder-reminder", selectedRelease?.title))
              }
              className="rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-left transition hover:border-[var(--accent)] hover:bg-[var(--muted)]"
            >
              Напоминание о предзаказе
            </button>
            <button
              type="button"
              onClick={() => setText(getTemplateText("final-payment", selectedRelease?.title))}
              className="rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-left transition hover:border-[var(--accent)] hover:bg-[var(--muted)]"
            >
              Открылась постоплата
            </button>
            <button
              type="button"
              onClick={() => setText(getTemplateText("delivery", selectedRelease?.title))}
              className="rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-left transition hover:border-[var(--accent)] hover:bg-[var(--muted)]"
            >
              Открылась доставка
            </button>
            <button
              type="button"
              onClick={() => {
                setTarget("release-final-unpaid");
                setText(getTemplateText("final-unpaid", selectedRelease?.title));
              }}
              className="rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-left transition hover:border-[var(--accent)] hover:bg-[var(--muted)]"
            >
              Напомнить о постоплате
            </button>
            <button
              type="button"
              onClick={() => {
                setTarget("release-delivery-unpaid");
                setText(getTemplateText("delivery-unpaid", selectedRelease?.title));
              }}
              className="rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-left transition hover:border-[var(--accent)] hover:bg-[var(--muted)]"
            >
              Напомнить об оплате доставки
            </button>
          </div>
        </section>

        <section className={`${cardClassName} min-w-0 p-6`}>
          <h2 className="text-lg font-medium">История рассылок</h2>
          <div className="mt-4 flex flex-col gap-4">
            {history.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                История рассылок пока пустая.
              </p>
            ) : (
              history.map((item) => (
                <article
                  key={item.id}
                  className="min-w-0 overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--background)] p-4 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="font-medium">{getTargetLabel(item)}</div>
                    <div className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted-foreground)]">
                      {getStatusLabel(item.status)}
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-[var(--muted-foreground)]">
                    Канал: {item.channel === "VK" ? "VK" : item.channel === "BOTH" ? "Telegram + VK" : "Telegram"}
                  </div>

                  <p className="mt-2 break-words whitespace-pre-wrap text-[var(--muted-foreground)]">
                    {item.text}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[var(--muted-foreground)]">
                    <span>Получателей: {item.recipients}</span>
                    <span>Отправлено: {item.sentCount}</span>
                    {item.failedCount > 0 ? <span>Ошибок: {item.failedCount}</span> : null}
                    <span>
                      {new Date(item.createdAt).toLocaleString("ru-RU", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>

                  {item.imageUrl ? (
                    <a
                      href={item.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex text-xs underline underline-offset-4"
                    >
                      Открыть изображение
                    </a>
                  ) : null}

                  {item.errorMessage ? (
                    <p className="mt-3 text-xs text-red-500">{item.errorMessage}</p>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
