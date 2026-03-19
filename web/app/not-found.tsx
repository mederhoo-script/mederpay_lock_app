import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-8 text-center"
      style={{ background: 'hsl(var(--background))' }}
    >
      <div className="gold-panel p-10 max-w-md w-full space-y-6">
        <div>
          <p className="text-7xl font-black font-mono" style={{ color: 'hsl(var(--primary))' }}>
            404
          </p>
          <h1 className="text-2xl font-bold mt-3" style={{ color: 'hsl(var(--foreground))' }}>
            Page not found
          </h1>
          <p className="text-sm mt-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
            The page you are looking for does not exist or has been moved.
          </p>
        </div>
        <Link href="/login" className="btn btn-primary w-full justify-center">
          Go to Login
        </Link>
      </div>
    </div>
  )
}
