<template>
  <div id="app" class="chat-container">
    <NavItem/>
    <div class="chat-box">
      <div class="messages">
        <MessageItem
          v-for="(msg, index) in messages"
          :key="index"
          :content="msg.content"
          :isUser="msg.isUser"
        />
      </div>
      <div class="input-box">
        <input
          v-model="newMessage"
          type="text"
          placeholder="輸入訊息..."
          @keyup.enter="sendMessage"
        />
        <button @click="sendMessage">送出</button>
      </div>
    </div>
  </div>
</template>

<script>
import MessageItem from "./components/MessageItem.vue";
import NavItem from "./components/nav.vue";
import { computed } from 'vue';

export default {
  name: "App",
  components: {
    MessageItem,
    NavItem,
  },
  data() {
    return {
      is_talk: false, // 是否正在對話
      question: "", // 使用者的問題
      api_url: "https://ai.k12edu.us.kg", // API 的基礎 URL
      isLogIn: true, // 使用者是否已登入
      userId: 1, // 使用者 ID
      conversationId: -1, // 對話 ID，初始為 -1 表示尚未建立
      newMessage: "", // 新的訊息內容
      messages: [], // 訊息列表，初始為空
      json_web_token: "", // JSON Web Token，用於身份驗證
    };
  },
  methods: {
    logout() {
      this.isLogIn = false; // 登出，將登入狀態設為 false
    },
    async sendMessage() {
      if (this.newMessage.trim() === "" || this.is_talk) return; // 若訊息為空或正在對話，則不執行
      this.messages.push({ content: this.newMessage, isUser: true }); // 新增使用者訊息至訊息列表
      this.question = this.newMessage; // 將新訊息內容設為當前問題
      this.newMessage = ""; // 清空輸入框
      await this.send_message_to_backend(); // 發送訊息至後端
    },
    async create_new_conversation() {
      try {
        console.log('請求建立新對話。');
        const data = { name: "new session" }; // 請求的資料內容

        const response = await fetch(`${this.api_url}/new_session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ragflow-hhOGY2ZDYwYzViYjExZWZiMWE1MDI0Mm' // 使用固定的 Bearer Token
          },
          body: JSON.stringify(data) // 將資料轉換為 JSON 字串
        });

        if (!response.ok) {
          throw new Error(`HTTP 錯誤！狀態：${response.status}`);
        }

        const result = await response.json();
        if (result.data && result.data.id) {
          this.conversationId = result.data.id; // 設定對話 ID
          console.log('新對話已建立，ID=', this.conversationId);
        } else {
          throw new Error('回應資料中缺少 id 參數。');
        }
      } catch (error) {
        console.error('發送請求時出錯：', error);
        alert("當前 AI 學習助手離線中，請稍後再嘗試與其交流"); // 顯示錯誤訊息
      }
    },
    async send_message_to_backend() {
      this.is_talk = true; // 設定為正在對話
      try {
        if (this.conversationId === -1) {
          await this.create_new_conversation(); // 若尚未建立對話，則建立新對話
        }
        if (this.conversationId === -1) {
          this.messages.push({
            content: "建立對話失敗。",
            isUser: false,
          });
          this.is_talk = false;
          return;
        }
        console.log('請求發送訊息。');
        const data = {
          'question': this.question,
          'stream': true,
          'session_id': this.conversationId
        };
        console.log('發送的資料：', data);

        const response = await fetch(`${this.api_url}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ragflow-hhOGY2ZDYwYzViYjExZWZiMWE1MDI0Mm' // 使用固定的 Bearer Token
          },
          body: JSON.stringify(data) // 將資料轉換為 JSON 字串
        });

        if (!response.ok) {
          if (response.status === 400 || response.status === 500) {
            this.messages.push({ content: '出現錯誤，請修改文字敘述內容!', isUser: false });
          }
          throw new Error(`HTTP 錯誤！狀態：${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        let result = '';
        let first_push = false;

        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          result += decoder.decode(value, { stream: true });

          const lines = result.split('\n');
          result = lines.pop(); // 保留最後一行未完整的資料
          console.log('接收到的行：', lines);

          for (let line of lines) {
            if (line.startsWith('data:')) {
              const jsonData = line.slice(5).trim();
              try {
                const parsedData = JSON.parse(jsonData);
                const answer = parsedData.data?.answer;
                if (answer) {
                  if (answer.startsWith("**ERROR**") || answer.length >= 5000) {
                    this.messages.push({ content: '出現錯誤，請換一句話重新傳送!', isUser: false });
                    done = true;
                    break;
                  }
                  if (!first_push) {
                    this.messages.push({ content: answer, isUser: false });
                    first_push = true;
                  } else {
                    this.messages[this.messages.length - 1].content = answer;
                  }
                }
              } catch (error) {
                console.error('解析 JSON 失敗：', error);
              }
            }
          }
        }
      } catch (error) {
        console.error('發送請求時出錯：', error);
        alert("當前 AI 學習助手離線中，請稍後再嘗試與其交流"); // 顯示錯誤訊息
      }
      this.is_talk = false; // 結束對話狀態
    }
  },
  async mounted() {
    // 在組件掛載後立即嘗試建立新對話
    await this.create_new_conversation();
  },
  provide() {
    return {
      isLogIn: computed(() => this.isLogIn),
      logout: this.logout,
    };
  }
};
</script>


<style scoped>
#app{
  display: flex;
  flex-direction: column;
}
.chat-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
}

.chat-box {
  width: 100%;
  height: 100%;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.messages {
  flex: 1;
  padding: 10px;
  overflow-y: auto;
  background-color: #f9f9f9;
}

.input-box {
  display: flex;
  padding: 10px;
  border-top: 1px solid #ddd;
  background-color: #fff;
}

input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  outline: none;
}

button {
  margin-left: 10px;
  padding: 8px 12px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #0056b3;
}
</style>
