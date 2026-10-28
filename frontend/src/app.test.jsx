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

    expect(screen.getByRole('heading', { name: 'WriteSpace' })).toBeInTheDocument();
    expect(screen.getByText('Your thoughts. Your space. Beautifully simple.')).toBeInTheDocument();
    expect(screen.getByText('A quiet, local place to read and publish plain-text writing, stored only in this browser.')).toBeInTheDocument();
  });
});
