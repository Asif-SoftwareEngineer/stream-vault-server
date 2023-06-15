import { Schema, model } from 'mongoose'

import { IMemberPlan } from './membership-plan'

export interface IFeePayment {
  userId: string
  membership: IMemberPlan
  paymentDate: Date
}

const feePaymentSchema = new Schema<IFeePayment>({
  userId: { type: String, required: true },
  membership: { type: Object, ref: 'Membership', required: true },
  paymentDate: { type: Date, required: true },
})

export const feePaymentModel = model<IFeePayment>('FeePayment', feePaymentSchema)
