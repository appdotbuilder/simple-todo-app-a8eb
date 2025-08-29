import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type CreateTodoInput } from '../schema';
import { getTodos } from '../handlers/get_todos';

describe('getTodos', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no todos exist', async () => {
    const result = await getTodos();

    expect(result).toEqual([]);
  });

  it('should return all todos', async () => {
    // Create test todos
    const testTodos = [
      { title: 'First Todo', description: 'First description' },
      { title: 'Second Todo', description: null },
      { title: 'Third Todo', description: 'Third description' }
    ];

    // Insert todos directly into database
    const insertedTodos = await db.insert(todosTable)
      .values(testTodos)
      .returning()
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(3);
    expect(result.every(todo => todo.id !== undefined)).toBe(true);
    expect(result.every(todo => todo.created_at instanceof Date)).toBe(true);
    expect(result.every(todo => todo.updated_at instanceof Date)).toBe(true);
    
    // Check that all titles are present
    const titles = result.map(todo => todo.title);
    expect(titles).toContain('First Todo');
    expect(titles).toContain('Second Todo');
    expect(titles).toContain('Third Todo');
  });

  it('should return todos ordered by created_at (newest first)', async () => {
    // Create todos with slight delays to ensure different timestamps
    await db.insert(todosTable)
      .values({ title: 'Oldest Todo', description: 'First created' })
      .execute();

    // Small delay to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(todosTable)
      .values({ title: 'Middle Todo', description: 'Second created' })
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(todosTable)
      .values({ title: 'Newest Todo', description: 'Last created' })
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(3);
    
    // Verify ordering - newest first
    expect(result[0].title).toBe('Newest Todo');
    expect(result[2].title).toBe('Oldest Todo');
    
    // Verify timestamps are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should return todos with all required fields', async () => {
    // Create a todo with specific values
    const testTodo = {
      title: 'Test Todo',
      description: 'Test description',
      completed: true
    };

    await db.insert(todosTable)
      .values(testTodo)
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(1);
    const todo = result[0];

    // Verify all fields are present and have correct types
    expect(typeof todo.id).toBe('number');
    expect(typeof todo.title).toBe('string');
    expect(typeof todo.description).toBe('string');
    expect(typeof todo.completed).toBe('boolean');
    expect(todo.created_at).toBeInstanceOf(Date);
    expect(todo.updated_at).toBeInstanceOf(Date);

    // Verify values
    expect(todo.title).toBe('Test Todo');
    expect(todo.description).toBe('Test description');
    expect(todo.completed).toBe(true);
  });

  it('should handle todos with null descriptions', async () => {
    // Create todo with null description
    await db.insert(todosTable)
      .values({
        title: 'Todo with null description',
        description: null,
        completed: false
      })
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(1);
    expect(result[0].description).toBe(null);
    expect(result[0].title).toBe('Todo with null description');
    expect(result[0].completed).toBe(false);
  });

  it('should handle mixed completed states', async () => {
    // Create todos with different completion states
    const todos = [
      { title: 'Completed Todo', description: 'Done', completed: true },
      { title: 'Incomplete Todo', description: 'Not done', completed: false },
      { title: 'Another Incomplete', description: null, completed: false }
    ];

    await db.insert(todosTable)
      .values(todos)
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(3);
    
    const completedTodos = result.filter(todo => todo.completed);
    const incompleteTodos = result.filter(todo => !todo.completed);

    expect(completedTodos).toHaveLength(1);
    expect(incompleteTodos).toHaveLength(2);
    expect(completedTodos[0].title).toBe('Completed Todo');
  });
});