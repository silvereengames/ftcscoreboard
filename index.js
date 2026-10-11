const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const ip = require('ip');
const fs = require('fs');

const app = express();
const server = createServer(app);
const io = new Server(server);

// Store independent state for each room
const rooms = {};

// Store expiration timers for each room
const emptyTimers = {};
const inactivityTimers = {};

// Helper function to generate default game settings
function getDefaultSettings() {
  return {
    'time': 0,
    'leave': 0,
    'park': 0,
    'hive_tips': 0,
    'cell_rem': 0,
    // Replace old flat values with arrays to track insertion order
    'flowers': {
      'red_alliance': [],
      'red_audience': [],
      'blue_alliance': [],
      'blue_audience': []
    },
    'garden_elements': 0,
    'minor_foul': 0,
    'major_foul': 0,
    'bgcolor': '#FF0000', // Used to determine which alliance's score to calculate
    'silent': 0,
    'total': 0,
    'dev': false,
    'driver': 'None',
    'operator': 'None',
    'human': 'None',
    'coach': 'None'
  };
}

// Helper function to safely delete a room and kick remaining clients
function deleteRoom(roomCode, reason) {
  if (emptyTimers[roomCode]) clearTimeout(emptyTimers[roomCode]);
  if (inactivityTimers[roomCode]) clearTimeout(inactivityTimers[roomCode]);
  
  delete emptyTimers[roomCode];
  delete inactivityTimers[roomCode];
  delete rooms[roomCode];
  
  console.log(`Room ${roomCode} deleted: ${reason}`);
  io.to(roomCode).emit('alert', { type: 'error', title: 'Room Closed', body: reason, time: 5000 });
  io.in(roomCode).disconnectSockets();
}

// Helper function to reset the 4-hour inactivity timer
function resetInactivityTimer(roomCode) {
  if (inactivityTimers[roomCode]) clearTimeout(inactivityTimers[roomCode]);
  
  inactivityTimers[roomCode] = setTimeout(() => {
    deleteRoom(roomCode, 'Closed due to 4 hours of inactivity.');
  }, 4 * 60 * 60 * 1000); // 4 hours
}

// In-Memory Rate Limiter (Max 20 room creations per 15 minutes per IP)
const rateLimitMap = new Map();
function createRoomRateLimiter(req, res, next) {
  const userIp = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 20;

  if (!rateLimitMap.has(userIp)) {
    rateLimitMap.set(userIp, []);
  }
  
  const timestamps = rateLimitMap.get(userIp);
  
  // Clear old timestamps outside the 15m window
  while (timestamps.length > 0 && timestamps[0] <= now - windowMs) {
    timestamps.shift();
  }
  
  // Block if they exceed the limit
  if (timestamps.length >= maxRequests) {
    return res.status(429).send("Too many rooms created recently. Please wait a few minutes.");
  }
  
  timestamps.push(now);
  next();
}

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'landing.html'));
});

// Route: Create Room
app.get('/create-room/:room', createRoomRateLimiter, (req, res) => {
  const roomCode = req.params.room;
  
  // If the room already exists, redirect back to landing
  if (rooms[roomCode]) {
    return res.redirect('/');
  }

  rooms[roomCode] = getDefaultSettings();
  
  // Start the inactivity timer immediately upon creation
  resetInactivityTimer(roomCode);

  // Redirect to the admin panel for the newly created room
  res.redirect(`/admin/${roomCode}`);
});

// Route: Admin Panel
app.get('/admin/:room', (req, res) => {
  const roomCode = req.params.room;
  // Redirect to landing if room doesn't exist
  if (!rooms[roomCode]) return res.redirect('/');
  res.sendFile(join(__dirname, 'public', 'admin.html'));
});

// Route: Public Scoreboard
app.get('/scoreboard/:room', (req, res) => {
  const roomCode = req.params.room;
  // Redirect to landing if room doesn't exist
  if (!rooms[roomCode]) return res.redirect('/');
  res.sendFile(join(__dirname, 'public', 'scoreboard.html'));
});

io.on('connection', (socket) => {
  
  socket.on('joinRoom', (roomCode) => {
    // Force a page reload (which will kick them to landing) if they try to join a dead room
    if (!rooms[roomCode]) {
      return socket.emit('reload'); 
    }
    
    socket.join(roomCode);
    socket.roomCode = roomCode;

    // Clear the 1-hour empty timer since someone joined
    if (emptyTimers[roomCode]) {
      clearTimeout(emptyTimers[roomCode]);
      delete emptyTimers[roomCode];
    }
    
    // Any join counts as activity
    resetInactivityTimer(roomCode);

    socket.emit('updateall', rooms[roomCode]);
  });

  socket.on('reload', () => {
    if (!socket.roomCode) return;
    resetInactivityTimer(socket.roomCode);
    io.to(socket.roomCode).emit('reload');
  });

  socket.on('alert', (msg) => {
    if (!socket.roomCode) return;
    resetInactivityTimer(socket.roomCode);
    io.to(socket.roomCode).emit('alert', msg);
  });

  socket.on('starttimer', (msg) => {
    if (socket.roomCode && rooms[socket.roomCode]) {
      resetInactivityTimer(socket.roomCode);
      rooms[socket.roomCode].time = msg;
    }
  });

  socket.on('stoptimer', () => {
    if (socket.roomCode && rooms[socket.roomCode]) {
      resetInactivityTimer(socket.roomCode);
      rooms[socket.roomCode].time = 0;
    }
  });

  socket.on('updatescores', (msg) => {
    if (!socket.roomCode || !rooms[socket.roomCode]) return;
    
    // Register this as activity to prevent the 4-hour timeout
    resetInactivityTimer(socket.roomCode);

    let leavepoints = 0;
    let parkpoints = 0;

    if (msg.leave == "Yes" || msg.leave == 1 || msg.leave == true) leavepoints = 3;
    if (msg.park == "Yes" || msg.park == 1 || msg.park == true) parkpoints = 5;

    // Determine target nectar color based on scoreboard background color
    const isRedAlliance = (msg.bgcolor && msg.bgcolor.toUpperCase() === '#FF0000');
    const targetNectar = isRedAlliance ? 'RED' : 'BLUE';

    let flowerPoints = 0;
    let bottomNectarPoints = 0;

    // Safely parse the flowers arrays if provided
    const parsedFlowers = msg.flowers || rooms[socket.roomCode].flowers;

    // Calculate Flower ownership and bottom nectar bonuses
    for (const key in parsedFlowers) {
      const flowerStack = parsedFlowers[key];
      // Filter out POLLEN to just look at NECTAR for ownership calculations
      const nectars = flowerStack.filter(item => item === 'RED' || item === 'BLUE');

      if (nectars.length > 0) {
        // Bottom NECTAR Bonus: 5 points if the bottom-most nectar matches our alliance
        if (nectars[0] === targetNectar) {
          bottomNectarPoints += 5;
        }

        // Flower Owner: 2 points per element (including pollen) if top-most nectar matches our alliance
        if (nectars[nectars.length - 1] === targetNectar) {
          flowerPoints += (flowerStack.length * 2);
        }
      }
    }

    const total = leavepoints + parkpoints + bottomNectarPoints + flowerPoints + 
                 (msg.hive_tips * 20) + (msg.cell_rem * 2) + (msg.garden_elements * 1);

    rooms[socket.roomCode] = {
      'time': rooms[socket.roomCode].time,
      'leave': msg.leave,
      'park': msg.park,
      'hive_tips': msg.hive_tips,
      'cell_rem': msg.cell_rem,
      'flowers': parsedFlowers, // Save the updated flower arrays
      'garden_elements': msg.garden_elements,
      'minor_foul': msg.minor_foul,
      'major_foul': msg.major_foul,
      'bgcolor': msg.bgcolor,
      'silent': msg.silent,
      'dev': msg.dev,
      'driver': msg.driver,
      'operator': msg.operator,
      'human': msg.human,
      'coach': msg.coach,
      'total': total
    };

    io.to(socket.roomCode).emit('updateall', rooms[socket.roomCode]);
  });

  // Handle client disconnects
  socket.on('disconnect', () => {
    const roomCode = socket.roomCode;
    if (roomCode && rooms[roomCode]) {
      const clients = io.sockets.adapter.rooms.get(roomCode);
      
      // If no clients are left in this room, start the 1-hour empty timer
      if (!clients || clients.size === 0) {
        if (emptyTimers[roomCode]) clearTimeout(emptyTimers[roomCode]);
        
        emptyTimers[roomCode] = setTimeout(() => {
          deleteRoom(roomCode, 'Closed due to being empty for 1 hour.');
        }, 1 * 60 * 60 * 1000); // 1 hour
      }
    }
  });
});

function updateLoop() {
  for (const roomCode in rooms) {
    if (rooms[roomCode].time > 0) {
      rooms[roomCode].time--;
    }
    io.to(roomCode).emit('updateall', rooms[roomCode]);
  }
}

setInterval(updateLoop, 1000);

server.listen(3000, () => {
  console.log(`Server started, accessible at http://${ip.address()}:3000.`);
});