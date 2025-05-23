import { Room, Client } from "@colyseus/core";
import { MapSchema, Schema, type } from "@colyseus/schema";
import { StoryService } from "../services/storyServices";
import { UserService } from "../services/userService";
import { ReplyService } from "../services/replyService";
import {
  generateJWT,
  verifysuiSignature,
  verifyJWT,
  verifySuiSignature,
} from "../utils/jwtUtils";
import { getStoryById } from "../database/storyDB";
import crypto from "crypto";

class Player extends Schema {
  @type("string")
  address: string;
}

export class TavernState extends Schema {
  @type({ map: Player })
  players = new MapSchema<Player>();

  @type({ map: "string" })
  loginChallenges = new MapSchema<string>();
}

export class TavernRoom extends Room<TavernState> {
  maxClients = 10;

  onCreate(options: any) {
    this.setState(new TavernState());

    // 注册消息处理器
    this.onMessage("jwtLogin", this.handleJWTLogin.bind(this));
    this.onMessage("userLogin", this.handleLogin.bind(this));
    this.onMessage("loginSignature", this.handleLoginSignature.bind(this));
    this.onMessage("publishStory", this.handlePublishStory.bind(this));
    this.onMessage("deleteStory", this.handleDeleteStory.bind(this));
    this.onMessage("getAllStory", this.handleGetAllStory.bind(this));
    this.onMessage("fetchStory", this.handleFetchStories.bind(this));
    this.onMessage("sendWhiskey", this.handleSendWhiskey.bind(this));
    this.onMessage("getWhiskeyPoints", this.handleGetWhiskeyPoints.bind(this));
    this.onMessage(
      "updateWhiskeyPoints",
      this.handleUpdateWhiskeyPoints.bind(this)
    );
    this.onMessage("getIntimacy", this.handleGetIntimacy.bind(this));
    this.onMessage("updateIntimacy", this.handleUpdateIntimacy.bind(this));
    this.onMessage("replyStory", this.handleReplyStory.bind(this));
    this.onMessage("replyUser", this.handleReply.bind(this));
    this.onMessage(
      "getRepliesByStoryId",
      this.handleGetRepliesByStoryId.bind(this)
    );
    this.onMessage("getNewReply", this.handleGetNewReply.bind(this));
    this.onMessage("markRepliesRead", this.handleMarkRepliesRead.bind(this));
    this.onMessage(
      "markRepliesUnread",
      this.handleMarkRepliesUnread.bind(this)
    );
    this.onMessage("getRecvStories", this.handleGetRecvStories.bind(this));
    this.onMessage("markLikedStory", this.handleMarkLikedStory.bind(this));
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!");
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

  /**
   * 验证 JWT 并返回用户地址
   * @param token - JWT 字符串
   * @returns 用户地址或 null
   */
  private verifyClientJWT(token: string): string | null {
    const decoded = verifyJWT(token);
    if (decoded && "address" in decoded) {
      return (decoded as any).address;
    }
    return null;
  }

  /**
   * 一个通用的认证方法，用于在处理其他消息时验证 JWT
   * @param client - Colyseus 客户端
   * @returns 用户地址或 null
   */
  private authenticate(client: Client): string | null {
    const token = client.auth.jwt;
    if (!token) {
      client.send("error", { message: "No JWT provided." });
      return null;
    }

    const address = this.verifyClientJWT(token);
    console.log("address:", address);
    if (!address) {
      client.send("error", { message: "Invalid JWT." });
      return null;
    }

    return address;
  }

  /**
   * 处理 JWT 登录请求
   */
  async handleJWTLogin(client: Client, data: any) {
    const { token } = data;
    if (!token) {
      client.send("loginResponse", {
        success: false,
        reason: "Token is required.",
      });
      return;
    }

    try {
      // 验证 JWT
      const address = this.verifyClientJWT(token);
      if (!address) {
        client.send("loginResponse", {
          success: false,
          reason: "Invalid token.",
        });
        return;
      }

      // 设置客户端的 auth 信息
      client.auth = { jwt: token };

      // 创建玩家实例
      const player = new Player();
      player.address = address;
      this.state.players.set(client.sessionId, player);

      // 读取用户信息
      const user = await UserService.getUser(address);
      const userState = await UserService.getDailyState(address);

      // 发送登录成功响应
      client.send("loginResponse", {
        success: true,
        token,
        user,
        userState,
      });

      console.log(
        `Player ${address} logged in with JWT, session ${client.sessionId}`
      );
    } catch (error: any) {
      client.send("loginResponse", { success: false, reason: error.message });
    }
  }

  /**
   * 处理登录请求
   */
  async handleLogin(client: Client, data: any) {
    const { address } = data;
    if (!address) {
      client.send("loginResponse", {
        success: false,
        reason: "Address is required.",
      });
      return;
    }

    // 转换地址格式
    let addressStr: string;
    const suiAddress = this.convertsuiAddress(address);
    if (suiAddress) {
      console.log("sui address detected.");
      console.log("Hex Address:", suiAddress);
      addressStr = suiAddress;
    } else {
      console.log("Sui address detected.");
      addressStr = address;
    }

    // 生成一个随机的挑战消息
    const challenge = Buffer.from(crypto.randomBytes(32)).toString("hex");

    // 存储挑战消息，关联到客户端的 sessionId
    this.state.loginChallenges.set(client.sessionId, challenge);

    // 使用转换后的地址字符串创建玩家
    const player = new Player();
    player.address = addressStr;
    this.state.players.set(client.sessionId, player);
    console.log(
      `Player ${player.address} logged in with session ${client.sessionId}, address ${addressStr} and challenge ${challenge}`
    );

    // 发送挑战消息给前端
    client.send("loginChallenge", { challenge });
  }

  /**
   * 验证 sui 地址并转换为字符串格式
   */
  private convertsuiAddress(address: any): string | null {
    if (address?.data && typeof address.data === "object") {
      const values = Object.values(address.data);
      if (
        values.length === 32 &&
        values.every((v) => typeof v === "number" && v >= 0 && v <= 255)
      ) {
        // 转换为标准的 hex 字符串格式
        return (
          "0x" + Buffer.from(new Uint8Array(values as number[])).toString("hex")
        );
      }
    }
    return null;
  }

  /**
   * 处理用户签名验证请求，生成 JWT
   */
  async handleLoginSignature(client: Client, data: any) {
    const { address, signature, challenge } = data;
    if (!challenge) {
      client.send("loginResponse", {
        success: false,
        reason: "No challenge found. Please initiate login again.",
      });
      return;
    }
    // 获取用户地址
    if (!address) {
      client.send("loginResponse", {
        success: false,
        reason: "User not authenticated.",
      });
      return;
    }

    try {
      // sui 验证签名
      console.log("address:", address);
      console.log("challenge:", challenge);
      console.log("signature:", signature);

      let addressStr: string;
      let isValid: boolean;

      // 检查是否为 sui 地址并转换
      const suiAddress = this.convertsuiAddress(address);
      if (suiAddress) {
        console.log("sui signature detected.");
        console.log("Hex Address:", suiAddress);
        isValid = await verifysuiSignature(suiAddress, challenge, signature);
        addressStr = suiAddress;
      } else {
        console.log("Sui signature detected.");
        isValid = await verifySuiSignature(address, challenge, signature);
        addressStr = address;
      }

      // 读取用户信息
      console.log("address:", addressStr);
      const user = await UserService.getUser(addressStr);
      const userState = await UserService.getDailyState(addressStr);
      // 签名验证通过，生成 JWT
      const token = generateJWT({ address: addressStr });
      client.auth = { jwt: token };
      // 发送 JWT 给前端
      client.send("loginResponse", { success: true, token });
      // 清除已使用的挑战消息
      this.state.loginChallenges.delete(client.sessionId);
    } catch (error: any) {
      client.send("loginResponse", { success: false, reason: error.message });
    }
  }

  /**
   * 处理发布故事请求
   */
  async handlePublishStory(client: Client, data: any) {
    const address = this.authenticate(client); // 调用认证函数
    if (!address) return; // 如果认证失败，函数会返回 null 并已经向客户端发送错误

    const { title, storyText } = data;
    console.log("title:", title);
    console.log("storyText:", storyText);

    try {
      const story = await StoryService.publishUserStory(
        address,
        title,
        storyText
      );
      client.send("storyPublishedResponse", { success: true, story });
    } catch (error: any) {
      client.send("storyPublishedResponse", {
        success: false,
        reason: error.message,
      });
    }
  }

  /**
   * 处理删除故事请求
   */
  async handleDeleteStory(client: Client, data: any) {
    const address = this.authenticate(client); // 调用认证函数
    if (!address) return; // 如果认证失败，函数会返回 null 并已经向客户端发送错误

    const { storyId } = data;
    try {
      await StoryService.deleteStory(address, storyId);
      client.send("deleteStoryResponse", { success: true });
    } catch (error: any) {
      client.send("deleteStoryResponse", {
        success: false,
        reason: error.message,
      });
    }
  }

  /**
   * 处理获取故事列表请求
   */
  async handleGetAllStory(client: Client) {
    const address = this.authenticate(client); // 调用认证函数
    if (!address) return; // 如果认证失败，函数会返回 null 并已经向客户端发送错误

    try {
      const stories = await StoryService.getAllStory(address);
      client.send("getAllStoryResponse", { success: true, stories });
    } catch (error: any) {
      client.send("getAllStoryResponse", {
        success: false,
        reason: error.message,
      });
    }
  }

  /**
   * 处理领取故事请求
   */
  async handleFetchStories(client: Client) {
    const address = this.authenticate(client); // 调用认证函数
    if (!address) return; // 如果认证失败，函数会返回 null 并已经向客户端发送错误

    try {
      const story = await StoryService.fetchRandomStory(address);
      client.send("fetchStoriesResult", { success: true, story });
    } catch (error: any) {
      client.send("fetchStoriesResult", {
        success: false,
        reason: error.message,
      });
    }
  }

  /**
   * 处理赠送威士忌请求
   */
  async handleSendWhiskey(client: Client, data: any) {
    const fromAddress = this.authenticate(client); // 调用认证函数
    if (!fromAddress) return; // 如果认证失败，函数会返回 null 并已经向客户端发送错误
    const { storyId } = data;
    try {
      await StoryService.sendWhiskey(fromAddress, storyId);
      client.send("whiskeySent", { success: true });
    } catch (error: any) {
      client.send("whiskeySent", { success: false, reason: error.message });
    }
  }

  /**
   * 处理读取积分请求
   */
  async handleGetWhiskeyPoints(client: Client) {
    const address = this.authenticate(client); // 调用认证函数
    if (!address) return; // 如果认证失败，函数会返回 null 并已经向客户端发送错误

    try {
      const points = UserService.getWhiskeyPoints(address);
      client.send("getWhiskeyPointsResponse", { success: true, points });
    } catch (error: any) {
      client.send("getWhiskeyPointsResponse", {
        success: false,
        reason: error.message,
      });
    }
  }

  /**
   * 处理更新积分请求
   */
  async handleUpdateWhiskeyPoints(client: Client, data: any) {
    const address = this.authenticate(client); // 调用认证函数
    if (!address) return;
    const { newPoints } = data;
    try {
      await UserService.updateWhiskeyPoints(address, newPoints);
      client.send("updateWhiskeyPointsResponse", { success: true, newPoints });
    } catch (error: any) {
      client.send("updateWhiskeyPointsResponse", {
        success: false,
        reason: error.message,
      });
    }
  }

  /**
   * 处理读取亲密度请求
   */
  async handleGetIntimacy(client: Client) {
    const address = this.authenticate(client); // 调用认证函数
    if (!address) return; // 如果认证失败，函数会返回 null 并已经向客户端发送错误

    try {
      const points = UserService.getIntimacy(address);
      client.send("getIntimacyResponse", { success: true, points });
    } catch (error: any) {
      client.send("getIntimacyResponse", {
        success: false,
        reason: error.message,
      });
    }
  }

  /**
   * 处理更新亲密度请求
   */
  async handleUpdateIntimacy(client: Client, data: any) {
    const address = this.authenticate(client); // 调用认证函数
    if (!address) return;
    const { newIntimacy } = data;
    try {
      await UserService.updateIntimacy(address, newIntimacy);
      client.send("updateIntimacyResponse", { success: true, newIntimacy });
    } catch (error: any) {
      client.send("updateIntimacyResponse", {
        success: false,
        reason: error.message,
      });
    }
  }

  /**
   * 处理回复故事请求
   */
  async handleReplyStory(client: Client, data: any) {
    const address = this.authenticate(client); // 调用认证函数
    if (!address) return; // 如果认证失败，函数会返回 null 并已经向客户端发送错误

    const { storyId, replyText } = data;
    console.log(storyId);
    console.log(replyText);

    try {
      const reply = await ReplyService.replyStory(address, storyId, replyText);
      client.send("replyStoryResponse", { success: true, reply });
    } catch (error: any) {
      client.send("replyStoryResponse", {
        success: false,
        reason: error.message,
      });
    }
  }

  /**
   * 处理回复用户请求
   */
  async handleReply(client: Client, data: any) {
    const address = this.authenticate(client); // 调用认证函数
    if (!address) return; // 如果认证失败，函数会返回 null 并已经向客户端发送错误

    const { targetUserAddress, replyText, storyId } = data;

    try {
      const reply = await ReplyService.replyBack(
        address,
        storyId,
        replyText,
        targetUserAddress
      );
      client.send("replyUserResponse", { success: true, reply });
    } catch (error: any) {
      client.send("replyUserResponse", {
        success: false,
        reason: error.message,
      });
    }
  }

  /**
   * 根据StoryId获取聊天历史
   * @param client
   * @param storyId
   */
  async handleGetRepliesByStoryId(client: Client, data: any) {
    const address = this.authenticate(client); // 调用认证函数
    if (!address) return; // 如果认证失败，函数会返回 null 并已经向客户端发送错误
    const { storyId } = data;
    try {
      console.log("storyId: ", storyId);
      const replies = await ReplyService.getRepliesForStoryByUser(
        address,
        Number(storyId)
      );
      client.send("getRepliesResponse", { success: true, replies });
    } catch (error: any) {
      client.send("getRepliesResponse", {
        success: false,
        reason: error.message,
      });
    }
  }

  /**
   * 获取新的回复
   */
  async handleGetNewReply(client: Client) {
    const address = this.authenticate(client); // 调用认证函数
    if (!address) return; // 如果认证失败，函数会返回 null 并已经向客户端发送错误

    try {
      const newReplies = await ReplyService.getNewReply(address);
      client.send("newRepliesResponse", { success: true, newReplies });
    } catch (error: any) {
      client.send("newRepliesResponse", {
        success: false,
        reason: error.message,
      });
    }
  }

  /**
   * 标记回复为已读
   */
  async handleMarkRepliesRead(client: Client, data: any) {
    const address = this.authenticate(client); // 调用认证函数
    if (!address) return; // 如果认证失败，函数会返回 null 并已经向客户端发送错误

    const { replyIds } = data;

    try {
      await ReplyService.markReplyRead(replyIds);
      client.send("markRepliesReadResponse", { success: true });
    } catch (error: any) {
      client.send("markRepliesReadResponse", {
        success: false,
        reason: error.message,
      });
    }
  }

  /**
   * 标记回复为未读
   */
  async handleMarkRepliesUnread(client: Client, data: any) {
    const address = this.authenticate(client); // 调用认证函数
    if (!address) return; // 如果认证失败，函数会返回 null 并已经向客户端发送错误

    const { replyIds } = data;

    try {
      await ReplyService.markReplyUnread(replyIds);
      client.send("markRepliesUnreadResponse", { success: true });
    } catch (error: any) {
      client.send("markRepliesUnreadResponse", {
        success: false,
        reason: error.message,
      });
    }
  }

  /***
   * 获取收到故事列表
   */
  async handleGetRecvStories(client: Client) {
    const address = this.authenticate(client); // 调用认证函数
    if (!address) return;
    try {
      await StoryService.getDailyStories(address);
      const likedStories = await UserService.getLikedStories(address);
      const recvStories = await Promise.all(
        likedStories.map(async (storyId: string) => {
          return await getStoryById(storyId);
        })
      );
      client.send("getRecvStoriesResponse", { success: true, recvStories });
    } catch (error: any) {
      client.send("getRecvStoriesResponse", {
        success: false,
        reason: error.message,
      });
    }
  }

  /***
   * 处理收藏请求
   */
  async handleMarkLikedStory(client: Client, data: any) {
    const address = this.authenticate(client); // 调用认证函数
    if (!address) return;
    const { storyId } = data;
    try {
      await StoryService.markLikedStory(address, storyId);
      client.send("markLikedStoryResponse", { success: true });
    } catch (error: any) {
      client.send("markLikedStoryResponse", {
        success: false,
        reason: error.message,
      });
    }
  }
}
