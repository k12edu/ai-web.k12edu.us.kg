<template>
  <div :class="['message-item', { 'user-message': isUser }]">
    <div class="message-content" v-html="formattedContent"></div>
  </div>
</template>

  
  <script>
  export default {
    name: "MessageItem",
    props: {
      content: {
        type: String,
        required: true,
      },
      isUser: {
        type: Boolean,
        required: true,
      },
    },
    computed: {
      formattedContent() {
        // 使用 marked 將 Markdown 格式轉換為 HTML
        return marked(this.content);
      },
    } 
  };
  </script>
  
  <style scoped>
  .message-item {
    margin: 20px 0;
    display: flex;
    justify-content: flex-start;
  }
  
  .user-message {
    justify-content: flex-end;
  }
  
  .message-content {
    max-width: 70%;
    padding: 8px 12px;
    border-radius: 12px;
    background-color: #e0e0e0;
    word-wrap: break-word;
  }
  
  .user-message .message-content {
    background-color: #007bff;
    color: white;
  }
  </style>
  