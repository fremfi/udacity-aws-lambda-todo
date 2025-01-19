import 'source-map-support/register';
import {deleteTodo} from '../../businessLogic/todos';
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
        const todoId = event.pathParameters.todoId;
      try {
        const jwtToken: string = getToken(event);
        await deleteTodo(getUserId(jwtToken), todoId);
        return {
          statusCode: 200, body: JSON.stringify({todoId})
        };
      } catch (error) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error })
        };
      }
    });