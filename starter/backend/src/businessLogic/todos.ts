import * as uuid from 'uuid'

import { TodosAccess } from '../dataLayer/todosAccess'
import { TodoItem } from '../models/TodoItem'

const todosAccess = new TodosAccess()

interface CreateTodoRequest {
    name: string
    dueDate: string
}

export async function createTodo(userId: string, createTodoRequest: CreateTodoRequest): Promise<TodoItem> {
    const todoId = uuid.v4()

    const newItem: TodoItem = {
        userId,
        todoId,
        createdAt: new Date().toISOString(),
        done: false,
        attachmentUrl: null,
        ...createTodoRequest
    }

    await todosAccess.createTodoItem(newItem)

    return newItem
}
