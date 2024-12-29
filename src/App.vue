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
        { content: "我是 k12edu 提供的 AI 學習助手，用於回答使用者在學習時遇到的問題，請問需要幫忙嗎？", isUser: false },
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
    },
    async create_new_conversation() {
      try {
        console.log('請求新的對話')
        const data = { name: "new session" };
        const response = await fetch(`https://ai.k12edu.us.kg/new_session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ragflow-hhOGY2ZDYwYzViYjExZWZiMWE1MDI0Mm'
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

      this.is_talk=true;
      function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
      }
      try {
        if(this.conversationId==-1){
          this.create_new_conversation();
          await delay(4000); 
        }
        if(this.conversationId==-1){
          this.messages.push({
            content: "建立對話失敗。",
            isUser: false,
          });
        }
        console.log('發送訊息(流狀態)')
        const data={
          'question': this.question,
          'stream': true,
          'session_id': this.conversationId
        }
        console.log(data);
        console.log('q='+JSON.stringify(data) );
        //const token=this.access_token;

        const url = 'https://ai.k12edu.us.kg/chat';
  
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ragflow-hhOGY2ZDYwYzViYjExZWZiMWE1MDI0Mm`
          },
          body: JSON.stringify(data) // 傳遞的data
        });
        if (!response.ok && (response.status === 400 || response.status === 500)) {
          this.messages.push({ content: '回答似乎發生問題，請常識重新連線。', isUser: false });
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // 讀取 response 的流資料
        const reader = response.body.getReader();
        let decoder = new TextDecoder();
        let done = false;
        let result = '';
        let first_push=false;
        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;

          // 將二進位數據解碼為字符串
          result += decoder.decode(value, { stream: true });

          // 按行處理返回的每段資料
          let lines = result.split('\n');
          
          // 可能剩下未完全接收到的數據，保留最後一行並繼續
          result = lines.pop();
          console.log(lines);
          // 處理每行資料
          
          for (let line of lines) {
            if (line.startsWith('data:')) {
              // 去除前綴 `data:` 並解析 JSON
              const jsonData = line.slice(5).trim();
              try {
                const parsedData = JSON.parse(jsonData);
                
                console.log(parsedData.data.answer);  // 用來檢查返回的內容
                // // if (!parsedData.data.answer || parsedData.data.answer.length === 0) {
                // //   this.messages.push({ content: '沒有返回有效的資料，請檢查問題內容。', isUser: false });
                // //   done = true;
                // //   break;
                // // }
                // if (parsedData.data.answer.slice(0, 9) == "**ERROR**") {
                //   this.messages.push({ content: '伺服器返回錯誤，請稍後再試。', isUser: false });
                //   done = true;
                //   break;
                // }
                // if (parsedData.data.answer.length >= 5000) {
                //   this.messages.push({ content: '回答過長，請換一句話重新傳送!', isUser: false });
                //   done = true;
                //   break;
                // }
                if((parsedData.data.answer != undefined && parsedData.data.answer!='')&& first_push==false){
                  this.messages.push({ content: parsedData.data.answer, isUser: false });
                  first_push=true;
                }
                else if((parsedData.data.answer != undefined && parsedData.data.answer!='' )&& parsedData.data.answer && this.messages.length>0){
                  this.messages[this.messages.length-1].content=parsedData.data.answer;
                }
              } catch (error) {
                console.error('Failed to parse JSON:', error);
              }
            }
          }
        }

      } catch (error) {
        console.error('發送請求時出錯：', error);
      }
      this.is_talk=false;
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
