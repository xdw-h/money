export interface SavingsPlan {
  id: string
  name: string
  targetAmount: number
  defaultAmount: number
  deadline?: string
  createdAt: string
}

export interface SavingsDeposit {
  id: string
  planId: string
  amount: number
  occurredAt: string
  note: string
}
