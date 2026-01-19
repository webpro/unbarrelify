export interface User {
  id: number;
  name: string;
  email: string;
}

export type UserId = number;

export type UserRole = "admin" | "user" | "guest";

export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

export enum Status {
  Active = "active",
  Inactive = "inactive",
  Pending = "pending",
}

export interface Repository<T> {
  findById(id: number): T | undefined;
  findAll(): T[];
  save(item: T): void;
  delete(id: number): boolean;
}

export type UserWithRole = User & { role: UserRole };

export const enum Priority {
  Low = 0,
  Medium = 1,
  High = 2,
}
