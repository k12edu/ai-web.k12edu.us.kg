
<template>
  <div :class="['message-item', { 'user-message': isUser }]">
    <div class="message-content" v-html="formattedContent"></div>
  </div>
</template>

  
  <script>
 import { marked } from 'marked';
 import ClipboardJS from 'clipboard';
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
        const markdownContent = marked(this.content);
        return this.addCopyButtons(markdownContent);
      },
    },
    methods: {
      // 這個方法會為每個程式碼區塊加上複製按鈕
      addCopyButtons(markdownContent) {
        const codeBlockRegex = /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g;
        return markdownContent.replace(codeBlockRegex, (match, language, code) => {
          // 建立複製按鈕
          const button = `<button class="copy-btn" data-clipboard-text="${code}">複製</button>`;
          return `<pre><code class="language-${language}">${code}</code></pre>${button}`;
        });
      },
    },
    mounted() {
      // 初始化複製按鈕功能
      new ClipboardJS('.copy-btn');
    },
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

  .copy-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  cursor: pointer;
  padding: 5px;
  margin-left: 10px;
  border-radius: 3px;
}

.copy-btn:hover {
  background-color: #45a049;
}
  </style>
  