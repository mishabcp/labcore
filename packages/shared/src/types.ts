/**
 * Shared types for LabCore (web + api).
 * Keep in sync with Prisma schema and API contracts.
 */

export type UserRole = 'admin' | 'pathologist' | 'senior_tech' | 'technician' | 'front_desk';

export type GenderType = 'male' | 'female' | 'other';

export type OrderStatus =
  | 'registered'
  | 'sample_collected'
  | 'in_process'
  | 'completed'
  | 'reported'
  | 'cancelled';

export type OrderPriority = 'routine' | 'urgent' | 'stat';

export type SampleStatus =
  | 'ordered'
  | 'collected'
  | 'received'
  | 'in_process'
  | 'completed'
  | 'stored'
  | 'disposed'
  | 'rejected';

export type ResultStatus = 'pending' | 'entered' | 'reviewed' | 'authorised' | 'amended';

export type DeliveryChannel = 'whatsapp' | 'email' | 'portal' | 'print';

export type PaymentMode = 'cash' | 'upi' | 'card' | 'net_banking' | 'cheque' | 'other';

export interface LabContext {
  labId: string;
  userId: string;
  role: UserRole;
}
