// Packages
const express = require("express");
const parser = require("body-parser");
const path = require("path");
const { v4: uuidv4 } = require('uuid');

// Clients (id: response)
let clients = {}

// Application creation
const app = express();
const port = 8080;
app.use("/static", express.static(path.join(__dirname, "public")));
app.use(parser.json());
app.use(express.static(__dirname)); // Allows external css and js files
app.listen(port, () => { console.log(`Server started on port ${port}`) })
console.log("Address: http://10.50.43.181:8080/");

app.get("/", (req, res) => {
    res.sendFile("engine.html", { root: __dirname });
});

app.get("/create", (req, res) => {
    let id = req.query.id;
    //res.send(JSON.stringify({ data: ___ }));
});