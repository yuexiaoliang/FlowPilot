export type Result<T, E> = Readonly<{ ok: true; value: T }> | Readonly<{ ok: false; error: E }>;

export function success<T>(value: T): Readonly<{ ok: true; value: T }> {
  return Object.freeze({ ok: true, value });
}

export function failure<E>(error: E): Readonly<{ ok: false; error: E }> {
  return Object.freeze({ ok: false, error });
}
