export type UserRole = 'partner' | 'admin';

export default {};

export interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
}
