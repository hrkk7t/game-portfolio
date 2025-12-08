/* --- CONFIGURATION --- */
const TILE_SIZE = 50;

// マップデータ (0:床, 1:壁, 2:作品, 3:赤絨毯, 9:受付)
const mapData = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 2, 0, 0, 1, 0, 0, 0, 0, 0, 1, 2, 0, 0, 0, 0, 0, 2, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 2, 0, 1],
    [1, 2, 0, 0, 1, 1, 1, 3, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 0, 0, 3, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 2, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 3, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 1, 9, 0, 3, 0, 9, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 0, 3, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 0, 3, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

const artData = [
    { title: 'WEB SITE', desc: 'コーポレートサイト制作\n使用技術: HTML/CSS/JS' },
    { title: 'APP UI', desc: 'モバイルアプリUIデザイン\nFigmaを使用' },
    { title: 'GRAPHIC', desc: 'イベントポスター\nPhotoshop/Illustrator' },
    { title: 'LOGO', desc: 'ブランドロゴ制作' },
    { title: 'ILLUST', desc: 'オリジナルキャラクター' },
    { title: 'GAME', desc: 'Unityで制作した\n3Dアクションゲーム' }
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
    backgroundColor: '#050505',
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

function preload() {
    // 【重要修正1】 ここに「実際の画像の1コマのサイズ」を指定します
    this.load.spritesheet('ghost', 'player.png', { 
        frameWidth: 160,  // 実際の横幅
        frameHeight: 160  // 実際の高さ
    });
    
    this.load.image('wall', 'wall.png');
    this.load.image('floor', 'floor.png');
    this.load.image('carpet', 'carpet.png');
}

function create() {
    const walls = this.physics.add.staticGroup();
    interactGroup = this.physics.add.staticGroup();
    let artIndex = 0;

    const mapWidth = mapData[0].length * TILE_SIZE;
    const mapHeight = mapData.length * TILE_SIZE;
    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);

    for (let row = 0; row < mapData.length; row++) {
        for (let col = 0; col < mapData[row].length; col++) {
            const x = col * TILE_SIZE + TILE_SIZE / 2;
            const y = row * TILE_SIZE + TILE_SIZE / 2;
            const tileType = mapData[row][col];

            let floorTile;
            if (tileType === 3) {
                floorTile = this.add.image(x, y, 'carpet').setDisplaySize(TILE_SIZE, TILE_SIZE);
            } else {
                floorTile = this.add.image(x, y, 'floor').setDisplaySize(TILE_SIZE, TILE_SIZE);
                floorTile.setTint(0xbbbbbb);
            }

            if (tileType === 1) {
                const wall = this.physics.add.image(x, y, 'wall');
                wall.setDisplaySize(TILE_SIZE, TILE_SIZE);
                wall.setTint(0x999999);
                walls.add(wall);
                wall.setImmovable(true);
            } 
            else if (tileType === 2) {
                const wall = this.physics.add.image(x, y, 'wall');
                wall.setDisplaySize(TILE_SIZE, TILE_SIZE);
                walls.add(wall);
                wall.setImmovable(true);

                const data = artData[artIndex] || { title: 'No Data', desc: '...' };
                const frame = this.add.rectangle(x, y, 36, 36, 0x8d6e63);
                const art = this.add.rectangle(x, y, 28, 28, 0x00bcd4);
                
                const interactZone = this.add.zone(x, y + 20, TILE_SIZE, TILE_SIZE);
                this.physics.add.existing(interactZone, true);
                interactZone.setData('info', data);
                interactGroup.add(interactZone);
                artIndex++;
            } 
            else if (tileType === 9) {
                const desk = this.add.rectangle(x, y, TILE_SIZE, 30, 0x5d4037);
                this.physics.add.existing(desk, true);
                desk.setData('info', receptionData);
                interactGroup.add(desk);
                this.add.circle(x, y - 10, 10, 0xffffff);
            }
        }
    }

    // --- プレイヤー設定 ---
    player = this.physics.add.sprite(mapWidth / 2, mapHeight - 100, 'ghost');
    player.setDepth(10);
    
    // 【重要修正2】 スケール調整
    // 32px / 160px = 0.2 なので、0.2倍に縮小します。
    player.setScale(0.2); 

    // 当たり判定の調整
    // 元の160pxの画像に対して、余白を削る設定をします。
    // ここでは上下左右に20pxずつの余白があると仮定して、120x120の判定にします。
    // (0.2倍されるので、実際の判定は24x24pxになります)
    player.body.setSize(120, 120); 
    player.body.setOffset(20, 20);
    
    player.setCollideWorldBounds(true);

    // カメラ設定（少しズームして見やすく）
    this.cameras.main.startFollow(player);
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
    this.cameras.main.setZoom(1.5); 

    // --- アニメーション定義 ---
    this.anims.create({
        key: 'down',
        frames: this.anims.generateFrameNumbers('ghost', { start: 0, end: 2 }),
        frameRate: 8,
        repeat: -1
    });
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('ghost', { start: 3, end: 5 }),
        frameRate: 8,
        repeat: -1
    });
    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('ghost', { start: 6, end: 8 }),
        frameRate: 8,
        repeat: -1
    });
    this.anims.create({
        key: 'up',
        frames: this.anims.generateFrameNumbers('ghost', { start: 9, end: 11 }),
        frameRate: 8,
        repeat: -1
    });

    player.play('down');
    player.anims.stop();

    this.physics.add.collider(player, walls);

    cursors = this.input.keyboard.createCursorKeys();
    spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    setupController();
}

// (update関数以降は変更ありませんが、念のため掲載します)
function update() {
    if (isModalOpen) {
        player.body.setVelocity(0);
        player.anims.stop();
        return;
    }
    
    player.body.setVelocity(0);
    const speed = 150;
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