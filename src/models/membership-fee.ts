import { Schema, model } from 'mongoose'

import { MemberPlan } from './membership-plan'

export interface FeePayment {
  userId: string
  membership: MemberPlan
  paymentDate: Date
}

const feePaymentSchema = new Schema<FeePayment>({
  userId: { type: String, required: true },
  membership: { type: Object, ref: 'Membership', required: true },
  paymentDate: { type: Date, required: true },
})

export const feePaymentModel = model<FeePayment>('FeePayment', feePaymentSchema)
