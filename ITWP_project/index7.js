/// Student: Jericho Koskinen
/// Student Number: 0607024
/// Inspiration/ Sources: 
/// Lecture video from week 7
/// https://www.youtube.com/playlist?list=PLJafb_gms6qNednIIrd5RB0F5qbYamz0t this playlist helped me with the project.


let game

const gameOptions = {
    mushGravity: 1000,
    mushSpeed: 400
}

window.onload = function() {
    let gameConfig = {
        type: Phaser.AUTO,
        backgroundColor: "#87CEEB",
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: 800,
            height: 1000,
        },
        pixelArt: true,
        physics: {
            default: "arcade",
            arcade: {
                gravity: {
                    y: 0
                }
            }
        },
        scene: [TitleScreen, Play]
    };
    game = new Phaser.Game(gameConfig)
    window.focus();
}


/// TitleScreen which comes when you launch. Read the instructions.
class TitleScreen extends Phaser.Scene {
    constructor() {
        super("TitleScreen");
    }
    create() {
        // Rules how to play
        const titleText = this.add.text(game.config.width / 2, game.config.height / 2 - 120, 'Oneup!', { fontSize: '50px', fill: '#fff' }).setOrigin(0.5);
        const instructionText = this.add.text(game.config.width / 2, game.config.height / 2 - 70, 'Instructions:', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);
        const collectStarsText = this.add.text(game.config.width / 2, game.config.height / 2 - 20, 'Collect stars!', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);
        const avoidMinesText = this.add.text(game.config.width / 2, game.config.height / 2 + 30, 'Avoid mines!', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);
        const reachTopText = this.add.text(game.config.width / 2, game.config.height / 2 + 70, 'Reach the top to gain levels!', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);
        const clickToPlayText = this.add.text(game.config.width / 2, game.config.height / 2 + 120, 'Click here to play', { fontSize: '24px', fill: '#fff', backgroundColor: '#333', padding: 10, borderRadius: 5, cursor: 'pointer' }).setOrigin(0.5);
    
        // Click to play
        clickToPlayText.setInteractive().on('pointerdown', () => {
            titleText.destroy();
            instructionText.destroy();
            collectStarsText.destroy();
            avoidMinesText.destroy();
            reachTopText.destroy();
            clickToPlayText.destroy();
            game.scene.start("Play");
        });
    }
}  

class Play extends Phaser.Scene {
    
    constructor(){
        super("Play")
        this.jumps = 0; // Track the number of jumps
        this.currentLevel = 1; //Initialize the level.


    }

    preload() { // Assets
        this.load.image("plat", "assets/platform.png");
        this.load.image("star", "assets/star.png");
        this.load.image("mine", "assets/mine.png");
        this.load.spritesheet("oneup", "assets/oneup.png", { frameWidth: 400, frameHeight: 400 });
    }

    create() {
        this.groundGroup = this.physics.add.group({
            immovable: true,
            allowGravity: false
        });


        // Create stars group
        this.starsGroup = this.physics.add.group();

        for (let i = 0; i < 10; i++) {
            let x = Phaser.Math.Between(0, game.config.width);
            let y = game.config.height - (i * 100);
    
            let platform = this.physics.add.sprite(x, y, "plat");
            platform.setScale(0.2);
            platform.setSize(platform.displayWidth, platform.displayHeight, true);
            this.groundGroup.add(platform);
        }

    
        this.spawnPlayer();
        this.cursors = this.input.keyboard.createCursorKeys();

        this.currentLevel = 1;  // Implement indicator of level you are at right now
        this.levelText = this.add.text(16, 16, 'Level: ' + this.currentLevel, { fontSize: '32px', fill: '#fff' });

        // Initialize star counter
        this.starCounter = 0;

        // Display star counter text in the top right corner
        this.starText = this.add.text(game.config.width - 16, 16, 'Stars: 0', { fontSize: '32px', fill: '#fff' }).setOrigin(1, 0);

        this.spawnStars();

        this.movingPlatforms = false; // flag
        this.minesSpawned = false; // flag 


        /// Spiky mines appear after level 2. Here is the group
        this.minesGroup = this.physics.add.group();


    }
    

    update() {
        this.oneup.body.velocity.x = 0;

        if (this.cursors.left.isDown) {
            this.oneup.body.velocity.x = -gameOptions.mushSpeed;
        } else if (this.cursors.right.isDown) {
            this.oneup.body.velocity.x = gameOptions.mushSpeed;
        }

        // Allow double jump
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up) && (this.oneup.body.touching.down || this.jumps === 0)) {
            this.oneup.body.velocity.y = -gameOptions.mushGravity / 2;
            this.jumps++;
        }

        if (this.oneup.body.touching.down) {
            this.jumps = 0;
        }

        // Check if player falls down
        if (this.oneup.y > game.config.height) {
            this.scene.start("Play");
            this.currentLevel = 1; // Reset to level 1
            this.levelText.setText('Level: ' + this.currentLevel);
        }

        // Check if the player reached the top
        if (this.oneup.y <= 0) {
           this.handleLevelCompletion();
        }

        // Check for star collection
        this.physics.overlap(this.oneup, this.starsGroup, this.collectStar, null, this);

        // Update the platform movement based on the level
        if (this.currentLevel  >  1 && !this.movingPlatforms) {
            this.movingPlatforms =  true;

            let numbMovingPlat = Math.min(this.currentLevel - 1, 5);

            let shufflePlat = Phaser.Utils.Array.Shuffle(this.groundGroup.getChildren().slice(1));
            let movingPlat = shufflePlat.slice(0,numbMovingPlat);

            movingPlat.forEach(platform => {
                platform.setVelocityX(Phaser.Math.Between(-200,  200));
                platform.setBounce(1,1);
                platform.setCollideWorldBounds(true);
            });
        }

        if (this.currentLevel > 1 && !this.minesSpawned) {
            this.minesSpawned = true; // flag
        }

        this.physics.overlap(this.oneup, this.minesGroup, this.handleMineCollision, null, this);

    }

    spawnStars() {

    // Sometimes the stars will spawn on the first platform. 

    let randomPlatform = Phaser.Utils.Array.GetRandom(this.groundGroup.getChildren());
    let starX = randomPlatform.x;
    let starY = randomPlatform.y - randomPlatform.displayHeight / 2;

    let star = this.physics.add.sprite(starX, starY, "star");
    star.setScale(0.1);

    // Star physics
    this.physics.add.existing(star);
    star.body.allowGravity = false;

    // Star group
    this.starsGroup.add(star);
        
    }


    spawnPlayer() {
        // Destroy the existing oneup if it exists
        if (this.oneup) {
            this.oneup.destroy();
        }
        // Spawn the player on top of a platform
        let platform = this.groundGroup.getFirstAlive();
        this.oneup = this.physics.add.sprite(platform.x, platform.y - platform.displayHeight / 2, "oneup");
        this.oneup.setScale(0.15);


        this.oneup.body.gravity.y = gameOptions.mushGravity;
    
        this.physics.add.collider(this.oneup, this.groundGroup);
    
        // Reset the number of jumps when the player spawns
        this.jumps = 0;
    }


    resetPlay() {
        // Destroy existing elements
        this.groundGroup.clear(true, true); // platforms
        this.starsGroup.clear(true, true); // stars
        this.minesGroup.clear(true,true); // mines


        // Reset the movingPlatforms flag
        this.movingPlatforms = false;

        // Spawn new platforms
        for (let i = 0; i < 10; i++) {
            let x = Phaser.Math.Between(0, game.config.width);
            let y = game.config.height - (i * 100);

            let platform = this.physics.add.sprite(x, y, "plat");

            platform.setScale(0.2);
            platform.setSize(platform.displayWidth, platform.displayHeight, true);
            this.groundGroup.add(platform);      
        }

        // Spawn the player on top of a platform
        this.spawnPlayer();
        this.spawnStars();

        // Mines appear on Level 2
        if (this.currentLevel > 1) { 
            this.spawnMines();
        }
    }

    handleLevelCompletion() {
        // Increment the level
        this.currentLevel++;
        this.levelText.setText('Level: ' + this.currentLevel);

        // Respawn the player at the bottom
        this.resetPlay();
    }

    collectStar(oneup, star) {
        // Notifies when a star has been collected
        star.disableBody(true, true);
        this.starCounter++;
        this.starText.setText('Stars: ' + this.starCounter);

    }

    spawnMines() {
        // Clear mines from the previous level
        this.clearPreviousMines();

        // Mines progressively increase
        let numberOfMines = this.currentLevel - 1;
    
        for (let i = 0; i < numberOfMines; i++) {
            // Add a delay for each mine
            this.time.delayedCall(i * 1000, function () {
                let mineX = Phaser.Math.Between(0, game.config.width);
                let mineY = 0;
    
                let mine = this.physics.add.sprite(mineX, mineY, "mine");
                mine.setScale(0.1);
    
                // Mine physics
                this.physics.add.existing(mine);
    
                // Random vertical velocity
                mine.setVelocityY(Phaser.Math.Between(100, 350));

                // Collision of oneup and mines
                this.physics.add.collider(mine, this.oneup, this.handleMineCollision, null, this);

                this.spawnedMines.push(mine);
            }, [], this);
        }
    }

    clearPreviousMines() {
        // Destroy mines from the previous level
        if (this.spawnedMines) {
            this.spawnedMines.forEach(mine => {
                mine.destroy();
            });
        }

        // Clear the array
        this.spawnedMines = [];
    }


    handleMineCollision(oneup, mine) {
        this.oneup.destroy(); // Destroy the player
        this.resetPlay(); // Respawn the player
        
        // Reset the level to 1
        this.currentLevel = 1;
        this.levelText.setText('Level: ' + this.currentLevel);

        // Reset the star counter to 0
        this.starCounter = 0;
        this.starText.setText('Stars: ' + this.starCounter);
    }

}
