import NextAuth from 'next-auth'
import type { DefaultSession } from 'next-auth'
import type {} from 'next-auth/jwt'
import GitHub from 'next-auth/providers/github'
import { shouldRecheckTeamMembershipFor, teamIdFor } from './src/auth/team-membership'
import { getTokyConfig } from './src/tokens/config'
import { isTeamMember } from './src/tokens/github-team'

declare module 'next-auth' {
  interface Session {
    user: {
      login: string
      isTeamMember: boolean
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    login?: string
    isTeamMember?: boolean
    teamCheckedAt?: number
    teamCheckedFor?: string
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  session: { strategy: 'jwt' },
  callbacks: {
    // Read-only identity from the GitHub provider (default `read:user` scope
    // — never used for writes or the team-check credential, see
    // docs/adr/0004). Team membership is re-verified whenever this callback
    // fires past TEAM_MEMBERSHIP_RECHECK_INTERVAL_MS, which bounds staleness
    // without an extra GitHub call on every request.
    async jwt({ token, profile }) {
      if (profile) {
        token.login = (profile as { login?: string }).login
        token.picture = (profile as { avatar_url?: string }).avatar_url
      }

      if (token.login) {
        const teamId = teamIdFor(await getTokyConfig())
        if (shouldRecheckTeamMembershipFor({ at: token.teamCheckedAt, teamId: token.teamCheckedFor }, teamId)) {
          token.isTeamMember = await isTeamMember(token.login)
          token.teamCheckedAt = Date.now()
          token.teamCheckedFor = teamId
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token.login) session.user.login = token.login
      session.user.isTeamMember = token.isTeamMember ?? false
      return session
    },
  },
})
