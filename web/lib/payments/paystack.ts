import type { PaymentGateway, VirtualAccountParams, VirtualAccountResult, PaymentVerificationResult } from './index'

export class PaystackGateway implements PaymentGateway {
  private secretKey: string

  constructor(secretKey: string) {
    this.secretKey = secretKey
  }

  async createVirtualAccount(params: VirtualAccountParams): Promise<VirtualAccountResult> {
    const response = await fetch('https://api.paystack.co/dedicated_account', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer: { email: `${params.reference}@mederbuy.com`, first_name: params.accountName },
        preferred_bank: 'wema-bank',
      }),
    })
    if (!response.ok) {
      throw new Error(`Paystack createVirtualAccount failed: HTTP ${response.status} ${response.statusText}`)
    }
    const data = await response.json() as { status: boolean; data: { account_number: string; account_name: string; bank: { name: string; id: string } } }
    if (!data.status) throw new Error('Failed to create Paystack virtual account')
    return {
      accountNumber: data.data.account_number,
      accountName: data.data.account_name,
      bankName: data.data.bank.name,
      bankCode: String(data.data.bank.id),
      reference: params.reference,
    }
  }

  async verifyPayment(reference: string): Promise<PaymentVerificationResult> {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { 'Authorization': `Bearer ${this.secretKey}` },
    })
    if (!response.ok) {
      throw new Error(`Paystack verifyPayment failed: HTTP ${response.status} ${response.statusText}`)
    }
    const data = await response.json() as { status: boolean; data: { status: string; amount: number; paid_at: string } }
    if (!data.status) throw new Error('Failed to verify Paystack payment')
    return {
      status: data.data.status === 'success' ? 'success' : 'pending',
      amount: data.data.amount,
      reference,
      paidAt: data.data.paid_at,
    }
  }

  getWebhookSecret(): string {
    return this.secretKey
  }
}
