import { LanguageType } from './enums'

interface Blocked {
  user_id: string
}

interface NotifyEmail {
  new_matches: boolean
  messages: boolean
  promo: boolean
}

interface PushNotify {
  new_matches: boolean
  messages: boolean
  messages_like: boolean
}

export interface Setting {
  blocked: Blocked[]
  notifyByEmail: NotifyEmail
  pushNotification: PushNotify
  Language: LanguageType
}
