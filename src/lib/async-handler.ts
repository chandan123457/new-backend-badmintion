import type { NextFunction, Request, RequestHandler, Response } from 'express';

// Express 4 does not catch rejections from async route handlers: an unhandled
// rejection takes the whole process down (Node >= 15). Wrapping every async
// handler routes the failure into the error middleware instead, so one bad
// query returns a 500 rather than killing the server.
export function asyncHandler<RequestType extends Request = Request>(
  handler: (request: RequestType, response: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (request, response, next) => {
    Promise.resolve(handler(request as unknown as RequestType, response, next)).catch(next);
  };
}
