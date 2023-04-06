import { Schema, model } from 'mongoose'

import { IChannel } from './channel'
import { MembershipType, Role } from './enums'
import { ISetting } from './setting'

export interface IUser {
  accessCode?: string
  pichain_uid?: string
  pichain_username?: string
  userId?: string

  streamVault_username: string
  email: string
  country: string
  city?: string
  role: Role
  registration_date: Date
  membership_date?: Date
  membership_Type?: MembershipType
  membership_renewal_date?: Date
  picture?: string
  isProfileDisabled: boolean
  isMembershipExpired: boolean
  watchList?: string[]
  settings?: ISetting
  channels?: IChannel[]
}

const userSchema = new Schema<IUser>({
  accessCode: { type: String, required: true },
  pichain_uid: { type: String, required: true },
  userId: { type: String, required: false },
  pichain_username: { type: String, required: true },

  streamVault_username: { type: String, required: true },
  email: { type: String, required: true },
  country: { type: String, required: true },
  city: { type: String, required: false },
  role: { type: String, required: true },
  registration_date: { type: Date, required: true },
  membership_date: { type: Date, required: false },
  membership_Type: { type: String, enum: Object.values(MembershipType), required: false },
  membership_renewal_date: { type: Date, required: false },
  picture: { type: String, required: false },
  isProfileDisabled: { type: Boolean, required: true },
  isMembershipExpired: { type: Boolean, required: true },
  watchList: [String],
  settings: { type: Object, ref: 'Setting' },
  channels: [{ type: Object, ref: 'Channel' }],
})

// userSchema.virtual('userId').get(function () {
//   return this._id
// })

export const userModel = model<IUser>('User', userSchema)
