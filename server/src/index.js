import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import circleRoutes from "./routes/circles.js";
import postRoutes from "./routes/posts.js";
import moodRoutes from "./routes/mood.js";
import journalRoutes from "./routes/journals.js";
import notificationRoutes from "./routes/notifications.js";
import adminRoutes from "./routes/admin.js";
import usersRoutes from "./routes/users.js";
import messagesRoutes from "./routes/messages.js";

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(morgan("dev"));

// Serve the admin panel BEFORE static files
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

app.use("/api/auth", authRoutes);
app.use("/api/circles", circleRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/mood", moodRoutes);
app.use("/api/journals", journalRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/messages", messagesRoutes);

// Serve the API documentation page at root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 4000;
connectDB().then(() => {
  app.listen(port, () => console.log(`Server running on ${port}`));
}).catch(err => {
  console.error("Failed to connect to DB:", err);
})