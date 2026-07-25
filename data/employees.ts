export interface Employee {
  id: number
  name: string
  role: string
  department: string
  email: string
  phone: string
  managerId: number | null
  level: 1 | 2 | 3
}

export const employees: Employee[] = []
