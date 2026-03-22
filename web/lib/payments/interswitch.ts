import type { PaymentGateway, VirtualAccountParams, VirtualAccountResult, PaymentVerificationResult } from './index'

export class InterswitchGateway implements PaymentGateway {
  private clientId: string
  private clientSecret: string

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId
    this.clientSecret = clientSecret
  }

  private async getToken(): Promise<string> {
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')
    const response = await fetch('https://sandbox.interswitchng.com/passport/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    })
    if (!response.ok) {
      throw new Error(`Interswitch getToken failed: HTTP ${response.status} ${response.statusText}`)
    }
    const data = await response.json() as { access_token: string }
    return data.access_token
  }

  async createVirtualAccount(params: VirtualAccountParams): Promise<VirtualAccountResult> {
    const token = await this.getToken()
    const response = await fetch('https://sandbox.interswitchng.com/api/v2/quickteller/reservedaccount', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerName: params.accountName,
        bvn: params.bvn,
        reference: params.reference,
      }),
    })
    if (!response.ok) {
      throw new Error(`Interswitch createVirtualAccount failed: HTTP ${response.status} ${response.statusText}`)
    }
    const data = await response.json() as { accountNumber: string; accountName: string; bankName: string; bankCode: string }
    return {
      accountNumber: data.accountNumber,
      accountName: data.accountName || params.accountName,
      bankName: data.bankName || 'Interswitch',
      bankCode: data.bankCode || '',
      reference: params.reference,
    }
  }

  async verifyPayment(reference: string): Promise<PaymentVerificationResult> {
    const token = await this.getToken()
    const response = await fetch(`https://sandbox.interswitchng.com/api/v2/quickteller/transactions?reference=${encodeURIComponent(reference)}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    if (!response.ok) {
      throw new Error(`Interswitch verifyPayment failed: HTTP ${response.status} ${response.statusText}`)
    }
    const data = await response.json() as { responseCode: string; amount: number; transactionDate: string }
    return {
      status: data.responseCode === '00' ? 'success' : 'pending',
      amount: data.amount,
      reference,
      paidAt: data.transactionDate,
    }
  }

  getWebhookSecret(): string {
    return this.clientSecret
  }
}
