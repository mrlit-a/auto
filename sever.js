const express = require('express')
const { exec } = require('child_process')
const path = require('path')
const bodyParser = require('body-parser')

const app = express()
const host = '0.0.0.0';
const port = process.env.PORT || 3000

let pairingCode = null
let phoneNumbers = []

// Middleware pour parser les données du formulaire
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Servir le fichier index.html
app.use(express.static(path.join(__dirname, 'public')))

// Endpoint pour générer un nouveau code de jumelage
app.post('/generate-pairing-code', (req, res) => {
    const phoneNumber = req.body.phoneNumber
    if (phoneNumber) {
        pairingCode = Math.floor(100000 + Math.random() * 900000).toString() // Générer un code à 6 chiffres
        console.log('Code de jumelage généré:', pairingCode)
        phoneNumbers.push(phoneNumber) // Ajouter le numéro de téléphone à la liste
        res.json({ pairingCode })
    } else {
        res.status(400).json({ status: 'Numéro de téléphone manquant' })
    }
})

// Endpoint pour valider le code de jumelage et démarrer le bot
app.get('/pair', (req, res) => {
    const { code } = req.query
    if (code === pairingCode) {
        exec('node whatsapp-bot.js', (error, stdout, stderr) => {
            if (error) {
                console.error(`Erreur lors du démarrage du bot: ${error}`)
                return res.status(500).send('Échec du démarrage du bot')
            }
            console.log(`Bot démarré avec succès: ${stdout}`)
            res.send('Bot démarré avec succès')
        })
    } else {
        res.status(400).send('Code de jumelage invalide')
    }
})

// Démarrer le serveur et afficher le lien public
app.listen(port, host, () => {
    console.log(`Serveur en cours d'exécution sur http://${host}:${port}`)
    console.log(`Lien public pour ajouter des numéros: http://${host}:${port}/index.html`)
})