const express = require('express');
const mqtt = require('mqtt');
const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');

// Array untuk menyimpan riwayat data sensor
let historyData = []; 

// Koneksi ke Broker RabbitMQ
const client = mqtt.connect('mqtt://195.35.23.135:1883', {
    username: '/vh-iot-cps-2026:iot-cps-2026',
    password: 'iotcihuy71.'
});

client.on('connect', () => {
    console.log("✅ Terhubung ke MQTT Broker");
    client.subscribe('routing_angel');
});

client.on('message', (topic, message) => {
    try {
        const payload = JSON.parse(message.toString());
        const sekarang = new Date();

        // Menambahkan Tanggal & Waktu (Sesuai yang dipanggil di EJS)
        payload.tanggal = sekarang.toLocaleDateString('id-ID'); 
        payload.waktu = sekarang.toLocaleTimeString('id-ID');
        
        // Masukkan data terbaru ke posisi paling atas
        historyData.unshift(payload);
        
        // Batasi maksimal 50 data di memori
        if (historyData.length > 50) historyData.pop();

        console.log("📥 Data Masuk:", payload);
    } catch (e) { 
        console.log("❌ Error parsing JSON:", e.message); 
    }
});

app.get('/', (req, res) => res.render('index'));

// API untuk hapus history
app.get('/clear-history', (req, res) => {
    historyData = [];
    console.log("🗑️ History telah dihapus");
    res.json({ status: 'success' });
});

// Endpoint untuk stream data real-time ke UI
app.get('/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const interval = setInterval(() => {
        res.write(`data: ${JSON.stringify(historyData)}\n\n`);
    }, 1000);

    req.on('close', () => {
        clearInterval(interval);
        res.end();
    });
});

app.listen(port, () => {
    console.log(`🚀 Dashboard berjalan di http://localhost:${port}`);
});