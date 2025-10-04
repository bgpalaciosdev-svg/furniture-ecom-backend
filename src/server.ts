import express from "express";
import { Server } from "socket.io";
import http from "http";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import userRoutes from "./routes/user.router";
import authRoutes from "./routes/auth.router";
import contentRoutes from "./routes/content.router";
import categoryRoutes from "./routes/category.router";
import productRoutes from "./routes/product.router";
import orderRoutes from "./routes/order.router";
import cartRoutes from "./routes/cart.router";
import deliveryRoutes from "./routes/delivery.router";
import paymentRoutes from "./routes/payment.router";
import adminRoutes from "./routes/admin.router";
import uploadRoutes from "./routes/upload.router";
import testRoutes from "./routes/test.router";

import { errorHandler } from "./middleware/erroHandler";
import cors from "cors";
import { Request, Response, NextFunction } from "express";
import { verifyToken } from "./services/jwt.service";

dotenv.config();
const app = express();
const port = process.env.PORT || 8080;

// Development URLs
const DEV_FRONTEND_URL = "http://localhost:3000";
const DEV_ADMIN_URL = "http://localhost:3001";

// Production URLs (update these with your actual production domains)
const PROD_FRONTEND_URL = process.env.FRONTEND_URL || "https://staging-release--splendorous-centaur-b5e5f1.netlify.app";
const PROD_ADMIN_URL = process.env.ADMIN_URL || "https://staging-release--splendorous-centaur-b5e5f1.netlify.app";

// Netlify site configuration
const NETLIFY_SITE_ID = "splendorous-centaur-b5e5f1";

// Determine allowed origins based on environment
const allowedOrigins = process.env.NODE_ENV === "production" 
  ? [
      PROD_FRONTEND_URL, 
      PROD_ADMIN_URL,
      // Allow all branch deployments from Netlify site
      new RegExp(`^https://.*--${NETLIFY_SITE_ID}\\.netlify\\.app$`),
      // Allow main Netlify domain
      `https://${NETLIFY_SITE_ID}.netlify.app`,
      // Add custom domain if you have one
      process.env.CUSTOM_DOMAIN
    ].filter(Boolean) // Remove undefined values
  : [DEV_FRONTEND_URL, DEV_ADMIN_URL, "http://localhost:3002"];

const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin matches any allowed origins (including regex patterns)
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed || process.env.NODE_ENV === "development") {
      console.log(`✅ CORS allowed origin: ${origin}`);
      callback(null, true);
    } else {
      console.log(`❌ CORS blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With", 
    "Content-Type", 
    "Accept", 
    "Authorization",
    "token",
    "x-access-token"
  ],
  credentials: true,
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
      if (!origin) return callback(null, true);
      
      const isAllowed = allowedOrigins.some(allowedOrigin => {
        if (typeof allowedOrigin === 'string') {
          return allowedOrigin === origin;
        } else if (allowedOrigin instanceof RegExp) {
          return allowedOrigin.test(origin);
        }
        return false;
      });
      
      if (isAllowed || process.env.NODE_ENV === "development") {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
  },
});
const adminSockets = new Map<string, string>();

io.on("connection", (socket) => {
  console.log(`New client connected: ${socket.id}`);

  socket.on("authenticate", (data) => {
    const { token } = data;
    try {
      const decoded = verifyToken(token);
      if (decoded.role === "admin") {
        adminSockets.set(socket.id, decoded.userId);
        console.log(`Admin connected: ${decoded.userId}`);
      }
    } catch (error) {
      console.error("Authentication failed:", error);
      socket.disconnect();
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    adminSockets.delete(socket.id);
    console.log(`Client disconnected: ${socket.id}`);
  });
});

app.set("io", io);
app.set("origins", allowedOrigins);

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is running v1!");
});
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/test", testRoutes);

app.get("/test-error", (req: Request, res: Response, next: NextFunction) => {
  try {
    throw new Error("Simulated error from test route");
  } catch (error) {
    next(error);
  }
});
app.use(errorHandler);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.log("GLOBAL ERROR MIDDLEWARE TRIGGERED");
  console.error(err);
  if (!res.headersSent) {
    res.status(err.status || 500).json({
      message: err.message,
      stack: err.stack,
    });
  } else {
    next(err);
  }
});

server.listen(port, async () => {
  console.warn(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('🌐 Allowed CORS Origins:');
  allowedOrigins.forEach((origin, index) => {
    if (typeof origin === 'string') {
      console.log(`  ${index + 1}. ${origin}`);
    } else if (origin instanceof RegExp) {
      console.log(`  ${index + 1}. ${origin.toString()} (regex pattern)`);
    }
  });
});
