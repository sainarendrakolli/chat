const socket = io();
const p = new URLSearchParams(location.search);

const roomId = p.get("room");
const name = p.get("name");
const role = p.get("role");

let chatEnabled = role === "owner";

document.getElementById("header").innerText =
  `Room: ${roomId} | You: ${name}`;

if (role === "owner") {
  socket.emit("createRoom", { roomId, name });
} else {
  socket.emit("requestJoin", { roomId, name });
}

socket.on("roomNotFound", () => {
  alert("Room not found");
  location.href = "/";
});

socket.on("joinRequest", ({ joinerName, joinerSocket }) => {
  const ok = confirm(`${joinerName} wants to join. Accept?`);
  if (ok) {
    socket.emit("acceptJoin", { roomId, joinerSocket });
    socket.emit("joinRoom", roomId);
  }
});

socket.on("joinAccepted", () => {
  chatEnabled = true;
  socket.emit("joinRoom", roomId);
  alert("Invitation accepted. Chat started.");
});

function send() {
  if (!chatEnabled) return alert("Waiting for acceptance");

  const input = msg;
  if (!input.value.trim()) return;

  socket.emit("chatMessage", {
    roomId,
    name,
    message: input.value
  });

  addMessage(name, input.value, "right");
  input.value = "";
}

socket.on("message", (data) => {
  addMessage(data.name, data.message, "left");
});

function addMessage(sender, text, side) {
  const div = document.createElement("div");
  div.className = `message ${side}`;
  div.innerHTML = `<b>${sender}</b><br>${text}`;

  if (side === "right") {
    div.oncontextmenu = e => {
      e.preventDefault();
      if (confirm("Delete message?")) div.remove();
    };
  }
  chat.appendChild(div);
}
