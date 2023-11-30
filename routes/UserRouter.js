const express = require("express")
const router = express.Router()

const logger = require("../utils/LogFile")
const query = require("../utils/DbUtils")
const genid = require("../utils/GenIdUtils")
const jwt = require("jsonwebtoken")
require("dotenv").config()
const secretKey = process.env.JWT_SECRET_KEY

router.post("/register", async (req,res) => {
    try {
        let { username,password } = req.body
        if (username === undefined || password === undefined) {
            res.status(400).send({
                success : false,
                msg  : "Required parameters are missing."
            })
            return
        }
        if (username.length <= 1 || username.length >= 10) {
            res.status(400).send({
                success :false,
                msg     : "Bad Request. The provided username has an invalid format."
            })
            return
        }
        let sql = "SELECT * FROM `user` WHERE `username` = ?"
        let rows = await query(sql,[username])
        if (rows.length > 0) {
            res.status(200).send({
                success : false,
                msg  : "Username already exists."
            })
            return
        }
        let signup_sql = "INSERT INTO  `user` (`id`,`username`,`password`) VALUES (?,?,?)"
        let signup_params = [genid.NextId(),username,password]

        await query(signup_sql,signup_params)
        logger.info(`User: ${username} registered.`)
        res.status(200).send({
            success : true,
            msg     : "Register successfully."
        })
    } catch ( err ) {
        logger.error(err)
        res.status(500).send({
            success : false,
            msg     : "Unknown error."
        })
    }
})

router.post("/login", async (req, res) => {
    try {
        let { username, password } = req.body
        if (username === undefined || password === undefined) {
            res.status(400).send({
                success : false,
                msg  : "Required parameters are missing."
            })
            return
        }
        let sql = "SELECT * FROM `user` WHERE `username` =? AND `password` =?"
        let rows = await query(sql,[username, password])
        if (rows.length === 0) {
            res.status(200).send({
                success : false,
                msg     : "Invalid username or password."
            })
            return
        }
        let payload = {
            id  : rows[0].id,
            username:   rows[0].username
        }
        let login_token = jwt.sign(payload,secretKey, {expiresIn : 60 * 60 * 24 * 7})
        //Update token
        await query("UPDATE `user` SET `token` =? WHERE `id` =?", [login_token, rows[0].id])

        logger.info(`User: ${rows[0].username} logged in.`)

        res.status(200).send({
            success : true,
            msg     : "Login successfully.",
            info    : {
                id      : rows[0].id,
                username: rows[0].username,
                token   : login_token
            }
        })
    } catch (err) {
        logger.error(err)
        res.status(500).send({
            success : false,
            msg     : "Unknown error."
        })
    }
})

module.exports = router