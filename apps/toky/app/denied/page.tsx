import { TriangleAlertIcon } from 'lucide-react'
import { auth } from '@/auth'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { getTokyConfig } from '@/src/tokens/config'
import { SignOutButton } from '../sign-out-button'

export default async function DeniedPage() {
  const session = await auth()
  const login = session?.user.login
  const { repo, team } = await getTokyConfig()
  const teamUrl = `https://github.com/orgs/${repo.owner}/teams/${team}`

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
        <Alert variant="destructive" className="text-left">
          <TriangleAlertIcon />
          <AlertTitle>Access denied</AlertTitle>
          <AlertDescription>
            {login ? `${login} isn't` : "You aren't"} a member of the{' '}
            <a href={teamUrl} target="_blank" rel="noreferrer" className="underline">
              <code>{team}</code> team
            </a>
            , which Toky requires for access.
          </AlertDescription>
        </Alert>
        <p className="text-sm text-muted-foreground">
          If you believe this is a mistake, ask a team maintainer to add you to the{' '}
          <a href={teamUrl} target="_blank" rel="noreferrer" className="underline">
            <code>{team}</code> team
          </a>
          .
        </p>
        {session && <SignOutButton />}
      </div>
    </main>
  )
}
