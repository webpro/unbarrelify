import type { User, UserId, UserRole, Result, Repository, UserWithRole } from "./index.ts";
import { Status, Priority } from "./index.ts";

const userId: UserId = 123;

const user: User = {
  id: userId,
  name: "Alice",
  email: "alice@example.com",
};

const role: UserRole = "admin";

const userWithRole: UserWithRole = {
  ...user,
  role,
};

function fetchUser(id: UserId): Result<User> {
  if (id > 0) {
    return { success: true, data: user };
  }
  return { success: false, error: new Error("Invalid user ID") };
}

class UserRepository implements Repository<User> {
  private users: User[] = [];

  findById(id: number): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  findAll(): User[] {
    return this.users;
  }

  save(item: User): void {
    this.users.push(item);
  }

  delete(id: number): boolean {
    const index = this.users.findIndex((u) => u.id === id);
    if (index >= 0) {
      this.users.splice(index, 1);
      return true;
    }
    return false;
  }
}

const status: Status = Status.Active;
const priority: Priority = Priority.High;

export { user, userWithRole, fetchUser, UserRepository, status, priority };
