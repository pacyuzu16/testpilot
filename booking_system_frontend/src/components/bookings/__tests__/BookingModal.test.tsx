import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookingModal } from '../BookingModal';
import { UserProvider } from '../../../hooks/useUser';
import type { Flight } from '../../../types';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock the api module
vi.mock('../../../services/api', () => ({
  bookFlight: vi.fn(),
  isErrorResponse: vi.fn(),
}));

import toast from 'react-hot-toast';
import { bookFlight, isErrorResponse } from '../../../services/api';

const mockFlight: Flight = {
  flight_id: 1,
  origin: 'Earth',
  destination: 'Mars',
  departure_time: '2099-01-01T09:00:00Z',
  arrival_time: '2099-01-01T17:00:00Z',
  price: 1000000,
  seats_available: 5,
};

const mockUser = { user_id: 1, name: 'Alice', email: 'alice@example.com' };

// Helper to render BookingModal inside a UserProvider with a given user pre-loaded
const renderWithUser = (user: typeof mockUser | null, props = {}) => {
  if (user) {
    localStorage.setItem('galaxium_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('galaxium_user');
  }
  return render(
    <UserProvider>
      <BookingModal
        isOpen={true}
        onClose={vi.fn()}
        flight={mockFlight}
        onSuccess={vi.fn()}
        {...props}
      />
    </UserProvider>
  );
};

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  vi.mocked(isErrorResponse).mockReturnValue(false);
});

describe('BookingModal', () => {
  it('renders null when flight prop is null', () => {
    const { container } = render(
      <UserProvider>
        <BookingModal isOpen={true} onClose={vi.fn()} flight={null} onSuccess={vi.fn()} />
      </UserProvider>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders flight route in the modal title area', () => {
    renderWithUser(mockUser);
    expect(screen.getByText('Earth → Mars')).toBeInTheDocument();
  });

  it('renders passenger info when user is logged in', () => {
    renderWithUser(mockUser);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
  });

  it('renders formatted price', () => {
    renderWithUser(mockUser);
    expect(screen.getByText('$1,000,000')).toBeInTheDocument();
  });

  it('shows error toast and does not call bookFlight when no user is logged in', async () => {
    const user = userEvent.setup();
    renderWithUser(null);
    await user.click(screen.getByRole('button', { name: 'Confirm Booking' }));
    expect(toast.error).toHaveBeenCalledWith('Please sign in to book a flight');
    expect(bookFlight).not.toHaveBeenCalled();
  });

  it('calls bookFlight with correct payload on confirm', async () => {
    const mockBooking = {
      booking_id: 1, user_id: 1, flight_id: 1,
      status: 'booked' as const, booking_time: '2099-01-01T10:00:00Z',
    };
    vi.mocked(bookFlight).mockResolvedValueOnce(mockBooking);
    vi.mocked(isErrorResponse).mockReturnValue(false);

    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const onClose = vi.fn();
    localStorage.setItem('galaxium_user', JSON.stringify(mockUser));
    render(
      <UserProvider>
        <BookingModal isOpen={true} onClose={onClose} flight={mockFlight} onSuccess={onSuccess} />
      </UserProvider>
    );

    await user.click(screen.getByRole('button', { name: 'Confirm Booking' }));

    expect(bookFlight).toHaveBeenCalledWith({
      user_id: 1,
      name: 'Alice',
      flight_id: 1,
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Flight booked successfully!');
      expect(onSuccess).toHaveBeenCalledOnce();
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  it('shows error toast when bookFlight returns an ErrorResponse', async () => {
    const errorResp = { success: false as const, error: 'No seats', error_code: 'NO_SEATS_AVAILABLE', details: 'Flight is full' };
    vi.mocked(bookFlight).mockResolvedValueOnce(errorResp);
    vi.mocked(isErrorResponse).mockReturnValue(true);

    const user = userEvent.setup();
    renderWithUser(mockUser);

    await user.click(screen.getByRole('button', { name: 'Confirm Booking' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Flight is full');
    });
  });

  it('shows error toast when bookFlight throws', async () => {
    vi.mocked(bookFlight).mockRejectedValueOnce({ error: 'Network error', details: undefined });

    const user = userEvent.setup();
    renderWithUser(mockUser);

    await user.click(screen.getByRole('button', { name: 'Confirm Booking' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Network error');
    });
  });
});
