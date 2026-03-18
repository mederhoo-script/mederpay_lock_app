import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const RegisterAgentSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Invalid phone number').max(15),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
})

export const AddPhoneSchema = z.object({
  imei: z.string().min(15, 'IMEI must be 15 digits').max(15, 'IMEI must be 15 digits').regex(/^\d{15}$/, 'IMEI must contain only digits'),
  brand: z.string().min(1, 'Brand is required'),
  model: z.string().min(1, 'Model is required'),
  storage: z.string().optional(),
  color: z.string().optional(),
  cost_price: z.number().positive('Cost price must be positive'),
  selling_price: z.number().positive('Selling price must be positive'),
  down_payment: z.number().min(0, 'Down payment cannot be negative'),
  payment_weeks: z.number().int().positive('Payment weeks must be a positive integer'),
})

export const RegisterBuyerSchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  phone: z.string().min(10, 'Invalid phone number'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().min(5, 'Address is required'),
  bvn: z.string().length(11, 'BVN must be 11 digits').optional().or(z.literal('')),
  nin: z.string().length(11, 'NIN must be 11 digits').optional().or(z.literal('')),
  phone_id: z.string().uuid('Please select a phone').optional().or(z.literal('')),
})

export const SellPhoneSchema = z.object({
  buyer_id: z.string().uuid('Please select a buyer'),
  phone_id: z.string().uuid('Please select a phone'),
})

export const AgentSettingsSchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  phone: z.string().min(10, 'Invalid phone number'),
  active_gateway: z.enum(['monnify', 'paystack', 'flutterwave', 'interswitch']).optional(),
  monnify_api_key: z.string().optional(),
  monnify_secret_key: z.string().optional(),
  monnify_contract_code: z.string().optional(),
  paystack_secret_key: z.string().optional(),
  flutterwave_secret_key: z.string().optional(),
  interswitch_client_id: z.string().optional(),
  interswitch_client_secret: z.string().optional(),
  payment_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  bvn: z.string().length(11, 'BVN must be 11 digits').optional().or(z.literal('')),
  nin: z.string().length(11, 'NIN must be 11 digits').optional().or(z.literal('')),
})

export const CreateSubAgentSchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Invalid phone number'),
})

export const FeeTierSchema = z.object({
  min_price: z.number().min(0, 'Min price must be non-negative'),
  max_price: z.number().nullable().optional(),
  fee_amount: z.number().min(0, 'Fee must be non-negative'),
  label: z.string().min(1, 'Label is required'),
})

export type LoginInput = z.infer<typeof LoginSchema>
export type RegisterAgentInput = z.infer<typeof RegisterAgentSchema>
export type AddPhoneInput = z.infer<typeof AddPhoneSchema>
export type RegisterBuyerInput = z.infer<typeof RegisterBuyerSchema>
export type SellPhoneInput = z.infer<typeof SellPhoneSchema>
export type AgentSettingsInput = z.infer<typeof AgentSettingsSchema>
export type CreateSubAgentInput = z.infer<typeof CreateSubAgentSchema>
export type FeeTierInput = z.infer<typeof FeeTierSchema>
