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
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // マップ上端はすべて壁
    [1, 2, 1, 2, 1, 1, 2, 1, 2, 1, 1, 2, 1, 2, 1, 1], // 作品が並ぶ壁の列
    [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3], // 壁の直前は絨毯
    [0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0], // 仕切りで順路を作る
    [0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0],
    [0, 0, 4, 4, 4, 0, 0, 3, 0, 0, 4, 4, 4, 4, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 4, 0, 0, 3, 0, 0, 4, 1, 1, 1, 1, 1], // 部屋を区切る壁
    [1, 2, 0, 0, 4, 0, 0, 3, 0, 0, 4, 0, 0, 2, 1, 1],
    [1, 0, 0, 0, 4, 0, 0, 3, 0, 0, 4, 0, 0, 0, 1, 1],
    [1, 0, 0, 0, 4, 9, 0, 3, 0, 9, 4, 0, 0, 0, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 3, 1, 1, 1, 1, 1, 1, 1, 1]  // 下端も壁で閉じる
];

// 作品データ (左上から順に割り当てられます)
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
    backgroundColor: '#2d1b1e', // 背景色を壁紙っぽい暗い赤茶色に
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
    // プレイヤー画像 (160px)
    this.load.spritesheet('ghost', 'player.png', { 
        frameWidth: 160, 
        frameHeight: 160 
    });
    
    // wall.png を「仕切り」として読み込みます
    this.load.image('partition', 'wall.png'); 
    
    this.load.image('floor', 'floor.png');
    this.load.image('carpet', 'carpet.png');
}

function create() {
    // グループの作成
    const walls = this.physics.add.staticGroup();     // 通れない壁
    const partitions = this.physics.add.staticGroup(); // 通れない仕切り
    interactGroup = this.physics.add.staticGroup();   // インタラクト可能な物
    
    let artIndex = 0;

    const mapWidth = mapData[0].length * TILE_SIZE;
    const mapHeight = mapData.length * TILE_SIZE;
    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);

    // --- 背景（床）を先に敷き詰める ---
    // 壁の下にも床がないと隙間ができるため
    for (let row = 0; row < mapData.length; row++) {
        for (let col = 0; col < mapData[row].length; col++) {
            const x = col * TILE_SIZE + TILE_SIZE / 2;
            const y = row * TILE_SIZE + TILE_SIZE / 2;
            
            // 基本は床、特定の場所はカーペット
            if (mapData[row][col] === 3) {
                this.add.image(x, y, 'carpet').setDisplaySize(TILE_SIZE, TILE_SIZE);
            } else {
                const f = this.add.image(x, y, 'floor').setDisplaySize(TILE_SIZE, TILE_SIZE);
                f.setTint(0xbbbbbb); // 少し暗くして雰囲気出し
            }
        }
    }

    // --- オブジェクト配置 ---
    for (let row = 0; row < mapData.length; row++) {
        for (let col = 0; col < mapData[row].length; col++) {
            const x = col * TILE_SIZE + TILE_SIZE / 2;
            const y = row * TILE_SIZE + TILE_SIZE / 2;
            const tileType = mapData[row][col];

            // 1: 美術館の壁 (画像がないのでコードで描画)
            if (tileType === 1 || tileType === 2) {
                // 壁の描画 (暗い赤茶色)
                const wallColor = 0x5c0912; // 洋館風の赤
                const wallRect = this.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, wallColor);
                // 上下に黒い枠線をつけて立体感を出す
                wallRect.setStrokeStyle(2, 0x220000);
                
                // 物理演算（当たり判定）に追加
                const wallBody = this.physics.add.existing(wallRect, true);
                walls.add(wallRect);
            }

            // 2: 作品 (壁の上に飾る)
            if (tileType === 2) {
                const data = artData[artIndex] || { title: 'No Data', desc: '...' };
                
                // 豪華な額縁 (金色)
                const frame = this.add.rectangle(x, y, 40, 40, 0xffd700); 
                frame.setStrokeStyle(2, 0xb8860b);
                
                // 絵の中身 (青系)
                this.add.rectangle(x, y, 32, 32, 0x1e88e5);
                
                // インタラクト判定 (壁の手前に少しはみ出す透明なゾーンを作る)
                // y座標を少しプラスして、プレイヤーが壁の下から触れられるようにする
                const interactZone = this.add.zone(x, y + 20, TILE_SIZE, TILE_SIZE);
                this.physics.add.existing(interactZone, true);
                interactZone.setData('info', data);
                interactGroup.add(interactZone);
                
                artIndex++;
            }

            // 4: 仕切り (元のwall.pngを使用)
            if (tileType === 4) {
                const p = this.physics.add.image(x, y, 'partition');
                p.setDisplaySize(TILE_SIZE, TILE_SIZE);
                partitions.add(p);
                // 【重要】サイズ変更後の当たり判定更新
                p.refreshBody(); 
            }

            // 9: 受付
            if (tileType === 9) {
                const desk = this.add.rectangle(x, y, TILE_SIZE, 30, 0x5d4037);
                desk.setStrokeStyle(1, 0x3e2723);
                this.physics.add.existing(desk, true);
                desk.setData('info', receptionData);
                interactGroup.add(desk);
                // 受付の人
                this.add.circle(x, y - 10, 10, 0xffffff);
            }
        }
    }

    // --- プレイヤー設定 ---
    player = this.physics.add.sprite(mapWidth / 2, mapHeight - 150, 'ghost');
    player.setDepth(20); // 壁や床より手前
    player.setScale(0.2); 

    // 当たり判定の調整
    player.body.setSize(120, 120); 
    player.body.setOffset(20, 20);
    player.setCollideWorldBounds(true);

    // カメラ設定
    this.cameras.main.startFollow(player);
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
    this.cameras.main.setZoom(1.5); 

    // アニメーション (変更なし)
    this.anims.create({ key: 'down', frames: this.anims.generateFrameNumbers('ghost', { start: 0, end: 2 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'left', frames: this.anims.generateFrameNumbers('ghost', { start: 3, end: 5 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'right', frames: this.anims.generateFrameNumbers('ghost', { start: 6, end: 8 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'up', frames: this.anims.generateFrameNumbers('ghost', { start: 9, end: 11 }), frameRate: 8, repeat: -1 });

    player.play('down');
    player.anims.stop();

    // --- 衝突判定の登録 ---
    // これが無いとすり抜けます
    this.physics.add.collider(player, walls);
    this.physics.add.collider(player, partitions);

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