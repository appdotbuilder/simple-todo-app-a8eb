import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoInput } from '../schema';
import { updateTodo } from '../handlers/update_todo';
import { eq } from 'drizzle-orm';

describe('updateTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test todo
  const createTestTodo = async () => {
    const result = await db.insert(todosTable)
      .values({
        title: 'Original Todo',
        description: 'Original description',
        completed: false
      })
      .returning()
      .execute();
    
    return result[0];
  };

  it('should update a todo title only', async () => {
    const testTodo = await createTestTodo();
    const originalUpdatedAt = testTodo.updated_at;

    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      title: 'Updated Title'
    };

    const result = await updateTodo(updateInput);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(testTodo.id);
    expect(result!.title).toEqual('Updated Title');
    expect(result!.description).toEqual('Original description'); // Should remain unchanged
    expect(result!.completed).toEqual(false); // Should remain unchanged
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at > originalUpdatedAt).toBe(true);
  });

  it('should update todo description to null', async () => {
    const testTodo = await createTestTodo();

    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      description: null
    };

    const result = await updateTodo(updateInput);

    expect(result).toBeDefined();
    expect(result!.title).toEqual('Original Todo'); // Should remain unchanged
    expect(result!.description).toBeNull();
    expect(result!.completed).toEqual(false); // Should remain unchanged
  });

  it('should update todo description to a new value', async () => {
    const testTodo = await createTestTodo();

    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      description: 'New description'
    };

    const result = await updateTodo(updateInput);

    expect(result).toBeDefined();
    expect(result!.description).toEqual('New description');
    expect(result!.title).toEqual('Original Todo'); // Should remain unchanged
    expect(result!.completed).toEqual(false); // Should remain unchanged
  });

  it('should update completed status', async () => {
    const testTodo = await createTestTodo();

    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      completed: true
    };

    const result = await updateTodo(updateInput);

    expect(result).toBeDefined();
    expect(result!.completed).toEqual(true);
    expect(result!.title).toEqual('Original Todo'); // Should remain unchanged
    expect(result!.description).toEqual('Original description'); // Should remain unchanged
  });

  it('should update multiple fields at once', async () => {
    const testTodo = await createTestTodo();

    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      title: 'Completely Updated',
      description: 'Updated description',
      completed: true
    };

    const result = await updateTodo(updateInput);

    expect(result).toBeDefined();
    expect(result!.title).toEqual('Completely Updated');
    expect(result!.description).toEqual('Updated description');
    expect(result!.completed).toEqual(true);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated todo to database', async () => {
    const testTodo = await createTestTodo();

    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      title: 'Database Test Update'
    };

    await updateTodo(updateInput);

    // Verify the change was persisted
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, testTodo.id))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].title).toEqual('Database Test Update');
    expect(todos[0].description).toEqual('Original description');
    expect(todos[0].completed).toEqual(false);
  });

  it('should return null for non-existent todo', async () => {
    const updateInput: UpdateTodoInput = {
      id: 99999, // Non-existent ID
      title: 'Should not work'
    };

    const result = await updateTodo(updateInput);

    expect(result).toBeNull();
  });

  it('should handle todo with null description originally', async () => {
    // Create todo with null description
    const todoResult = await db.insert(todosTable)
      .values({
        title: 'No Description Todo',
        description: null,
        completed: false
      })
      .returning()
      .execute();
    
    const testTodo = todoResult[0];

    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      description: 'Adding description now'
    };

    const result = await updateTodo(updateInput);

    expect(result).toBeDefined();
    expect(result!.description).toEqual('Adding description now');
    expect(result!.title).toEqual('No Description Todo');
  });

  it('should always update the updated_at timestamp', async () => {
    const testTodo = await createTestTodo();
    const originalUpdatedAt = testTodo.updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      completed: true
    };

    const result = await updateTodo(updateInput);

    expect(result).toBeDefined();
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at > originalUpdatedAt).toBe(true);
  });
});