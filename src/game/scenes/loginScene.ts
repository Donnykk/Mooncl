import { Scene } from "phaser";
import { EventBus } from "../EventBus";

interface LoginResponse {
    success: boolean;
    data?: {
        userId: number;
        username: string;
        lastLoginTime: string;
    };
    error?: string;
}

export class loginScene extends Scene {
    private loginText: Phaser.GameObjects.Text;

    constructor() {
        super("login");
    }

    preload() {
        // Load background image
        this.load.image("cover", "img/cover_new.png");
        this.load.image("logo", "favicon_w.png");
        this.load.image("twitter", "img/page/x.png");
        this.load.image("telegram", "img/page/telegram.png");
        this.load.image("purple", "img/page/purple.png");
    }

    create() {
        const { width, height } = this.scale;

        // 替换原来的 topOverlay
        const fogOverlay = this.add.graphics();

        // 创建从上到下的渐变遮罩
        fogOverlay.fillGradientStyle(
            0x000000,
            0x000000,
            0x000000,
            0x000000, // colors
            0.9,
            0.9,
            0,
            0 // alphas
        );
        fogOverlay.fillRect(0, 0, width, height / 5);
        fogOverlay.setDepth(5);

        // 添加雾气动画效果
        this.tweens.add({
            targets: fogOverlay,
            alpha: { from: 0.8, to: 1 },
            duration: 2000,
            ease: "Sine.easeInOut",
            yoyo: true,
            repeat: -1,
        });

        // 创建一个容器来包含 logo 和文字，以便更好地控制对齐
        const headerContainer = this.add.container(20, 20);
        headerContainer.setDepth(10);

        // 添加 logo
        const logo = this.add
            .image(width * 0.02, height * 0.05, "logo")
            .setOrigin(0, 0.5)
            .setScale(0.1);

        // 添加 Mooncl 文字
        const logoText = this.add
            .text(logo.width * 0.1 + width * 0.025, height * 0.05, "Mooncl", {
                fontSize: "15px",
                fontFamily: "Arial, sans-serif",
                color: "#ffffff",
                fontStyle: "bold",
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: "rgba(0, 0, 0, 0.5)",
                    blur: 3,
                    fill: true,
                },
            })
            .setOrigin(0, 0.5); // 设置文字原点到左侧中间

        // 将 logo 和文字添加到容器中
        headerContainer.add([logo, logoText]);

        // 添加社交媒体图标
        const socialContainer = this.add.container(width * 0.95, height * 0.04);
        socialContainer.setDepth(10);

        // 添加 Twitter 图标
        const twitterIcon = this.add
            .image(0, height * 0.05, "twitter")
            .setOrigin(1, 0.5)
            .setScale(1)
            .setInteractive()
            .on("pointerover", () => {
                this.tweens.add({
                    targets: twitterIcon,
                    scale: 1.1,
                    duration: 200,
                    ease: "Sine.easeOut",
                });
            })
            .on("pointerout", () => {
                this.tweens.add({
                    targets: twitterIcon,
                    scale: 1,
                    duration: 200,
                    ease: "Sine.easeOut",
                });
            });

        // 添加 Telegram 图标
        const telegramIcon = this.add
            .image(-twitterIcon.width - 20, height * 0.05, "telegram")
            .setOrigin(1, 0.5)
            .setScale(1)
            .setInteractive()
            .on("pointerover", () => {
                this.tweens.add({
                    targets: telegramIcon,
                    scale: 1.1,
                    duration: 200,
                    ease: "Sine.easeOut",
                });
            })
            .on("pointerout", () => {
                this.tweens.add({
                    targets: telegramIcon,
                    scale: 1,
                    duration: 200,
                    ease: "Sine.easeOut",
                });
            });

        socialContainer.add([telegramIcon, twitterIcon]);

        // 计算图片缩放比例（保持原始宽高比）
        const bgTexture = this.textures.get("cover");
        const scaleX = width / bgTexture.source[0].width;
        const scaleY = height / bgTexture.source[0].height;
        const scale = Math.max(scaleX, scaleY); // 取最大缩放值（覆盖模式）

        const background = this.add
            .image(width / 2, height / 2, "cover")
            .setScale(scale)
            .setTint(0x666666);

        // 添加紫色背景叠加
        const purpleOverlay = this.add
            .image(width / 2, height / 2, "purple")
            .setAlpha(0.7);

        // 添加黑色蒙版
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.02);
        overlay.fillRect(0, 0, width, height);

        const fullWidth = window.innerWidth;
        const fullHeight = window.innerHeight;

        const createGradientText = (
            scene: Phaser.Scene,
            x: number,
            y: number,
            text: string,
            size: string
        ) => {
            const fontFamily =
                "SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif";
            const container = scene.add.container(x, y);

            // 分割文本
            const prefix = "Welcome to ";
            const highlight = "Mooncl";
            const style = {
                fontSize: "60px",
                fontFamily: "Space Grotesk",
                fontWeight: "700",
                color: "#FFFFFF",
                resolution: 2,
                antialias: true,
            };

            // 创建前缀文本 (白色)
            const prefixText = scene.add.text(0, 0, prefix, {
                ...style,
                color: "#FFFFFF",
            });
            container.add(prefixText);

            // 创建Mooncl渐变文本
            const gradientColors = ["#FF3BFF", "#A341FF", "#28B4FF"]; // 更新为新的渐变色

            // 先创建所有字符测量总宽度
            let highlightWidth = 0;
            const charTexts: Phaser.GameObjects.Text[] = [];
            for (let i = 0; i < highlight.length; i++) {
                const charText = scene.add.text(0, 0, highlight[i], style);
                highlightWidth += charText.width;
                charTexts.push(charText);
                charText.destroy(); // 只用于测量
            }

            // 计算起始位置 (确保整体居中)
            const totalWidth = prefixText.width + highlightWidth;
            prefixText.setX(-totalWidth / 2);

            // 实际渲染字符
            let currentX = prefixText.x + prefixText.width;
            for (let i = 0; i < highlight.length; i++) {
                const color = Phaser.Display.Color.Interpolate.ColorWithColor(
                    Phaser.Display.Color.ValueToColor(gradientColors[0]),
                    Phaser.Display.Color.ValueToColor(
                        gradientColors[gradientColors.length - 1]
                    ),
                    highlight.length,
                    i
                );

                const charText = scene.add.text(currentX, 0, highlight[i], {
                    ...style,
                    color: Phaser.Display.Color.RGBToString(
                        color.r,
                        color.g,
                        color.b
                    ),
                });
                container.add(charText);
                currentX += charText.width;
            }

            // 移除发光效果
            container.list.forEach((child) => {
                if (child instanceof Phaser.GameObjects.Text) {
                    child.setShadow(0, 0, "transparent", 0);
                }
            });

            return container;
        };

        // 使用方式
        const title = createGradientText(
            this,
            width / 2,
            height * 0.25,
            "Welcome to Mooncl",
            "80px"
        );

        //添加副标题
        const subtitle = this.add
            .text(width / 2, height * 0.42, "SUI Board", {
                fontSize: "20px",
                color: "#999999",
                fontFamily: "Space Grotesk",
                fontStyle: "400",
                lineSpacing: 10,
                align: "center",
            })
            .setOrigin(0.5);

        //添加描述文字
        const description = this.add
            .text(
                width / 2,
                height * 0.45,
                "Connecting SUI Ecosystem Partners Effortlessly",
                {
                    fontSize: "20px",
                    color: "#999999",
                    fontFamily: "Space Grotesk",
                    fontStyle: "400",
                    lineSpacing: 10,
                    wordWrap: { width: 498 },
                    align: "center",
                }
            )
            .setOrigin(0.5);

        // 移除原来的DOM元素容器（不需要了）
        // this.connectButtonContainer.destroy(); // 如果之前创建过的话

        const buttonWidth = 285;
        const buttonHeight = 72;
        const buttonX = width / 2;
        const buttonY = height * 0.6;
        const buttonSpacing = 20; // 按钮之间的间距

        // 创建 Google 登录按钮
        const googleButton = this.add.graphics();
        const googleCanvas = document.createElement("canvas");
        googleCanvas.width = buttonWidth;
        googleCanvas.height = buttonHeight;
        const googleCtx = googleCanvas.getContext("2d");
        if (!googleCtx) {
            throw new Error("Could not get 2D context from canvas");
        }

        // 创建 Google 按钮的圆角矩形
        const radius = 24;
        googleCtx.beginPath();
        googleCtx.moveTo(radius, 0);
        googleCtx.lineTo(buttonWidth - radius, 0);
        googleCtx.quadraticCurveTo(buttonWidth, 0, buttonWidth, radius);
        googleCtx.lineTo(buttonWidth, buttonHeight - radius);
        googleCtx.quadraticCurveTo(
            buttonWidth,
            buttonHeight,
            buttonWidth - radius,
            buttonHeight
        );
        googleCtx.lineTo(radius, buttonHeight);
        googleCtx.quadraticCurveTo(0, buttonHeight, 0, buttonHeight - radius);
        googleCtx.lineTo(0, radius);
        googleCtx.quadraticCurveTo(0, 0, radius, 0);
        googleCtx.closePath();

        // 设置 Google 按钮的渐变效果
        const googleGrd = googleCtx.createLinearGradient(0, 0, buttonWidth, 0);
        googleGrd.addColorStop(0, "#FF39E0");
        googleGrd.addColorStop(0.5, "#AE4FFF");
        googleGrd.addColorStop(1, "#30B3D4");
        googleCtx.fillStyle = googleGrd;
        googleCtx.fill();

        // 创建 Google 按钮纹理
        const googleButtonTexture = this.textures.addCanvas(
            "googleButtonTexture",
            googleCanvas
        );
        const googleButtonSprite = this.add
            .sprite(
                buttonX - buttonWidth / 2 - buttonSpacing / 2,
                buttonY,
                "googleButtonTexture"
            )
            .setDisplaySize(buttonWidth, buttonHeight);

        // 创建钱包登录按钮（透明背景）
        const walletCanvas = document.createElement("canvas");
        walletCanvas.width = buttonWidth;
        walletCanvas.height = buttonHeight;
        const walletCtx = walletCanvas.getContext("2d");
        if (!walletCtx) {
            throw new Error("Could not get 2D context from canvas");
        }

        // 创建钱包按钮的圆角矩形
        walletCtx.beginPath();
        walletCtx.moveTo(radius, 0);
        walletCtx.lineTo(buttonWidth - radius, 0);
        walletCtx.quadraticCurveTo(buttonWidth, 0, buttonWidth, radius);
        walletCtx.lineTo(buttonWidth, buttonHeight - radius);
        walletCtx.quadraticCurveTo(
            buttonWidth,
            buttonHeight,
            buttonWidth - radius,
            buttonHeight
        );
        walletCtx.lineTo(radius, buttonHeight);
        walletCtx.quadraticCurveTo(0, buttonHeight, 0, buttonHeight - radius);
        walletCtx.lineTo(0, radius);
        walletCtx.quadraticCurveTo(0, 0, radius, 0);
        walletCtx.closePath();

        // 设置钱包按钮的透明背景
        walletCtx.fillStyle = "rgba(255, 255, 255, 0.1)";
        walletCtx.fill();

        // 创建钱包按钮纹理
        const walletButtonTexture = this.textures.addCanvas(
            "walletButtonTexture",
            walletCanvas
        );
        const walletButtonSprite = this.add
            .sprite(
                buttonX + buttonWidth / 2 + buttonSpacing / 2,
                buttonY,
                "walletButtonTexture"
            )
            .setDisplaySize(buttonWidth, buttonHeight);

        // 设置按钮的交互
        [googleButtonSprite, walletButtonSprite].forEach((button) => {
            button
                .setInteractive()
                .on("pointerover", () => {
                    this.tweens.add({
                        targets: button,
                        scaleX: 1.02,
                        scaleY: 1.02,
                        duration: 200,
                        ease: "Sine.easeOut",
                    });
                })
                .on("pointerout", () => {
                    this.tweens.add({
                        targets: button,
                        scaleX: 1,
                        scaleY: 1,
                        duration: 200,
                        ease: "Sine.easeOut",
                    });
                });
        });

        // 为钱包按钮添加点击事件
        walletButtonSprite.on("pointerdown", () => {
            // 隐藏原有按钮
            googleButtonSprite.setVisible(false);
            walletButtonSprite.setVisible(false);
            googleText.setVisible(false);
            walletText.setVisible(false);

            // 创建新的登录按钮
            const loginCanvas = document.createElement("canvas");
            loginCanvas.width = buttonWidth;
            loginCanvas.height = buttonHeight;
            const loginCtx = loginCanvas.getContext("2d");
            if (!loginCtx) {
                throw new Error("Could not get 2D context from canvas");
            }

            // 创建登录按钮的圆角矩形
            loginCtx.beginPath();
            loginCtx.moveTo(radius, 0);
            loginCtx.lineTo(buttonWidth - radius, 0);
            loginCtx.quadraticCurveTo(buttonWidth, 0, buttonWidth, radius);
            loginCtx.lineTo(buttonWidth, buttonHeight - radius);
            loginCtx.quadraticCurveTo(
                buttonWidth,
                buttonHeight,
                buttonWidth - radius,
                buttonHeight
            );
            loginCtx.lineTo(radius, buttonHeight);
            loginCtx.quadraticCurveTo(
                0,
                buttonHeight,
                0,
                buttonHeight - radius
            );
            loginCtx.lineTo(0, radius);
            loginCtx.quadraticCurveTo(0, 0, radius, 0);
            loginCtx.closePath();

            // 设置登录按钮的渐变效果
            const loginGrd = loginCtx.createLinearGradient(
                0,
                0,
                buttonWidth,
                0
            );
            loginGrd.addColorStop(0, "#FF39E0");
            loginGrd.addColorStop(0.5, "#AE4FFF");
            loginGrd.addColorStop(1, "#30B3D4");
            loginCtx.fillStyle = loginGrd;
            loginCtx.fill();

            // 创建登录按钮纹理
            const loginButtonTexture = this.textures.addCanvas(
                "loginButtonTexture",
                loginCanvas
            );
            const loginButtonSprite = this.add
                .sprite(buttonX, buttonY, "loginButtonTexture")
                .setDisplaySize(buttonWidth, buttonHeight);

            // 添加登录文字
            this.loginText = this.add
                .text(buttonX, buttonY, "Logging...", {
                    fontSize: "24px",
                    color: "#FFFFFF",
                    fontFamily: "Space Grotesk",
                    fontStyle: "700",
                })
                .setOrigin(0.5)
                .setDepth(1);

            // 添加加载动画
            this.tweens.add({
                targets: this.loginText,
                alpha: 0.5,
                duration: 500,
                ease: "Power2",
                yoyo: true,
                repeat: -1,
            });

            // 触发登录请求
            this.handleLogin();
        });

        // 添加按钮文字
        const googleText = this.add
            .text(
                buttonX - buttonWidth / 2 - buttonSpacing / 2,
                buttonY,
                "Sign in with Google",
                {
                    fontSize: "24px",
                    color: "#FFFFFF",
                    fontFamily: "Space Grotesk",
                    fontStyle: "700",
                }
            )
            .setOrigin(0.5)
            .setDepth(1);

        const walletText = this.add
            .text(
                buttonX + buttonWidth / 2 + buttonSpacing / 2,
                buttonY,
                "Sign in with Wallet",
                {
                    fontSize: "24px",
                    color: "#FFFFFF",
                    fontFamily: "Space Grotesk",
                    fontStyle: "700",
                }
            )
            .setOrigin(0.5)
            .setDepth(1);

        // 更新登录文本引用
        this.loginText = walletText;

        // Listen for login response
        EventBus.on("phaser_loginResponse", (response: LoginResponse) => {
            if (response.success) {
                // Store user info in game registry
                this.registry.set("userData", response.data);
                // Delay 1 second before transition to let user see success message
                this.time.delayedCall(1000, () => {
                    this.scene.start("Preloader");
                });
            } else {
                console.error("failed:", response.error);
                // Display error message
                this.add
                    .text(
                        fullWidth / 2,
                        fullHeight * 0.7,
                        `failed: ${response.error}`,
                        {
                            fontSize: "16px",
                            color: "#ff0000",
                        }
                    )
                    .setOrigin(0.5);
            }
        });
    }

    handleLogin() {
        // Show loading status
        this.loginText.setText("logging...");

        // Trigger login request
        EventBus.emit("phaser_loginRequest", {});

        // Add loading animation
        this.tweens.add({
            targets: this.loginText,
            alpha: 0.5,
            duration: 500,
            ease: "Power2",
            yoyo: true,
            repeat: -1,
        });
    }
}
