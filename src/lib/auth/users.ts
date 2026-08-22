import { eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { usersTable, type User } from '@/server/db/schema/userTable';
import { type Roles } from '@/types/globals';
import { hashPassword } from './password';

export const DEFAULT_PASSWORDS: Record<Roles, string> = {
  super_admin: 'Admin1234',
  developer: 'Admin1234',
  client_admin: 'User1234',
  client_additional_admin: 'User1234',
  supplier_admin: 'Supplier1234',
  supplier_additional_admin: 'Supplier1234',
};

type DbClient = Pick<typeof db, 'select' | 'insert' | 'delete' | 'update'>;

export async function getUserByEmail(
  email: string,
  client: DbClient = db
): Promise<User | null> {
  const [user] = await client
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  return user ?? null;
}

export async function createUser(
  email: string,
  role: Roles,
  meta?: {
    companyId?: number;
    supplierId?: number;
    name?: string;
  },
  client: DbClient = db
): Promise<User | null> {
  const passwordHash = await hashPassword(DEFAULT_PASSWORDS[role]);

  const [user] = await client
    .insert(usersTable)
    .values({
      email,
      passwordHash,
      role,
      companyId: meta?.companyId,
      supplierId: meta?.supplierId,
      name: meta?.name,
    })
    .onConflictDoNothing({ target: usersTable.email })
    .returning();

  return user ?? null;
}

export async function deleteUserById(
  id: number,
  client: DbClient = db
): Promise<void> {
  await client.delete(usersTable).where(eq(usersTable.id, id));
}

export async function deleteUserByEmail(
  email: string,
  client: DbClient = db
): Promise<void> {
  await client.delete(usersTable).where(eq(usersTable.email, email));
}
