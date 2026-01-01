const Y = require('yjs');
const { WebsocketProvider } = require('y-websocket');
const WebSocket = require('ws');

// Polyfill WebSocket for Node.js
global.WebSocket = WebSocket;

// CONFIGURATION
const SERVER_URL = "ws://localhost:5000"; 
const ROOM_ID = "benchmark-room-yjs";
const FILE_ID = "bench-file.js";
const DOC_ID = `yjs/${ROOM_ID}-${FILE_ID}`; 
const TOTAL_CLIENTS = 300; 

console.log(`🚀 Starting DEBUG Benchmark: ${TOTAL_CLIENTS} clients connecting to ${SERVER_URL}...`);

const clients = [];

// HELPER: Promise with Timeout
const waitWithTimeout = (promise, ms, label) => {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(`TIMEOUT: ${label} took longer than ${ms}ms`)), ms))
    ]);
};

// 1. SETUP CLIENTS
async function setupClients() {
    console.log("   [Step 1] connecting clients...");
    const promises = [];

    for (let i = 0; i < TOTAL_CLIENTS; i++) {
        const doc = new Y.Doc();
        const provider = new WebsocketProvider(SERVER_URL, DOC_ID, doc, { connect: false });
        
        clients.push({ id: i, doc, provider });

        // Connect and wait for sync with 5s timeout
        const connectPromise = new Promise((resolve) => {
            provider.on('synced', (isSynced) => {
                if (isSynced) resolve();
            });
            provider.connect();
        });

        promises.push(connectPromise);
    }

    const start = Date.now();
    try {
        // Wait max 10 seconds for all clients to connect
        await waitWithTimeout(Promise.all(promises), 10000, "Client Connection");
        console.log(`✅ ${TOTAL_CLIENTS} clients connected & synced in ${Date.now() - start}ms`);
    } catch (err) {
        console.error("❌ STUCK AT CONNECTION:", err.message);
        console.error("👉 Check if your server is running and accessible at ws://localhost:5000");
        process.exit(1);
    }
}

// 2. TEST: TYPING LATENCY
async function benchmarkLatency() {
    console.log("\n--- TEST 1: Typing Latency (Point-to-Point) ---");
    
    const sender = clients[0];
    const receiver = clients[clients.length - 1];
    
    const senderText = sender.doc.getText(FILE_ID);
    const receiverText = receiver.doc.getText(FILE_ID);

    // Warmup
    senderText.insert(0, 'Warmup');

    const samples = 5; // Reduced samples for debugging
    let totalLatency = 0;

    for (let i = 0; i < samples; i++) {
        process.stdout.write(`   Ping ${i+1}/${samples}... `);
        
        try {
            await waitWithTimeout(new Promise(resolve => {
                const timestamp = Date.now().toString();
                
                const listener = () => {
                    const str = receiverText.toString();
                    if (str.includes(timestamp)) {
                        const lat = Date.now() - parseInt(timestamp);
                        totalLatency += lat;
                        receiverText.unobserve(listener);
                        senderText.delete(0, senderText.length); 
                        process.stdout.write(`${lat}ms\n`);
                        resolve();
                    }
                };
                
                receiverText.observe(listener);
                senderText.insert(0, timestamp);
            }), 2000, `Ping ${i+1}`); // 2s timeout per ping
        } catch (err) {
            console.log("\n❌ STUCK AT LATENCY TEST:", err.message);
            console.log("👉 The receiver is not getting updates. WebSocket might be silent.");
            return; // Skip to next test
        }
        
        await new Promise(r => setTimeout(r, 100));
    }

    console.log(`✅ Average Latency: ${(totalLatency / samples).toFixed(2)}ms`);
}

// 3. TEST: CONCURRENT STRESS
async function benchmarkStress() {
    console.log("\n--- TEST 2: High Concurrency Stress ---");
    
    const activeTypers = clients.slice(0, 20); 
    const observer = clients[clients.length - 1]; 
    const observerText = observer.doc.getText(FILE_ID);

    let updatesReceived = 0;
    const testDuration = 2000; 

    const listener = () => updatesReceived++;
    observerText.observe(listener);

    console.log(`⚡ 20 users typing simultaneously for ${testDuration/1000}s...`);

    const intervals = activeTypers.map((client, index) => {
        const text = client.doc.getText(FILE_ID);
        return setInterval(() => {
            text.insert(0, `U${index}`);
        }, 50);
    });

    await new Promise(r => setTimeout(r, testDuration));

    intervals.forEach(clearInterval);
    observerText.unobserve(listener);

    if (updatesReceived === 0) {
        console.error("❌ FAILED: Observer received 0 updates.");
        console.error("👉 Check if your server supports broadcasting (is yjsUtils.js correct?)");
    } else {
        console.log(`✅ Processed ${updatesReceived} updates in 2s`);
        console.log(`📊 Throughput: ~${(updatesReceived / (testDuration/1000)).toFixed(0)} ops/sec`);
    }
}

// RUNNER
(async () => {
    try {
        await setupClients();
        await benchmarkLatency();
        await benchmarkStress();
        
        console.log("\n✅ Done. Disconnecting...");
        clients.forEach(c => c.provider.destroy());
        process.exit(0);
    } catch (err) {
        console.error("❌ Benchmark Crashed:", err);
        process.exit(1);
    }
})();