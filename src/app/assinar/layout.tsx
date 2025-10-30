// Force dynamic rendering for subscription flow
// Uses authentication context and dynamic pricing
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function AssinarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
