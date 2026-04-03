"use client";

import { useActionState } from "react";
import {
  generateMailingDraftAction,
  generateReleaseDigestAction,
  generateReleaseForecastAction,
  type AiToolState,
} from "@/modules/ai/server/actions";

type ReleaseOption = {
  id: string;
  title: string;
};

const initialState: AiToolState = {};

function ResultBlock({ state }: { state: AiToolState }) {
  if (!state.error && !state.result) {
    return null;
  }

  return (
    <div className="grid gap-3">
      {state.error ? <p className="text-sm text-red-500">{state.error}</p> : null}
      {state.result ? (
        <textarea
          readOnly
          value={state.result}
          className="min-h-56 border border-[var(--border)] bg-[var(--muted)] px-4 py-3 text-sm outline-none"
        />
      ) : null}
    </div>
  );
}

export function AiAdminPanel({ releases }: { releases: ReleaseOption[] }) {
  const [digestState, digestAction, digestPending] = useActionState(
    generateReleaseDigestAction,
    initialState,
  );
  const [forecastState, forecastAction, forecastPending] = useActionState(
    generateReleaseForecastAction,
    initialState,
  );
  const [mailingState, mailingAction, mailingPending] = useActionState(
    generateMailingDraftAction,
    initialState,
  );

  return (
    <div className="grid gap-6">
      <section className="border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-medium">Что умеет ИИ</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            Локальная модель помогает по трём задачам: быстро объяснить ситуацию
            по релизу, оценить прогноз и подготовить черновик Telegram-рассылки.
          </p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <form action={digestAction} className="border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-medium">ИИ-сводка по релизу</h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              Коротко объясняет, где риск, что хорошо и что стоит сделать сегодня.
            </p>

            <select
              name="releaseId"
              defaultValue=""
              className="border border-[var(--border)] bg-transparent px-4 py-3 outline-none"
            >
              <option value="" disabled>
                Выберите релиз
              </option>
              {releases.map((release) => (
                <option key={release.id} value={release.id}>
                  {release.title}
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={digestPending}
              className="w-fit border border-transparent bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90 disabled:opacity-60"
            >
              {digestPending ? "Думаю..." : "Сделать сводку"}
            </button>

            <ResultBlock state={digestState} />
          </div>
        </form>

        <form action={forecastAction} className="border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-medium">Прогноз по релизу</h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              Объясняет, успеет ли релиз набрать тираж и стоит ли усиливать анонс.
            </p>

            <select
              name="releaseId"
              defaultValue=""
              className="border border-[var(--border)] bg-transparent px-4 py-3 outline-none"
            >
              <option value="" disabled>
                Выберите релиз
              </option>
              {releases.map((release) => (
                <option key={release.id} value={release.id}>
                  {release.title}
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={forecastPending}
              className="w-fit border border-transparent bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90 disabled:opacity-60"
            >
              {forecastPending ? "Считаю..." : "Построить прогноз"}
            </button>

            <ResultBlock state={forecastState} />
          </div>
        </form>

        <form action={mailingAction} className="border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-medium">Черновик Telegram-рассылки</h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              Готовит текст для анонса, постоплаты, доставки или напоминания.
            </p>

            <select
              name="releaseId"
              defaultValue=""
              className="border border-[var(--border)] bg-transparent px-4 py-3 outline-none"
            >
              <option value="" disabled>
                Выберите релиз
              </option>
              {releases.map((release) => (
                <option key={release.id} value={release.id}>
                  {release.title}
                </option>
              ))}
            </select>

            <select
              name="purpose"
              defaultValue="reminder"
              className="border border-[var(--border)] bg-transparent px-4 py-3 outline-none"
            >
              <option value="preorder">Анонс / предзаказ</option>
              <option value="final">Открытие постоплаты</option>
              <option value="delivery">Открытие доставки</option>
              <option value="reminder">Напоминание</option>
            </select>

            <select
              name="tone"
              defaultValue="friendly"
              className="border border-[var(--border)] bg-transparent px-4 py-3 outline-none"
            >
              <option value="friendly">Дружелюбный</option>
              <option value="neutral">Спокойный</option>
              <option value="urgent">Мягко срочный</option>
            </select>

            <button
              type="submit"
              disabled={mailingPending}
              className="w-fit border border-transparent bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90 disabled:opacity-60"
            >
              {mailingPending ? "Генерирую..." : "Сделать черновик"}
            </button>

            <ResultBlock state={mailingState} />
          </div>
        </form>
      </div>

      <section className="border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-medium">Что понадобится от вас</h2>
        <div className="mt-4 grid gap-2 text-sm text-[var(--muted-foreground)]">
          <p>1. Установить Ollama на Mac.</p>
          <p>2. Выполнить `ollama pull qwen2.5:7b`.</p>
          <p>3. Держать Ollama запущенным во время работы админки.</p>
        </div>
      </section>
    </div>
  );
}
