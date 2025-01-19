import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";
import cors from "@middy/http-cors";
import {APIGatewayProxyEvent} from "aws-lambda";
import {getToken, getUserId} from "../../auth/jwt";
import {TodoItem} from "../../models/TodoItem";
import { getTodos} from "../../businessLogic/todos";


export const handler = middy()
    .use(httpErrorHandler())
    .use(
        cors({
          credentials: true
        })
    )
    .handler(async (event: APIGatewayProxyEvent) => {
      try {
        const jwtToken: string = getToken(event);
        const todos: TodoItem[] = await getTodos(getUserId(jwtToken));
        return {
          statusCode: 200,
          body: JSON.stringify({ items: todos })
        };
      } catch (error) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error })
        };
      }
    });