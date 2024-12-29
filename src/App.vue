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
      is_talk: false,
      question: "",
      api_url: "http://192.168.0.237",
      isLogIn: true,
      userId: 1,
      conversationId: -1,
      newMessage: "",
      messages: [
        { content: "你好！有什麼需要幫忙的嗎？", isUser: false },
      ],
      json_web_token: "",
    };
  },
  methods: {
    logout(){
      this.isLogIn=false;
    },
    sendMessage() {
      if (this.newMessage.trim() === "" || this.is_talk) return;
      //this.create_new_conversation();
      this.messages.push({ content: this.newMessage, isUser: true });
      this.question = this.newMessage;
      this.newMessage = "";
      this.send_message_to_backend();
      // 新增使用者訊息
      
      // 模擬對方回覆
      // setTimeout(() => {
      //   this.messages.push({
      //     content: "這是自動回覆的訊息。",
      //     isUser: false,
      //   });
      // }, 1000);

      // 清空輸入框
      
    },
    async create_new_conversation() {
      try {
        console.log('request to create new conversation.')
        // const data={
          
        // }
        //const token=this.access_token;
        const data = { name: "new session" };

        const response = await fetch(`https://ai.k12edu.us.kg/new_session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ragflow-hhOGY2ZDYwYzViYjExZWZiMWE1MDI0Mm'
            // 'Authorization': `Bearer ${token}`
          }, 
          body: JSON.stringify(data) 
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        this.conversationId = result.data.id;
        console.log(result);
        console.log('id=',this.conversationId);
      } catch (error) {
        console.error('發送請求時出錯：', error);
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
          const errorData = await response.json();
          const errorMessage = errorData.message || '發生未知錯誤';
          this.messages.push({ content: `錯誤：${errorMessage}`, isUser: false });
          throw new Error(`HTTP 錯誤！狀態：${response.status}，訊息：${errorMessage}`);
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
    },
  },
  mounted(){
    // 取得網址中的查詢參數
    const queryString = window.location.search;

    // 使用 URLSearchParams 解析查詢參數
    const urlParams = new URLSearchParams(queryString);

    // 取得特定的請求關鍵字
    const keyword = urlParams.get('id'); // 假設關鍵字參數名稱是 'keyword'
    this.json_web_token=keyword;
    console.log('id:', keyword);
  },
  provide(){
    return{
      isLogIn : computed(() => this.isLogIn),
      logout: this.logout,
    }
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
