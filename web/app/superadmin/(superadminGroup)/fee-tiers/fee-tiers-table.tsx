'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatNaira } from '@/lib/utils'
import { nairaToKobo } from '@/lib/utils'

interface FeeTier {
  id: string
  label: string
  min_price: number
  max_price: number | null
  fee_amount: number
}

interface FeeTiersTableProps {
  tiers: FeeTier[]
}

function EditableRow({ tier, onDone }: { tier: FeeTier; onDone: () => void }) {
  const [label, setLabel] = useState(tier.label)
  const [feeNaira, setFeeNaira] = useState(String(tier.fee_amount / 100))
  const [isPending, startTransition] = useTransition()

  const save = async () => {
    const supabase = createClient()
    const { error } = await supabase
      .from('fee_tiers')
      .update({ label, fee_amount: nairaToKobo(parseFloat(feeNaira) || 0) })
      .eq('id', tier.id)
    if (error) {
      toast.error('Failed to update tier')
    } else {
      toast.success('Fee tier updated')
      startTransition(onDone)
    }
  }

  return (
    <tr className="bg-[#0070F3]/5">
      <td className="px-4 py-3">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="w-full rounded bg-white/10 border border-white/20 px-2 py-1 text-sm text-white focus:outline-none focus:border-[#0070F3]"
        />
      </td>
      <td className="px-4 py-3 text-white/50">{formatNaira(tier.min_price)}</td>
      <td className="px-4 py-3 text-white/50">{tier.max_price ? formatNaira(tier.max_price) : '∞'}</td>
      <td className="px-4 py-3">
        <input
          value={feeNaira}
          onChange={(e) => setFeeNaira(e.target.value)}
          type="number"
          className="w-28 rounded bg-white/10 border border-white/20 px-2 py-1 text-sm text-white focus:outline-none focus:border-[#0070F3]"
          placeholder="Fee (₦)"
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={isPending}
            className="px-3 py-1 text-xs font-medium rounded bg-[#0070F3]/20 text-[#0070F3] hover:bg-[#0070F3]/30 transition-colors disabled:opacity-50"
          >
            Save
          </button>
          <button
            onClick={onDone}
            className="px-3 py-1 text-xs font-medium rounded bg-white/10 text-white/60 hover:bg-white/20 transition-colors"
          >
            Cancel
          </button>
        </div>
      </td>
    </tr>
  )
}

export function FeeTiersTable({ tiers }: FeeTiersTableProps) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)

  return (
    <div className="rounded-xl border border-white/10 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/5">
            <th className="px-4 py-3 text-left font-medium text-white/50">Label</th>
            <th className="px-4 py-3 text-left font-medium text-white/50">Min Price</th>
            <th className="px-4 py-3 text-left font-medium text-white/50">Max Price</th>
            <th className="px-4 py-3 text-left font-medium text-white/50">Platform Fee</th>
            <th className="px-4 py-3 text-left font-medium text-white/50">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {tiers.map((tier) =>
            editingId === tier.id ? (
              <EditableRow
                key={tier.id}
                tier={tier}
                onDone={() => {
                  setEditingId(null)
                  router.refresh()
                }}
              />
            ) : (
              <tr key={tier.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 text-white">{tier.label}</td>
                <td className="px-4 py-3 text-white/60">{formatNaira(tier.min_price)}</td>
                <td className="px-4 py-3 text-white/60">
                  {tier.max_price ? formatNaira(tier.max_price) : '∞'}
                </td>
                <td className="px-4 py-3 font-semibold text-[#F5A623]">
                  {formatNaira(tier.fee_amount)}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setEditingId(tier.id)}
                    className="px-3 py-1 text-xs font-medium rounded bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-colors"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  )
}
