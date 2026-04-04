import { AxiosError } from 'axios';

type ApiErrorBody = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

function extractApiMessage(body?: ApiErrorBody): string | undefined {
  if (!body) return undefined;
  if (Array.isArray(body.message)) {
    const joined = body.message.filter(Boolean).join('. ');
    return joined || undefined;
  }
  if (typeof body.message === 'string' && body.message.trim()) {
    return body.message;
  }
  if (typeof body.error === 'string' && body.error.trim()) {
    return body.error;
  }
  return undefined;
}

export function getBookingErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const apiMessage = extractApiMessage(error.response?.data as ApiErrorBody | undefined);

    if (apiMessage) {
      return apiMessage;
    }

    if (status === 400) {
      return 'Invalid booking details. Please review your dates, guests, and inputs.';
    }
    if (status === 401) {
      return 'Please sign in to complete your booking.';
    }
    if (status === 403) {
      return 'You are not allowed to perform this booking action.';
    }
    if (status === 404) {
      return 'This listing is no longer available or the booking route is missing.';
    }
    if (status === 409) {
      return 'This booking conflicts with current availability. Please choose different dates.';
    }
    if (status !== undefined && status >= 500) {
      return 'Server error while processing booking. Please try again in a moment.';
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}
