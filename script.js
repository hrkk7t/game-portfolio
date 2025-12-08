/* --- CONFIGURATION --- */
const TILE_SIZE = 50;

// 1=壁, 0=床, 2=作品, 3=カーペット, 9=受付
const mapData = [
    // 外壁（上）
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    // 左の部屋（作品A, B）        通路          右の部屋（作品C, D）
    [1, 2, 0, 0, 0, 1, 0, 0, 3, 3, 0, 0, 1, 0, 0, 2, 1],
    [1, 0, 0, 0, 0, 1, 0, 0, 3, 3, 0, 0, 1, 0, 0, 0, 1],
    [1, 0, 2, 0, 0, 1, 0, 0, 3, 3, 0, 0, 1, 0, 0, 2, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0, 0, 0, 1],
    // 中央ホール（作品E）
    [1, 1, 1, 0, 0, 1, 0, 0, 3, 3, 0, 0, 1, 0, 0, 1, 1],
    [1, 0, 0, 0, 0, 1, 0, 0, 2, 2, 0, 0, 1, 0, 0, 0, 1], // 真ん中に大きな展示
    [1, 0, 0, 0, 0, 1, 0, 0, 3, 3, 0, 0, 1, 0, 0, 0, 1],
    // エントランス
    [1, 1, 1, 0, 0, 1, 1, 0, 3, 3, 0, 1, 1, 0, 0, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 9, 9, 0, 0, 0, 0, 0, 0, 1], // 受付
    [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1], // 入口
    [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1]  // 外へ
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
    desc: 'ようこそ。\nゆっくりご覧ください。'
};

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
let interactGroup;
let activeItem = null;
let isModalOpen = false;
const btnState = { up: false, down: false, left: false, right: false };

const game = new Phaser.Game(config);

/* --- PRELOAD --- */
function preload() {
    this.load.image('ghost', 'player.png');
    this.load.image('wall', 'wall.png');
    this.load.image('floor', 'floor.png');
    this.load.image('carpet', 'carpet.png');
}

/* --- CREATE --- */
function create() {
    const walls = this.physics.add.staticGroup();
    interactGroup = this.physics.add.staticGroup();
    let artIndex = 0;

    for (let row = 0; row < mapData.length; row++) {
        for (let col = 0; col < mapData[row].length; col++) {
            const x = col * TILE_SIZE + TILE_SIZE / 2;
            const y = row * TILE_SIZE + TILE_SIZE / 2;
            const tileType = mapData[row][col];

            if (tileType === 3) {
                this.add.image(x, y, 'carpet').setDisplaySize(TILE_SIZE, TILE_SIZE);
            } else {
                this.add.image(x, y, 'floor').setDisplaySize(TILE_SIZE, TILE_SIZE);
            }

            if (tileType === 1) {
                const wall = this.physics.add.image(x, y, 'wall');
                wall.setDisplaySize(TILE_SIZE, TILE_SIZE);
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
                const desk = this.add.rectangle(x, y, TILE_SIZE, 30, 0x8d6e63);
                this.physics.add.existing(desk, true);
                desk.setData('info', receptionData);
                interactGroup.add(desk);
                this.add.circle(x, y - 10, 10, 0xffffff);
            }
        }
    }

    player = this.physics.add.sprite(400, 500, 'ghost');
    player.setScale(0.15); 
    player.setOrigin(0.5, 0.5);
    player.setCollideWorldBounds(true);

    this.physics.add.collider(player, walls);
    this.physics.add.overlap(player, interactGroup, checkItem, null, this);

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
        // 【修正】左移動時に反転するよう変更しました（元画像が右向きの場合）
        player.setFlipX(true); 
    } else if (cursors.right.isDown || btnState.right) {
        player.body.setVelocityX(speed);
        // 【修正】右移動時は反転しない
        player.setFlipX(false);
    }

    if (cursors.up.isDown || btnState.up) {
        player.body.setVelocityY(-speed);
    } else if (cursors.down.isDown || btnState.down) {
        player.body.setVelocityY(speed);
    }

    if (Phaser.Input.Keyboard.JustDown(spaceKey) && activeItem) {
        openModal(activeItem);
    }
    activeItem = null;
}

/* --- FUNCTIONS --- */
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