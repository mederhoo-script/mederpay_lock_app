'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatNaira } from '@/lib/utils'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

interface FeeTier {
  id: string
  label: string
  min_price: number
  max_price: number | null
  fee_amount: number
  created_at: string
}

interface FormData {
  label: string
  min_price_naira: string
  max_price_naira: string
  fee_amount_naira: string
}

const emptyForm: FormData = { label: '', min_price_naira: '', max_price_naira: '', fee_amount_naira: '' }

export default function FeeTiersTable({ tiers: initial }: { tiers: FeeTier[] }) {
  const [tiers, setTiers] = useState(initial)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<FeeTier | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [processing, setProcessing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<Partial<FormData>>({})

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormErrors({})
    setDialogOpen(true)
  }

  const openEdit = (tier: FeeTier) => {
    setEditing(tier)
    setForm({
      label: tier.label,
      min_price_naira: String(tier.min_price / 100),
      max_price_naira: tier.max_price != null ? String(tier.max_price / 100) : '',
      fee_amount_naira: String(tier.fee_amount / 100),
    })
    setFormErrors({})
    setDialogOpen(true)
  }

  const validateForm = () => {
    const e: Partial<FormData> = {}
    if (!form.label.trim()) e.label = 'Label is required'
    if (!form.min_price_naira || isNaN(Number(form.min_price_naira))) e.min_price_naira = 'Required'
    if (!form.fee_amount_naira || isNaN(Number(form.fee_amount_naira))) e.fee_amount_naira = 'Required'
    setFormErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return
    setProcessing(true)
    try {
      const supabase = createClient()
      const payload = {
        label: form.label,
        min_price: Math.round(Number(form.min_price_naira) * 100),
        max_price: form.max_price_naira ? Math.round(Number(form.max_price_naira) * 100) : null,
        fee_amount: Math.round(Number(form.fee_amount_naira) * 100),
      }

      if (editing) {
        const { data, error } = await supabase.from('fee_tiers').update(payload).eq('id', editing.id).select().single()
        if (error) { toast.error(error.message); return }
        setTiers(prev => prev.map(t => t.id === editing.id ? { ...t, ...(data as FeeTier) } : t))
        toast.success('Fee tier updated.')
      } else {
        const { data, error } = await supabase.from('fee_tiers').insert(payload).select().single()
        if (error) { toast.error(error.message); return }
        setTiers(prev => [...prev, data as FeeTier])
        toast.success('Fee tier added.')
      }
      setDialogOpen(false)
    } catch {
      toast.error('Operation failed.')
    } finally {
      setProcessing(false)
    }
  }

  const deleteTier = async (id: string) => {
    setProcessing(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('fee_tiers').delete().eq('id', id)
      if (error) { toast.error(error.message); return }
      setTiers(prev => prev.filter(t => t.id !== id))
      toast.success('Fee tier deleted.')
    } catch {
      toast.error('Delete failed.')
    } finally {
      setProcessing(false)
      setConfirmDelete(null)
    }
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={openAdd} className="btn btn-primary">
          <Plus className="w-4 h-4" /> Add Tier
        </button>
      </div>

      <div className="gold-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Label</th>
                <th>Min Price</th>
                <th>Max Price</th>
                <th>Weekly Fee</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tiers.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>No fee tiers yet.</td></tr>
              ) : tiers.map(tier => (
                <tr key={tier.id}>
                  <td style={{ color: 'hsl(var(--foreground))' }}>{tier.label}</td>
                  <td className="font-mono text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{formatNaira(tier.min_price)}</td>
                  <td className="font-mono text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{tier.max_price != null ? formatNaira(tier.max_price) : 'No limit'}</td>
                  <td className="font-mono text-xs" style={{ color: 'hsl(var(--primary))' }}>{formatNaira(tier.fee_amount)}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(tier)} className="btn btn-ghost text-xs px-2 py-1">
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button onClick={() => setConfirmDelete(tier.id)} className="btn btn-ghost text-xs px-2 py-1">
                        <Trash2 className="w-3 h-3" style={{ color: 'hsl(0 78% 68%)' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="gold-panel p-6 w-full max-w-md space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{editing ? 'Edit Fee Tier' : 'Add Fee Tier'}</h3>
              <button onClick={() => setDialogOpen(false)} className="btn btn-ghost p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Label *</label>
                <input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="e.g. Budget Tier" className="input-field" />
                {formErrors.label && <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{formErrors.label}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Min Price (₦) *</label>
                  <input value={form.min_price_naira} onChange={e => setForm({ ...form, min_price_naira: e.target.value })} type="number" step="0.01" placeholder="0" className="input-field" />
                  {formErrors.min_price_naira && <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{formErrors.min_price_naira}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Max Price (₦)</label>
                  <input value={form.max_price_naira} onChange={e => setForm({ ...form, max_price_naira: e.target.value })} type="number" step="0.01" placeholder="No limit" className="input-field" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Weekly Fee Amount (₦) *</label>
                <input value={form.fee_amount_naira} onChange={e => setForm({ ...form, fee_amount_naira: e.target.value })} type="number" step="0.01" placeholder="e.g. 5000" className="input-field" />
                {formErrors.fee_amount_naira && <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{formErrors.fee_amount_naira}</p>}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setDialogOpen(false)} className="btn btn-ghost flex-1">Cancel</button>
              <button onClick={handleSave} disabled={processing} className="btn btn-primary flex-1">
                {processing ? 'Saving…' : editing ? 'Save Changes' : 'Add Tier'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="gold-panel p-6 w-full max-w-sm space-y-4">
            <h3 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Delete Fee Tier</h3>
            <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Are you sure? This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="btn btn-ghost flex-1">Cancel</button>
              <button onClick={() => deleteTier(confirmDelete)} disabled={processing} className="btn btn-destructive flex-1">
                {processing ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
