/* --- CONFIGURATION --- */
const TILE_SIZE = 50;

// マップデータ
// 0:床, 1:壁, 2:作品, 3:赤いカーペット, 9:受付
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
    [1, 0, 0, 0, 0, 0, 0, 9, 0, 0, 0, 0, 0, 0, 0, 1], // 9が受付
    [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

// 作品データ
const artData = [
    { title: 'WEB SITE', desc: 'コーポレートサイト制作\n使用技術: HTML/CSS/JS' },
    { title: 'APP UI', desc: 'モバイルアプリUIデザイン\nFigmaを使用' },
    { title: 'GRAPHIC', desc: 'イベントポスター\nPhotoshop/Illustrator' },
    { title: 'LOGO', desc: 'ブランドロゴ制作' },
    { title: 'ILLUST', desc: 'オリジナルキャラクター' }
];

// 受付データ
const receptionData = {
    title: 'RECEPTION',
    desc: 'ようこそ、私のポートフォリオへ。\nゆっくりご覧ください。\n\n矢印キーで移動\nスペース/SELECTで詳細を見る'
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
let interactGroup; // 作品と受付をまとめるグループ
let activeItem = null; // 今触れているアイテム
let isModalOpen = false;

const btnState = { up: false, down: false, left: false, right: false };

const game = new Phaser.Game(config);

/* --- PRELOAD --- */
function preload() {
    this.load.image('ghost', 'player.png');
}

/* --- CREATE --- */
function create() {
    const walls = this.physics.add.staticGroup();
    interactGroup = this.physics.add.staticGroup();
    let artIndex = 0;

    // グラフィック描画用（床やカーペットを描くため）
    const graphics = this.add.graphics();

    for (let row = 0; row < mapData.length; row++) {
        for (let col = 0; col < mapData[row].length; col++) {
            const x = col * TILE_SIZE + TILE_SIZE / 2;
            const y = row * TILE_SIZE + TILE_SIZE / 2;
            const tileType = mapData[row][col];

            // 1. まず床を描く
            if (tileType === 3) {
                // 赤いカーペット
                graphics.fillStyle(0x880000, 1);
                graphics.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            } else if (tileType !== 1) {
                // 通常の床（濃いグレー）
                graphics.fillStyle(0x222222, 1);
                graphics.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }

            // 2. 物体を配置する
            if (tileType === 1) {
                // [1] 壁 (ブロック)
                const wall = this.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, 0x444444);
                wall.setStrokeStyle(1, 0x000000);
                walls.add(wall);

            } else if (tileType === 2) {
                // [2] 作品
                const data = artData[artIndex] || { title: 'No Data', desc: '...' };
                const art = this.add.rectangle(x, y, 40, 40, 0x00bcd4); // シアン色
                art.setStrokeStyle(2, 0xffffff);
                this.physics.add.existing(art, true);
                art.setData('info', data);
                interactGroup.add(art);
                artIndex++;

            } else if (tileType === 9) {
                // [9] 受付
                // 机のような長方形
                const desk = this.add.rectangle(x, y, TILE_SIZE, 30, 0x8d6e63); // 木の色
                this.physics.add.existing(desk, true);
                desk.setData('info', receptionData);
                interactGroup.add(desk);
                
                // 受付の人（簡易的な丸）
                this.add.circle(x, y - 10, 10, 0xffffff); 
            }
        }
    }

    // プレイヤー作成 (表示順序を壁より手前にするため最後に作成)
    player = this.physics.add.sprite(400, 500, 'ghost'); // 受付の前あたりからスタート
    player.setScale(0.15); // サイズ調整
    player.setCollideWorldBounds(true);
    // 画像の基準点が中心じゃない場合に備えて中心に設定
    player.setOrigin(0.5, 0.5); 

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

    // 水平移動
    if (cursors.left.isDown || btnState.left) {
        player.body.setVelocityX(-speed);
        // 【修正点】 左に進むときは false (元の画像向きによる)
        player.setFlipX(false); 
    } 
    else if (cursors.right.isDown || btnState.right) {
        player.body.setVelocityX(speed);
        // 【修正点】 右に進むときは true
        player.setFlipX(true);
    }

    // 垂直移動
    if (cursors.up.isDown || btnState.up) {
        player.body.setVelocityY(-speed);
    } 
    else if (cursors.down.isDown || btnState.down) {
        player.body.setVelocityY(speed);
    }

    // アクション
    if (Phaser.Input.Keyboard.JustDown(spaceKey) && activeItem) {
        openModal(activeItem);
    }
    
    // 毎フレームリセット（接触していなければnullになる）
    activeItem = null;
}

/* --- FUNCTIONS --- */
function checkItem(player, item) {
    activeItem = item.getData('info');
}

function openModal(info) {
    isModalOpen = true;
    document.getElementById('modal-title').innerText = info.title;
    // 改行コード(\n)をHTMLの<br>に変換して表示
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
            if (activeItem && !isModalOpen) {
                openModal(activeItem);
            }
        };
        selectBtn.addEventListener('click', triggerSelect);
        selectBtn.addEventListener('touchstart', triggerSelect);
    }

    const cancelBtn = document.getElementById('btn-cancel');
    if(cancelBtn) {
        const triggerCancel = (e) => {
            e.preventDefault();
            if (isModalOpen) {
                closeModal();
            }
        };
        cancelBtn.addEventListener('click', triggerCancel);
        cancelBtn.addEventListener('touchstart', triggerCancel);
    }
}