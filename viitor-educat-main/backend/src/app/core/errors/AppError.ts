export class AppError extends Error {
    constructor(
        public errorCode: string,
        public message: string,
        public statusCode: number = 400
    ) {
        super(message);
        this.name = 'AppError';
    }

    static NotFound(message = 'Resource not found') {
        return new AppError('NOT_FOUND', message, 404);
    }

    static Forbidden(message = 'Access denied') {
        return new AppError('FORBIDDEN', message, 403);
    }

    static Unauthorized(message = 'Unauthorized') {
        return new AppError('UNAUTHORIZED', message, 401);
    }

    static BadRequest(message = 'Bad request') {
        return new AppError('BAD_REQUEST', message, 400);
    }

    static Internal(message = 'Internal server error') {
        return new AppError('INTERNAL_ERROR', message, 500);
    }
}
