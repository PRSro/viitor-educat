import { ServiceResponse } from '../types/service.js';
import { AppError } from '../errors/AppError.js';

export abstract class BaseService {
    protected success<T>(data: T, meta?: any): ServiceResponse<T> {
        return { success: true, data, meta };
    }

    protected error(error: unknown): ServiceResponse {
        if (error instanceof AppError) {
            return {
                success: false,
                errorCode: error.errorCode,
                message: error.message
            };
        }

        if (error instanceof Error) {
            // Log sensitive details only in dev if possible, but for now keep it simple
            return {
                success: false,
                errorCode: 'INTERNAL_ERROR',
                message: error.message
            };
        }

        return {
            success: false,
            errorCode: 'UNKNOWN_ERROR',
            message: 'An unexpected error occurred'
        };
    }
}
