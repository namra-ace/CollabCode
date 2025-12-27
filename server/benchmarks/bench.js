const { io } = require("socket.io-client");

// CONFIGURATION
const SERVER_URL = "http://localhost:5000"; 
const TOTAL_CLIENTS = 200; // Adjusted for realistic load (500 is heavy for a single localized test script)
const ROOM_ID = "benchmark-room-1";         

const clients = [];

console.log(`🚀 Starting Architecture V2 Benchmark: ${TOTAL_CLIENTS} users connecting to ${SERVER_URL}...`);

// 0. HELPER: CREATE ROOM
async function createRoom() {
  console.log("🛠️  Ensuring benchmark room exists...");
  try {
    // Attempt to create room via API (Adjust endpoint if your API differs)
    const response = await fetch(`${SERVER_URL}/api/save`, { 
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        roomId: ROOM_ID, 
        title: "Benchmark Room", 
        files: {}, 
        structure: { type: "folder", name: "root", children: [] } 
      }),
    });
    
    if (response.ok) console.log("✅ Room ensured.");
    else console.warn(`ℹ️  Room check status: ${response.status} (Make sure room exists in DB)`);
    
  } catch (error) {
    console.error("⚠️  Could not verify room via API. Assuming it exists...");
  }
}

// 1. SETUP CLIENTS
function setupClients() {
  for (let i = 0; i < TOTAL_CLIENTS; i++) {
    const socket = io(SERVER_URL, {
      transports: ["websocket"], 
      reconnection: false,
      forceNew: true
    });
    socket.username = `User_${i}`;
    clients.push(socket);
  }
}

// 2. TEST: ROOM JOINING (Active Users Broadcast)
async function benchmarkJoin() {
  console.log("\n--- TEST 1: Room Join & Active Users Latency ---");
  const startTime = Date.now();

  const joinPromises = clients.map((socket) => {
    return new Promise((resolve) => {
      // Wait for the active users list to confirm join
      socket.on("active-users-update", () => resolve());
      
      socket.on("room-error", (err) => {
          console.error(`❌ Join failed: ${err.message}`);
          resolve(); 
      });

      socket.emit("join-room", ROOM_ID, { username: socket.username });
    });
  });

  await Promise.all(joinPromises);
  
  const duration = Date.now() - startTime;
  console.log(`✅ ${TOTAL_CLIENTS} users joined in ${duration}ms`);
  console.log(`📊 Avg Join Overhead: ${(duration / TOTAL_CLIENTS).toFixed(2)}ms per user`);
}

// 3. TEST: STRUCTURE SYNC (The new "Broadcast" bottleneck)
async function benchmarkStructureSync() {
  console.log("\n--- TEST 2: File Structure Sync Latency ---");
  
  const sender = clients[0];
  const receiver = clients[clients.length - 1]; 

  // Simulate a user creating a new file
  const mockStructure = {
      type: "folder",
      name: "root",
      children: [{ type: "file", name: "Benchmark.js" }]
  };

  return new Promise((resolve) => {
    receiver.on("structure-update", () => {
        const endTime = Date.now();
        console.log(`✅ Last user received file tree update.`);
        console.log(`📊 Structure Broadcast Latency: ${endTime - testStart}ms`);
        resolve();
    });

    console.log(`User_0 adding a new file (broadcasting structure)...`);
    const testStart = Date.now();
    
    sender.emit("structure-update", { 
        roomId: ROOM_ID, 
        structure: mockStructure,
        files: {},
        sender: sender.id 
    });
  });
}

// 4. TEST: COLD START LOAD (Requesting files)
async function benchmarkColdStart() {
    console.log("\n--- TEST 3: New User Cold Start Latency ---");
    
    // Create a NEW client that wasn't part of the initial mob
    const newSocket = io(SERVER_URL, { transports: ["websocket"] });
    
    return new Promise((resolve) => {
        const start = Date.now();

        newSocket.on("connect", () => {
            newSocket.emit("join-room", ROOM_ID, { username: "Late_Joiner" });
            
            // Immediately request files like the React Client does
            newSocket.emit("request-all-files", { roomId: ROOM_ID });
        });

        // The logic in your server requires a peer to send files back.
        // We need one of our existing clients to respond.
        // *Your server code forwards 'request-all-files' to other users*
        
        // Let's have User_0 listen for the request and respond
        clients[0].on("request-all-files", ({ requesterId }) => {
            clients[0].emit("send-all-files", {
                roomId: ROOM_ID,
                files: { "Main.js": "console.log('hello')" },
                structure: {},
                to: requesterId
            });
        });

        newSocket.on("load-all-files", () => {
            const duration = Date.now() - start;
            console.log(`✅ New user received full project state.`);
            console.log(`📊 Cold Start Latency: ${duration}ms`);
            newSocket.disconnect();
            resolve();
        });
    });
}

// RUNNER
(async () => {
  await createRoom();
  setupClients();
  
  try {
      // Give sockets a moment to connect physically
      await new Promise(r => setTimeout(r, 1000));

      await benchmarkJoin();
      
      // Pause to let event loop drain
      await new Promise(r => setTimeout(r, 1000));
      
      await benchmarkStructureSync();

      await new Promise(r => setTimeout(r, 1000));

      await benchmarkColdStart();
      
      console.log("\n✅ Benchmark Complete. Disconnecting...");
      clients.forEach(c => c.disconnect());
      process.exit(0);
  } catch (err) {
      console.error("\n❌ Benchmark Failed:", err);
      process.exit(1);
  }
})();