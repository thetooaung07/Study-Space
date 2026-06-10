import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// A simple dummy component to test
const Hello = () => <h1>Hello Vitest</h1>;

describe('Example Vitest', () => {
  it('renders hello component', () => {
    render(<Hello />);
    const heading = screen.getByRole('heading', { name: /hello vitest/i });
    expect(heading).toBeInTheDocument();
  });
});
