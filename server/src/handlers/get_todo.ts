import { db } from '../db';
import { todosTable } from '../db/schema';
import { type GetTodoInput, type Todo } from '../schema';
import { eq } from 'drizzle-orm';

export const getTodo = async (input: GetTodoInput): Promise<Todo | null> => {
  try {
    // Query for the specific todo by ID
    const result = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, input.id))
      .execute();

    // Return null if todo not found, otherwise return the first (and only) result
    return result.length === 0 ? null : result[0];
  } catch (error) {
    console.error('Get todo failed:', error);
    throw error;
  }
};