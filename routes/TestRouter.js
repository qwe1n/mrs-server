const express = require("express")
const router = express.Router()

const query = require("../utils/DbUtils")
const genid = require("../utils/GenIdUtils")

router.get("/test", async (req,res) => {
    try {
        let rows = await query("SELECT * FROM `user`")
        console.log(rows[0])
    } catch (err) {
        console.log(err)
    }
    res.send({
        code: 200,
        msg: "test ok"
    })
})

module.exports = router