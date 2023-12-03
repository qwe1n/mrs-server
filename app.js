const express = require("express")
const path = require("path")
const multer = require("multer")
const FileStreamRotator = require("file-stream-rotator")
const fs = require("fs")
const morgan = require("morgan")
const bodyParser = require("body-parser")

const app = express()

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

//log
const logDirectory = path.join(__dirname, 'logs')
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory)
const accessLogStream = FileStreamRotator.getStream({
    date_format: 'YYYYMMDD',
    filename: path.join(logDirectory, 'access-%DATE%.log'),
    frequency: 'daily',
    verbose: false
})
app.use(morgan('combined', {stream: accessLogStream}))

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    res.header("Access-Control-Allow-Methods", "DELETE,PUT,POST,GET,OPTIONS");
    if (req.method === "OPTIONS") res.sendStatus(200);
    else next();
})

app.use(express.json())

const upload = multer({
    dest: "./public/upload/temp"
})

app.use(upload.any())

app.use(express.static(path.join(__dirname, "public")))

//Auth
app.all("*",require("./routes/AuthMiddleWare"))

app.use("/user", require("./routes/UserRouter"))

app.use("/movies", require("./routes/MoviesRouter"))

const httpServer = require("http").createServer(app)

const port = Number(process.env.SERVER_PORT) || 8085

httpServer.listen(port, () => {
    console.log(`Server listening on: http://localhost:${port}/`)
})

