const express = require("express")
const path = require("path")
const { Server } = require("socket.io")

const PORT = process.env.PORT || 4000

const app = express()

app.use(express.static(path.resolve(__dirname, "client", "build")))

const server = app.listen(PORT)

const io = new Server(server, {
  serveClient: false,
})

io.on("connection", function (socket) {
  socket.on("mousemove", function (position) {
    socket.broadcast.emit("mousemove", {
      username: socket.handshake.query.username,
      position,
    })
  })
  socket.on("disconnect", function () {
    socket.broadcast.emit("userleave", socket.handshake.query.username)
  })
})
