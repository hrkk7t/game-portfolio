/* --- CONFIGURATION --- */
const TILE_SIZE = 50;

// マップデータ (0:床, 1:壁, 2:作品, 3:赤絨毯, 9:受付)
// 美術館らしいレイアウトに変更しました
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
    [1, 1, 1, 1, 1, 1, 1, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] // エントランス
];

const artData = [
    { title: 'WEB SITE', desc: 'コーポレートサイト制作\n使用技術: HTML/CSS/JS' },
    { title: 'APP UI', desc: 'モバイルアプリUIデザイン\nFigmaを使用' },
    { title: 'GRAPHIC', desc: 'イベントポスター\nPhotoshop/Illustrator' },
    { title: 'LOGO', desc: 'ブランドロゴ制作' },
    { title: 'ILLUST', desc: 'オリジナルキャラクター' },
    { title: 'GAME', desc: 'Unityで制作した\n3Dアクションゲーム' } // データを1つ追加しました
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
    // 画像の読み込み
    // player.pngの実際のサイズが不明なため、読み込み後にサイズ処理をします
    this.load.spritesheet('ghost', 'player.png', { 
        // 一旦、画像をそのまま読み込みます。
        // ※もし画像が32x32などの場合、ここを間違えると表示されません。
        // 安全策として、フレーム設定をcreate内で行う方法もありますが、
        // ここでは一般的なピクセルアートサイズ(32x32〜48x48程度)を想定して
        // スプライトシートとして読み込みます。
        // もし表示がおかしい場合は、frameWidth, frameHeightの数値を調整してください。
        frameWidth: 32,  // ★ここを画像の「1コマの横幅」に合わせてください
        frameHeight: 32  // ★ここを画像の「1コマの高さ」に合わせてください
    });
    
    this.load.image('wall', 'wall.png');
    this.load.image('floor', 'floor.png');
    this.load.image('carpet', 'carpet.png');
}

function create() {
    // --- プレイヤーのスプライト設定を修正 ---
    // もし画像のサイズが32pxでない場合、Phaserはうまく読み込めない可能性があります。
    // そのため、テクスチャ情報を確認して動的にフレームを設定する方法もありますが、
    // まずはpreloadでの指定を優先します。
    
    const walls = this.physics.add.staticGroup();
    interactGroup = this.physics.add.staticGroup();
    let artIndex = 0;

    // --- マップ生成 ---
    // マップ全体のサイズを計算して、カメラの境界を設定
    const mapWidth = mapData[0].length * TILE_SIZE;
    const mapHeight = mapData.length * TILE_SIZE;
    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);

    for (let row = 0; row < mapData.length; row++) {
        for (let col = 0; col < mapData[row].length; col++) {
            const x = col * TILE_SIZE + TILE_SIZE / 2;
            const y = row * TILE_SIZE + TILE_SIZE / 2;
            const tileType = mapData[row][col];

            // 床の描画
            let floorTile;
            if (tileType === 3) {
                // 赤絨毯
                floorTile = this.add.image(x, y, 'carpet').setDisplaySize(TILE_SIZE, TILE_SIZE);
            } else {
                // 通常の床
                floorTile = this.add.image(x, y, 'floor').setDisplaySize(TILE_SIZE, TILE_SIZE);
                floorTile.setTint(0xbbbbbb);
            }

            // オブジェクトの配置
            if (tileType === 1) {
                // 壁
                const wall = this.physics.add.image(x, y, 'wall');
                wall.setDisplaySize(TILE_SIZE, TILE_SIZE);
                wall.setTint(0x999999);
                walls.add(wall);
                wall.setImmovable(true);
            } 
            else if (tileType === 2) {
                // 作品（壁＋額縁）
                const wall = this.physics.add.image(x, y, 'wall'); // 背景に壁を置く
                wall.setDisplaySize(TILE_SIZE, TILE_SIZE);
                walls.add(wall);
                wall.setImmovable(true);

                // 作品データ取得
                const data = artData[artIndex] || { title: 'No Data', desc: '...' };
                
                // 額縁風の表現
                const frame = this.add.rectangle(x, y, 36, 36, 0x8d6e63); // 額縁
                const art = this.add.rectangle(x, y, 28, 28, 0x00bcd4); // 絵の部分
                
                // インタラクト用透明判定
                // 壁の手前に透明な判定用オブジェクトを置く
                const interactZone = this.add.zone(x, y + 20, TILE_SIZE, TILE_SIZE); // 少し手前に判定を置く
                this.physics.add.existing(interactZone, true);
                interactZone.setData('info', data);
                interactGroup.add(interactZone);
                
                artIndex++;
            } 
            else if (tileType === 9) {
                // 受付
                const desk = this.add.rectangle(x, y, TILE_SIZE, 30, 0x5d4037);
                this.physics.add.existing(desk, true);
                desk.setData('info', receptionData);
                interactGroup.add(desk);
                // 受付の人（仮）
                this.add.circle(x, y - 10, 10, 0xffffff);
            }
        }
    }

    // --- プレイヤー（おばけ）の設定 ---
    // マップの下の方（入り口付近）に出現させる
    player = this.physics.add.sprite(mapWidth / 2, mapHeight - 100, 'ghost');
    player.setDepth(10);
    
    // スケール調整: ドット絵をきれいに大きく見せる
    player.setScale(1.5); 

    // 当たり判定のサイズ調整
    // 画像の余白に合わせて調整してください
    // ここでは32x32の画像を想定して、少し小さめの判定にします
    player.body.setSize(20, 20); 
    player.body.setOffset(6, 6);
    player.setCollideWorldBounds(true);

    // カメラがプレイヤーを追従するように設定
    this.cameras.main.startFollow(player);
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
    this.cameras.main.setZoom(1.2); // 少しズームしてドット絵感を強調

    // --- アニメーション定義 ---
    // 1段目: 下, 2段目: 左, 3段目: 右, 4段目: 上
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

    // プレイヤーと重なっているinteractGroupのオブジェクトを探す
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
    // スマホ用コントローラーの設定（変更なし）
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