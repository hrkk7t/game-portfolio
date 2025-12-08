/* --- CONFIGURATION --- */
const TILE_SIZE = 50;

const mapData = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 2, 0, 2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

const artData = [
    { title: 'HOMEPAGE', desc: 'Webサイト制作実績...' },
    { title: 'UI DESIGN', desc: 'アプリUIデザイン実績...' },
    { title: 'GRAPHIC', desc: 'バナー・チラシ制作...' },
    { title: 'LOGO', desc: 'ロゴデザイン...' },
    { title: 'ILLUST', desc: 'オリジナルイラスト...' }
];

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#000000',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: { preload: preload, create: create, update: update }
};

let player;
let cursors;
let spaceKey;
let artGroup;
let activeArt = null;
let isModalOpen = false;

const btnState = {
    up: false,
    down: false,
    left: false,
    right: false
};

const game = new Phaser.Game(config);

/* --- PRELOAD --- */
function preload() {
    this.load.image('ghost', 'player.png');
}

/* --- CREATE --- */
function create() {
    const walls = this.physics.add.staticGroup();
    artGroup = this.physics.add.staticGroup();
    let artIndex = 0;

    for (let row = 0; row < mapData.length; row++) {
        for (let col = 0; col < mapData[row].length; col++) {
            const x = col * TILE_SIZE + TILE_SIZE / 2;
            const y = row * TILE_SIZE + TILE_SIZE / 2;

            if (mapData[row][col] === 1) {
                const wall = this.add.rectangle(x, y, TILE_SIZE, TILE_SIZE);
                wall.setStrokeStyle(2, 0x00bcd4);
                walls.add(wall);
            } else if (mapData[row][col] === 2) {
                const data = artData[artIndex] || { title: 'No Data', desc: '...' };
                const art = this.add.rectangle(x, y, 40, 40, 0x00bcd4);
                art.setAlpha(0.5);
                this.physics.add.existing(art, true);
                art.setData('info', data);
                artGroup.add(art);
                artIndex++;
            }
        }
    }

    player = this.physics.add.sprite(100, 300, 'ghost');
    player.setScale(0.15);
    player.setCollideWorldBounds(true);

    this.physics.add.collider(player, walls);
    this.physics.add.overlap(player, artGroup, checkArt, null, this);

    cursors = this.input.keyboard.createCursorKeys();
    spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    setupController();
}

/* --- UPDATE --- */
function update() {
    if (isModalOpen) {
        player.body.setVelocity(0);
        return;
    }

    player.body.setVelocity(0);
    const speed = 200;

    if (cursors.left.isDown || btnState.left) {
        player.body.setVelocityX(-speed);
        player.setFlipX(false);
    } 
    else if (cursors.right.isDown || btnState.right) {
        player.body.setVelocityX(speed);
        player.setFlipX(true);
    }

    if (cursors.up.isDown || btnState.up) {
        player.body.setVelocityY(-speed);
    } 
    else if (cursors.down.isDown || btnState.down) {
        player.body.setVelocityY(speed);
    }

    if (Phaser.Input.Keyboard.JustDown(spaceKey) && activeArt) {
        openModal(activeArt);
    }
    
    activeArt = null;
}

/* --- FUNCTIONS --- */
function checkArt(player, art) {
    activeArt = art.getData('info');
}

function openModal(info) {
    isModalOpen = true;
    document.getElementById('modal-title').innerText = info.title;
    document.getElementById('modal-content').innerText = info.desc;
    document.getElementById('modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    isModalOpen = false;
}

document.getElementById('modal-close-btn').addEventListener('click', closeModal);

function setupController() {
    const addTouch = (id, dir) => {
        const btn = document.getElementById(id);
        const start = (e) => { e.preventDefault(); btnState[dir] = true; };
        const end = (e) => { e.preventDefault(); btnState[dir] = false; };
        
        btn.addEventListener('mousedown', start);
        btn.addEventListener('touchstart', start);
        btn.addEventListener('mouseup', end);
        btn.addEventListener('touchend', end);
        btn.addEventListener('mouseleave', end);
    };

    addTouch('btn-up', 'up');
    addTouch('btn-down', 'down');
    addTouch('btn-left', 'left');
    addTouch('btn-right', 'right');

    const selectBtn = document.getElementById('btn-select');
    const triggerSelect = (e) => {
        e.preventDefault();
        if (activeArt && !isModalOpen) {
            openModal(activeArt);
        }
    };
    selectBtn.addEventListener('click', triggerSelect);
    selectBtn.addEventListener('touchstart', triggerSelect);

    const cancelBtn = document.getElementById('btn-cancel');
    const triggerCancel = (e) => {
        e.preventDefault();
        if (isModalOpen) {
            closeModal();
        }
    };
    cancelBtn.addEventListener('click', triggerCancel);
    cancelBtn.addEventListener('touchstart', triggerCancel);
}