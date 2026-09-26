import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FlightCard } from '../FlightCard';
import type { Flight } from '../../../types';

// Mock framer-motion to avoid jsdom animation errors
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const baseFlight: Flight = {
  flight_id: 1,
  origin: 'Earth',
  destination: 'Mars',
  departure_time: '2099-01-01T09:00:00Z',
  arrival_time: '2099-01-01T17:00:00Z',
  price: 1000000,
  seats_available: 5,
};

describe('FlightCard', () => {
  it('renders origin and destination', () => {
    render(<FlightCard flight={baseFlight} onBook={vi.fn()} />);
    expect(screen.getByText('Earth → Mars')).toBeInTheDocument();
  });

  it('renders the flight ID', () => {
    render(<FlightCard flight={baseFlight} onBook={vi.fn()} />);
    expect(screen.getByText('Flight #1')).toBeInTheDocument();
  });

  it('shows available seat count for normal availability', () => {
    render(<FlightCard flight={baseFlight} onBook={vi.fn()} />);
    expect(screen.getByText('5 seats available')).toBeInTheDocument();
  });

  it('shows "Book Now" button when seats are available', () => {
    render(<FlightCard flight={baseFlight} onBook={vi.fn()} />);
    const button = screen.getByRole('button', { name: 'Book Now' });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('shows "Sold Out" and disables button when seats_available is 0', () => {
    render(<FlightCard flight={{ ...baseFlight, seats_available: 0 }} onBook={vi.fn()} />);
    // Both the seats label and the button render "Sold Out", so use getAllByText
    expect(screen.getAllByText('Sold Out').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: 'Sold Out' })).toBeDisabled();
  });

  it('calls onBook with the flight when Book Now is clicked', async () => {
    const onBook = vi.fn();
    const user = userEvent.setup();
    render(<FlightCard flight={baseFlight} onBook={onBook} />);
    await user.click(screen.getByRole('button', { name: 'Book Now' }));
    expect(onBook).toHaveBeenCalledOnce();
    expect(onBook).toHaveBeenCalledWith(baseFlight);
  });

  it('does not call onBook when sold out button is clicked', async () => {
    const onBook = vi.fn();
    const user = userEvent.setup();
    render(<FlightCard flight={{ ...baseFlight, seats_available: 0 }} onBook={onBook} />);
    await user.click(screen.getByRole('button', { name: 'Sold Out' }));
    expect(onBook).not.toHaveBeenCalled();
  });

  it('renders price with currency formatting', () => {
    render(<FlightCard flight={baseFlight} onBook={vi.fn()} />);
    expect(screen.getByText('$1,000,000')).toBeInTheDocument();
  });
});
