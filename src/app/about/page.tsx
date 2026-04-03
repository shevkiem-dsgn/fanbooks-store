const galleryItems = [
  {
    imageUrl:
      "https://images.unsplash.com/photo-1755613495591-5b86c76a9df6?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=80&w=1800",
    alt: "Уютный интерьер книжного пространства с полками",
    creditLabel: "Evgeniy Beloshytskiy / Unsplash",
    creditHref:
      "https://unsplash.com/photos/bookstore-interior-with-shelves-full-of-colorful-books-X4EhUoJPRt8",
  },
  {
    imageUrl:
      "https://images.unsplash.com/photo-1748465414055-81bbb812c8d7?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=80&w=1800",
    alt: "Красиво оформленные книги в коробе",
    creditLabel: "Theo / Unsplash",
    creditHref:
      "https://unsplash.com/photos/books-wrapped-for-a-blind-date-with-a-book-yn6yGIvjgGU",
  },
  {
    imageUrl:
      "https://images.unsplash.com/photo-1753620654290-e8ab8566020e?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=80&w=1800",
    alt: "Атмосферный книжный интерьер в тёмных тонах",
    creditLabel: "Milad Fakurian / Unsplash",
    creditHref:
      "https://unsplash.com/photos/a-dark-bookstore-offers-books-on-shelves-6E-rmzFP_Do",
  },
];

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <section className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="max-w-3xl">
          <span className="inline-flex border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-sm text-[var(--muted-foreground)]">
            О проекте
          </span>

          <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
            Коллекционные фанатские издания, которые удобно заказывать и приятно ждать.
          </h1>

          <div className="mt-6 grid gap-4 text-base leading-7 text-[var(--muted-foreground)]">
            <p>
              КНИГОВЁРТ - это пространство для читателей, которым важны не только
              сами тексты, но и ощущение от издания: оформление, бумага, атмосфера
              релиза и понятный путь заказа от предзаказа до получения посылки.
            </p>
            <p>
              Здесь можно следить за релизами, оформлять заказ на книги и мерч,
              проходить этапы оплаты, выбирать ПВЗ СДЭК и видеть статус заказа без
              переписок и хаоса в сообщениях. Всё, что обычно приходится собирать по
              кусочкам, находится в одном кабинете.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 overflow-hidden border border-[var(--border)] bg-[var(--card)]">
            <img
              src={galleryItems[0].imageUrl}
              alt={galleryItems[0].alt}
              className="h-[340px] w-full object-cover"
            />
          </div>

          {galleryItems.slice(1).map((item) => (
            <div
              key={item.imageUrl}
              className="overflow-hidden border border-[var(--border)] bg-[var(--card)]"
            >
              <img
                src={item.imageUrl}
                alt={item.alt}
                className="h-[220px] w-full object-cover"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14 grid gap-6 md:grid-cols-3">
        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="text-lg font-medium">Для кого этот проект</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
            Для тех, кто любит фанатские тексты в печатном виде, ценит аккуратное
            оформление и хочет видеть понятный путь заказа без лишней рутины.
          </p>
        </div>

        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="text-lg font-medium">Что здесь можно заказать</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
            Книги, связанные с конкретными релизами, и сопутствующий мерч. Для
            каждого товара видно статус, описание и этап продаж.
          </p>
        </div>

        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="text-lg font-medium">Почему это удобно</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
            Не нужно искать информацию в чате или переспросах: заказ, этапы оплаты,
            доставка, ПВЗ и трек-номер собраны в одном личном кабинете.
          </p>
        </div>
      </section>

      <section className="mt-14 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="text-2xl font-semibold">Как проходит заказ</h2>
          <div className="mt-5 grid gap-4 text-sm leading-6 text-[var(--muted-foreground)]">
            <p>
              1. Вы выбираете книгу или мерч в каталоге и оформляете заказ.
            </p>
            <p>
              2. Если для книги открыт предзаказ, сначала оплачивается первый этап.
            </p>
            <p>
              3. Когда релиз переходит дальше, в заказе открывается постоплата,
              а затем - этап оплаты доставки.
            </p>
            <p>
              4. После выбора ПВЗ и отправки заказа в кабинете появляется трек-номер.
            </p>
          </div>
        </div>

        <div className="border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="text-2xl font-semibold">Что получает покупатель</h2>
          <div className="mt-5 grid gap-4 text-sm leading-6 text-[var(--muted-foreground)]">
            <p>
              Понятную историю заказа, прозрачные этапы оплаты, сохранённые данные
              получателя и быстрый доступ к следующему действию без путаницы.
            </p>
            <p>
              Если хочется получать новости удобнее, можно подключить Telegram или VK
              и получать напоминания о следующих этапах прямо в привычный канал.
            </p>
            <p>
              В результате покупка ощущается не как длинная ручная переписка, а как
              аккуратно организованный процесс вокруг любимого релиза.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-14 border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-xl font-medium">Немного о настроении проекта</h2>
        <p className="mt-4 max-w-4xl text-sm leading-6 text-[var(--muted-foreground)]">
          Мы хотели, чтобы эта страница и весь магазин воспринимались не как сухая
          витрина, а как спокойное книжное пространство: с понятной навигацией,
          ясными этапами и ощущением, что заказ сопровождается аккуратно и бережно.
        </p>

        <div className="mt-6 grid gap-2 text-xs text-[var(--muted-foreground)]">
          {galleryItems.map((item) => (
            <a
              key={item.creditHref}
              href={item.creditHref}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4"
            >
              Фото: {item.creditLabel}
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
