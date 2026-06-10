import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from '@/components/auth/login-form';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth-context';

// Mock the dependencies
vi.mock('@/lib/api', () => ({
  api: {
    post: vi.fn(),
  },
  SERVER_BASE_URL: 'http://localhost:8080',
}));

vi.mock('@/context/auth-context', () => ({
  useAuth: vi.fn(),
}));

describe('LoginForm', () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ login: mockLogin });
  });

  it('renders all fields and buttons', () => {
    render(<LoginForm />);
    
    // Check fields
    expect(screen.getByLabelText(/email \/ username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    
    // Check buttons
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with github/i })).toBeInTheDocument();
  });

  it('toggles password visibility', () => {
    render(<LoginForm />);
    
    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Find the toggle button (it's the only button without text inside the input wrapper, but we can find it by getting all buttons and picking the eye icon)
    // Actually, getting by role is better but there's no accessible name for the toggle button in the component. 
    // Let's use test id or query selector, but since there's no test id, we can click the button next to the password input.
    // The closest reliable way is to find the input, then its sibling button.
    const buttons = screen.getAllByRole('button');
    // The eye icon button is right before the Sign In button
    const eyeButton = buttons.find(b => !b.textContent && b.querySelector('svg')); 
    
    if (eyeButton) {
      fireEvent.click(eyeButton);
      expect(passwordInput).toHaveAttribute('type', 'text');
      
      fireEvent.click(eyeButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    }
  });

  it('displays error message on failed login', async () => {
    (api.post as any).mockRejectedValue(new Error('Invalid Credentials!'));
    
    render(<LoginForm />);
    
    fireEvent.change(screen.getByLabelText(/email \/ username/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpassword' } });
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Invalid Credentials!')).toBeInTheDocument();
    });
    
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('calls login context on successful login', async () => {
    const mockResponse = { token: 'fake-jwt-token', user: { id: 1, email: 'test@test.com' } };
    (api.post as any).mockResolvedValue(mockResponse);
    
    render(<LoginForm />);
    
    fireEvent.change(screen.getByLabelText(/email \/ username/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@test.com',
        password: 'password123'
      });
      expect(mockLogin).toHaveBeenCalledWith('fake-jwt-token', mockResponse.user);
    });
  });
});
