import axios from "axios";

type ApiError = Error & {
  status?: number;
  details?: unknown;
};

function getResponseMessage(data: unknown): string | undefined {
  if (typeof data !== "object" || data === null) {
    return undefined;
  }

  const message = (data as { message?: unknown }).message;

  if (Array.isArray(message)) {
    return typeof message[0] === "string" ? message[0] : undefined;
  }

  return typeof message === "string" && message.length > 0
    ? message
    : undefined;
}

export function toApiError(
  error: unknown,
  fallback = "Something went wrong",
): ApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const details = error.response?.data;
    const message = getResponseMessage(details) ?? error.message ?? fallback;

    return Object.assign(new Error(message), {
      status,
      details,
    }) as ApiError;
  }

  if (error instanceof Error) {
    return Object.assign(error, {
      status: (error as ApiError).status,
      details: (error as ApiError).details,
    });
  }

  return new Error(fallback) as ApiError;
}
