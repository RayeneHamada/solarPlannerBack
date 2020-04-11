 
const jwt = require('jsonwebtoken');

module.exports.verifyUserJwtToken = (req, res, next) => {
    var token;
    if ('authorization' in req.headers)
       { token = req.headers['authorization'].split(' ')[1];
    }
        

    if (!token)
        return res.status(403).send({ auth: false, message: 'No token provided.' });
    else {
        jwt.verify(token, process.env.JWT_SECRET,
            (err, decoded) => {
                if (err)
                    return res.status(500).send({ auth: false, message: 'Token authentication failed.' });
                else {
                    if(decoded.role != 'user')
                    {
                        return res.status(403).send({ auth: false, message: 'You should respect users privacy' });
                    }
                    else{
                        req._id = decoded._id;
                    next();
                    }
                }
            }
        )
    }
}
module.exports.verifyAdminJwtToken = (req, res, next) => {
    var token;
    if ('authorization' in req.headers)
       { token = req.headers['authorization'].split(' ')[1];
    }
        

    if (!token)
        return res.status(403).send({ auth: false, message: 'No token provided.' });
    else {
        jwt.verify(token, process.env.JWT_SECRET,
            (err, decoded) => {
                if (err)
                    return res.status(500).send({ auth: false, message: 'Token authentication failed.' });
                else {
                    if(decoded.role != 'admin')
                    {
                        return res.status(403).send({ auth: false, message: 'Permission Denied' });
                    }
                    else{
                        req._id = decoded._id;
                    next();
                    }
                    
                }
            }
        )
    }
}