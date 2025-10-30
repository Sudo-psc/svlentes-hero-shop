// Force dynamic rendering for authentication pages
// These pages use Firebase authentication context
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
