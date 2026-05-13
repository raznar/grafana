import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AccessControlAction } from 'app/types/accessControl';
import { TestProvider } from 'test/helpers/TestProvider';

import LabsPage from './LabsPage';
import { useGetFeatureMgmtQuery, useUpdateFeatureMgmtMutation } from './featureMgmtApi';
import { FeatureMgmtResponse } from './types';

jest.mock('./featureMgmtApi', () => ({
  ...jest.requireActual('./featureMgmtApi'),
  useGetFeatureMgmtQuery: jest.fn(),
  useUpdateFeatureMgmtMutation: jest.fn(),
}));

jest.mock('app/core/services/context_srv', () => ({
  contextSrv: {
    user: { orgId: 1, timezone: 'browser', weekStart: 'browser' },
    hasPermission: jest.fn(() => true),
  },
}));

const sample: FeatureMgmtResponse = {
  restartRequired: true,
  toggles: [
    {
      name: 'panelTitleSearch',
      description: 'Search for dashboards using panel title',
      stage: 'preview',
      owner: 'owner-team',
      expression: 'false',
      requiresRestart: false,
      requiresDevMode: false,
      runtimeEnabled: false,
      afterRestart: false,
      inheritedAfterRestart: false,
      hasOverride: true,
      override: false,
      readOnly: false,
      unavailable: false,
    },
    {
      name: 'configPinnedFlag',
      description: 'Set in ini',
      stage: 'GA',
      owner: 'owner',
      expression: 'true',
      requiresRestart: false,
      requiresDevMode: false,
      runtimeEnabled: true,
      afterRestart: true,
      inheritedAfterRestart: true,
      hasOverride: false,
      readOnly: true,
      unavailable: false,
    },
  ],
};

describe('LabsPage', () => {
  const contextSrv = jest.requireMock('app/core/services/context_srv').contextSrv;
  const mockedUseGet = jest.mocked(useGetFeatureMgmtQuery);
  const mockedUseMutate = jest.mocked(useUpdateFeatureMgmtMutation);

  beforeEach(() => {
    jest.clearAllMocks();
    contextSrv.hasPermission.mockReturnValue(true);
    mockedUseGet.mockReturnValue({ data: sample, isLoading: false, error: undefined });
    mockedUseMutate.mockReturnValue([
      jest.fn(() => ({ unwrap: async () => sample })),
      { reset: () => {}, isLoading: false, isSuccess: false, isError: false, error: undefined },
    ]);
  });

  it('renders restart banner and toggle groups', async () => {
    render(
      <TestProvider>
        <LabsPage />
      </TestProvider>
    );

    expect(await screen.findByText(/restart required/i)).toBeInTheDocument();
    expect(screen.getByText('panelTitleSearch')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /public preview/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /general availability/i })).toBeInTheDocument();
  });

  it('disables save when user lacks write permission', async () => {
    contextSrv.hasPermission.mockImplementation(
      (action: string) => action !== AccessControlAction.ActionFeatureManagementWrite
    );

    render(
      <TestProvider>
        <LabsPage />
      </TestProvider>
    );

    expect(await screen.findByText('panelTitleSearch')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save changes/i })).toBeDisabled();
  });

  it('submits updates when saving', async () => {
    const mutate = jest.fn(() => ({ unwrap: async () => ({ toggles: [], restartRequired: false }) }));
    mockedUseMutate.mockReturnValue([
      mutate,
      { reset: () => {}, isLoading: false, isSuccess: false, isError: false, error: undefined },
    ]);

    render(
      <TestProvider>
        <LabsPage />
      </TestProvider>
    );

    const user = userEvent.setup();
    expect(await screen.findByText('panelTitleSearch')).toBeInTheDocument();

    const switches = screen.getAllByRole('switch');
    const editableSwitch = switches.find((el) => !el.hasAttribute('disabled'));
    expect(editableSwitch).toBeDefined();
    await user.click(editableSwitch!);

    await user.click(screen.getByRole('button', { name: /save changes/i }));
    expect(mutate).toHaveBeenCalled();
  });

  it('shows empty state when filter matches nothing', async () => {
    mockedUseGet.mockReturnValue({
      data: { toggles: [], restartRequired: false },
      isLoading: false,
      error: undefined,
    });

    render(
      <TestProvider>
        <LabsPage />
      </TestProvider>
    );

    const user = userEvent.setup();
    const input = await screen.findByPlaceholderText(/filter/i);
    await user.type(input, 'zzzz-not-found');

    expect(await screen.findByText(/no feature toggles match/i)).toBeInTheDocument();
  });
});
