import 'source-map-support/register';
import { generateUploadUrl} from '../../businessLogic/todos';
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
        const signedUrl: string = await generateUploadUrl(
            getUserId(jwtToken)
            , todoId);
        return {
          statusCode: 201, body: JSON.stringify({uploadUrl: signedUrl})
        };
      } catch (error) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error })
        };
      }
    });