const errorHandler = (error: any) => {
    if (!error.originalError) {
        return error
    }
    const message = error.message || 'Error occurred';
    const status = error.originalError.statusCode || 500;
    const data = error.originalError.data || [];
    return {
        message,
        status,
        data: data.map((err:any) => ({...err.statusCode,message:err.message}))
    };
}

export default errorHandler;