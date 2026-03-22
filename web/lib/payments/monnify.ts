import type { PaymentGateway, VirtualAccountParams, VirtualAccountResult, PaymentVerificationResult } from './index'

interface MonnifyConfig {
  apiKey: string
  secretKey: string
  contractCode: string
  baseUrl: string
}

export class MonnifyGateway implements PaymentGateway {
  private config: MonnifyConfig

  constructor(config: MonnifyConfig) {
    this.config = config
  }

  private async getToken(): Promise<string> {
    const credentials = Buffer.from(`${this.config.apiKey}:${this.config.secretKey}`).toString('base64')
    const response = await fetch(`${this.config.baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    })
    if (!response.ok) {
      throw new Error(`Monnify getToken failed: HTTP ${response.status} ${response.statusText}`)
    }
    const data = await response.json() as { requestSuccessful: boolean; responseBody: { accessToken: string } }
    if (!data.requestSuccessful) throw new Error('Monnify auth failed')
    return data.responseBody.accessToken
  }

  async createVirtualAccount(params: VirtualAccountParams): Promise<VirtualAccountResult> {
    const token = await this.getToken()
    const response = await fetch(`${this.config.baseUrl}/api/v2/bank-transfer/reserved-accounts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountReference: params.reference,
        accountName: params.accountName,
        currencyCode: 'NGN',
        contractCode: this.config.contractCode,
        bvn: params.bvn,
        nin: params.nin,
        getAllAvailableBanks: false,
        preferredBanks: ['035'],
      }),
    })
    if (!response.ok) {
      throw new Error(`Monnify createVirtualAccount failed: HTTP ${response.status} ${response.statusText}`)
    }
    const data = await response.json() as { requestSuccessful: boolean; responseBody: { accounts: Array<{ accountNumber: string; bankName: string; bankCode: string }> } }
    if (!data.requestSuccessful) throw new Error('Failed to create Monnify virtual account')
    const account = data.responseBody.accounts[0]
    return {
      accountNumber: account.accountNumber,
      accountName: params.accountName,
      bankName: account.bankName,
      bankCode: account.bankCode,
      reference: params.reference,
    }
  }

  async verifyPayment(reference: string): Promise<PaymentVerificationResult> {
    const token = await this.getToken()
    const response = await fetch(`${this.config.baseUrl}/api/v2/transactions/${encodeURIComponent(reference)}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    if (!response.ok) {
      throw new Error(`Monnify verifyPayment failed: HTTP ${response.status} ${response.statusText}`)
    }
    const data = await response.json() as { requestSuccessful: boolean; responseBody: { paymentStatus: string; amountPaid: number; createdOn: string } }
    if (!data.requestSuccessful) throw new Error('Failed to verify Monnify payment')
    return {
      status: data.responseBody.paymentStatus === 'PAID' ? 'success' : 'pending',
      amount: Math.round(data.responseBody.amountPaid * 100),
      reference,
      paidAt: data.responseBody.createdOn,
    }
  }

  getWebhookSecret(): string {
    return this.config.secretKey
  }
}

export function createOwnerMonnifyGateway(): MonnifyGateway {
  return new MonnifyGateway({
    apiKey: process.env.MONNIFY_API_KEY!,
    secretKey: process.env.MONNIFY_SECRET_KEY!,
    contractCode: process.env.MONNIFY_CONTRACT_CODE!,
    baseUrl: process.env.MONNIFY_BASE_URL || 'https://api.monnify.com',
  })
}
