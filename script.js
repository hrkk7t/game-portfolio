/* --- CONFIGURATION --- */
const TILE_SIZE = 50;

// マップデータ（変更なし）
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
    backgroundColor: '#050505', // 少し深い黒に変更
    pixelArt: true, // ドット絵をぼやけさせない設定
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
let darknessLayer; // 暗闇のエフェクト用
const btnState = { up: false, down: false, left: false, right: false };

const game = new Phaser.Game(config);

function preload() {
    // スプライトシートとして読み込み（フレームサイズを指定）
    // player.pngのサイズから推測：横3コマ、縦4コマ (例: 32x32px と仮定。画像に合わせて調整が必要ですが、Phaserが自動で切ってくれる場合もあります)
    // 今回の画像を見ると、3列x4行のように見えます。全体のサイズが不明ですが、一旦 frameWidth: 32, frameHeight: 32 程度と仮定して進めます。
    // ※もしおばけが変に切れる場合は、画像のピクセルサイズを確認して数値を調整してください。
    this.load.spritesheet('ghost', 'player.png', { frameWidth: 32, frameHeight: 32 }); 
    
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

            // 床の描画（少し暗くする tint をかけることで重厚感を出す）
            let floorTile;
            if (tileType === 3) {
                floorTile = this.add.image(x, y, 'carpet').setDisplaySize(TILE_SIZE, TILE_SIZE);
            } else {
                floorTile = this.add.image(x, y, 'floor').setDisplaySize(TILE_SIZE, TILE_SIZE);
            }
            floorTile.setTint(0xaaaaaa); // 床を少し暗く

            // 壁・作品・受付
            if (tileType === 1) {
                const wall = this.physics.add.image(x, y, 'wall');
                wall.setDisplaySize(TILE_SIZE, TILE_SIZE);
                wall.setTint(0x888888); // 壁も少し暗く
                walls.add(wall);
                wall.setImmovable(true);
            } 
            else if (tileType === 2) {
                const wall = this.physics.add.image(x, y, 'wall');
                wall.setDisplaySize(TILE_SIZE, TILE_SIZE);
                walls.add(wall);
                wall.setImmovable(true);

                const data = artData[artIndex] || { title: 'No Data', desc: '...' };
                // 作品の色をシアン系に
                const art = this.add.rectangle(x, y, 40, 40, 0x00bcd4); 
                art.setStrokeStyle(2, 0xffffff);
                
                this.physics.add.existing(art, true);
                art.setData('info', data);
                interactGroup.add(art);
                artIndex++;
            } 
            else if (tileType === 9) {
                // 受付（後でドット絵キャラに差し替え予定）
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
    player = this.physics.add.sprite(400, 500, 'ghost');
    // おばけのサイズ調整（元の画像サイズによりますが、少し大きく表示）
    player.setScale(1.5); 
    player.setOrigin(0.5, 0.5);
    player.setCollideWorldBounds(true);

    // アニメーション定義
    // 正面（待機）
    this.anims.create({
        key: 'down',
        frames: this.anims.generateFrameNumbers('ghost', { start: 0, end: 2 }),
        frameRate: 8,
        repeat: -1
    });
    // 左
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('ghost', { start: 3, end: 5 }),
        frameRate: 8,
        repeat: -1
    });
    // 右
    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('ghost', { start: 6, end: 8 }),
        frameRate: 8,
        repeat: -1
    });
    // 上（後ろ姿）
    this.anims.create({
        key: 'up',
        frames: this.anims.generateFrameNumbers('ghost', { start: 9, end: 11 }),
        frameRate: 8,
        repeat: -1
    });

    player.play('down'); // 初期アニメーション

    this.physics.add.collider(player, walls);
    this.physics.add.overlap(player, interactGroup, checkItem, null, this);

    // --- ライト（視界制限）エフェクトの作成 ---
    // 画面全体を覆う黒いテクスチャを作成
    const width = this.sys.canvas.width;
    const height = this.sys.canvas.height;
    
    // RenderTextureを使って動的にマスクを作る準備
    const rt = this.make.renderTexture({ x: width/2, y: height/2, width: width, height: height }, true);
    rt.fill(0x000000, 0.85); // 0.85は暗さの濃さ（0〜1）
    rt.setDepth(10); // プレイヤーより手前に表示
    
    // プレイヤーの周りだけ「透明」にして、くり抜くためのブラシ（円形の画像）
    // PhaserのGraphicsで円を描いてテクスチャとして登録する
    const spotlightGraphics = this.make.graphics().fillStyle(0xffffff).fillCircle(50, 50, 50);
    spotlightGraphics.generateTexture('spotlight', 100, 100);
    spotlightGraphics.destroy();

    // 暗闇レイヤーを保持（updateで更新するため）
    this.darknessLayer = this.add.image(400, 300, rt.texture);
    this.darknessLayer.setDepth(10);
    this.darknessLayer.setScrollFactor(0); // カメラが動いてもついてくるように（今回は固定画面なので影響小）
    
    // マスク処理用（これがくり抜く処理）
    // 今回はシンプルにするため、RenderTextureを毎フレーム書き直す方式（update内）で実装します

    cursors = this.input.keyboard.createCursorKeys();
    spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    setupController();
}

function update() {
    if (isModalOpen) {
        player.body.setVelocity(0);
        player.anims.stop(); // モーダル中はアニメーション停止
        return;
    }
    
    // 速度設定
    player.body.setVelocity(0);
    const speed = 150; // 少しゆっくりにして重厚感を出す

    let moving = false;

    // 横移動
    if (cursors.left.isDown || btnState.left) {
        player.body.setVelocityX(-speed);
        player.anims.play('left', true);
        moving = true;
    } else if (cursors.right.isDown || btnState.right) {
        player.body.setVelocityX(speed);
        player.anims.play('right', true);
        moving = true;
    }

    // 縦移動（横移動していない場合のみ、あるいは同時押し挙動を調整）
    if (cursors.up.isDown || btnState.up) {
        player.body.setVelocityY(-speed);
        if (!moving) player.anims.play('up', true);
        moving = true;
    } else if (cursors.down.isDown || btnState.down) {
        player.body.setVelocityY(speed);
        if (!moving) player.anims.play('down', true);
        moving = true;
    }

    // 停止時はアニメーションを止めて、最初のフレームを表示
    if (!moving) {
        player.anims.stop();
        // どの向きを向いているかで停止フレームを変えるなどの処理も可能ですが、
        // 今回はシンプルにアニメーションストップのみにします
    }

    if (Phaser.Input.Keyboard.JustDown(spaceKey) && activeItem) {
        openModal(activeItem);
    }
    activeItem = null;

    // --- スポットライトの更新 ---
    updateSpotlight.call(this);
}

// 暗闇を描画しなおす関数
function updateSpotlight() {
    // 毎回RenderTextureを再生成するのは重いですが、この規模ならOKです。
    // より高度にするなら mask を使いますが、ここでは「黒い紙に穴を開ける」イメージで実装します。
    
    // 画面サイズの黒い四角を描画するためのGraphics
    if (!this.shadowGraphics) {
        this.shadowGraphics = this.add.graphics();
        this.shadowGraphics.setDepth(10); // 最前面
    }
    
    this.shadowGraphics.clear();
    this.shadowGraphics.fillStyle(0x000000, 0.85); // 暗闇の色と透明度
    this.shadowGraphics.fillRect(0, 0, 800, 600); // 全体を塗りつぶす

    // プレイヤーの位置だけ「切り抜く」＝合成モード（Blend Mode）を使う
    // ERASEモードでプレイヤーの周りに円を描くことで、そこだけ黒を消す
    this.shadowGraphics.defaultBlendMode = Phaser.BlendModes.ERASE; 
    
    // おばけの周囲をクリアに
    // ふんわりさせるために複数の円を重ねる手もありますが、まずはシンプルに
    // Graphicsだけだとボカシが難しいので、
    // ここではシンプルに「周囲を暗くする」画像を被せる方式に変更します
    
    // ※ 修正: BlendMode.ERASEはCanvas/WebGLの設定次第で難しい場合があるので、
    // もっと簡単な「画像によるマスク」を使います。
    // 先ほど create で作った darknessLayer を使いましょう。
}

// create内で作った renderTexture を使った、より確実なスポットライト処理
// 上記の updateSpotlight は削除して、こちらの update 内処理を使ってください。

/* update関数内の最後に以下を記述してください */
/*
    // RenderTexture（rt）をクリア
    // this.children.listなどから rt を探す必要がありますが、create内で this.rt = rt としておくと楽です。
    // ですが、今回はもっと簡単な「黒い画像（真ん中に穴が開いた画像）」を被せるのが一番です。
    // なので、今回は「vignette（ビネット）」効果を擬似的に作ります。
*/

// --- 【修正版】シンプルなスポットライト実装 ---
// create関数内の「ライトエフェクト」部分を以下に書き換えてください。
// これが一番簡単で「重厚感」が出ます。

/*
    // create関数内に追加
    // 画面全体を覆う「暗闇画像」を作る（中心が透明なグラデーション）
    const spotlightTexture = this.make.graphics();
    spotlightTexture.fillStyle(0x000000, 1);
    spotlightTexture.fillRect(0, 0, 800, 600);
    
    // マスク用の画像を作る（白い円）
    const maskGraphics = this.make.graphics();
    maskGraphics.fillStyle(0xffffff);
    maskGraphics.fillCircle(0, 0, 100); // 半径100の円
    
    // マスクを作成
    const mask = maskGraphics.createGeometryMask();
    mask.setInvertAlpha(true); // マスクの「外側」を表示する（＝円の中が見える）
    
    // 暗闇のレイヤーを作る
    const darkness = this.add.graphics();
    darkness.fillStyle(0x000000, 0.8); // 80%の黒
    darkness.fillRect(0, 0, 800, 600);
    darkness.setDepth(10);
    
    // プレイヤーを追従させるためにマスクをプレイヤーに紐付ける
    // PhaserのGeometryMaskは位置固定なので、updateでマスクのソース位置を動かします
    this.spotlightMask = maskGraphics;
    darkness.setMask(mask);
*/
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
    // （変更なし）
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

// ★重要★ create関数内のスポットライト部分の差し替えコード（updateで動かす用）
/* Create関数の最後に追加：
    this.lightMask = this.make.graphics();
    this.lightMask.fillStyle(0xffffff);
    this.lightMask.fillCircle(0, 0, 80); // 穴のサイズ
    const mask = this.lightMask.createGeometryMask();
    mask.setInvertAlpha(true);

    const darkOverlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.85);
    darkOverlay.setScrollFactor(0);
    darkOverlay.setDepth(10);
    darkOverlay.setMask(mask);
*/

/* Update関数の最後に追加：
    if (this.lightMask) {
        this.lightMask.x = player.x;
        this.lightMask.y = player.y;
    }
*/