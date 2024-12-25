
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
          return `${button}<pre><code class="language-${language}">${code}</code></pre>`;
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
    margin-left: 2;
  padding: 2px 3;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.copy-btn:hover {
  background-color: #0056b3;
}
  </style>
  