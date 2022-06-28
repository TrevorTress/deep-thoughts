// import json web token
const jwt = require('jsonwebtoken');

// establish secret and session expiration
const secret = 'mysecretsshhhhh';
const expiration = '2h';

// export signToken and auth functions for use
module.exports = {
    // function takes an object with username, email, and makes it 'payload'
    // returns 
    signToken: function({ username, email, _id }) {
        const payload = { username, email, _id };

        return jwt.sign({ data: payload }, secret, { expiresIn: expiration });
    },

    authMiddleware: function({ req }) {
        // allows token to be sent via req.body, req.query, or headers
        let token = req.body.token || req.query.token || req.headers.authorization;
    
        // separate "Bearer" from "<tokenvalue>"
        if (req.headers.authorization) {
            token = token
            .split(' ')
            .pop()
            .trim();
        }
    
        // if no token, return request object as is
        if (!token) {
            return req;
        }
    
        try {
            // decode and attach user data to request object
            const { data } = jwt.verify(token, secret, { maxAge: expiration });
            req.user = data;
        } catch {
            console.log('Invalid token');
        }
    
        // return updated request object
        return req;
    }
};