const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

// ACÁ PONÉS LA URL DE TU WEB DE GALMED
const LARAVEL_WEBHOOK_URL = 'https://galmed.com.ar/whatsapp/webhook';

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('============= ESCANEÁ EL QR =============');
});

client.on('ready', () => {
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

// Servidor web para que Render se mantenga activo
app.get('/', (req, res) => res.send('Motor activo'));
app.listen(port, () => console.log(`Puerto ${port} activo`));
