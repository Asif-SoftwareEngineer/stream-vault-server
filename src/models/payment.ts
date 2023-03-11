import { Schema, model } from 'mongoose'

export interface IPayment {
  amount: number
  uid: string
  created_at: Date
  paid: boolean
  paymentId: string

  memo?: string
  cancelled?: boolean
  developer_approved?: boolean
  transaction_verified?: boolean
  linkUrl?: string
  txid?: string
}

export interface PaymentDTO {
  amount: number
  user_uid: string
  created_at: string
  identifier: string
  metadata: Object
  memo: string
  status: {
    developer_approved: boolean
    transaction_verified: boolean
    developer_completed: boolean
    cancelled: boolean
    user_cancelled: boolean
  }
  to_address: string
  transaction?: null | {
    txid?: string
    verified: boolean
    _link: string
  }
}

const paymentSchema = new Schema<IPayment>({
  amount: { type: Number, required: true },
  uid: { type: String, required: true },
  created_at: { type: Date, required: true },
  paymentId: { type: String, required: true },
  paid: { type: Boolean, required: true },

  memo: { type: String, required: false },
  cancelled: { type: Boolean, required: false },
  developer_approved: { type: Boolean, required: false },
  transaction_verified: { type: Boolean, required: false },
  linkUrl: { type: String, required: false },
  txid: { type: String, required: false },
})

export const paymentModel = model<IPayment>('Payment', paymentSchema)
