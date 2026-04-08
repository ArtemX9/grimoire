import { Plan, Role } from '@grimoire/shared';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import type { AdminUserRow } from '@/api/adminApi';
import { UserRow } from '@/pages/AdminDashboardPage/components/UserRow/UserRow';

// ---------------------------------------------------------------------------
// JSDOM polyfills required by Radix UI
// Radix's pointer-events internals call `hasPointerCapture` / `releasePointerCapture`
// which are not implemented in JSDOM. Without these stubs the Select component
// throws on open.
// ---------------------------------------------------------------------------

beforeAll(() => {
  if (!HTMLElement.prototype.hasPointerCapture) {
    HTMLElement.prototype.hasPointerCapture = () => false;
  }
  if (!HTMLElement.prototype.setPointerCapture) {
    HTMLElement.prototype.setPointerCapture = () => undefined;
  }
  if (!HTMLElement.prototype.releasePointerCapture) {
    HTMLElement.prototype.releasePointerCapture = () => undefined;
  }
  // Radix Select's SelectContentImpl calls scrollIntoView on the active item
  // when the listbox opens; JSDOM does not implement this method.
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => undefined;
  }
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUser(overrides: Partial<AdminUserRow> = {}): AdminUserRow {
  return {
    id: 'user-1',
    email: 'alice@grimoire.app',
    name: 'Alice',
    role: Role.USER,
    plan: Plan.FREE,
    mustChangePassword: false,
    aiEnabled: true,
    aiRequestsUsed: 0,
    aiRequestsLimit: 10,
    gamesCount: 5,
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

interface RowProps {
  user: AdminUserRow;
  globalAiEnabled: boolean;
  isSelf: boolean;
  onDelete: (id: string) => void;
  onAiEnabledChange: (id: string, enabled: boolean) => void;
  onAiLimitChange: (id: string, limit: number | null) => void;
  onPlanChange: (id: string, plan: string) => void;
  onRoleChange: (userID: string, role: Role) => void;
}

const defaultProps: RowProps = {
  user: makeUser(),
  globalAiEnabled: true,
  isSelf: false,
  onDelete: vi.fn(),
  onAiEnabledChange: vi.fn(),
  onAiLimitChange: vi.fn(),
  onPlanChange: vi.fn(),
  onRoleChange: vi.fn(),
};

/**
 * UserRow must be wrapped in <table><tbody> to satisfy HTML table semantics
 * and avoid JSDOM warnings about invalid nesting.
 */
function renderRow(overrides: Partial<RowProps> = {}) {
  const props = { ...defaultProps, ...overrides };
  return render(
    <table>
      <tbody>
        <UserRow {...props} />
      </tbody>
    </table>,
  );
}

/**
 * The role Select is always the FIRST combobox in the row.
 * The plan Select is always the SECOND combobox.
 * Radix Select does not expose an accessible name on the trigger button when
 * no <label> is associated, so we address them positionally.
 */
function getRoleCombobox() {
  return screen.getAllByRole('combobox')[0];
}

function getPlanCombobox() {
  return screen.getAllByRole('combobox')[1];
}

// ---------------------------------------------------------------------------
// Tests — role Select rendering
// ---------------------------------------------------------------------------

describe('UserRow — role Select rendering', () => {
  it('renders two comboboxes: one for role and one for plan', () => {
    renderRow();

    expect(screen.getAllByRole('combobox')).toHaveLength(2);
  });

  it('displays the current USER role as the selected value', () => {
    renderRow({ user: makeUser({ role: Role.USER }) });

    expect(within(getRoleCombobox()).getByText(Role.USER)).toBeInTheDocument();
  });

  it('displays the current ADMIN role as the selected value', () => {
    renderRow({ user: makeUser({ role: Role.ADMIN }) });

    expect(within(getRoleCombobox()).getByText(Role.ADMIN)).toBeInTheDocument();
  });

  it('the role combobox is enabled when isSelf is false', () => {
    renderRow({ isSelf: false });

    expect(getRoleCombobox()).not.toBeDisabled();
  });

  it('the role combobox is disabled when isSelf is true', () => {
    renderRow({ isSelf: true });

    expect(getRoleCombobox()).toBeDisabled();
  });

  it('renders all available role options when the listbox is opened', async () => {
    renderRow({ user: makeUser({ role: Role.USER }), isSelf: false });

    await userEvent.click(getRoleCombobox());

    expect(screen.getByRole('option', { name: Role.USER })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: Role.ADMIN })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Tests — role Select interaction
// ---------------------------------------------------------------------------

describe('UserRow — role Select interaction', () => {
  it('calls onRoleChange with the correct userID and ADMIN role', async () => {
    const onRoleChange = vi.fn();
    renderRow({ user: makeUser({ id: 'user-1', role: Role.USER }), onRoleChange });

    await userEvent.click(getRoleCombobox());
    await userEvent.click(screen.getByRole('option', { name: Role.ADMIN }));

    expect(onRoleChange).toHaveBeenCalledOnce();
    expect(onRoleChange).toHaveBeenCalledWith('user-1', Role.ADMIN);
  });

  it('calls onRoleChange with the correct userID and USER role when demoting an admin', async () => {
    const onRoleChange = vi.fn();
    renderRow({ user: makeUser({ id: 'user-42', role: Role.ADMIN }), onRoleChange });

    await userEvent.click(getRoleCombobox());
    await userEvent.click(screen.getByRole('option', { name: Role.USER }));

    expect(onRoleChange).toHaveBeenCalledOnce();
    expect(onRoleChange).toHaveBeenCalledWith('user-42', Role.USER);
  });

  it('does not call onRoleChange when isSelf is true', async () => {
    const onRoleChange = vi.fn();
    renderRow({ user: makeUser({ role: Role.USER }), isSelf: true, onRoleChange });

    // Disabled elements ignore click events — the listbox must not open
    await userEvent.click(getRoleCombobox());

    expect(screen.queryByRole('option')).not.toBeInTheDocument();
    expect(onRoleChange).not.toHaveBeenCalled();
  });

  it('passes a Role enum value, not an arbitrary string', async () => {
    const onRoleChange = vi.fn();
    renderRow({ user: makeUser({ id: 'user-99', role: Role.USER }), onRoleChange });

    await userEvent.click(getRoleCombobox());
    await userEvent.click(screen.getByRole('option', { name: Role.ADMIN }));

    const [, calledRole] = onRoleChange.mock.calls[0] as [string, Role];
    expect(Object.values(Role)).toContain(calledRole);
  });
});

// ---------------------------------------------------------------------------
// Tests — isSelf isolation — only the role combobox is affected
// ---------------------------------------------------------------------------

describe('UserRow — isSelf does not affect other cells', () => {
  it('still renders the user name and email when isSelf is true', () => {
    renderRow({ user: makeUser({ name: 'Alice', email: 'alice@grimoire.app' }), isSelf: true });

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('alice@grimoire.app')).toBeInTheDocument();
  });

  it('the plan combobox is not disabled when isSelf is true (only role is)', () => {
    renderRow({ user: makeUser({ role: Role.USER }), isSelf: true });

    expect(getRoleCombobox()).toBeDisabled();
    expect(getPlanCombobox()).not.toBeDisabled();
  });

  it('the plan combobox is disabled for an ADMIN user regardless of isSelf', () => {
    // UserRow disables plan when role === ADMIN (see production code)
    renderRow({ user: makeUser({ role: Role.ADMIN }), isSelf: false });

    expect(getPlanCombobox()).toBeDisabled();
  });
});
