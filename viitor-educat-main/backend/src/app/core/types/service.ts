export interface ServiceResponse<T = any> {
    success: boolean;
    data?: T;
    errorCode?: string;
    message?: string;
    meta?: any;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
