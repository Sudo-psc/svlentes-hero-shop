// Force dynamic rendering for all subscriber area pages
// These pages require authentication and use client-side context
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function AreaAssinanteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
