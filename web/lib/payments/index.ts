export interface VirtualAccountParams {
  accountName: string
  bvn?: string
  nin?: string
  reference: string
  amount?: number
}

export interface VirtualAccountResult {
  accountNumber: string
  accountName: string
  bankName: string
  bankCode: string
  reference: string
}

export interface PaymentVerificationResult {
  status: 'success' | 'failed' | 'pending'
  amount: number
  reference: string
  paidAt?: string
}

export interface PaymentGateway {
  createVirtualAccount(params: VirtualAccountParams): Promise<VirtualAccountResult>
  verifyPayment(reference: string): Promise<PaymentVerificationResult>
  getWebhookSecret(): string
}
