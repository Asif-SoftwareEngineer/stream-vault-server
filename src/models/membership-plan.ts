import { MembershipType } from "./enums"

export interface IMemberPlan {
  planType: MembershipType
  amount: number
  paymentMode: string
  currency: string
}
