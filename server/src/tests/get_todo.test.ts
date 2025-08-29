import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type GetTodoInput } from '../schema';
import { getTodo } from '../handlers/get_todo';

describe('getTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a todo when it exists', async () => {
    // Create a test todo
    const testTodo = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'A todo for testing',
        completed: false
      })
      .returning()
      .execute();

    const createdTodo = testTodo[0];
    
    // Test the handler
    const input: GetTodoInput = { id: createdTodo.id };
    const result = await getTodo(input);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdTodo.id);
    expect(result!.title).toEqual('Test Todo');
    expect(result!.description).toEqual('A todo for testing');
    expect(result!.completed).toEqual(false);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when todo does not exist', async () => {
    // Try to get a non-existent todo
    const input: GetTodoInput = { id: 999 };
    const result = await getTodo(input);

    expect(result).toBeNull();
  });

  it('should return correct todo when multiple todos exist', async () => {
    // Create multiple test todos
    const todos = await db.insert(todosTable)
      .values([
        { title: 'First Todo', description: 'First description', completed: false },
        { title: 'Second Todo', description: 'Second description', completed: true },
        { title: 'Third Todo', description: null, completed: false }
      ])
      .returning()
      .execute();

    // Get the second todo specifically
    const input: GetTodoInput = { id: todos[1].id };
    const result = await getTodo(input);

    // Verify we get the correct todo
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(todos[1].id);
    expect(result!.title).toEqual('Second Todo');
    expect(result!.description).toEqual('Second description');
    expect(result!.completed).toEqual(true);
  });

  it('should handle todos with null description', async () => {
    // Create a todo with null description
    const testTodo = await db.insert(todosTable)
      .values({
        title: 'Todo with null description',
        description: null,
        completed: true
      })
      .returning()
      .execute();

    const createdTodo = testTodo[0];
    
    // Test the handler
    const input: GetTodoInput = { id: createdTodo.id };
    const result = await getTodo(input);

    // Verify the result handles null description correctly
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdTodo.id);
    expect(result!.title).toEqual('Todo with null description');
    expect(result!.description).toBeNull();
    expect(result!.completed).toEqual(true);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return todo with different completion states', async () => {
    // Create todos with different completion states
    const completedTodo = await db.insert(todosTable)
      .values({
        title: 'Completed Todo',
        description: 'This is done',
        completed: true
      })
      .returning()
      .execute();

    const incompleteTodo = await db.insert(todosTable)
      .values({
        title: 'Incomplete Todo',
        description: 'This is not done',
        completed: false
      })
      .returning()
      .execute();

    // Test completed todo
    const completedInput: GetTodoInput = { id: completedTodo[0].id };
    const completedResult = await getTodo(completedInput);
    
    expect(completedResult).not.toBeNull();
    expect(completedResult!.completed).toEqual(true);
    expect(completedResult!.title).toEqual('Completed Todo');

    // Test incomplete todo
    const incompleteInput: GetTodoInput = { id: incompleteTodo[0].id };
    const incompleteResult = await getTodo(incompleteInput);
    
    expect(incompleteResult).not.toBeNull();
    expect(incompleteResult!.completed).toEqual(false);
    expect(incompleteResult!.title).toEqual('Incomplete Todo');
  });
});