export class ValidationError extends Error {
  constructor(message: string) { super(message); this.name = "ValidationError"; }
}

export class NotFoundError extends Error {
  constructor(message: string) { super(message); this.name = "NotFoundError"; }
}

export function handleError(error: unknown): Response {
  console.error("[API Error]", error);

  if (error instanceof ValidationError) {
    return Response.json({ ok: false, error: error.message }, { status: 400 });
  }
  if (error instanceof NotFoundError) {
    return Response.json({ ok: false, error: error.message }, { status: 404 });
  }
  return Response.json(
    { ok: false, error: "An internal error occurred. Please try again." },
    { status: 500 },
  );
}
