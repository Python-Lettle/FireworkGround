# Lumina Fireworks - Backend Specification

此文档描述了支持多人在线烟花游戏所需的后端接口规范。鉴于游戏的实时交互特性（烟花同步、即时聊天），推荐使用 **WebSocket** (如 Socket.io 或原生 WebSocket) 进行通信。

## 1. 连接建立 (Connection)

客户端在加载应用时尝试连接 WebSocket 服务器。

- **Endpoint**: `/socket` (或相应的 WebSocket 路径)
- **Query Params** (可选):
  - `name`: 玩家昵称 (如果由前端生成)
  - `color`: 玩家颜色 (如果由前端生成)

## 2. 数据结构定义

### Player (玩家)
```json
{
  "id": "string (uuid)",
  "name": "string",
  "color": "string (hex code)",
  "isCurrentUser": "boolean (仅前端使用)"
}
```

### ChatMessage (聊天消息)
```json
{
  "id": "string (uuid)",
  "playerId": "string",
  "playerName": "string",
  "text": "string",
  "timestamp": "number (epoch)",
  "color": "string"
}
```

### FireworkPayload (烟花发射数据)
```json
{
  "sx": "number (起始 X 坐标)",
  "sy": "number (起始 Y 坐标)",
  "tx": "number (目标 X 坐标)",
  "ty": "number (目标 Y 坐标)",
  "hue": "number (色相 0-360)"
}
```

---

## 3. WebSocket 事件协议

### A. 客户端发送给服务器 (Client -> Server)

| 事件名 (Event Name) | 载荷 (Payload) | 描述 |
| :--- | :--- | :--- |
| **`join_room`** | `{ name: string, color: string }` | 玩家进入房间时发送，请求加入游戏列表。 |
| **`firework_launch`** | `FireworkPayload` | 当玩家点击屏幕/长按发射烟花时触发。 |
| **`chat_send`** | `{ text: string }` | 当玩家在聊天框输入并发送消息时触发。 |
| **`disconnect`** | *None* | 客户端断开连接（通常由底层库自动处理）。 |

### B. 服务器发送给客户端 (Server -> Client)

| 事件名 (Event Name) | 载荷 (Payload) | 描述 |
| :--- | :--- | :--- |
| **`init_state`** | `{ selfId: string, players: Player[], chatHistory: ChatMessage[] }` | 连接成功后发送给当前客户端。包含分配的 ID、当前在线玩家列表和最近的聊天记录。 |
| **`player_joined`** | `Player` | 当有新玩家加入时，广播给房间内所有**其他**玩家。 |
| **`player_left`** | `{ id: string }` | 当有玩家断开连接时，广播给房间内所有剩余玩家，用于更新列表。 |
| **`remote_launch`** | `{ playerId: string, ...FireworkPayload }` | 当某玩家发射烟花时，广播给所有**其他**玩家，以便在他们的屏幕上渲染该烟花。 |
| **`new_message`** | `ChatMessage` | 当某玩家发送消息时，服务器附加时间戳和 ID 后广播给**所有**玩家。 |

---

## 4. 业务逻辑流程示例

1. **初始化**:
   - Client A 连接 WebSocket。
   - Server 分配 ID `user_123`。
   - Server 发送 `init_state` 给 Client A。
   - Server 广播 `player_joined` (User A) 给已在线的 Client B, Client C。

2. **发射烟花**:
   - Client A 点击屏幕。
   - Client A 本地立即渲染烟花（为了零延迟体验）。
   - Client A 发送 `firework_launch` 给 Server。
   - Server 收到后，向 Client B 和 Client C 广播 `remote_launch`。
   - Client B 和 C 收到事件，使用 `FireworkCanvas` 的 `launchRocket` 方法渲染来自 User A 的烟花。

3. **聊天**:
   - Client B 发送 `chat_send` (`text: "Hello!"`)。
   - Server 构造完整的 `ChatMessage` 对象。
   - Server 广播 `new_message` 给所有客户端 (A, B, C)。
   - 所有客户端更新 UI 显示新消息。
