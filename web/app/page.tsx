import { notFound } from 'next/navigation'

/**
 * The root path `/` has no landing page.
 * Unauthenticated visitors and direct `/` hits always receive 404.
 * Authenticated users are sent to their role-specific dashboard by the proxy.
 */
export default function RootPage() {
  notFound()
}
