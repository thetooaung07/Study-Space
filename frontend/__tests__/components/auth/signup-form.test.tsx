import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SignupForm } from '@/components/auth/signup-form';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth-context';

// Mock dependencies
vi.mock('@/lib/api', () => ({
  api: {
    post: vi.fn(),
  },
  SERVER_BASE_URL: 'http://localhost:8080',
}));

vi.mock('@/context/auth-context', () => ({
  useAuth: vi.fn(),
}));

describe('SignupForm', () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ login: mockLogin });
  });

  it('renders all signup fields', () => {
    render(<SignupForm />);
    
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('shows error if passwords do not match', async () => {
    render(<SignupForm />);
    
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'johndoe' } });
    fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'different123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
    
    expect(api.post).not.toHaveBeenCalled();
  });

  it('submits form successfully when passwords match', async () => {
    const mockResponse = { token: 'new-fake-token', user: { id: 2, username: 'johndoe' } };
    (api.post as any).mockResolvedValue(mockResponse);
    
    render(<SignupForm />);
    
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'johndoe' } });
    fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/register', {
        fullName: 'John Doe',
        username: 'johndoe',
        email: 'john@example.com',
        password: 'password123'
      });
      expect(mockLogin).toHaveBeenCalledWith('new-fake-token', mockResponse.user);
    });
  });
});
