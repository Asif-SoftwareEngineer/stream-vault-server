import { Schema, model } from 'mongoose'

import * as Log from './enums'

export interface ILogVideo {
  userId: string
  ip: string
  country: string
  city: string
  videoId: string
  eventType: Log.LogEventType
  timestamp: string
  view_duration: number
}

export interface ILogUser {
  userId: string
  ip: string
  country: string
  city: string
  eventType: Log.LogEventType
  timestamp: string
}

const logVideoSchema = new Schema<ILogVideo>({
  userId: { type: String, required: true },
  ip: { type: String, required: true },
  country: { type: String, required: false },
  city: { type: String, required: false },
  videoId: { type: String, required: true },
  eventType: { type: String, enum: Object.values(Log.LogEventType), required: true },
  timestamp: { type: String, required: true },
  view_duration: { type: Number, required: false },
})

const logUserSchema = new Schema<ILogUser>({
  userId: { type: String, required: true },
  ip: { type: String, required: true },
  country: { type: String, required: false },
  city: { type: String, required: false },
  eventType: { type: String, enum: Object.values(Log.LogEventType), required: true },
  timestamp: { type: String, required: true },
})

export const logVideoModel = model<ILogVideo>('LogVideo', logVideoSchema)

export const logUserModel = model<ILogVideo>('LogUser', logUserSchema)
