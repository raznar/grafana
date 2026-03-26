import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PropsWithChildren } from 'react';

const getMock = jest.fn();
const putMock = jest.fn();

jest.mock('@grafana/runtime', () => ({
  config: { bootData: { user: {}, settings: {}, navTree: [] } },
  getBackendSrv: () => ({
    get: getMock,
    put: putMock,
  }),
}));

jest.mock('app/core/components/Page/Page', () => ({
  Page: Object.assign(({ children }: PropsWithChildren<object>) => <div>{children}</div>, {
    Contents: ({ children }: PropsWithChildren<object>) => <div>{children}</div>,
  }),
}));

jest.mock('@grafana/ui', () => ({
  Alert: ({ title, children }: PropsWithChildren<{ title?: string }>) => (
    <div>
      {title && <div>{title}</div>}
      {children}
    </div>
  ),
  Badge: ({ text }: { text: string }) => <span>{text}</span>,
  FilterInput: ({
    value,
    onChange,
    placeholder,
  }: {
    value?: string;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
  }) => <input value={value} onChange={onChange} placeholder={placeholder} />,
  InlineSwitch: ({
    id,
    value,
    onChange,
    disabled,
  }: {
    id: string;
    value?: boolean;
    onChange?: () => void;
    disabled?: boolean;
  }) => <input id={id} type="checkbox" role="switch" checked={value} onChange={onChange} disabled={disabled} />,
  LinkButton: ({ children, href }: PropsWithChildren<{ href: string }>) => <a href={href}>{children}</a>,
  LoadingPlaceholder: ({ text }: { text?: string }) => <div>{text}</div>,
  Spinner: () => <span>loading</span>,
  Stack: ({ children }: PropsWithChildren<object>) => <div>{children}</div>,
  Text: ({ children, element: Element = 'div' }: PropsWithChildren<{ element?: keyof JSX.IntrinsicElements }>) => (
    <Element>{children}</Element>
  ),
  useStyles2: () =>
    ({
      toolbar: '',
      filter: '',
      list: '',
      card: '',
      cardHeader: '',
      switchWrap: '',
      meta: '',
    }) as const,
}));

import LabsPage from './LabsPage';

describe('LabsPage', () => {
  beforeEach(() => {
    getMock.mockResolvedValue({
      allowEditing: true,
      restartRequired: false,
      enabled: { panelTitleSearch: true },
      toggles: [
        {
          name: 'panelTitleSearch',
          description: 'Search for dashboards using panel title',
          stage: 'preview',
          enabled: true,
          writeable: true,
          source: { name: 'labs' },
        },
        {
          name: 'liveAPIServer',
          description: 'Registers a live apiserver',
          stage: 'experimental',
          enabled: false,
          writeable: false,
          warning: 'requires dev mode',
          source: { name: 'default' },
        },
      ],
    });
    putMock.mockResolvedValue({});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the Labs toggle list and filters entries', async () => {
    render(<LabsPage />);

    expect(await screen.findByRole('heading', { name: 'panelTitleSearch' })).toBeInTheDocument();
    expect(screen.getByText('Search for dashboards using panel title')).toBeInTheDocument();
    expect(screen.getByText('requires dev mode')).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText('Filter feature flags'), 'panel');

    expect(screen.getByRole('heading', { name: 'panelTitleSearch' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'liveAPIServer' })).not.toBeInTheDocument();
  });

  it('updates a feature flag when the switch is toggled', async () => {
    render(<LabsPage />);

    const toggle = (await screen.findByTestId('labs-toggle-panelTitleSearch')).querySelector('input[role="switch"]');
    expect(toggle).not.toBeNull();
    await userEvent.click(toggle!);

    await waitFor(() => {
      expect(putMock).toHaveBeenCalledWith('/api/admin/labs/panelTitleSearch', { enabled: false });
    });
  });
});
