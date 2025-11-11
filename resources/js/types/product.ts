export interface Product {
  id: number
  name: string
  description?: string | null
  price: number
  stock: number
  image?: string | null
  category_id: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

