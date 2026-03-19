import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Info } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function EditSalePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return (
    <div className="p-6 lg:p-8 max-w-lg space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Edit Sale</h1>
      <div className="gold-panel p-6 space-y-4">
        <div className="flex items-start gap-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'hsl(var(--primary))' }} />
          <p className="text-sm">
            Sale details cannot be modified after creation. Payment terms, buyer info, and device assignment are locked once a sale is created to maintain financial integrity.
          </p>
        </div>
        <Link href={`/agent/sales/${id}`} className="btn btn-primary w-full justify-center">
          ← Back to Sale
        </Link>
      </div>
    </div>
  )
}
