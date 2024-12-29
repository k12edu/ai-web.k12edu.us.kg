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
import { createNewConversation, sendMessageToBackend } from './api/conversation.js';  // 導入函數

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
        { content: "我是 k12edu 提供的 AI 學習助手，用於回答使用者在學習時遇到的問題，請問需要幫忙嗎？", isUser: false },
      ],
      json_web_token: "",
    };
  },
  methods: {
    logout() {
      this.isLogIn = false;
    },
    sendMessage() {
      if (this.newMessage.trim() === "" || this.is_talk) return;
      this.messages.push({ content: this.newMessage, isUser: true });
      this.question = this.newMessage;
      this.newMessage = "";
      this.sendMessageToBackend();
    },
    async sendMessageToBackend() {
      this.is_talk = true;
      try {
        if (this.conversationId === -1) {
          this.conversationId = await createNewConversation();
        }

        if (this.conversationId === -1) {
          this.messages.push({
            content: "建立對話失敗。",
            isUser: false,
          });
          this.is_talk = false;
          return;
        }

        const response = await sendMessageToBackend(this.question, this.conversationId);
        
        if (response) {
          this.messages.push({ content: response, isUser: false });
        }
      } catch (error) {
        console.error('發送訊息時出錯:', error);
        this.messages.push({ content: '發送訊息時出錯，請稍後再試。', isUser: false });
      }
      this.is_talk = false;
    }
  },
  mounted() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const keyword = urlParams.get('id');
    this.json_web_token = keyword;
    console.log('id:', keyword);
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
