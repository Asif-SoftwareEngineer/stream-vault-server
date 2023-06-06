import { Schema, model } from 'mongoose'

export interface IAccountVerification {
  firstName: string
  lastName: string
  email: string
  code: string
  isVerified: boolean
  createdAt: Date
}

const verificationSchema = new Schema<IAccountVerification>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  code: { type: String, required: true },
  isVerified: { type: Boolean, required: true, default: false },
  createdAt: { type: Date, required: true, default: Date.now },
})

export const accountVerificationModel = model<IAccountVerification>(
  'Verification',
  verificationSchema
)
