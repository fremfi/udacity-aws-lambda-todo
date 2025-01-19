import 'source-map-support/register';
import { createTodo } from '../../businessLogic/todos';
import { TodoItem } from '../../models/TodoItem';
import { TodoCreate } from '../../models/TodoCreate';
import middy from '@middy/core'
import cors from '@middy/http-cors'
import httpErrorHandler from '@middy/http-error-handler'
import {getToken, getUserId} from "../../auth/jwt";
import {APIGatewayProxyEvent} from "aws-lambda";
import Ajv from 'ajv';

const ajv = new Ajv();

const createTodoSchema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "create-todo",
    "type": "object",
    "properties": {
        "name": {
            "type": "string",
            "pattern": "^[a-zA-Z0-9]+$",
            "minLength": 5,
            "maxLength": 20
        },
        "dueDate": {
            "type": "string",
            "pattern": "[0-9]{4}-[0-9]{2}-[0-9]{2}"
        }
    },
    "required": ["name", "dueDate"],
    "additionalProperties": {
        "properties": {
            "attachmentUrl": {
                "type": "string"
            }
        }
    }
};

const validateTodo = ajv.compile(createTodoSchema);

export const handler = middy()
    .use(httpErrorHandler())
    .use(
        cors({
          credentials: true
        })
    )
    .handler(async (event: APIGatewayProxyEvent) => {
    const newTodoData: TodoCreate = JSON.parse(event.body);
    const valid = validateTodo(newTodoData);

    if (!valid) {
        // If validation fails, return an error response
        return {
            statusCode: 400,
            body: JSON.stringify({
                error: 'Invalid input data',
                details: validateTodo.errors,
            })
        };
    }

    try {
      const jwtToken: string = getToken(event);
      const newTodo: TodoItem = await createTodo(getUserId(jwtToken), newTodoData);
      return {
          statusCode: 201,
          body: JSON.stringify({ newTodo })
      };
    } catch (error) {
      return {
          statusCode: 500,
          body: JSON.stringify({ error })
      };
    }
});