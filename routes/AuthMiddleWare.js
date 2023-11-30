const jwt = require("jsonwebtoken");
const query = require("../utils/DbUtils");
const logger = require("../utils/LogFile");
require("dotenv").config()
const secretKey = process.env.JWT_SECRET_KEY

const USER_TOKEN_PATH = "/_user"
const AuthMiddleWare = async (req, res, next) => {
    if (req.path.indexOf(USER_TOKEN_PATH) > -1) {
        const query  = require("../utils/DbUtils")
        const genid = require("../utils/GenIdUtils")
        let token = req.headers.token
        if (token === undefined) {
            res.status(401).send({
                success : false,
                msg     : "Please login in."
            })
            return
        }
        try {
            let decoded = jwt.verify(token, secretKey)
            let id = decoded.id;
            let sql = "SELECT * FROM `user` WHERE `token` = ? AND `id` = ?"
            try {
                let rows = await query(sql, [token, id])
                if (rows.length === 0) {
                    res.status(401).send({
                        success : false,
                        msg     : "Please login in again."
                    })
                    return
                }
            } catch ( err ) {
                logger.error(err)
                res.status(500).send({
                    success : false,
                    msg     : "Unknown error."
                })
                return
            }
        } catch ( err ) {
            logger.error(err)
            if (err) {
                res.status(400).send({
                    success : false,
                    msg     : "Invalid token"
                })
                return
            }
        }
        next()
    } else {
        next()
    }
}

module.exports = AuthMiddleWare