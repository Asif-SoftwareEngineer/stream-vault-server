import { Schema, model } from 'mongoose'

export interface UserDTO {
  uid: string // An app-specific user identifier
  credentials: {
    valid_until: {
      timestamp: number
      iso8601: string
    }
  }
  username?: string // The user's Pi username. Requires the `username` scope.
}

export interface PiUser {
  accessToken: string
  uid: string
  username: string
  valid_timestamp: number
  iso8601: string
  signin_date: string
}

const piUserSchema = new Schema<PiUser>({
  accessToken: { type: String, required: true },
  uid: { type: String, required: true },
  username: { type: String, required: true },
  valid_timestamp: { type: Number, required: true },
  iso8601: { type: String, required: true },
  signin_date: { type: String, required: true },
})

export const piUserModel = model<PiUser>('Signin', piUserSchema)
