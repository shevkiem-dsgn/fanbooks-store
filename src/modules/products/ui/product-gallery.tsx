"use client";

import { useState, useRef, useEffect } from "react";

type ProductGalleryImage = {
  imageUrl: string;
  altText?: string | null;
  isCover?: boolean;
};

type Props = {
  title: string;
  images: ProductGalleryImage[];
};

export function ProductGallery({ title, images }: Props) {
  const safeImages = images.length > 0 ? images : [];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Автоматический скролл к активной миниатюре
  useEffect(() => {
    if (scrollRef.current) {
      const activeThumb = scrollRef.current.children[selectedIndex] as HTMLElement;
      if (activeThumb) {
        activeThumb.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [selectedIndex]);

  if (safeImages.length === 0) {
    return (
      <div className="border border-[var(--border)] bg-[var(--card)]">
        <div className="aspect-[3/4] w-full bg-[var(--muted)]" />
      </div>
    );
  }

  const selectedImage = safeImages[selectedIndex];

  const openModal = (index: number) => {
    setSelectedIndex(index);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const showPrev = () => {
    setSelectedIndex((prev) =>
      prev === 0 ? safeImages.length - 1 : prev - 1,
    );
  };

  const showNext = () => {
    setSelectedIndex((prev) =>
      prev === safeImages.length - 1 ? 0 : prev + 1,
    );
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => openModal(selectedIndex)}
          className="overflow-hidden border border-[var(--border)] bg-[var(--card)] text-left"
        >
          <img
            src={selectedImage.imageUrl}
            alt={selectedImage.altText || title}
            className="max-h-[600px] w-full object-contain" // Изменено: object-contain вместо object-cover
          />
        </button>

        {/* Горизонтальный скролл для миниатюр */}
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-[var(--border)]">
          <div 
            ref={scrollRef}
            className="flex gap-3 pb-2" // min-w-max убрано, теперь flex сам управляет шириной
          >
            {safeImages.map((image, index) => {
              const isActive = index === selectedIndex;

              return (
                <button
                  key={`${image.imageUrl}-${index}`}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className={`shrink-0 overflow-hidden border ${
                    isActive
                      ? "border-[var(--foreground)]"
                      : "border-[var(--border)]"
                  }`}
                >
                  <img
                    src={image.imageUrl}
                    alt={image.altText || `${title} ${index + 1}`}
                    className="h-24 w-18 object-cover sm:h-28 sm:w-20"
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={closeModal}
        >
          <div
            className="relative flex max-h-[95vh] w-full max-w-6xl items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-0 top-0 z-10 border border-white/20 bg-black/50 px-4 py-2 text-sm text-white"
            >
              Закрыть
            </button>

            {safeImages.length > 1 ? (
              <button
                type="button"
                onClick={showPrev}
                className="absolute left-0 z-10 border border-white/20 bg-black/50 px-4 py-3 text-white"
              >
                ←
              </button>
            ) : null}

            <img
              src={safeImages[selectedIndex].imageUrl}
              alt={safeImages[selectedIndex].altText || title}
              className="max-h-[90vh] w-auto max-w-full object-contain"
            />

            {safeImages.length > 1 ? (
              <button
                type="button"
                onClick={showNext}
                className="absolute right-0 z-10 border border-white/20 bg-black/50 px-4 py-3 text-white"
              >
                →
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}