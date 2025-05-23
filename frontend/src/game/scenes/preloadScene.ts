import { Scene } from "phaser";
import { calculateGameSize } from "../utils/screenUtils";

export class preloadScene extends Scene {
    private progressBar!: Phaser.GameObjects.Graphics;
    private percentText!: Phaser.GameObjects.Text;
    private loadingText!: Phaser.GameObjects.Text;
    private assetText!: Phaser.GameObjects.Text;

    constructor() {
        super("Preloader");
    }

    init() {
        const width = this.scale.gameSize.width;
        const height = this.scale.gameSize.height;

        // 添加背景图片
        const bgTexture = this.textures.get("cover");
        const scaleX = width / bgTexture.source[0].width;
        const scaleY = height / bgTexture.source[0].height;
        const scale = Math.max(scaleX, scaleY);

        const background = this.add
            .image(width / 2, height / 2, "cover")
            .setScale(scale)
            .setTint(0x666666);

        // 添加紫色背景叠加
        const purpleOverlay = this.add
            .image(width / 2, height / 2, "purple")
            .setAlpha(0.7);

        // 创建半透明背景层
        const bg = this.add
            .rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
            .setOrigin(0.5);

        // 加载容器
        const container = this.add.container(width / 2, height / 2);

        // 加载文字
        this.loadingText = this.add
            .text(0, -80, "Loading...", {
                fontSize: "32px",
                color: "#ffffff",
                fontFamily: "Arial",
                stroke: "#000000",
                strokeThickness: 4,
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: "#000000",
                    blur: 2,
                    fill: true,
                },
            })
            .setOrigin(0.5);

        // 进度条背景
        const progressBg = this.add
            .graphics()
            .fillStyle(0x444444, 1)
            .fillRoundedRect(-150, -10, 300, 20, 10);

        // 进度条前景
        this.progressBar = this.add.graphics();

        // 百分比文字
        this.percentText = this.add
            .text(0, 30, "0%", {
                fontSize: "24px",
                color: "#ffffff",
                fontStyle: "bold",
                shadow: {
                    offsetX: 1,
                    offsetY: 1,
                    color: "#000000",
                    blur: 2,
                },
            })
            .setOrigin(0.5);

        // 加载动画图标
        const spinner = this.add
            .dom(width / 2, height / 2 - 100)
            .createFromCache(
                '<i class="fas fa-spinner fa-spin fa-3x" style="color: white"></i>'
            );

        // 添加资源文本
        this.assetText = this.add
            .text(0, 80, "", {
                fontSize: "18px",
                color: "#ffffff",
                shadow: {
                    offsetX: 1,
                    offsetY: 1,
                    color: "#000000",
                    blur: 2,
                },
            })
            .setOrigin(0.5);

        // 将所有元素添加到容器
        container.add([
            spinner,
            this.loadingText,
            progressBg,
            this.progressBar,
            this.percentText,
            this.assetText,
        ]);

        // 加载事件监听
        this.load.on("progress", (value: number) => {
            const percentage = Math.floor(value * 100) + "%";
            this.percentText.setText(percentage);

            // 绘制纯色进度条
            this.progressBar.clear();
            this.progressBar.fillStyle(0x00a3ff, 1); // 使用纯蓝色
            this.progressBar.fillRoundedRect(-150, -10, 300 * value, 20, 10);

            // 动态缩放效果
            spinner.setScale(0.5 + value * 0.3);
        });

        this.load.on("fileprogress", (file: Phaser.Loader.File) => {
            this.assetText.setText("Loading: " + file.key);
        });

        this.load.on("complete", () => {
            this.tweens.add({
                targets: container,
                alpha: 0,
                scale: 0.9,
                duration: 800,
                ease: "Power2",
                onComplete: () => {
                    this.scene.start("tavernScene");
                },
            });
        });
    }

    preload() {
        // 加载loading动画资源
        // 资源加载
        this.load.image("cover", "img/cover_new.png");
        this.load.image("purple", "img/page/purple.png");
        this.load.image("tavern_bg", "img/backgroundHorizontal.jpg");
        this.load.spritesheet("player", "animation/move.png", {
            frameWidth: 280,
            frameHeight: 550,
        });
        this.load.image("user", "animation/david.png");
        this.load.image("barwoman", "animation/lucy.png");
        this.load.audio("theme", ["audio/background.mp3"]);
        this.load.image("button_content", "img/button_content.png");
        this.load.image("button_write", "img/button_write.png");
        this.load.image("button_chat", "img/button_chat.png");
        this.load.image("bar_menu", "img/bar_menu.png");
        this.load.image("bar_bottle", "img/bar_bottle.png");
        this.load.image("wine_logo", "img/wineIcon.png");
        this.load.image("button_content", "img/button_content.png");
        this.load.image("button_write", "img/button_write.png");
        this.load.image("button_chat", "img/button_chat.png");
        this.load.image("dialog-box", "img/Rectangle.png");
        this.load.image("profile-pic", "img/profile.png");
        this.load.image("close-button", "img/closeButton.png");
        this.load.image("menu-rectangle", "img/menuRectangle.png");
        this.load.image("ellipse", "img/Ellipse.png");
        this.load.image("chat-hover", "img/chatHover.png");
        this.load.image("content-hover", "img/contentHover.png");
        this.load.image("write-hover", "img/writeHover.png");
        this.load.image("profile", "img/page/user.png");
        this.load.image("page", "img/page/wine.png");
        this.load.image("meet-button", "img/meet.png");
        this.load.image("profile-rectangle", "img/profileRectangle.png");
        this.load.image("point-rectangle", "img/pointRectangle.png");
        this.registry.set("gridSize", 50);
        // debugger;
        const { width, height } = calculateGameSize(
            window.innerWidth,
            window.innerHeight
        );
        const gridArray = new Array(Math.ceil(width / 50))
            .fill(null)
            .map(() => new Array(Math.ceil(height / 50)).fill(0));
        this.registry.set("grid", gridArray);
    }
}
