import Phaser from "phaser";
import Player from "../../heroes/player";
import Barman from "../../heroes/barman";
import { findPath } from "../../utils/findPath";
import { movementController } from "./moveController";
import { staticObstacles } from "@/game/objects/static";
import { EventBus } from "@/game/EventBus";

export class SceneManager {
    public player!: Player;
    public barman!: Barman;
    public cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    public gridSize!: number;
    public grid!: number[][];
    public UI: Phaser.GameObjects.Image[] = [];
    private sidebarButtons: Phaser.GameObjects.Container[] = [];

    private scene: Phaser.Scene;
    private obstrucleGroup?: Phaser.Physics.Arcade.StaticGroup;
    private background?: Phaser.GameObjects.Image;
    private tokenAmount?: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    public initialize() {
        this.initializeGrid();
        this.createBackground();
        this.createCharacters();
        this.createObstacles();
        this.setupCamera();
        this.createUI();
        // 添加恢复游戏的事件监听
        EventBus.on("close-mail", () => {
            if (this.scene.scene.isPaused()) {
                this.scene.scene.resume();
            }
        });
    }

    private setupUIEventListeners() {
        // UI Close events - enable keyboard
        EventBus.on("close-write", () => {
            this.enableGameInput();
        });

        EventBus.on("close-content", () => {
            this.enableGameInput();
        });

        EventBus.on("close-chat", () => {
            this.enableGameInput();
        });
    }

    public disableGameInput() {
        if (this.scene.input.keyboard) {
            this.scene.input.keyboard.enabled = false;
            this.scene.input.keyboard.clearCaptures();
        }
    }

    public enableGameInput() {
        if (this.scene.input.keyboard) {
            this.scene.input.keyboard.enabled = true;
        }
    }

    public destroy() {
        // Clean up event listeners
        EventBus.removeListener("close-write");
        EventBus.removeListener("close-content");
        EventBus.removeListener("close-chat");
    }

    // UI 相关方法
    private createUI() {
        this.createTopBar();
        this.createSidebar();
    }

    private createTopBar() {
        const userData = this.scene.registry.get("userData");
        console.log(userData);

        // 积分背景图片 (左侧)
        const pointsBg = this.scene.add
            .image(this.scene.cameras.main.width - 260, 48, "point-rectangle")
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(1000)
            .setDisplaySize(109, 44);

        // 钱包背景图片 (右侧)
        const walletBg = this.scene.add
            .image(
                this.scene.cameras.main.width * 0.92,
                48,
                "profile-rectangle"
            )
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(1000)
            .setDisplaySize(159, 44);

        // 酒杯图标 (左侧)
        const wineLogo = this.scene.add
            .image(this.scene.cameras.main.width - 290, 48, "wine_logo")
            .setDisplaySize(24, 24)
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(1001);

        // 积分文本 (左侧)
        const tokenAmount = this.scene.add
            .text(this.scene.cameras.main.width - 270, 48, "11,230", {
                fontFamily: "Montserrat",
                fontSize: "16px",
                color: "#FFFFFF",
            })
            .setOrigin(0, 0.5)
            .setScrollFactor(0)
            .setDepth(1001);

        // Profile图标 (右侧)
        const userLogo = this.scene.add
            .image(this.scene.cameras.main.width - 170, 48, "profile")
            .setDisplaySize(20, 20)
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(1001);

        // 钱包地址文本 (右侧)
        const addressText = this.scene.add
            .text(
                this.scene.cameras.main.width - 150,
                48,
                `${String(userData.walletAddress).slice(0, 6)}...${String(
                    userData.walletAddress
                ).slice(-4)}`,
                {
                    fontFamily: "Montserrat",
                    fontSize: "16px",
                    color: "#FFFFFF",
                }
            )
            .setOrigin(0, 0.5)
            .setScrollFactor(0)
            .setDepth(1001);

        // 将元素添加到UI数组
        this.UI.push(
            pointsBg as any,
            walletBg as any,
            wineLogo as any,
            tokenAmount as any,
            userLogo as any,
            addressText as any
        );
    }

    private createSidebar() {
        const menuItems = [
            {
                text: "CONTENT",
                y: this.scene.cameras.main.height * 0.49,
                key: "button_content",
                hoverKey: "content-hover",
            },
            {
                text: "WRITE",
                y: this.scene.cameras.main.height * 0.56,
                key: "button_write",
                hoverKey: "write-hover",
            },
            {
                text: "CHAT",
                y: this.scene.cameras.main.height * 0.63,
                key: "button_chat",
                hoverKey: "chat-hover",
            },
        ];

        // Add menu background rectangle
        const menuBg = this.scene.add
            .image(78, 410, "menu-rectangle")
            .setScrollFactor(0)
            .setDepth(999);

        menuItems.forEach((item) => {
            // Create button container
            const button = this.scene.add.container(78, item.y);

            // Create hover elements (initially invisible)
            const hoverEllipse = this.scene.add
                .image(0, 0, "ellipse")
                .setVisible(false);
            const hoverText = this.scene.add
                .image(80, 0, item.hoverKey)
                .setVisible(false);

            // Create the main button
            const mainButton = this.scene.add
                .image(0, 0, item.key)
                .setScrollFactor(0)
                .setDepth(1000)
                .setInteractive({ useHandCursor: true });

            // Add hover effects
            mainButton.on("pointerover", () => {
                this.scene.input.manager.canvas.style.cursor = "pointer";
                hoverEllipse.setVisible(true);
                hoverText.setVisible(true);
                if (item.text !== "WRITE") {
                    mainButton.setAlpha(0.8);
                }
            });

            mainButton.on("pointerout", () => {
                this.scene.input.manager.canvas.style.cursor = "default";
                hoverEllipse.setVisible(false);
                hoverText.setVisible(false);
                if (item.text !== "WRITE") {
                    mainButton.setAlpha(1);
                }
            });

            mainButton.on("pointerdown", () => {
                if (item.text === "CONTENT") {
                    EventBus.emit("open-content");
                    this.disableGameInput();
                } else if (item.text === "WRITE") {
                    EventBus.emit("open-write");
                    this.disableGameInput();
                } else if (item.text === "CHAT") {
                    EventBus.emit("open-chat");
                    this.disableGameInput();
                }
            });

            // Add all elements to the container
            button.add([hoverEllipse, mainButton, hoverText]);
            this.sidebarButtons.push(button);
        });
    }

    // 原有的场景管理方法
    private initializeGrid() {
        this.gridSize = this.scene.registry.get("gridSize");
        this.grid = this.scene.registry.get("grid");
    }

    private createBackground() {
        const bgWidth = this.scene.data.get("bgWidth");
        const bgHeight = this.scene.data.get("bgHeight");

        this.background = this.scene.add
            .image(bgWidth / 2, bgHeight / 2, "tavern_bg")
            .setOrigin(0.5, 0.5)
            .setDisplaySize(bgWidth, bgHeight);
    }

    private createObstacles() {
        this.obstrucleGroup = this.scene.physics.add.staticGroup();
        for (const obstacle of staticObstacles) {
            const obstacleRect = this.scene.add.rectangle(
                obstacle.startx,
                obstacle.starty,
                obstacle.endx - obstacle.startx,
                obstacle.endy - obstacle.starty
            );
            this.scene.physics.add.existing(obstacleRect, true);
            this.obstrucleGroup.add(obstacleRect);
        }
        this.scene.physics.add.collider(
            this.player.sprite,
            this.obstrucleGroup
        );
        //this.drawGrid();
    }

    private createCharacters() {
        const scaleFactor = this.scene.data.get("bgWidth") / 1600;
        // 创建玩家
        this.player = new Player(
            this.scene,
            20 * this.gridSize * scaleFactor,
            4 * this.gridSize * scaleFactor,
            "user"
        );
        this.player.sprite.setDisplaySize(
            this.gridSize * 1.6 * scaleFactor,
            this.gridSize * 3.8 * scaleFactor
        );

        this.cursors = this.scene.input.keyboard!.createCursorKeys();
        this.scene.physics.add.collider(
            this.player.sprite,
            this.obstrucleGroup!
        );

        // 创建酒保
        this.barman = new Barman(
            this.scene,
            7 * this.gridSize * scaleFactor,
            5.83 * this.gridSize * scaleFactor,
            "barwoman"
        );
        this.barman.sprite.setInteractive();
        this.barman.sprite.setDisplaySize(
            this.gridSize * 1.6 * scaleFactor,
            this.gridSize * 3 * scaleFactor
        );

        this.barman.sprite.on("pointerover", () => {
            this.scene.input.manager.canvas.style.cursor = "pointer";
        });

        this.barman.sprite.on("pointerout", () => {
            this.scene.input.manager.canvas.style.cursor = "default";
        });
    }

    private setupCamera() {
        const MAP_WIDTH = this.scene.data.get("bgWidth"); // 明确使用地图常量
        const MAP_HEIGHT = this.scene.data.get("bgHeight");

        const mainCamera = this.scene.cameras.main
            .setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT)
            .startFollow(this.player.sprite, true, 0.09, 0.09)
            .setZoom(1) // 明确禁用缩放
            .setBackgroundColor("#000000");
        // 动态调整视口
        const updateViewport = () => {
            mainCamera.setViewport(
                0,
                0,
                Math.min(window.innerWidth, MAP_WIDTH), // 视口不超过地图尺寸
                Math.min(window.innerHeight, MAP_HEIGHT)
            );
        };

        window.addEventListener("resize", updateViewport);
        updateViewport();
    }

    public handlePointerDown(
        pointer: Phaser.Input.Pointer,
        moveController?: movementController
    ) {
        const tx = Math.floor(pointer.worldX / this.gridSize);
        const ty = Math.floor(pointer.worldY / this.gridSize);

        if (
            tx < 0 ||
            tx >= this.grid[0].length ||
            ty < 0 ||
            ty >= this.grid.length
        ) {
            return;
        }
        if (this.grid[ty][tx] === 1) {
            return;
        }
        // if (this.grid[tx][ty] === 1) {
        //   return;
        // }
        // click on UI, stop moving
        if (
            this.UI.some((ui) => ui.getBounds().contains(pointer.x, pointer.y))
        ) {
            return;
        }
        const px = Math.floor(this.player.sprite.x / this.gridSize);
        const py = Math.floor(this.player.sprite.y / this.gridSize);

        const result = findPath(this.grid, px, py, tx, ty);
        if (result.length === 0) {
            return;
        }

        moveController?.stopMoving();
        moveController?.startPath(result);
    }
    private drawGrid() {
        // const bgWidth = 550;
        // const bgHeight = 1195;
        // 添加网格显示
        const graphics = this.scene.add.graphics();

        // 遍历每个格子
        for (let y = 0; y < this.grid.length; y++) {
            for (let x = 0; x < this.grid[0].length; x++) {
                const isObstacle = this.grid[y][x] === 1;

                // 设置网格线的样式
                graphics.lineStyle(
                    1,
                    isObstacle ? 0xff0000 : 0xffffff,
                    isObstacle ? 0.5 : 0.3
                );

                // 计算格子的四个顶点
                const left = x * this.gridSize;
                const right = left + this.gridSize;
                const top = y * this.gridSize;
                const bottom = top + this.gridSize;

                // 绘制格子的四条边
                graphics.beginPath();
                graphics.moveTo(left, top);
                graphics.lineTo(right, top);
                graphics.lineTo(right, bottom);
                graphics.lineTo(left, bottom);
                graphics.lineTo(left, top);
                graphics.strokePath();

                // 如果是障碍物，添加文字标识
                if (isObstacle) {
                    this.scene.add
                        .text(
                            left + this.gridSize / 2,
                            top + this.gridSize / 2,
                            "障碍",
                            {
                                fontSize: "14px",
                                color: "#ff0000",
                                backgroundColor: "#00000080",
                            }
                        )
                        .setOrigin(0.5);
                }
            }
        }
    }

    // 添加更新余额的方法
    public async updateSuiBalance() {
        if (!this.tokenAmount) return;

        const userData = this.scene.registry.get("userData");
        const address = userData.walletAddress;
        const newBalance = 5;

        this.tokenAmount.setText(`${Number(newBalance).toFixed(2)}`);

        // 更新registry中的数据
        userData.suiBalance = Number(newBalance).toFixed(2);
        this.scene.registry.set("userData", userData);
    }

    public isContained(x: number, y: number) {
        return this.UI.some((ui) => ui.getBounds().contains(x, y));
    }
}
