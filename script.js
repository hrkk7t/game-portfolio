/* --- CONFIGURATION --- */
const TILE_SIZE = 50;

// マップデータ
const mapData = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 2, 0, 0, 1, 2, 0, 0, 0, 0, 2, 1, 0, 0, 2, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 3, 3, 3, 3, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 3, 3, 3, 3, 0, 0, 0, 0, 0, 1],
    [1, 1, 0, 0, 1, 1, 3, 3, 3, 3, 1, 1, 0, 0, 1, 1],
    [1, 2, 0, 0, 0, 0, 3, 3, 3, 3, 0, 0, 0, 0, 2, 1],
    [1, 0, 0, 0, 0, 0, 3, 3, 3, 3, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 9, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

const artData = [
    { title: 'WEB SITE', desc: 'コーポレートサイト制作\n使用技術: HTML/CSS/JS' },
    { title: 'APP UI', desc: 'モバイルアプリUIデザイン\nFigmaを使用' },
    { title: 'GRAPHIC', desc: 'イベントポスター\nPhotoshop/Illustrator' },
    { title: 'LOGO', desc: 'ブランドロゴ制作' },
    { title: 'ILLUST', desc: 'オリジナルキャラクター' }
];

const receptionData = {
    title: 'RECEPTION',
    desc: 'ようこそ。\n当美術館は、深夜のみ開館しております。\nごゆっくりご覧ください。'
};

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#050505', // 背景色
    pixelArt: true, // ドット絵をくっきり表示
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
let activeItem = null;
let isModalOpen = false;
const btnState = { up: false, down: false, left: false, right: false };

const game = new Phaser.Game(config);

function preload() {
    // 【重要】32x32pxで区切って読み込みます
    // 画像サイズが正しく96x128pxであればこれで正常に分割されます
    this.load.spritesheet('ghost', 'player.png', { 
        frameWidth: 32, 
        frameHeight: 32 
    });
    
    this.load.image('wall', 'wall.png');
    this.load.image('floor', 'floor.png');
    this.load.image('carpet', 'carpet.png');
}

function create() {
    const walls = this.physics.add.staticGroup();
    interactGroup = this.physics.add.staticGroup();
    let artIndex = 0;

    // --- マップ生成 ---
    for (let row = 0; row < mapData.length; row++) {
        for (let col = 0; col < mapData[row].length; col++) {
            const x = col * TILE_SIZE + TILE_SIZE / 2;
            const y = row * TILE_SIZE + TILE_SIZE / 2;
            const tileType = mapData[row][col];

            // 床
            let floorTile;
            if (tileType === 3) {
                floorTile = this.add.image(x, y, 'carpet').setDisplaySize(TILE_SIZE, TILE_SIZE);
            } else {
                floorTile = this.add.image(x, y, 'floor').setDisplaySize(TILE_SIZE, TILE_SIZE);
            }
            floorTile.setTint(0xbbbbbb); // 少し暗く

            // 壁・作品・受付
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
                const art = this.add.rectangle(x, y, 40, 40, 0x00bcd4); 
                art.setStrokeStyle(2, 0xffffff);
                
                this.physics.add.existing(art, true);
                art.setData('info', data);
                interactGroup.add(art);
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

    // --- プレイヤー（おばけ）の設定 ---
    // 初期位置 400, 500 に生成
    player = this.physics.add.sprite(400, 500, 'ghost');
    
    // 【重要】表示順序（Depth）を上げて、床より手前に表示させる
    player.setDepth(10); 
    
    // サイズ調整
    player.setScale(1.5); 
    player.setOrigin(0.5, 0.5);
    player.setCollideWorldBounds(true);
    // 当たり判定のサイズを少し小さくして、歩きやすくする
    player.body.setSize(20, 20);
    player.body.setOffset(6, 12);

    // --- アニメーション定義 ---
    // 画像の並び順（左上から右へ 0,1,2...）に基づき設定
    
    // 下向き (1行目: 0, 1, 2)
    this.anims.create({
        key: 'down',
        frames: this.anims.generateFrameNumbers('ghost', { start: 0, end: 2 }),
        frameRate: 8,
        repeat: -1
    });

    // 左向き (2行目: 3, 4, 5)
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('ghost', { start: 3, end: 5 }),
        frameRate: 8,
        repeat: -1
    });

    // 右向き (3行目: 6, 7, 8)
    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('ghost', { start: 6, end: 8 }),
        frameRate: 8,
        repeat: -1
    });

    // 上向き (4行目: 9, 10, 11)
    this.anims.create({
        key: 'up',
        frames: this.anims.generateFrameNumbers('ghost', { start: 9, end: 11 }),
        frameRate: 8,
        repeat: -1
    });

    // 初期状態は下向きで停止
    player.play('down');
    player.anims.stop();

    this.physics.add.collider(player, walls);
    this.physics.add.overlap(player, interactGroup, checkItem, null, this);

    cursors = this.input.keyboard.createCursorKeys();
    spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    setupController();
}

function update() {
    if (isModalOpen) {
        player.body.setVelocity(0);
        player.anims.stop();
        return;
    }
    
    player.body.setVelocity(0);
    const speed = 150;
    
    // 移動フラグ
    let moving = false;

    // --- キー入力とアニメーション制御 ---
    
    // 左
    if (cursors.left.isDown || btnState.left) {
        player.body.setVelocityX(-speed);
        // true を渡すことで「同じアニメーションならリセットしない」ようにする
        player.anims.play('left', true);
        moving = true;
    } 
    // 右
    else if (cursors.right.isDown || btnState.right) {
        player.body.setVelocityX(speed);
        player.anims.play('right', true);
        moving = true;
    }
    // 上
    else if (cursors.up.isDown || btnState.up) {
        player.body.setVelocityY(-speed);
        player.anims.play('up', true);
        moving = true;
    } 
    // 下
    else if (cursors.down.isDown || btnState.down) {
        player.body.setVelocityY(speed);
        player.anims.play('down', true);
        moving = true;
    }

    // 移動していない時はアニメーションを止める
    if (!moving) {
        player.anims.stop();
        
        // 止まった瞬間のフレームを維持するか、
        // ニュートラル（真ん中の足踏み）に戻すこともできますが、
        // いったんはstopのみで自然に見えます。
    }

    if (Phaser.Input.Keyboard.JustDown(spaceKey) && activeItem) {
        openModal(activeItem);
    }
    activeItem = null;
}

function checkItem(player, item) {
    activeItem = item.getData('info');
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
            if (activeItem && !isModalOpen) openModal(activeItem);
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