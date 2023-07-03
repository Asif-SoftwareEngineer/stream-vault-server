import { MembershipType } from "./enums"

export interface MemberPlan {
  planType: MembershipType
  amount: number
  paymentMode: string
  currency: string
}
