import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { Role } from '@grimoire/shared'
import { ProtectedRoute } from '@/shared/components/ProtectedRoute/ProtectedRoute'
import { AdminRoute } from '@/shared/components/ProtectedRoute/AdminRoute'
import { MustChangePasswordRoute } from '@/shared/components/ProtectedRoute/MustChangePasswordRoute'

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@/features/auth/authApi', () => ({
  useGetSessionQuery: vi.fn(),
}))

vi.mock('@/shared/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid='skeleton' className={className} />
  ),
}))

import { useGetSessionQuery } from '@/features/auth/authApi'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type SessionData = {
  user: {
    id: string
    email: string
    name: string
    role: Role
    mustChangePassword: boolean
    aiEnabled: boolean
    aiRequestsLimit: number | null
  }
}

function mockSession(overrides: Partial<SessionData['user']> = {}) {
  return {
    user: {
      id: '1',
      email: 'user@example.com',
      name: 'User',
      role: Role.USER,
      mustChangePassword: false,
      aiEnabled: true,
      aiRequestsLimit: null,
      ...overrides,
    },
  }
}

function renderWithRoutes(
  guardElement: React.ReactElement,
  initialEntry = '/',
) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path='/login' element={<div>Login Page</div>} />
        <Route path='/change-password' element={<div>Change Password Page</div>} />
        <Route path='/' element={<div>Home Page</div>} />
        <Route element={guardElement}>
          <Route path='/protected' element={<div>Protected Content</div>} />
          <Route path='/admin/dashboard' element={<div>Admin Dashboard</div>} />
          <Route path='/must-change' element={<div>Must Change Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

// ---------------------------------------------------------------------------
// ProtectedRoute
// ---------------------------------------------------------------------------

describe('ProtectedRoute', () => {
  it('renders loading skeletons while session is loading', () => {
    vi.mocked(useGetSessionQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as unknown as ReturnType<typeof useGetSessionQuery>)

    renderWithRoutes(<ProtectedRoute />, '/protected')

    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0)
  })

  it('redirects to /login when there is no session', () => {
    vi.mocked(useGetSessionQuery).mockReturnValue({
      data: null,
      isLoading: false,
    } as unknown as ReturnType<typeof useGetSessionQuery>)

    renderWithRoutes(<ProtectedRoute />, '/protected')

    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('redirects to /change-password when mustChangePassword is true', () => {
    vi.mocked(useGetSessionQuery).mockReturnValue({
      data: mockSession({ mustChangePassword: true }),
      isLoading: false,
    } as unknown as ReturnType<typeof useGetSessionQuery>)

    renderWithRoutes(<ProtectedRoute />, '/protected')

    expect(screen.getByText('Change Password Page')).toBeInTheDocument()
  })

  it('renders the outlet when session is valid', () => {
    vi.mocked(useGetSessionQuery).mockReturnValue({
      data: mockSession(),
      isLoading: false,
    } as unknown as ReturnType<typeof useGetSessionQuery>)

    renderWithRoutes(<ProtectedRoute />, '/protected')

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// AdminRoute
// ---------------------------------------------------------------------------

describe('AdminRoute', () => {
  it('redirects to /login when there is no session', () => {
    vi.mocked(useGetSessionQuery).mockReturnValue({
      data: null,
      isLoading: false,
    } as unknown as ReturnType<typeof useGetSessionQuery>)

    renderWithRoutes(<AdminRoute />, '/admin/dashboard')

    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('redirects to / when the user is not an admin', () => {
    vi.mocked(useGetSessionQuery).mockReturnValue({
      data: mockSession({ role: Role.USER }),
      isLoading: false,
    } as unknown as ReturnType<typeof useGetSessionQuery>)

    renderWithRoutes(<AdminRoute />, '/admin/dashboard')

    expect(screen.getByText('Home Page')).toBeInTheDocument()
  })

  it('renders the outlet when the user is an admin', () => {
    vi.mocked(useGetSessionQuery).mockReturnValue({
      data: mockSession({ role: Role.ADMIN }),
      isLoading: false,
    } as unknown as ReturnType<typeof useGetSessionQuery>)

    renderWithRoutes(<AdminRoute />, '/admin/dashboard')

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
  })

  it('renders loading skeletons while session is loading', () => {
    vi.mocked(useGetSessionQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as unknown as ReturnType<typeof useGetSessionQuery>)

    renderWithRoutes(<AdminRoute />, '/admin/dashboard')

    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// MustChangePasswordRoute
// ---------------------------------------------------------------------------

describe('MustChangePasswordRoute', () => {
  it('redirects to /login when there is no session', () => {
    vi.mocked(useGetSessionQuery).mockReturnValue({
      data: null,
      isLoading: false,
    } as unknown as ReturnType<typeof useGetSessionQuery>)

    renderWithRoutes(<MustChangePasswordRoute />, '/must-change')

    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('redirects to / when mustChangePassword is false', () => {
    vi.mocked(useGetSessionQuery).mockReturnValue({
      data: mockSession({ mustChangePassword: false }),
      isLoading: false,
    } as unknown as ReturnType<typeof useGetSessionQuery>)

    renderWithRoutes(<MustChangePasswordRoute />, '/must-change')

    expect(screen.getByText('Home Page')).toBeInTheDocument()
  })

  it('renders the outlet when mustChangePassword is true', () => {
    vi.mocked(useGetSessionQuery).mockReturnValue({
      data: mockSession({ mustChangePassword: true }),
      isLoading: false,
    } as unknown as ReturnType<typeof useGetSessionQuery>)

    renderWithRoutes(<MustChangePasswordRoute />, '/must-change')

    expect(screen.getByText('Must Change Content')).toBeInTheDocument()
  })

  it('renders loading skeletons while session is loading', () => {
    vi.mocked(useGetSessionQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as unknown as ReturnType<typeof useGetSessionQuery>)

    renderWithRoutes(<MustChangePasswordRoute />, '/must-change')

    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0)
  })
})
