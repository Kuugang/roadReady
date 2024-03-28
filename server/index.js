const dotenv = require("dotenv").config();
const express = require("express");
const cors = require("cors")
const app = express();
const port = 6969;
const bodyParser = require("body-parser")
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const passport = require("passport");
app.use(passport.initialize());

app.use(
    cors({
        origin:
            process.env.node_env = "production" ? "" : "http://localhost:3000", credentials: true, exposedHeaders: ["Authorization"]
    }))

app.use(cookieParser());
app.use(helmet());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: "10mb" }))
app.use(express.json());

app.use("/", require("./routes/mainRoutes"));

const server = app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
})
