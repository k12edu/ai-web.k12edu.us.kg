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
      if (this.newMessage.trim() === "") return;
      //this.create_new_conversation();
      this.messages.push({ content: this.newMessage, isUser: true });
      this.question = this.newMessage;
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
          'question': this.question,
          'stream': true
        }
        console.log('q='+JSON.stringify(data) );
        //const token=this.access_token;

        const response = await fetch(`http://100.73.132.110:60004/api/v1/chats/b4dbf55cc1c911ef80f40242c0a89006/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ragflow-EyNDY4NjRlYzFjYTExZWZiMmJmMDI0Mm`
          },
          body: JSON.stringify(data)
        }).then(response => {
          const reader = response.body.getReader();  // 確保正確使用 response
          let chunks = [];

          // 使用遞歸方式逐步讀取數據
          function read() {
            return reader.read().then(result => {
              if (result.done) {
                return chunks;  // 完成後返回所有數據
              }

              chunks.push(result.value);
              return read();  // 繼續讀取
            });
          }

          return read();  // 啟動讀取
        }).then(data => {
          // 這裡處理讀取的數據
          const decodedData = new TextDecoder().decode(new Uint8Array(data));  // 解碼
          console.log('Decoded data:', decodedData);

          // 嘗試解析 JSON 數據
          try {
            const parsedResult = JSON.parse(decodedData);
            console.log('Parsed result:', parsedResult);
            // 進一步處理你的數據
          } catch (error) {
            console.error('Failed to parse JSON:', error.message);
          }
        }).catch(error => {
          console.error('Request failed', error);  // 捕獲任何錯誤
        });
        console.log('res='+response);

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
