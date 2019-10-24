const Slackbot = require('slackbots');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();
const bot = new Slackbot({
  token: `${process.env.BOT_TOKEN}`,
  name: 'devdesk'
});

bot.on('start', () => {
  bot.getUsers().then(data => updateUsers(data));

  const params = {
    icon_emoji: ':robot_face:'
  };

  bot.postMessageToChannel(
    'random',
    "To get help follow the format 'devdesk TITLE DESCRIPTION'",
    params
  );
});

bot.on('error', err => {
  console.log(err);
});

bot.on('message', data => {
  if (data.type !== 'message') {
    return;
  }
  const params = {
    icon_emoji: ':robot_face:'
  };

  if (
    data.text.includes('devdesk') &&
    getUsernameFromId(data.user) !== 'unknown member'
  ) {
    bot.postMessageToUser(
      `${getUsernameFromId(data.user)}`,
      `Processing your request`,
      params
    );

    let request = data.text.split(' ');
    request.shift();
    const [title, ...rest] = request;
    axios
      .post('https://devdesk-queue.herokuapp.com/api/auth/login', {
        username: 'jay',
        password: 'pass'
      })
      .then(res => {
        console.log(res.data);
        axios
          .post(
            'https://devdesk-queue.herokuapp.com/api/tickets',
            {
              status: 'pending',
              title: `${title}`,
              description: `${rest.join(' ')}`,
              student_id: '3'
            },
            {
              headers: {
                Authorization: res.data.token,
                role: 'student'
              }
            }
          )
          .then(() => {})
          .catch(err =>
            bot.postMessageToUser(
              `${getUsernameFromId(data.user)}`,
              `Ticket with title: ${title} saved`,
              params
            )
          );
      })
      .catch(err => console.error(err));
  } else {
    console.log(data.text);
  }
});

let users = [];

function updateUsers(data) {
  users = data.members;
}

function getUsernameFromId(id) {
  const user = users.find(user => user.id === id);
  return user ? user.name : 'unknown member';
}
