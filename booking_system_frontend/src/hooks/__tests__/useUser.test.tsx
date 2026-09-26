import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserProvider, useUser } from '../useUser';

// Helper component to expose context values for assertions
const TestConsumer = () => {
  const { user, setUser, logout } = useUser();
  return (
    <div>
      <span data-testid="user-name">{user?.name ?? 'null'}</span>
      <button onClick={() => setUser({ user_id: 1, name: 'Alice', email: 'alice@example.com' })}>
        Set User
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

beforeEach(() => {
  localStorage.clear();
});

describe('UserProvider', () => {
  it('starts with null user when localStorage is empty', () => {
    render(
      <UserProvider>
        <TestConsumer />
      </UserProvider>
    );
    expect(screen.getByTestId('user-name').textContent).toBe('null');
  });

  it('loads user from localStorage on mount', () => {
    const stored = { user_id: 2, name: 'Bob', email: 'bob@example.com' };
    localStorage.setItem('galaxium_user', JSON.stringify(stored));

    render(
      <UserProvider>
        <TestConsumer />
      </UserProvider>
    );
    expect(screen.getByTestId('user-name').textContent).toBe('Bob');
  });

  it('handles corrupted localStorage gracefully and starts with null', () => {
    localStorage.setItem('galaxium_user', 'not-valid-json{{{');
    render(
      <UserProvider>
        <TestConsumer />
      </UserProvider>
    );
    expect(screen.getByTestId('user-name').textContent).toBe('null');
  });

  it('setUser persists user to localStorage', async () => {
    const user = userEvent.setup();
    render(
      <UserProvider>
        <TestConsumer />
      </UserProvider>
    );

    await user.click(screen.getByRole('button', { name: 'Set User' }));

    expect(screen.getByTestId('user-name').textContent).toBe('Alice');
    const stored = JSON.parse(localStorage.getItem('galaxium_user') ?? 'null');
    expect(stored?.name).toBe('Alice');
  });

  it('logout clears user from state and localStorage', async () => {
    const stored = { user_id: 1, name: 'Alice', email: 'alice@example.com' };
    localStorage.setItem('galaxium_user', JSON.stringify(stored));

    const user = userEvent.setup();
    render(
      <UserProvider>
        <TestConsumer />
      </UserProvider>
    );

    expect(screen.getByTestId('user-name').textContent).toBe('Alice');
    await user.click(screen.getByRole('button', { name: 'Logout' }));
    expect(screen.getByTestId('user-name').textContent).toBe('null');
    expect(localStorage.getItem('galaxium_user')).toBeNull();
  });
});

describe('useUser outside provider', () => {
  it('throws an error when used outside UserProvider', () => {
    // Suppress console.error for this expected throw
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow('useUser must be used within a UserProvider');
    consoleSpy.mockRestore();
  });
});
