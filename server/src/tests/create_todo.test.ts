import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type CreateTodoInput } from '../schema';
import { createTodo } from '../handlers/create_todo';
import { eq } from 'drizzle-orm';

// Test inputs with different scenarios
const basicInput: CreateTodoInput = {
  title: 'Test Todo',
  description: 'A todo for testing'
};

const nullDescriptionInput: CreateTodoInput = {
  title: 'Todo without description',
  description: null
};

const undefinedDescriptionInput: CreateTodoInput = {
  title: 'Todo with undefined description'
  // description is omitted (undefined)
};

describe('createTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a todo with description', async () => {
    const result = await createTodo(basicInput);

    // Basic field validation
    expect(result.title).toEqual('Test Todo');
    expect(result.description).toEqual('A todo for testing');
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a todo with null description', async () => {
    const result = await createTodo(nullDescriptionInput);

    expect(result.title).toEqual('Todo without description');
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a todo with undefined description (converts to null)', async () => {
    const result = await createTodo(undefinedDescriptionInput);

    expect(result.title).toEqual('Todo with undefined description');
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save todo to database correctly', async () => {
    const result = await createTodo(basicInput);

    // Query database to verify persistence
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, result.id))
      .execute();

    expect(todos).toHaveLength(1);
    const savedTodo = todos[0];
    
    expect(savedTodo.title).toEqual('Test Todo');
    expect(savedTodo.description).toEqual('A todo for testing');
    expect(savedTodo.completed).toEqual(false);
    expect(savedTodo.created_at).toBeInstanceOf(Date);
    expect(savedTodo.updated_at).toBeInstanceOf(Date);
  });

  it('should create multiple todos with unique IDs', async () => {
    const todo1 = await createTodo({
      title: 'First Todo',
      description: 'First description'
    });

    const todo2 = await createTodo({
      title: 'Second Todo',
      description: 'Second description'
    });

    expect(todo1.id).not.toEqual(todo2.id);
    expect(todo1.title).toEqual('First Todo');
    expect(todo2.title).toEqual('Second Todo');

    // Verify both are saved to database
    const todos = await db.select()
      .from(todosTable)
      .execute();

    expect(todos).toHaveLength(2);
  });

  it('should set timestamps correctly', async () => {
    const beforeCreation = new Date();
    const result = await createTodo(basicInput);
    const afterCreation = new Date();

    // Timestamps should be within reasonable range
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());

    // For new todos, created_at and updated_at should be the same (or very close)
    expect(Math.abs(result.created_at.getTime() - result.updated_at.getTime())).toBeLessThan(1000);
  });

  it('should handle long titles correctly', async () => {
    const longTitle = 'A'.repeat(255); // Test with long but reasonable title
    const result = await createTodo({
      title: longTitle,
      description: 'Test with long title'
    });

    expect(result.title).toEqual(longTitle);
    expect(result.description).toEqual('Test with long title');
  });
});