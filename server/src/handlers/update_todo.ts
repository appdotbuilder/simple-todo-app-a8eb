import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoInput, type Todo } from '../schema';
import { eq } from 'drizzle-orm';

export const updateTodo = async (input: UpdateTodoInput): Promise<Todo | null> => {
  try {
    // Build update object with only provided fields
    const updateData: Partial<{
      title: string;
      description: string | null;
      completed: boolean;
      updated_at: Date;
    }> = {
      updated_at: new Date() // Always update the timestamp
    };

    // Only include fields that were provided in the input
    if (input.title !== undefined) {
      updateData.title = input.title;
    }

    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    if (input.completed !== undefined) {
      updateData.completed = input.completed;
    }

    // Update the todo and return the updated record
    const result = await db.update(todosTable)
      .set(updateData)
      .where(eq(todosTable.id, input.id))
      .returning()
      .execute();

    // Return null if no record was found/updated
    if (result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    console.error('Todo update failed:', error);
    throw error;
  }
};