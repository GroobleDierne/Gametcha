const { createCanvas, loadImage } = require('canvas')


const MAP_WIDTH = 500
const MAP_HEIGHT = 500
const RESOURCE_AMOUNT = 200

function randint(a, b) {
    return Math.floor(Math.random() * (b - a + 1) + a);
}

class Player {
    invSize = 100
    constructor() {
        this.x = randint(0, MAP_WIDTH)
        this.y = randint(0, MAP_HEIGHT)
        this.collected = 0
    }

    collect(amount) {
        if (this.collected + amount > this.invSize) {
            this.collected = this.invSize
            return this.invSize-this.collected
        }
        this.collected += amount
        return amount
    }
}

class Structure {
    constructor(type, level, maxLevel, x, y) {
        this.type = type
        this.level = level,
        this.maxLevel = maxLevel
        this.x = x
        this.y = y
    }

    distance(coords) {
        return Math.sqrt((this.x - coords.x)**2 + (this.y - coords.y)**2)
    }
}


let activeChallenges = {}

let challengeId = 0

function registerNewSession() {
    challengeId++
    activeChallenges[challengeId] = {
        initialized: false,
        succeeded: false,
        player: new Player(),
        structures: []
    }
    return challengeId
}

function getChallenge(id) {
    return activeChallenges[id]
}

function exists(id) {    
    return activeChallenges[id] != undefined
}

async function renderChallenge(id) {
    if (!exists(id)) {        
        return { error: 'no challenge with that id' }
    }

    const chall = activeChallenges[id]

    if (!chall.initialized) {
        chall.initialized = true

        const collectPoint = new Structure('collection', 0, RESOURCE_AMOUNT, randint(3, MAP_WIDTH-3), randint(3, MAP_HEIGHT-3))
        chall.structures.push(collectPoint)

        const resourcesLocationCount = randint(2, 5)
        for (let i = 0; i < resourcesLocationCount; i++) {
            let resourceLocation
            let locationTried = 0
            do {
                locationTried++
                resourceLocation = new Structure(
                    'resource',
                    Math.ceil(RESOURCE_AMOUNT/resourcesLocationCount),
                    Math.ceil(RESOURCE_AMOUNT/resourcesLocationCount),
                    randint(16, MAP_WIDTH-16),
                    randint(16, MAP_HEIGHT-16)
                )

                closestNeighbour = chall.structures
                .map(x => resourceLocation.distance(x))
                .reduce((prev, cur) => prev < cur ? prev : cur)
            } while (closestNeighbour < 30 && locationTried < 10);

            chall.structures.push(resourceLocation)
        }
    }

    let canvas = createCanvas(MAP_WIDTH+32, MAP_HEIGHT+32)
    let ctx = canvas.getContext('2d')

    ctx.strokeStyle = 'rgba(0, 255, 0, 1)'
    ctx.fillRect(0, 0, MAP_WIDTH+32, MAP_HEIGHT+32)

    const mapSprite = await loadImage('sprites/map.png')
    const playerSprite = await loadImage('sprites/player.png')
    const resourceSprite = await loadImage('sprites/resource.png')
    const collectionSprite = await loadImage('sprites/panier.png')

    ctx.drawImage(mapSprite, 16, 16)
    ctx.strokeStyle = 'rgba(0, 0, 0, 1)'
    ctx.font = '14px'
    chall.structures.forEach(struct => {
        ctx.drawImage(struct.type === 'resource' ? resourceSprite : collectionSprite, 16+struct.x-25, 16+struct.y-25)
        ctx.strokeText(`${struct.level}/${struct.maxLevel}`, 16+struct.x-5, 16+struct.y+35)
    });
    ctx.drawImage(playerSprite, 16+chall.player.x-25, 16+chall.player.y-20)
    ctx.strokeText(`${chall.player.collected}/${chall.player.invSize}`, 16+chall.player.x-5, 16+chall.player.y+35)


    return {img: canvas.toDataURL(), succeeded: chall.succeeded}
    
}

function handleInput(id, input) {
    if (!exists(id)) {
        return { error: 'no challenge with that id' }
    }

    const chall = activeChallenges[id]

    switch (input) {
        case 'down':
            chall.player.y = Math.max(chall.player.y + 5, 16)
            break;
        case 'up':
            chall.player.y = Math.min(chall.player.y - 5, MAP_HEIGHT-16)
            break;
        case 'left':
            chall.player.x = Math.max(chall.player.x - 5, 16)
            break;
        case 'right':
            chall.player.x = Math.min(chall.player.x + 5, MAP_WIDTH-16)
            break;
        default:
            break;
    }
}

function tick() {
    Object.keys(activeChallenges).forEach(key => {
        const chall = activeChallenges[key]
        if (chall.succeeded) return
        const resources = chall.structures.filter(x => x.type === 'resource')
        
        for (let i = 0; i < resources.length; i++) {
            if (resources[i].distance(chall.player) < 20) {
                const toCollect = Math.min(resources[i].level, 5)
                const amountCollected = chall.player.collect(toCollect)
                resources[i].level -= amountCollected
                break;
            }
        }

        chall.structures.filter(x => x.type === 'collection').forEach(collection => {
            if (collection.distance(chall.player) < 20) {
                const toCollect = Math.min(chall.player.collected, 5)
                chall.player.collected -= toCollect
                collection.level += toCollect
                if (collection.level === collection.maxLevel) {
                    chall.succeeded = true
                }
            }
        })
        activeChallenges[key] = chall
    })
}

setInterval(tick, 200)

module.exports = { registerNewSession, getChallenge, renderChallenge, handleInput, Structure, Player }