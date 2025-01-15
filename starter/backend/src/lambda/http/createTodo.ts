import 'source-map-support/register';
import { createTodo } from '../../businessLogic/todos';
import { TodoItem } from '../../models/TodoItem';
import { TodoCreate } from '../../models/TodoCreate';
import middy from '@middy/core'
import cors from '@middy/http-cors'
import httpErrorHandler from '@middy/http-error-handler'
import {getToken, getUserId} from "../../auth/jwt";
import {APIGatewayProxyEvent} from "aws-lambda";

export const handler = middy()
    .use(httpErrorHandler())
    .use(
        cors({
          credentials: true
        })
    )
    .handler(async (event: APIGatewayProxyEvent) => {
  const newTodoData: TodoCreate = JSON.parse(event.body);

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