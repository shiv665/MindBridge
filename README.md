#  MindBridge

<div align="center">


**A safe space for mental wellness, community support, and personal growth**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Installation](#-installation) • [Environment Variables](#-environment-variables) • [API Documentation](#-api-documentation) • [Contributing](#-contributing)

</div>

---

## 📖 About

**MindBridge** is a full-stack mental wellness platform that connects individuals seeking support with like-minded communities. It provides tools for mood tracking, journaling, and meaningful conversations in a safe, supportive environment.

Whether you're looking to track your emotional well-being, connect with support circles, or maintain a private journal of your thoughts, MindBridge offers the features you need on your wellness journey.

---

## ✨ Features

### 🔐 Authentication
- **Email/Password Registration** - Secure local authentication with bcrypt password hashing
- **Google OAuth Integration** - Quick sign-in with Google account
- **JWT Token-based Sessions** - Secure, stateless authentication

### 🏠 Dashboard
- Personalized welcome screen
- Quick access to all features
- Activity overview and recent updates

### 🔵 Support Circles
- **Create & Join Communities** - Public and private support groups
- **Themed Discussions** - Circles organized by topics/interests
- **Member Management** - Admin controls, join requests for private circles
- **Post & Engage** - Share thoughts, support others in your circles

### 📔 Private Journal
- **Secure Journaling** - Write and store private thoughts
- **Date-based Organization** - Easy access to past entries
- **Reflection Tool** - Track your mental journey over time

### 📊 Mood Tracking
- **Daily Mood Logs** - Record how you're feeling
- **Mood History** - Visualize patterns over time
- **Self-awareness Tool** - Understand your emotional trends

### 💬 Direct Messaging
- **Private Conversations** - Message other users directly
- **Real-time Updates** - Stay connected with your support network
- **Privacy Controls** - Choose who can message you

### 🔔 Notifications
- Stay updated on circle activities
- Message alerts
- Community engagement notifications

### ⚙️ Settings & Profile
- **Profile Customization** - Avatar, bio, interests
- **Privacy Controls** - Manage what others can see
- **Account Management** - Update email, password, preferences

### 🛡️ Admin Panel
- User management dashboard
- Content moderation tools
- Platform analytics

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| ![React](https://img.shields.io/badge/React-18.2-61dafb?logo=react&logoColor=white) | UI Library |
| ![Vite](https://img.shields.io/badge/Vite-5.2-646cff?logo=vite&logoColor=white) | Build Tool |
| ![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss&logoColor=white) | Styling |
| ![React Router](https://img.shields.io/badge/React_Router-6.23-ca4245?logo=reactrouter&logoColor=white) | Routing |
| ![Zustand](https://img.shields.io/badge/Zustand-4.5-orange?logo=react&logoColor=white) | State Management |
| ![Axios](https://img.shields.io/badge/Axios-1.6-5a29e4?logo=axios&logoColor=white) | HTTP Client |

### Backend
| Technology | Purpose |
|------------|---------|
| ![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white) | Runtime |
| ![Express](https://img.shields.io/badge/Express-4.19-000000?logo=express&logoColor=white) | Web Framework |
| ![MongoDB](https://img.shields.io/badge/MongoDB-8.5-47a248?logo=mongodb&logoColor=white) | Database |
| ![Mongoose](https://img.shields.io/badge/Mongoose-8.5-880000?logo=mongoose&logoColor=white) | ODM |
| ![JWT](https://img.shields.io/badge/JWT-9.0-000000?logo=jsonwebtokens&logoColor=white) | Authentication |

---

## 🚀 Installation

### Prerequisites
- **Node.js** v18 or higher
- **MongoDB** (local installation or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **npm** or **yarn**
- **Google Cloud Console** account (for OAuth)

### Clone the Repository
```bash
git clone https://github.com/your-username/mindbridge.git
cd mindbridge
```

### Install Dependencies

#### Server
```bash
cd server
npm install
```

#### Client
```bash
cd ../client
npm install
```

### Configure Environment Variables
See the [Environment Variables](#-environment-variables) section below.

### Run the Application

#### Development Mode

**Terminal 1 - Start the Server:**
```bash
cd server
npm run dev
```

**Terminal 2 - Start the Client:**
```bash
cd client
npm run dev
```

### Access the Application
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:4000
- **API Documentation:** http://localhost:4000/
- **Admin Panel:** http://localhost:4000/admin

---

## 🔐 Environment Variables

### ⚠️ Important Security Notice
> **Never commit `.env` files with real credentials to version control!**  
> Always use `.env.example` files as templates with placeholder values.

### Server Environment Variables

Create a `.env` file in the `server/` directory:

```env
# Server Configuration
PORT=4000

# Database
MONGO_URI=mongodb://localhost:27017/mindbridge

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-key-here

# Google OAuth 2.0 (Get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# CORS
CLIENT_URL=http://localhost:5173
```

### Client Environment Variables

Create a `.env` file in the `client/` directory:

```env
# API Configuration
VITE_API_URL=http://localhost:4000/api

# Google OAuth 2.0 (Same Client ID as server)
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### Environment Variables Explained

| Variable | Location | Description |
|----------|----------|-------------|
| `PORT` | Server | Port number for the Express server (default: 4000) |
| `MONGO_URI` | Server | MongoDB connection string. Use `mongodb://localhost:27017/mindbridge` for local or your MongoDB Atlas URI for cloud |
| `JWT_SECRET` | Server | Secret key for signing JWT tokens. Use a strong, random string (32+ characters) |
| `GOOGLE_CLIENT_ID` | Both | OAuth 2.0 Client ID from [Google Cloud Console](https://console.cloud.google.com/) |
| `GOOGLE_CLIENT_SECRET` | Server | OAuth 2.0 Client Secret from Google Cloud Console |
| `CLIENT_URL` | Server | Frontend URL for CORS configuration |
| `VITE_API_URL` | Client | Backend API base URL |

### Setting Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client IDs**
5. Configure the consent screen if prompted
6. Set Application type to **Web application**
7. Add Authorized JavaScript origins:
   - `http://localhost:5173` (development)
   - Your production URL
8. Add Authorized redirect URIs:
   - `http://localhost:5173` (development)
   - Your production URL
9. Copy the **Client ID** and **Client Secret** to your `.env` files

### Generating a Secure JWT Secret

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Using OpenSSL
openssl rand -hex 64
```

---

## 📚 API Documentation

### Base URL
```
http://localhost:4000/api
```

### Authentication Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login with email/password |
| POST | `/auth/google` | Login with Google OAuth |
| GET | `/auth/me` | Get current user |

### Circles Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/circles` | Get all circles |
| POST | `/circles` | Create new circle |
| GET | `/circles/:id` | Get circle by ID |
| PUT | `/circles/:id` | Update circle |
| DELETE | `/circles/:id` | Delete circle |
| POST | `/circles/:id/join` | Join a circle |
| POST | `/circles/:id/leave` | Leave a circle |

### Posts Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/posts/circle/:circleId` | Get posts in a circle |
| POST | `/posts` | Create new post |
| PUT | `/posts/:id` | Update post |
| DELETE | `/posts/:id` | Delete post |

### Mood Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/mood` | Get mood entries |
| POST | `/mood` | Log new mood |

### Journal Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/journals` | Get journal entries |
| POST | `/journals` | Create journal entry |
| PUT | `/journals/:id` | Update journal entry |
| DELETE | `/journals/:id` | Delete journal entry |

### Messages Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/messages` | Get conversations |
| GET | `/messages/:userId` | Get messages with user |
| POST | `/messages/:userId` | Send message |

### Users Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/:id` | Get user profile |
| PUT | `/users/profile` | Update profile |
| GET | `/users/search` | Search users |

### Notifications Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | Get notifications |
| PUT | `/notifications/:id/read` | Mark as read |

---

## 📁 Project Structure

```
mindbridge/
├── client/                   # React Frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── Layout.jsx
│   │   │   ├── Nav.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── hooks/            # Custom React hooks
│   │   │   └── useAuth.js
│   │   ├── pages/            # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Circles.jsx
│   │   │   ├── CircleDetail.jsx
│   │   │   ├── Journal.jsx
│   │   │   ├── Mood.jsx
│   │   │   ├── Messages.jsx
│   │   │   ├── Notifications.jsx
│   │   │   ├── Settings.jsx
│   │   │   ├── UserProfile.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── styles/           # CSS styles
│   │   ├── api.js            # API client configuration
│   │   ├── App.jsx           # Main app component
│   │   └── main.jsx          # Entry point
│   ├── .env.example          # Environment template
│   └── package.json
│
├── server/                   # Express Backend
│   ├── src/
│   │   ├── config/           # Configuration files
│   │   │   └── db.js         # MongoDB connection
│   │   ├── middleware/       # Express middlewares
│   │   │   └── auth.js       # JWT authentication
│   │   ├── models/           # Mongoose models
│   │   │   ├── User.js
│   │   │   ├── Circle.js
│   │   │   ├── Post.js
│   │   │   ├── Journal.js
│   │   │   ├── MoodEntry.js
│   │   │   ├── Message.js
│   │   │   ├── Notification.js
│   │   │   └── Block.js
│   │   ├── routes/           # API routes
│   │   │   ├── auth.js
│   │   │   ├── circles.js
│   │   │   ├── posts.js
│   │   │   ├── journals.js
│   │   │   ├── mood.js
│   │   │   ├── messages.js
│   │   │   ├── users.js
│   │   │   ├── notifications.js
│   │   │   └── admin.js
│   │   ├── utils/            # Utility functions
│   │   │   └── generateToken.js
│   │   ├── public/           # Static files
│   │   │   ├── index.html    # API docs page
│   │   │   └── admin.html    # Admin panel
│   │   └── index.js          # Server entry point
│   ├── .env.example          # Environment template
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - UI Library
- [TailwindCSS](https://tailwindcss.com/) - Styling
- [Express.js](https://expressjs.com/) - Backend Framework
- [MongoDB](https://www.mongodb.com/) - Database
- [Heroicons](https://heroicons.com/) & [Lucide](https://lucide.dev/) - Icons

---

<div align="center">

**Made with ❤️ for mental wellness**

⭐ Star this repo if you find it helpful!

</div>
