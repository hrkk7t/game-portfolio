/* --- CONFIGURATION --- */
const TILE_SIZE = 50;

// マップデータ定義
// 0: 床 (何もなし)
// 1: 美術館の壁 (奥にある壁・通れない・作品が飾れる)
// 2: 作品 (壁に飾られた絵)
// 3: 赤絨毯 (床・装飾)
// 4: 仕切り (手前の障害物・wall.pngを使用)
// 9: 受付
const mapData = [
    // --- 【エリア1：最奥の大広間】(WEB / UI) ---
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 2, 0, 0, 0, 0, 1, 2, 0, 1, 2, 0, 0, 0, 0, 2, 1, 1], // 作品列
    [1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1],
    [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
    [1, 1, 1, 1, 4, 4, 1, 1, 0, 0, 1, 1, 4, 4, 1, 1, 1, 1, 1], // 区切り

    // --- 【エリア2：左右の回廊】(GRAPHIC / LOGO) ---
    [1, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 2, 0, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0, 0, 2, 0, 1], // 左右作品
    [1, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 0, 3, 3, 0, 1, 1, 1, 1, 1, 1, 1, 1],

    // --- 【エリア3：エントランスホール】(ILLUST / 受付) ---
    [1, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 2, 0, 0, 0, 3, 3, 0, 0, 0, 2, 0, 0, 0, 0, 1], // 手前作品
    [1, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 9, 9, 9, 9, 0, 0, 0, 0, 0, 0, 0, 1], // 受付
    [1, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1], // 入口
    [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1]  // 外
];

const artData = [
    { title: 'WEB SITE', desc: 'コーポレートサイト制作\n使用技術: HTML/CSS/JS' },
    { title: 'APP UI', desc: 'モバイルアプリUIデザイン\nFigmaを使用' },
    { title: 'GRAPHIC', desc: 'イベントポスター\nPhotoshop/Illustrator' },
    { title: 'LOGO', desc: 'ブランドロゴ制作' },
    { title: 'ILLUST', desc: 'オリジナルキャラクター' },
    { title: 'GAME', desc: 'Unityで制作した\n3Dアクションゲーム' },
    { title: 'SECRET', desc: '隠し要素：\n開発中のプロトタイプ' }
];

const receptionData = {
    title: 'RECEPTION',
    desc: 'ようこそ。\n当美術館は、深夜のみ開館しております。\n\n矢印キーで移動し、\n作品の前でSPACEキー(またはSELECT)を押すと\n詳細をご覧いただけます。'
};

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#2d1b1e',
    pixelArt: true,
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
let interactGroup;
let isModalOpen = false;
const btnState = { up: false, down: false, left: false, right: false };

const game = new Phaser.Game(config);

/* --- PRELOAD --- */
function preload() {
    this.load.spritesheet('ghost', 'player.png', { frameWidth: 160, frameHeight: 160 });
    this.load.image('partition', 'wall.png');
    this.load.image('floor', 'floor.png');
    this.load.image('carpet', 'carpet.png');
}

/* --- CREATE --- */
function create() {
    /* --- GROUPS & WORLD --- */
    const walls = this.physics.add.staticGroup();
    const partitions = this.physics.add.staticGroup();
    interactGroup = this.physics.add.staticGroup();
    
    let artIndex = 0;
    const mapWidth = mapData[0].length * TILE_SIZE;
    const mapHeight = mapData.length * TILE_SIZE;
    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);

    /* --- BACKGROUND --- */
    for (let row = 0; row < mapData.length; row++) {
        for (let col = 0; col < mapData[row].length; col++) {
            const x = col * TILE_SIZE + TILE_SIZE / 2;
            const y = row * TILE_SIZE + TILE_SIZE / 2;
            
            if (mapData[row][col] === 3) {
                this.add.image(x, y, 'carpet').setDisplaySize(TILE_SIZE, TILE_SIZE);
            } else {
                const f = this.add.image(x, y, 'floor').setDisplaySize(TILE_SIZE, TILE_SIZE);
                f.setTint(0xbbbbbb);
            }
        }
    }

    /* --- OBJECTS --- */
    for (let row = 0; row < mapData.length; row++) {
        for (let col = 0; col < mapData[row].length; col++) {
            const x = col * TILE_SIZE + TILE_SIZE / 2;
            const y = row * TILE_SIZE + TILE_SIZE / 2;
            const tileType = mapData[row][col];

            if (tileType === 1 || tileType === 2) {
                const wallColor = 0x5c0912;
                const wallRect = this.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, wallColor);
                wallRect.setStrokeStyle(2, 0x220000);
                this.physics.add.existing(wallRect, true);
                walls.add(wallRect);
            }

            if (tileType === 2) {
                const data = artData[artIndex] || { title: 'No Data', desc: '...' };
                
                const frame = this.add.rectangle(x, y, 40, 40, 0xffd700); 
                frame.setStrokeStyle(2, 0xb8860b);
                this.add.rectangle(x, y, 32, 32, 0x1e88e5);
                
                const interactZone = this.add.zone(x, y + 20, TILE_SIZE, TILE_SIZE);
                this.physics.add.existing(interactZone, true);
                interactZone.setData('info', data);
                interactGroup.add(interactZone);
                
                artIndex++;
            }

            if (tileType === 4) {
                const p = this.physics.add.image(x, y, 'partition');
                p.setDisplaySize(TILE_SIZE, TILE_SIZE);
                partitions.add(p);
                p.refreshBody(); 
            }

            if (tileType === 9) {
                const desk = this.add.rectangle(x, y, TILE_SIZE, 30, 0x5d4037);
                desk.setStrokeStyle(1, 0x3e2723);
                this.physics.add.existing(desk, true);
                desk.setData('info', receptionData);
                interactGroup.add(desk);
                this.add.circle(x, y - 10, 10, 0xffffff);
            }
        }
    }

    /* --- PLAYER --- */
    // スタート位置を新しいマップの入口（下中央）に合わせました
    player = this.physics.add.sprite(9 * TILE_SIZE, 14 * TILE_SIZE, 'ghost');
    player.setDepth(20);
    player.setScale(0.2); 
    player.body.setSize(120, 120); 
    player.body.setOffset(20, 20);
    player.setCollideWorldBounds(true);

    this.cameras.main.startFollow(player);
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
    this.cameras.main.setZoom(1.5); 

    this.anims.create({ key: 'down', frames: this.anims.generateFrameNumbers('ghost', { start: 0, end: 2 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'left', frames: this.anims.generateFrameNumbers('ghost', { start: 3, end: 5 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'right', frames: this.anims.generateFrameNumbers('ghost', { start: 6, end: 8 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'up', frames: this.anims.generateFrameNumbers('ghost', { start: 9, end: 11 }), frameRate: 8, repeat: -1 });

    player.play('down');
    player.anims.stop();

    /* --- COLLIDERS & INPUT --- */
    this.physics.add.collider(player, walls);
    this.physics.add.collider(player, partitions);

    cursors = this.input.keyboard.createCursorKeys();
    spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    setupController();
}

/* --- UPDATE --- */
function update() {
    if (isModalOpen) {
        player.body.setVelocity(0);
        player.anims.stop();
        return;
    }
    
    player.body.setVelocity(0);
    const speed = 200;
    let moving = false;

    if (cursors.left.isDown || btnState.left) {
        player.body.setVelocityX(-speed);
        player.anims.play('left', true);
        moving = true;
    } 
    else if (cursors.right.isDown || btnState.right) {
        player.body.setVelocityX(speed);
        player.anims.play('right', true);
        moving = true;
    }
    else if (cursors.up.isDown || btnState.up) {
        player.body.setVelocityY(-speed);
        player.anims.play('up', true);
        moving = true;
    } 
    else if (cursors.down.isDown || btnState.down) {
        player.body.setVelocityY(speed);
        player.anims.play('down', true);
        moving = true;
    }

    if (!moving) {
        player.anims.stop();
    }

    if (Phaser.Input.Keyboard.JustDown(spaceKey)) {
        tryInteract();
    }
}

/* --- HELPER FUNCTIONS --- */
function tryInteract() {
    if (isModalOpen) return;
    game.scene.scenes[0].physics.overlap(player, interactGroup, (player, item) => {
        const info = item.getData('info');
        if (info) {
            openModal(info);
        }
    });
}

function openModal(info) {
    isModalOpen = true;
    document.getElementById('modal-title').innerText = info.title;
    document.getElementById('modal-content').innerHTML = info.desc.replace(/\n/g, '<br>');
    document.getElementById('modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    isModalOpen = false;
}

document.getElementById('modal-close-btn').addEventListener('click', closeModal);

/* --- CONTROLLER SETUP --- */
function setupController() {
    const addTouch = (id, dir) => {
        const btn = document.getElementById(id);
        if(!btn) return;
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
    if(selectBtn) {
        const triggerSelect = (e) => {
            e.preventDefault();
            if (!isModalOpen) tryInteract();
        };
        selectBtn.addEventListener('click', triggerSelect);
        selectBtn.addEventListener('touchstart', triggerSelect);
    }
    const cancelBtn = document.getElementById('btn-cancel');
    if(cancelBtn) {
        const triggerCancel = (e) => {
            e.preventDefault();
            if (isModalOpen) closeModal();
        };
        cancelBtn.addEventListener('click', triggerCancel);
        cancelBtn.addEventListener('touchstart', triggerCancel);
    }
}