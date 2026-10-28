import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App.jsx';

describe('WriteSpace application shell', () => {
  it('renders the product name and local writing description', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'A home for your words.' })).toBeInTheDocument();
    expect(screen.getByText(/stored in this browser/i)).toBeInTheDocument();
  });
});
