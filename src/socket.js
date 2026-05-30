import { io } from "socket.io-client";

// const socket = io(import.meta.env.VITE_SOCKET_URL, {
//   transports: ["websocket"],
// });

const socket = io(`${import.meta.env.VITE_BASE_URL}`, {
  path: import.meta.env.VITE_SOCKET,
});

socket.on("connection", () => {
  console.log("Connected to socket.io server");
});

socket.on("disconnect", () => {
  console.log("Disconnected from socket.io server");
});

export default socket;