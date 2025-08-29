import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type DeleteTodoInput, type CreateTodoInput } from '../schema';
import { deleteTodo } from '../handlers/delete_todo';
import { eq } from 'drizzle-orm';

// Test input for deleting a todo
const deleteInput: DeleteTodoInput = {
  id: 1
};

// Helper function to create a test todo
const createTestTodo = async (): Promise<number> => {
  const result = await db.insert(todosTable)
    .values({
      title: 'Test Todo',
      description: 'A todo for testing deletion',
      completed: false
    })
    .returning()
    .execute();
  
  return result[0].id;
};

describe('deleteTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing todo and return true', async () => {
    // Create a test todo first
    const todoId = await createTestTodo();

    // Delete the todo
    const result = await deleteTodo({ id: todoId });

    // Should return true indicating successful deletion
    expect(result).toBe(true);

    // Verify the todo was actually deleted from the database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();

    expect(todos).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent todo', async () => {
    // Try to delete a todo that doesn't exist
    const result = await deleteTodo({ id: 999 });

    // Should return false indicating no todo was deleted
    expect(result).toBe(false);
  });

  it('should not affect other todos when deleting one', async () => {
    // Create multiple test todos
    const todoId1 = await createTestTodo();
    const todoId2 = await createTestTodo();
    const todoId3 = await createTestTodo();

    // Delete only the second todo
    const result = await deleteTodo({ id: todoId2 });

    // Should return true
    expect(result).toBe(true);

    // Verify only the targeted todo was deleted
    const remainingTodos = await db.select()
      .from(todosTable)
      .execute();

    expect(remainingTodos).toHaveLength(2);
    
    const remainingIds = remainingTodos.map(todo => todo.id);
    expect(remainingIds).toContain(todoId1);
    expect(remainingIds).toContain(todoId3);
    expect(remainingIds).not.toContain(todoId2);
  });

  it('should handle deletion of already completed todos', async () => {
    // Create a completed todo
    const result = await db.insert(todosTable)
      .values({
        title: 'Completed Todo',
        description: 'A completed todo for testing deletion',
        completed: true
      })
      .returning()
      .execute();

    const completedTodoId = result[0].id;

    // Delete the completed todo
    const deleteResult = await deleteTodo({ id: completedTodoId });

    // Should successfully delete completed todos
    expect(deleteResult).toBe(true);

    // Verify it was deleted
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, completedTodoId))
      .execute();

    expect(todos).toHaveLength(0);
  });

  it('should handle deletion of todos with null descriptions', async () => {
    // Create a todo with null description
    const result = await db.insert(todosTable)
      .values({
        title: 'Todo with null description',
        description: null,
        completed: false
      })
      .returning()
      .execute();

    const todoId = result[0].id;

    // Delete the todo
    const deleteResult = await deleteTodo({ id: todoId });

    // Should successfully delete
    expect(deleteResult).toBe(true);

    // Verify it was deleted
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();

    expect(todos).toHaveLength(0);
  });
});