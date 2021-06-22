# ChalkTalk

ChalkTalk is a social networking web application geared towards climbers.
Primary Features include:

- Authentication with client, server, and database validation.
- Post, follow users, like, and share functionality.
- Profile and cover photo upload, with built-in cropping editor using the Popper npm package.
- Notifications
- Individual and group real-time chat functionality utilizing Socket.io.

## Getting started
Please look over the code or create a free account @ 'https://chalktalk.azurewebsites.net/login'

To run locally:

- Fork repo to personal GitHub
- clone down fork to local machine
- cd into local directory
- npm install
- create a config.js file, write to file:
  - module.exports = {
  MONGO_KEY: "mongodb+srv://admin:[Your MongoDB Atlas authentication key goes here]"
}

- npm start
- If you change Sass styles, then recompile Sass with npm run sass.

