import { api } from '@/app/api'

export interface Session {
  user: {
    id: string
    email: string
    name: string
  }
}

interface SignInArgs {
  email: string
  password: string
}

interface SignUpArgs {
  email: string
  password: string
  name: string
}

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSession: builder.query<Session | null, void>({
      query: () => 'auth/get-session',
      providesTags: ['User'],
    }),

    signIn: builder.mutation<Session, SignInArgs>({
      query: (body) => ({
        url: 'auth/sign-in/email',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),

    signUp: builder.mutation<Session, SignUpArgs>({
      query: (body) => ({
        url: 'auth/sign-up/email',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),

    signOut: builder.mutation<void, void>({
      query: () => ({
        url: 'auth/sign-out',
        method: 'POST',
      }),
      invalidatesTags: ['User', 'Game', 'Session', 'Stats'],
    }),
  }),
})

export const {
  useGetSessionQuery,
  useSignInMutation,
  useSignUpMutation,
  useSignOutMutation,
} = authApi
