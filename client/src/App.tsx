import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PlusIcon, Edit2Icon, Trash2Icon, CheckIcon } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Todo, CreateTodoInput, UpdateTodoInput } from '../../server/src/schema';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Form state for creating new todos
  const [createFormData, setCreateFormData] = useState<CreateTodoInput>({
    title: '',
    description: null
  });

  // Form state for editing todos
  const [editFormData, setEditFormData] = useState<Partial<UpdateTodoInput>>({
    title: '',
    description: null
  });

  const loadTodos = useCallback(async () => {
    try {
      const result = await trpc.getTodos.query();
      setTodos(result);
    } catch (error) {
      console.error('Failed to load todos:', error);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFormData.title.trim()) return;

    setIsLoading(true);
    try {
      const newTodo = await trpc.createTodo.mutate(createFormData);
      setTodos((prev: Todo[]) => [newTodo, ...prev]);
      setCreateFormData({ title: '', description: null });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create todo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    try {
      const updatedTodo = await trpc.updateTodo.mutate({
        id: todo.id,
        completed: !todo.completed
      });
      
      if (updatedTodo) {
        setTodos((prev: Todo[]) => 
          prev.map((t: Todo) => t.id === todo.id ? updatedTodo : t)
        );
      }
    } catch (error) {
      console.error('Failed to toggle todo completion:', error);
    }
  };

  const handleEditTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTodo || !editFormData.title?.trim()) return;

    setIsLoading(true);
    try {
      const updatedTodo = await trpc.updateTodo.mutate({
        id: editingTodo.id,
        title: editFormData.title,
        description: editFormData.description
      });

      if (updatedTodo) {
        setTodos((prev: Todo[]) => 
          prev.map((t: Todo) => t.id === editingTodo.id ? updatedTodo : t)
        );
        setIsEditDialogOpen(false);
        setEditingTodo(null);
        setEditFormData({ title: '', description: null });
      }
    } catch (error) {
      console.error('Failed to update todo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTodo = async (todoId: number) => {
    try {
      const success = await trpc.deleteTodo.mutate({ id: todoId });
      if (success) {
        setTodos((prev: Todo[]) => prev.filter((t: Todo) => t.id !== todoId));
      }
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const openEditDialog = (todo: Todo) => {
    setEditingTodo(todo);
    setEditFormData({
      title: todo.title,
      description: todo.description
    });
    setIsEditDialogOpen(true);
  };

  const completedCount = todos.filter((todo: Todo) => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">📝 Todo App</h1>
          <p className="text-gray-600">Stay organized and get things done!</p>
          <div className="flex justify-center gap-4 mt-4">
            <Badge variant="secondary" className="text-sm">
              {completedCount} completed
            </Badge>
            <Badge variant="outline" className="text-sm">
              {totalCount - completedCount} remaining
            </Badge>
          </div>
        </div>

        {/* Create Todo Button */}
        <div className="flex justify-center mb-6">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
                <PlusIcon className="mr-2 h-4 w-4" />
                Add New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Add a new task to your todo list. Fill in the details below.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateTodo}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Task Title *</label>
                    <Input
                      placeholder="What do you need to do?"
                      value={createFormData.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCreateFormData((prev: CreateTodoInput) => ({ 
                          ...prev, 
                          title: e.target.value 
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description (Optional)</label>
                    <Textarea
                      placeholder="Add more details about this task..."
                      value={createFormData.description || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setCreateFormData((prev: CreateTodoInput) => ({ 
                          ...prev, 
                          description: e.target.value || null 
                        }))
                      }
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create Task'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Todo List */}
        {todos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No tasks yet!</h3>
            <p className="text-gray-500">Create your first task to get started.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {todos.map((todo: Todo) => (
              <Card key={todo.id} className={`transition-all hover:shadow-md ${
                todo.completed ? 'bg-green-50 border-green-200' : 'bg-white'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() => handleToggleComplete(todo)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <h3 className={`font-semibold text-lg ${
                        todo.completed 
                          ? 'line-through text-gray-500' 
                          : 'text-gray-800'
                      }`}>
                        {todo.title}
                      </h3>
                      {todo.description && (
                        <p className={`text-sm mt-1 ${
                          todo.completed 
                            ? 'text-gray-400' 
                            : 'text-gray-600'
                        }`}>
                          {todo.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-xs text-gray-400">
                          Created: {todo.created_at.toLocaleDateString()}
                        </span>
                        {todo.completed && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                            <CheckIcon className="mr-1 h-3 w-3" />
                            Completed
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(todo)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit2Icon className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Task</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{todo.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteTodo(todo.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
              <DialogDescription>
                Update your task details below.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditTodo}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Task Title *</label>
                  <Input
                    placeholder="What do you need to do?"
                    value={editFormData.title || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: Partial<UpdateTodoInput>) => ({ 
                        ...prev, 
                        title: e.target.value 
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description (Optional)</label>
                  <Textarea
                    placeholder="Add more details about this task..."
                    value={editFormData.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setEditFormData((prev: Partial<UpdateTodoInput>) => ({ 
                        ...prev, 
                        description: e.target.value || null 
                      }))
                    }
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Task'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default App;