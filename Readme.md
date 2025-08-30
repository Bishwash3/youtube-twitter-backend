# VideoTube Backend

This is the backend code for **VideoTube**, a video-sharing platform. The project is built using **Node.js**, **Express.js**, and **MongoDB**. It provides APIs for user authentication, video uploads, comments, likes, subscriptions, and more.

---

## Features

- **User Authentication**: Register, login, logout, and token refresh.
- **Video Management**: Upload, update, delete, and fetch videos.
- **Comments**: Add, update, delete, and fetch comments on videos.
- **Likes**: Like/unlike videos, comments, and tweets.
- **Playlists**: Create, update, delete, and manage playlists.
- **Subscriptions**: Subscribe/unsubscribe to channels.
- **Tweets**: Create, update, delete, and fetch tweets.
- **Health Check**: API health check endpoint.
- **Dashboard**: Fetch channel stats and uploaded videos.

---

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **File Uploads**: Multer, Cloudinary
- **Other Libraries**: Mongoose, bcrypt, dotenv, cors

---

## Project Structure

```
videotube-backend/
├── config/                  # Configuration files
│   ├── db.js                # Database configuration
│   ├── cloudinary.js        # Cloudinary configuration for file uploads
│   └── keys.js              # API keys and secrets
│
├── controllers/             # Route controllers for handling requests
│   ├── authController.js     # Authentication-related actions
│   ├── videoController.js    # Video-related actions
│   ├── commentController.js  # Comment-related actions
│   ├── likeController.js     # Like/unlike actions
│   ├── playlistController.js  # Playlist-related actions
│   ├── subscriptionController.js # Subscription-related actions
│   └── tweetController.js    # Tweet-related actions
│
├── middleware/              # Custom middleware functions
│   ├── auth.js              # Authentication middleware
│   └── errorHandler.js      # Error handling middleware
│
├── models/                  # Mongoose models for MongoDB
│   ├── User.js              # User model
│   ├── Video.js             # Video model
│   ├── Comment.js           # Comment model
│   ├── Like.js              # Like model
│   ├── Playlist.js          # Playlist model
│   ├── Subscription.js       # Subscription model
│   └── Tweet.js             # Tweet model
│
├── routes/                  # Express routes
│   ├── authRoutes.js         # Authentication routes
│   ├── videoRoutes.js        # Video routes
│   ├── commentRoutes.js      # Comment routes
│   ├── likeRoutes.js         # Like/unlike routes
│   ├── playlistRoutes.js     # Playlist routes
│   ├── subscriptionRoutes.js  # Subscription routes
│   └── tweetRoutes.js        # Tweet routes
│
├── uploads/                 # Directory for uploaded files (e.g., videos, images)
│
├── .env                     # Environment variables
├── .gitignore               # Git ignore file
├── package.json              # NPM package configuration
└── server.js                # Entry point of the application
```

---

## Installation and Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/videotube-backend.git
   cd videotube-backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   - Create a `.env` file in the root directory.
   - Add the following variables:

     ```
     PORT=5000
     MONGODB_URI=your_mongodb_uri
     JWT_SECRET=your_jwt_secret
     CLOUDINARY_URL=your_cloudinary_url
     ```

4. Start the server:

   ```bash
   npm start
   ```

   The server will run on `http://localhost:5000`.

---

## API Documentation

- **Authentication**

  - `POST /api/auth/register`: Register a new user.
  - `POST /api/auth/login`: Login a user.
  - `POST /api/auth/logout`: Logout the current user.
  - `POST /api/auth/refresh-token`: Refresh the access token.

- **Video Management**

  - `POST /api/videos`: Upload a new video.
  - `PUT /api/videos/:id`: Update video details.
  - `DELETE /api/videos/:id`: Delete a video.
  - `GET /api/videos`: Fetch all videos.
  - `GET /api/videos/:id`: Fetch a single video by ID.

- **Comments**

  - `POST /api/comments`: Add a new comment to a video.
  - `PUT /api/comments/:id`: Update a comment.
  - `DELETE /api/comments/:id`: Delete a comment.
  - `GET /api/comments`: Fetch all comments for a video.

- **Likes**

  - `POST /api/likes`: Like a video, comment, or tweet.
  - `DELETE /api/likes`: Unlike a video, comment, or tweet.

- **Playlists**

  - `POST /api/playlists`: Create a new playlist.
  - `PUT /api/playlists/:id`: Update playlist details.
  - `DELETE /api/playlists/:id`: Delete a playlist.
  - `GET /api/playlists`: Fetch all playlists for a user.

- **Subscriptions**

  - `POST /api/subscriptions`: Subscribe to a channel.
  - `DELETE /api/subscriptions`: Unsubscribe from a channel.

- **Tweets**

  - `POST /api/tweets`: Create a new tweet.
  - `PUT /api/tweets/:id`: Update a tweet.
  - `DELETE /api/tweets/:id`: Delete a tweet.
  - `GET /api/tweets`: Fetch all tweets from subscribed channels.

- **Health Check**

  - `GET /api/health`: Check the health of the API.

- **Dashboard**

  - `GET /api/dashboard`: Fetch channel statistics and uploaded videos.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [Node.js](https://nodejs.org/): JavaScript runtime built on Chrome's V8 JavaScript engine.
- [Express.js](https://expressjs.com/): Fast, unopinionated, minimalist web framework for Node.js.
- [MongoDB](https://www.mongodb.com/): Document database with the scalability and flexibility that you want with the querying and indexing that you need.
- [Cloudinary](https://cloudinary.com/): Cloud-based service for managing images and videos.
- [JWT](https://jwt.io/): Compact, URL-safe means of representing claims to be transferred between two parties.