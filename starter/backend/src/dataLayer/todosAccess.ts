import {
    DeleteItemCommand,
    DynamoDBClient,
    GetItemCommand,
    PutItemCommand,
    UpdateItemCommand,
} from '@aws-sdk/client-dynamodb'
import * as AWSXRay from 'aws-xray-sdk-core'
import {marshall, unmarshall} from "@aws-sdk/util-dynamodb";
import {TodoItem} from "../models/TodoItem";
import { createLogger } from '../utils/logger.mjs';
import {QueryCommand} from "@aws-sdk/lib-dynamodb";
import {TodoUpdate} from "../models/TodoUpdate";

const logger = createLogger('todoAccess');
export class TodosAccess {

    constructor(
        private readonly dynamoDbClient = AWSXRay.captureAWSv3Client(
            new DynamoDBClient({ region: "us-east-1" })
        ),
        private readonly todosTable = process.env.TODOS_TABLE,
    ) {}

    async getTodos(userId: string): Promise<TodoItem[]> {
        logger.info('Getting all todo items');
        const result = await this.dynamoDbClient.send(new QueryCommand({
                TableName: this.todosTable,
                KeyConditionExpression: 'userId = :userId',
                ExpressionAttributeValues: {
                    ':userId': userId
                }
            }));
        return result.Items as TodoItem[];
    }

    async createTodoItem(todoItem: TodoItem) {
        logger.info(`Creating new todo item: ${todoItem.todoId}`);
        await this.dynamoDbClient.send(new PutItemCommand({
            TableName: this.todosTable,
            Item: marshall(todoItem),
        }));
    }

    async getTodo(userId: string, todoId: string): Promise<TodoItem> {
        logger.info(`Getting todo item: ${todoId}`);
        const result = await this.dynamoDbClient.send(new GetItemCommand({
            TableName: this.todosTable,
            Key: marshall({
                userId: userId,
                todoId: todoId
            })
        }));

        if (!result.Item) {
            throw new Error(`Todo item with ID: ${todoId} not found`);
        }

        return unmarshall(result.Item) as TodoItem;
    }

    async updateTodo(userId: string, todoId: string, updateData: TodoUpdate): Promise<void> {
        logger.info(`Updating a todo item: ${todoId}`);
        await this.dynamoDbClient.send(new UpdateItemCommand({
            TableName: this.todosTable,
            Key: marshall({
                userId: userId,
                todoId: todoId
            }),
            ConditionExpression: 'attribute_exists(todoId)',
            UpdateExpression: 'SET #n = :n, dueDate = :due, done = :dn',
            ExpressionAttributeNames: {
                '#n': 'name'
            },
            ExpressionAttributeValues: marshall({
                ':n': updateData.name,
                ':due': updateData.dueDate,
                ':dn': updateData.done
            })
        }));

        logger.info(`Todo item with ID: ${todoId} updated successfully`);
    }

    async deleteTodo(userId: string, todoId: string): Promise<void> {
        logger.info(`Deleting a todo item: ${todoId}`);
        await this.dynamoDbClient.send(new DeleteItemCommand({
            TableName: this.todosTable,
            Key: marshall({
                userId: userId,
                todoId: todoId
            })
        }));

        logger.info(`Todo item with ID: ${todoId} deleted successfully`);
    }

    async saveImgUrl(userId: string, todoId: string, bucketName: string): Promise<void> {
        logger.info(`Saving attachment URL for todo item: ${todoId}`);
        const attachmentUrl = `https://${bucketName}.s3.amazonaws.com/${todoId}`;

        await this.dynamoDbClient.send(
            new UpdateItemCommand({
                TableName: this.todosTable,
                Key: marshall({ userId, todoId }),
                ConditionExpression: 'attribute_exists(todoId)',
                UpdateExpression: 'SET attachmentUrl = :attachmentUrl',
                ExpressionAttributeValues: marshall({
                    ':attachmentUrl': attachmentUrl,
                }),
            })
        );
    }

}