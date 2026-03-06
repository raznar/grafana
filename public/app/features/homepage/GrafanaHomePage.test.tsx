import { screen } from '@testing-library/react';
import { render } from 'test/test-utils';

import GrafanaHomePage from './GrafanaHomePage';

describe('GrafanaHomePage', () => {
  it('shows Windows 98 theme by default', () => {
    render(<GrafanaHomePage />);

    expect(screen.getByRole('heading', { name: 'Windows 98 edition' })).toBeInTheDocument();
  });

  it('switches between Windows Vista, macOS, and NextStep themes', async () => {
    const { user } = render(<GrafanaHomePage />);

    await user.click(screen.getByRole('button', { name: 'Windows Vista' }));
    expect(screen.getByRole('heading', { name: 'Windows Vista edition' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'macOS' }));
    expect(screen.getByRole('heading', { name: 'macOS edition' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'NextStep' }));
    expect(screen.getByRole('heading', { name: 'NextStep edition' })).toBeInTheDocument();
  });
});
