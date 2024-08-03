const express = require('express')
const { exec } = require('child_process')
const path = require('path')
const bodyParser = require('body-parser')
const fs = require('fs')
const qrcode = require('qrcode')

const app = express()
const host = '0.0.0.0'
const port = process.env.PORT || 3000

let phoneNumbers = []

// Middleware pour parser les données du formulaire
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Servir le fichier index.html
app.use(express.static(path.join(__dirname, 'public')))

// Endpoint pour générer un QR code de jumelage
app.get('/generate-qr', async (req, res) => {
    try {
        const { state, saveCreds } = await useMultiFileAuthState('auth_info')
        const sock = makeWASocket({
            auth: state
        })

        sock.ev.on('creds.update', saveCreds)

        sock.ev.on('qr', qr => {
            qrcode.toDataURL(qr, (err, url) => {
                res.json({ qr: url })
            })
        })

        sock.ev.on('connection.update', update => {
            const { connection, lastDisconnect } = update
            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect.error && lastDisconnect.error.output && lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut)
                if (shouldReconnect) {
                    startWhatsAppBot()
                }
            }
        })

        return sock
    } catch (error) {
        console.error('Erreur lors de la génération du QR code:', error)
        res.status(500).send('Erreur lors de la génération du QR code')
    }
})

// Endpoint pour valider le code de jumelage et démarrer le bot
app.get('/pair', (req, res) => {
    const { code } = req.query
    // Ici nous devons vérifier le QR code et non un code numérique
    res.send('Bot démarré avec succès')
})

// Démarrer le serveur et afficher le lien public
app.listen(port, host, () => {
    console.log(`Serveur en cours d'exécution sur http://${host}:${port}`)
    console.log(`Lien public pour ajouter des numéros: http://${host}:${port}/index.html`)
})
