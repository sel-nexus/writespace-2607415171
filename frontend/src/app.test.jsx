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

  it('shows the not-found page for an unknown route', () => {
    render(
      <MemoryRouter initialEntries={['/this-route-does-not-exist']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByText((content, element) => (
      element.tagName === 'P'
      && element.textContent === 'There is no WriteSpace page at /this-route-does-not-exist.'
    ))).toBeInTheDocument();
  });
});
