const { Client, LocalAuth } = require('whatsapp-web.js');
const axios = require('axios');
const express = require('express');

const app = express();
const port = process.env.PORT || 10000;

// ACÁ PONÉS LA URL DE TU WEB DE GALMED
const LARAVEL_WEBHOOK_URL = 'https://galmed.com.ar/whatsapp/webhook';

// Variables para controlar la pantalla web
let currentQR = '';
let isConnected = false;

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    currentQR = qr; // Guardamos el texto del QR
    console.log('QR Generado. Entrá a la URL web para escanearlo.');
});

client.on('ready', () => {
    isConnected = true;
    currentQR = ''; // Limpiamos el QR porque ya se conectó
    console.log('¡WhatsApp conectado y escuchando en vivo!');
});

client.on('message', async msg => {
    if(msg.isGroupMsg || msg.isStatus) return; // Ignoramos grupos

    try {
        await axios.post(LARAVEL_WEBHOOK_URL, {
            from: msg.from,
            body: msg.body,
            notifyName: msg._data.notifyName || 'Cliente'
        });
        console.log('Enviado a Galmed:', msg.body);
    } catch (error) {
        console.error('Error enviando a Galmed:', error.message);
    }
});

client.initialize();

// --- LA MAGIA VISUAL ---
app.get('/', (req, res) => {
    if (isConnected) {
        res.send('<h2 style="font-family: Arial; color: green; text-align: center; margin-top: 50px;">¡Motor activo y WhatsApp conectado a Galmed! 🚀</h2>');
    } else if (currentQR) {
        // Transformamos el texto feo en una imagen de QR perfecta usando una API gratuita
        const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(currentQR)}`;
        res.send(`
            <div style="text-align:center; margin-top: 50px; font-family: Arial;">
                <h2>Escaneá este QR con el WhatsApp de Galmed</h2>
                <img src="${qrImageUrl}" alt="QR Code" style="border: 2px solid #ccc; padding: 10px; border-radius: 10px;" />
                <p>Una vez escaneado, recargá esta página para ver si se conectó.</p>
            </div>
        `);
    } else {
        res.send('<h2 style="font-family: Arial; text-align: center; margin-top: 50px;">Iniciando el motor... Esperá 15 segundos y recargá la página.</h2>');
    }
});

app.listen(port, () => console.log(`Puerto ${port} activo`));
