import { Schema, model } from 'mongoose'

import { LogEventType } from './enums'

export interface ILogVideo {
  userId: string
  ip: string
  country: string
  city: string
  videoId: string
  eventType: LogEventType
  timestamp: string
  view_duration: number
}

export interface ILogUser {
  userId: string
  ip: string
  country: string
  city: string
  eventType: LogEventType
  timestamp: string
  details: string
}

const logVideoSchema = new Schema<ILogVideo>({
  userId: { type: String, required: true },
  ip: { type: String, required: true },
  country: { type: String, required: false },
  city: { type: String, required: false },
  videoId: { type: String, required: true },
  eventType: { type: String, enum: Object.values(LogEventType), required: true },
  timestamp: { type: String, required: true },
  view_duration: { type: Number, required: false },
})

const logUserSchema = new Schema<ILogUser>({
  userId: { type: String, required: true },
  ip: { type: String, required: true },
  country: { type: String, required: false },
  city: { type: String, required: false },
  eventType: { type: String, enum: Object.values(LogEventType), required: true },
  timestamp: { type: String, required: true },
  details: { type: String, required: false },
})

export const logVideoModel = model<ILogVideo>('LogVideo', logVideoSchema)

export const logUserModel = model<ILogVideo>('LogUser', logUserSchema)
