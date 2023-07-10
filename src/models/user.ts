import { Schema, Types, model } from 'mongoose'
import { Channel } from './channel'
import { Role } from './enums'
import { MemberPlan } from './membership-plan'
import { Setting } from './setting'

export interface User {
  userName: string
  firstName: string
  lastName: string
  email: string
  mobile: string
  language: string
  age18Above: boolean
  agreeToTerms: boolean
  role: Role
  registrationDate: Date
  membership: MemberPlan
  membershipRenewalDate?: Date
  isVerified: boolean
  piUserId?: string
  piUserName?: string
  userId?: string
  country?: string
  city?: string
  picture?: string
  isProfileDisabled: boolean
  isMembershipExpired: boolean
  watchList?: Types.ObjectId[]
  settings?: Setting
  channels?: Channel[]
}

const channelSchema = new Schema<Channel>({
  userId: { type: Schema.Types.ObjectId, required: true },
  channelId: { type: Schema.Types.ObjectId, required: true },
  profileImageUrl: { type: String, required: false },
  bannerImageUrl: { type: String, required: false },
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  handle: { type: String, required: true },
  videos: [{ type: Schema.Types.ObjectId, required: false }],
  followers: [{ type: Schema.Types.ObjectId, required: false }],
})

const userSchema = new Schema<User>({
  piUserId: { type: String, required: false },
  piUserName: { type: String, required: false },

  userName: { type: String, required: true },

  firstName: { type: String, required: true },
  lastName: { type: String, required: true },

  email: { type: String, required: true },
  mobile: { type: String, required: true },

  language: { type: String, required: true },
  age18Above: { type: Boolean, required: true },
  agreeToTerms: { type: Boolean, required: true },

  country: { type: String, required: false },
  city: { type: String, required: false },
  role: { type: String, enum: Object.values(Role), required: true },
  registrationDate: { type: Date, required: true },
  membership: { type: Object, required: true },
  membershipRenewalDate: { type: Date, required: false },
  picture: { type: String, required: false },
  isProfileDisabled: { type: Boolean, required: true },
  isVerified: { type: Boolean, required: true },
  isMembershipExpired: { type: Boolean, required: true },
  watchList: [{ type: Schema.Types.ObjectId, required: false }],
  settings: { type: Object, ref: 'Setting' },
  channels: [channelSchema],
})

export const userModel = model<User>('User', userSchema)
