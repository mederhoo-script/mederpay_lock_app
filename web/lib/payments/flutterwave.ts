import type { PaymentGateway, VirtualAccountParams, VirtualAccountResult, PaymentVerificationResult } from './index'

export class FlutterwaveGateway implements PaymentGateway {
  private secretKey: string

  constructor(secretKey: string) {
    this.secretKey = secretKey
  }

  async createVirtualAccount(params: VirtualAccountParams): Promise<VirtualAccountResult> {
    const response = await fetch('https://api.flutterwave.com/v3/virtual-account-numbers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: `${params.reference}@mederbuy.com`,
        tx_ref: params.reference,
        amount: params.amount,
        bvn: params.bvn,
        is_permanent: true,
        narration: params.accountName,
      }),
    })
    const data = await response.json() as { status: string; data: { account_number: string; account_name: string; bank_name: string } }
    if (data.status !== 'success') throw new Error('Failed to create Flutterwave virtual account')
    return {
      accountNumber: data.data.account_number,
      accountName: data.data.account_name || params.accountName,
      bankName: data.data.bank_name,
      bankCode: '',
      reference: params.reference,
    }
  }

  async verifyPayment(reference: string): Promise<PaymentVerificationResult> {
    const response = await fetch(`https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`, {
      headers: { 'Authorization': `Bearer ${this.secretKey}` },
    })
    const data = await response.json() as { status: string; data: { status: string; amount: number; created_at: string } }
    if (data.status !== 'success') throw new Error('Failed to verify Flutterwave payment')
    return {
      status: data.data.status === 'successful' ? 'success' : 'pending',
      amount: Math.round(data.data.amount * 100),
      reference,
      paidAt: data.data.created_at,
    }
  }

  getWebhookSecret(): string {
    return this.secretKey
  }
}
