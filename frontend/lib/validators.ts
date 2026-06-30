import { z } from 'zod'

export const reportIssueSchema = z.object({
  title: z
    .string()
    .min(10, 'Title must be at least 10 characters')
    .max(100, 'Title must be under 100 characters'),
  description: z
    .string()
    .min(20, 'Please describe the issue in at least 20 characters')
    .max(1000, 'Description must be under 1000 characters'),
  category: z.enum([
    'pothole', 'streetlight', 'garbage', 'water',
    'drainage', 'tree', 'traffic_signal', 'other',
  ]),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  landmark: z.string().min(3, 'Please enter a nearby landmark').max(200),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    address: z.string().min(3, 'Address is required'),
  }),
})

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  ward: z.string().min(1, 'Select your ward'),
})

export type ReportIssueInput = z.infer<typeof reportIssueSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
