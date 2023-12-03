const express = require("express")
const router = express.Router()
const { exec } = require("child_process")
const logger = require("../utils/LogFile")
const query = require("../utils/DbUtils")
const jwt = require("jsonwebtoken")
require("dotenv").config()
const secretKey = process.env.JWT_SECRET_KEY
router.get("/_user/getByRand", async (req,res) => {
    try {
        let { num } = req.query
        if (num === undefined || isNaN(num)) {
            num = 10
        }
        num = Number(num)
        if (num > 50) {
            num = 50
        }
        let sql = "SELECT * FROM movieinfo where movieid > 100000 ORDER BY rand() LIMIT ?"
        let rows = await query(sql, [num])
        res.status(200).send({
            success: true,
            msg: "Get movies successfully.",
            length: rows.length,
            info: rows
        })
    } catch (err) {
        logger.error(err);
        res.status(500).send({
            success: false,
            msg: "Unknown error."
        })
    }
})


router.post("/_user/submitRating", async (req, res) => {
    try {
        let { movieid, rating } = req.body
        if ( isNaN(movieid) || movieid === undefined || isNaN(rating) || rating === undefined ) {
            res.status(400).send({
                success : false,
                msg     : "Invalid input."
            })
            return
        }
        movieid = Number(movieid)
        rating = Number(rating)
        if (rating > 5) {
            res.status(400).send({
                success : false,
                msg     : "Invalid input."
            })
            return
        }
        let token = req.headers.token
        let userid = jwt.verify(token, secretKey).id
        let sql = "insert into personalratings set ?"
        let data = {
            userid,
            movieid,
            rating,
            timestamp   : new Date().getTime()
        }
        await query(sql,data)
        res.status(200).send({
            success : true,
            msg     : "Submit rating successfully."
        })
    } catch ( err ) {
        logger.error(err);
        res.status(500).send({
            success: false,
            msg: "Unknown error."
        })
    }
})

router.get("/_user/getRecommends", async  (req, res) => {
    try {
        let token = req.headers.token
        let userid = jwt.verify(token, secretKey).id
        let sql = "SELECT `movieid` FROM `recommendresult` WHERE `userid` = ?"
        let rows = await query(sql,userid)
        if (rows.length === 0) {
            res.status(200).send({
                success : true,
                msg     : "No recommends for you.",
                length  : 0,
		info	: []
            })
	    return
        }
        let movieids = rows.map(item => item.movieid)
        let sql2 = "SELECT * FROM `movieinfo` WHERE `movieid` IN (?)"
        let rows2 = await query(sql2, [movieids])
        res.status(200).send({
            success : true,
            msg     : "Get results successfully.",
            length  : rows2.length,
            info    : rows2
        })
    } catch ( err ) {
        logger.error(err);
        res.status(500).send({
            success: false,
            msg: "Unknown error."
        })
    }
})

router.get("/_user/runSpark", async (req, res) => {
    try {
        let token = req.headers.token
        let userid = jwt.verify(token, secretKey).id
        let command = "/usr/local/spark/bin/spark-submit --class recommend.MovieLensALS ~/Downloads/Film_Recommend/out/artifacts/Film_Recommend_jar/Film_Recommend.jar ~/Downloads/ "+userid
        exec(command,(error, stdout, stderr) => {
            if (error) {
                logger.error(`${error.message}`);
                res.status(500).send({
                    success : false,
                    msg     : "Program failed.",
                    errInfo : error.message
                })
                return;
            }
            res.status(200).send({
                success : true,
                msg     : "Program finished."
            })
        })
    } catch ( err ) {
        logger.error(err);
        res.status(500).send({
            success: false,
            msg: "Unknown error."
        })
    }
})

module.exports = router

