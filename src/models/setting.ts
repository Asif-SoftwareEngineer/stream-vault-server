import { LanguageType } from './enums'

interface IBlocked {
  user_id: string
}

interface INotifyEmail {
  new_matches: boolean
  messages: boolean
  promo: boolean
}

interface IPushNotify {
  new_matches: boolean
  messages: boolean
  messages_like: boolean
}

export interface ISetting {
  blocked: IBlocked[]
  notifyByEmail: INotifyEmail
  pushNotification: IPushNotify
  Language: LanguageType
}
