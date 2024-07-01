import type { Contact } from './ContactType'

export interface Deal {
  id: string
  name: string
  price: number
  pipeline: {
    name: string
    color: string
  }
  responsible_user: string
  created: string
  isOpen: boolean
  contacts?: Contact[]
}
