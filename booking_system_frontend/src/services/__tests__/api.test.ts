import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isErrorResponse,
  getFlights,
  registerUser,
  getUserByCredentials,
  bookFlight,
  getUserBookings,
  cancelBooking,
  healthCheck,
} from '../api';

// Mock the entire axios module
vi.mock('axios', () => {
  const mockAxios = {
    create: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      response: { use: vi.fn() },
    },
  };
  mockAxios.create.mockReturnValue(mockAxios);
  return { default: mockAxios };
});

// Re-import api after mock to get the instance
import api from '../api';

const mockFlight = {
  flight_id: 1,
  origin: 'Earth',
  destination: 'Mars',
  departure_time: '2099-01-01T09:00:00Z',
  arrival_time: '2099-01-01T17:00:00Z',
  price: 1000000,
  seats_available: 5,
};

const mockUser = { user_id: 1, name: 'Alice', email: 'alice@example.com' };
const mockBooking = {
  booking_id: 1,
  user_id: 1,
  flight_id: 1,
  status: 'booked' as const,
  booking_time: '2099-01-01T10:00:00Z',
};
const mockError = { success: false as const, error: 'Not found', error_code: 'NOT_FOUND' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('isErrorResponse', () => {
  it('returns true when success is false', () => {
    expect(isErrorResponse({ success: false, error: 'e', error_code: 'E' })).toBe(true);
  });

  it('returns false for a valid User object', () => {
    expect(isErrorResponse(mockUser)).toBe(false);
  });

  it('returns false for null', () => {
    expect(isErrorResponse(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isErrorResponse(undefined)).toBe(false);
  });
});

describe('getFlights', () => {
  it('returns flight array on success', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: [mockFlight] });
    const result = await getFlights();
    expect(result).toEqual([mockFlight]);
    expect(api.get).toHaveBeenCalledWith('/flights');
  });
});

describe('registerUser', () => {
  it('returns user on success', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: mockUser });
    const result = await registerUser({ name: 'Alice', email: 'alice@example.com' });
    expect(result).toEqual(mockUser);
    expect(api.post).toHaveBeenCalledWith('/register', { name: 'Alice', email: 'alice@example.com' });
  });

  it('returns ErrorResponse on duplicate email', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: mockError });
    const result = await registerUser({ name: 'Alice', email: 'alice@example.com' });
    expect(result).toEqual(mockError);
  });
});

describe('getUserByCredentials', () => {
  it('returns user on success', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockUser });
    const result = await getUserByCredentials('Alice', 'alice@example.com');
    expect(result).toEqual(mockUser);
    expect(api.get).toHaveBeenCalledWith('/user', { params: { name: 'Alice', email: 'alice@example.com' } });
  });
});

describe('bookFlight', () => {
  it('returns booking on success', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: mockBooking });
    const result = await bookFlight({ user_id: 1, name: 'Alice', flight_id: 1 });
    expect(result).toEqual(mockBooking);
    expect(api.post).toHaveBeenCalledWith('/book', { user_id: 1, name: 'Alice', flight_id: 1 });
  });

  it('returns ErrorResponse when booking fails', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: mockError });
    const result = await bookFlight({ user_id: 1, name: 'Alice', flight_id: 99 });
    expect(result).toEqual(mockError);
  });
});

describe('getUserBookings', () => {
  it('returns bookings array for a user', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: [mockBooking] });
    const result = await getUserBookings(1);
    expect(result).toEqual([mockBooking]);
    expect(api.get).toHaveBeenCalledWith('/bookings/1');
  });

  it('returns empty array when user has no bookings', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: [] });
    const result = await getUserBookings(99);
    expect(result).toEqual([]);
  });
});

describe('cancelBooking', () => {
  it('returns cancelled booking on success', async () => {
    const cancelled = { ...mockBooking, status: 'cancelled' as const };
    vi.mocked(api.post).mockResolvedValueOnce({ data: cancelled });
    const result = await cancelBooking(1);
    expect(result).toEqual(cancelled);
    expect(api.post).toHaveBeenCalledWith('/cancel/1');
  });

  it('returns ErrorResponse when booking not found', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: mockError });
    const result = await cancelBooking(999);
    expect(result).toEqual(mockError);
  });
});

describe('healthCheck', () => {
  it('returns status OK', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { status: 'OK' } });
    const result = await healthCheck();
    expect(result).toEqual({ status: 'OK' });
  });
});
