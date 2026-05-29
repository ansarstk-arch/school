export const responseMiddleware = (req, res, next) => {
    res.respond = function(status, message = "Success", data = null){
        const responseBody = {
            success: status >= 200 && status < 300, 
            message: message, 
            status: status
        };
        if(data && typeof data === "object"){
            Object.assign(responseBody, {data});
        }
        res.status(status).json(responseBody);
    }
    next();
}
