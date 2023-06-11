import { Dayjs } from 'dayjs'
import { Schema, model } from 'mongoose'

import { IChannel } from './channel'
import { Role } from './enums'
import { IMemberPlan } from './membership-plan'
import { ISetting } from './setting'

export interface IUser {
  piUserId?: string
  piUserName?: string
  userId?: string

  userName: string
  email: string
  mobile: string
  country?: string
  city?: string
  role: Role
  registrationDate: Dayjs
  membershipPlan: IMemberPlan
  membershipRenewalDate?: Dayjs
  picture?: string
  isProfileDisabled: boolean
  isMembershipExpired: boolean
  watchList?: string[]
  settings?: ISetting
  channels?: IChannel[]
}

const userSchema = new Schema<IUser>({
  piUserId: { type: String, required: false },
  piUserName: { type: String, required: false },

  userId: { type: String, required: false },
  userName: { type: String, required: true },

  email: { type: String, required: true },
  mobile: { type: String, required: true },
  country: { type: String, required: false },
  city: { type: String, required: false },
  role: { type: String, required: true },
  registrationDate: { type: Date, required: true },
  membershipPlan: { type: Object, ref: 'MemberPlan', required: true },
  membershipRenewalDate: { type: Date, required: false },
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
