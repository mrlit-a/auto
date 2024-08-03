const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const qrcode = require('qrcode-terminal')
const fs = require('fs')

// Lire les numéros de téléphone depuis un fichier ou une variable globale
let phoneNumbers = []

const startWhatsAppBot = async () => {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info')
    const sock = makeWASocket({
        auth: state
    })

    sock.ev.on('creds.update', saveCreds)

    // Gérer les mises à jour de la connexion
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            const reason = lastDisconnect.error?.output?.statusCode
            if (reason === DisconnectReason.loggedOut) {
                console.log('Déconnecté')
                startWhatsAppBot()
            } else {
                startWhatsAppBot()
            }
        } else if (connection === 'open') {
            console.log('Connecté')
            // Envoyer un message de bienvenue à tous les numéros de téléphone ajoutés
            phoneNumbers.forEach(async (number) => {
                await sock.sendMessage(number, { text: 'Bot WhatsApp activé pour lire vos statuts automatiquement.' })
            })
        }
    })

    // Gérer la génération du QR code
    sock.ev.on('qr', (qr) => {
        qrcode.generate(qr, { small: true })
        console.log('QR Code:', qr)
    })

    // Écouter les mises à jour de statut
    sock.ev.on('messages.upsert', async (msg) => {
        console.log('Nouveau message reçu', msg)
        if (msg.messages && msg.messages[0].message && msg.messages[0].message.protocolMessage) {
            const statusUpdate = msg.messages[0].message.protocolMessage.historySyncNotification
            if (statusUpdate) {
                console.log('Nouvelle mise à jour de statut:', statusUpdate)
                // Traitez les mises à jour de statut ici
            }
        }
    })

    return sock
}

startWhatsAppBot()