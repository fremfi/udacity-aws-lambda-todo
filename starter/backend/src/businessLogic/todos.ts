import * as uuid from 'uuid'

import { TodosAccess } from '../dataLayer/todosAccess'
import { TodoItem } from '../models/TodoItem'
import {TodoUpdate} from "../models/TodoUpdate";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {createLogger} from "../utils/logger.mjs";

const logger = createLogger('todosBusinessLogic');

const todosAccess = new TodosAccess()

interface CreateTodoRequest {
    name: string
    dueDate: string
}

export async function getTodos(userId: string): Promise<TodoItem[]> {
    logger.info('Getting all todo items');
    return todosAccess.getTodos(userId);
}

export async function createTodo(userId: string, createTodoRequest: CreateTodoRequest): Promise<TodoItem> {
    logger.info(`Creating new todo item for user: ${userId}`);
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

export async function updateTodo(
    userId: string,
    todoId: string,
    updateTodo: TodoUpdate
): Promise<void> {
    logger.info(`Updating todo item: ${todoId}`);
    await todosAccess.updateTodo(userId, todoId, updateTodo);
}

export async function deleteTodo(userId: string, todoId: string): Promise<void> {
    logger.info(`Deleting todo item: ${todoId}`);
    await todosAccess.deleteTodo(userId, todoId);
}

export async function generateUploadUrl(userId: string, todoId: string): Promise<string> {
    logger.info(`Generating upload URL for todo item: ${todoId}`);
    const bucketName = process.env.IMAGES_S3_BUCKET;
    const urlExpiration = parseInt(process.env.SIGNED_URL_EXPIRATION, 10);

    const s3Client = new S3Client({ region: 'us-east-1' });

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: todoId,
    });
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: urlExpiration });

    await todosAccess.saveImgUrl(userId, todoId, bucketName);

    return signedUrl;
}