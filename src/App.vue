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
      if (this.newMessage.trim() === "") return;
      //this.create_new_conversation();
      this.send_message_to_backend();
      // 新增使用者訊息
      this.messages.push({ content: this.newMessage, isUser: true });

      // 模擬對方回覆
      // setTimeout(() => {
      //   this.messages.push({
      //     content: "這是自動回覆的訊息。",
      //     isUser: false,
      //   });
      // }, 1000);

      // 清空輸入框
      this.newMessage = "";
    },
    async create_new_conversation() {
      try {
        console.log('request to create new conversation.')
        // const data={
          
        // }
        //const token=this.access_token;
        const data = { name: "new session" };

        const response = await fetch(`http://100.73.132.110:60004/api/v1/chats/b4dbf55cc1c911ef80f40242c0a89006/sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ragflow-EyNDY4NjRlYzFjYTExZWZiMmJmMDI0Mm'
            // 'Authorization': `Bearer ${token}`
          }, 
          body: JSON.stringify(data) 
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        this.conversationId = result.chat_id;
        console.log(result);
      } catch (error) {
        console.error('發送請求時出錯：', error);
      }
    },
    async send_message_to_backend() {
      function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
      }
      try {
        if(this.conversationId==-1){
          this.create_new_conversation();
          await delay(2000); 
        }
        if(this.conversationId==-1){
          this.messages.push({
            content: "建立對話失敗。",
            isUser: false,
          });
        }
        console.log('request to send message.')
        const data={
          'session_id': this.conversationId,
          'question': this.newMessage,
          'stream': true
        }
        //const token=this.access_token;
        const response = await fetch(`http://100.73.132.110:60004/api/v1/chats/b4dbf55cc1c911ef80f40242c0a89006/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ragflow-EyNDY4NjRlYzFjYTExZWZiMmJmMDI0Mm`
          }, 
          body: JSON.stringify(data) 
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        // 建立讀取器，逐步讀取流
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        let result = '';

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;

          // 將這段回應資料轉換為字串
          result += decoder.decode(value, { stream: true });
        }

        // 逐段處理並移除 'data:' 前綴
        const chunks = result.split('\n'); // 假設每個回應段是以換行分隔的

        chunks.forEach(chunk => {
          if (chunk.startsWith('data:')) {
            // 移除 'data:' 並進行 JSON 解析
            const cleanChunk = chunk.replace(/^data:/, '').trim();

            try {
              // 嘗試解析 JSON
              const parsedResult = JSON.parse(cleanChunk);
              // console.log('Parsed result:', parsedResult);  // 顯示解析結果
              if(parsedResult.data.answer!=''){
                console.log('log'+parsedResult.data.answer);
                this.messages.push({
                  content: parsedResult.data.answer,  // 假設要使用 'answer' 欄位
                  isUser: false,
                });
              }
            } catch (error) {
              console.error('Failed to parse JSON:', error.message);
              console.log('Invalid data chunk:', cleanChunk);  // 顯示無效的資料塊
            }
          }
        });
      } catch (error) {
        console.error('發送請求時出錯：', error);
      }
    }
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
