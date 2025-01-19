import 'source-map-support/register';
import {updateTodo} from '../../businessLogic/todos';
import middy from '@middy/core'
import cors from '@middy/http-cors'
import httpErrorHandler from '@middy/http-error-handler'
import {getToken, getUserId} from "../../auth/jwt";
import {APIGatewayProxyEvent} from "aws-lambda";
import {TodoUpdate} from "../../models/TodoUpdate";

export const handler = middy()
    .use(httpErrorHandler())
    .use(
        cors({
          credentials: true
        })
    )
    .handler(async (event: APIGatewayProxyEvent) => {
      const todoId = event.pathParameters.todoId;
      const updateData: TodoUpdate = JSON.parse(event.body);

      try {
        const jwtToken: string = getToken(event);
        await updateTodo(getUserId(jwtToken), todoId, updateData);
        return {
          statusCode: 204,
            body: JSON.stringify({todoId})
        };
      } catch (error) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error })
        };
      }
    });