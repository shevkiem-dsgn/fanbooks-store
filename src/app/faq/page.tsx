"use client";

import { useState } from "react";

const faqItems = [
  {
    question: "Как оформить заказ?",
    answer:
      "Выберите товары в каталоге, добавьте их в корзину и перейдите к оформлению. После входа в аккаунт можно указать данные получателя, выбрать ПВЗ СДЭК и создать заказ.",
  },
  {
    question: "Почему книга оплачивается не целиком сразу?",
    answer:
      "Для части книг используется этапная модель оплаты: сначала вносится предоплата на этапе предзаказа, затем после подготовки релиза открывается постоплата, а позже - оплата доставки.",
  },
  {
    question: "Где смотреть статус заказа?",
    answer:
      "Все статусы отображаются в личном кабинете в разделе заказов. Там же можно увидеть состав заказа, этап оплаты, выбранный ПВЗ и трек-номер после отправки.",
  },
  {
    question: "Можно ли выбрать пункт выдачи СДЭК позже?",
    answer:
      "Да. ПВЗ можно сохранить заранее в профиле или выбрать на этапе оплаты доставки прямо на странице заказа.",
  },
  {
    question: "Как считается доставка?",
    answer:
      "Стоимость зависит от города, количества книг в заказе и наличия мерча. После выбора ПВЗ сумма доставки рассчитывается автоматически и становится доступной к оплате.",
  },
  {
    question: "Когда появляется трек-номер?",
    answer:
      "Трек-номер появляется после создания отправления администратором. После этого он отображается в карточке заказа в личном кабинете.",
  },
  {
    question: "Как подключить уведомления?",
    answer:
      "В личном кабинете можно привязать Telegram и VK с помощью одноразового кода. После подтверждения вы сможете получать уведомления и сервисные рассылки.",
  },
  {
    question: "Что делать, если я уже оплатил первый этап?",
    answer:
      "Ничего дополнительно делать не нужно. Когда для вашего релиза откроется следующий этап, он появится в карточке заказа: сначала постоплата, затем оплата доставки.",
  },
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <div className="max-w-4xl">
        <h1 className="text-3xl font-semibold">FAQ</h1>
        <p className="mt-4 text-[var(--muted-foreground)]">
          Ответы на самые частые вопросы о предзаказах, оплате, доставке и личном кабинете.
        </p>
      </div>

      <section className="mt-10 grid gap-4">
        {faqItems.map((item, index) => {
          const isOpen = openIndex === index;

          return (
            <article
              key={item.question}
              className="border border-[var(--border)] bg-[var(--card)] transition"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                aria-expanded={isOpen}
              >
                <span className="text-lg font-medium">{item.question}</span>
                <span className="text-2xl leading-none text-[var(--muted-foreground)]">
                  {isOpen ? "-" : "+"}
                </span>
              </button>

              {isOpen ? (
                <div className="border-t border-[var(--border)] px-6 py-5">
                  <p className="text-sm leading-6 text-[var(--muted-foreground)]">
                    {item.answer}
                  </p>
                </div>
              ) : null}
            </article>
          );
        })}
      </section>
    </main>
  );
}
