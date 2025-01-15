import {  DynamoDBClient, PutItemCommand, } from '@aws-sdk/client-dynamodb'
import * as AWSXRay from 'aws-xray-sdk-core'
import { marshall } from "@aws-sdk/util-dynamodb";
import {TodoItem} from "../models/TodoItem";

export class TodosAccess {

    constructor(
        private readonly dynamoDbClient = AWSXRay.captureAWSv3Client(
            new DynamoDBClient({ region: "us-east-1" })
        ),
        private readonly todosTable = process.env.TODOS_TABLE,
    ) {}

    async createTodoItem(todoItem: TodoItem) {
        await this.dynamoDbClient.send(new PutItemCommand({
            TableName: this.todosTable,
            Item: marshall(todoItem),
        }));
    }

}