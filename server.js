const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

const rooms = {}; // roomId -> ownerSocketId

// image upload
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

io.on("connection", (socket) => {

  socket.on("createRoom", ({ roomId, name }) => {
    rooms[roomId] = socket.id;
    socket.join(roomId);
  });

  socket.on("requestJoin", ({ roomId, name }) => {
    if (rooms[roomId]) {
      io.to(rooms[roomId]).emit("joinRequest", {
        roomId,
        joinerName: name,
        joinerSocket: socket.id
      });
    } else {
      socket.emit("roomNotFound");
    }
  });

  socket.on("acceptJoin", ({ roomId, joinerSocket }) => {
    io.to(joinerSocket).emit("joinAccepted");
  });

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
  });

  socket.on("chatMessage", (data) => {
    socket.to(data.roomId).emit("message", data);
  });

  socket.on("imageMessage", (data) => {
    socket.to(data.roomId).emit("image", data);
  });
});

app.post("/upload", upload.single("image"), (req, res) => {
  res.json({ imageUrl: `/uploads/${req.file.filename}` });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
