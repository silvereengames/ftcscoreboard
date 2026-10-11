const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const ip = require('ip');
const fs = require('fs');

const app = express();
const server = createServer(app);
const io = new Server(server);

var time = 0;
var settings = {
  'time': 0,
  'leave': 0,
  'park': 0,
  'hive_tips': 0,
  'cell_rem': 0,
  'bot_nectar': 0,
  'flower_owned': 0,
  'garden_elements': 0,
  'minor_foul': 0,
  'major_foul': 0,
  'bgcolor': '#FF0000',
  'silent': 0,
  'total': 0
}

app.use(express.static('public'))

io.on('connection', (socket) => {
  //console.log('a user connected');

  socket.on('reload', (msg) => {
    io.emit('reload');
  })

  socket.on('alert', (msg) => {
    io.emit('alert', msg);
  })

  socket.on('shutdown', () => {
    console.warn('User request server shutdown. Goodbye 👋!')
    server.close(() => {
      process.exit(0)
    })
    process.exit(0)
  })

  socket.on('starttimer', (msg) => {
    settings.time = msg;
  })

  socket.on('stoptimer', (msg) => {
    settings.time = 0;
  })

  socket.on('updatescores', (msg) => {
    var leavepoints = 0;
    var parkpoints = 0;
    var botnectarpoints = 0;

    settings = {
      'time': settings.time,
      'leave': msg.leave,
      'park': msg.park,
      'hive_tips': msg.hive_tips,
      'cell_rem': msg.cell_rem,
      'bot_nectar': msg.bot_nectar,
      'flower_owned': msg.flower_owned,
      'garden_elements': msg.garden_elements,
      'minor_foul': msg.minor_foul,
      'major_foul': msg.major_foul,
      'bgcolor': msg.bgcolor,
      'silent': msg.silent,
      'dev': msg.dev,
      'driver': msg.driver,
      'operator': msg.operator,
      'human': msg.human,
      'coach': msg.coach
    }

    // Handle boolean or string inputs for flat-point objectives
    if (msg.leave == "Yes" || msg.leave == 1 || msg.leave == true) leavepoints = 3;
    if (msg.park == "Yes" || msg.park == 1 || msg.park == true) parkpoints = 5;
    if (msg.bot_nectar == "Yes" || msg.bot_nectar == 1 || msg.bot_nectar == true) botnectarpoints = 5;

    // Calculate total using BIOBUZZ points WITHOUT adding your own penalties
    settings.total = leavepoints + parkpoints + botnectarpoints + (msg.hive_tips * 20) + (msg.cell_rem * 2) + (msg.flower_owned * 2) + (msg.garden_elements * 1);

    io.emit('updateall', settings)
  })
});

function updateLoop() {
  //console.log('updateloop')

  if (settings.time > 0) {
    settings.time--
  }

  io.emit('updateall', settings)
}

setInterval(updateLoop, 1000)

server.listen(3000, () => {
  console.log(`Server started, accessable at ${ip.address()}:3000. Administrator page is located at: ${ip.address()}:3000/admin.html`);
});