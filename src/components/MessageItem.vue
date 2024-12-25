<template>
  <div :class="['message-item', { 'user-message': isUser }]">
    <div class="message-content" v-html="formattedContent"></div>
  </div>
</template>

<script>
import hljs from 'highlight.js/lib/core';

// 導入你需要的語言庫
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
// 如果你需要其他語言，只需按需導入
import css from 'highlight.js/lib/languages/css';

// 註冊語言庫
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('css', css);
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
      const markdownContent = marked(this.content, {
        highlight: function (code) {
          // 自動偵測語言並進行語法高亮
          return hljs.highlightAuto(code).value;
        }
      });
      console.log(markdownContent);
      return this.addCopyButtons(markdownContent);
    },
  }, 
  methods: {
    // 這個方法會為每個程式碼區塊加上複製按鈕
    addCopyButtons(markdownContent) {
      const codeBlockRegex = /<pre><code.*?>([\s\S]*?)<\/code><\/pre>/g;
      const updatedContent = markdownContent.replace(codeBlockRegex, (match, code) => {
        // 建立複製按鈕
        const button = `<button class="copy-btn" data-clipboard-text="${code}">複製</button>`;
        let res = `${button}<div class="code_block"><pre><code>${code}</code></pre></div>`;
        console.log(res);
        return res;
      });
      // 確保在 DOM 更新後初始化 ClipboardJS
      this.$nextTick(() => {
        this.initializeClipboard();
      });
      return updatedContent;
    },

    // 主動初始化 ClipboardJS
    initializeClipboard() {
      // 先清理先前的實例
      if (this.clipboard) {
        this.clipboard.destroy();
      }

      // 初始化 ClipboardJS
      this.clipboard = new ClipboardJS('.copy-btn');
    },
  },
  mounted() {
    // 初始化複製按鈕功能
    new ClipboardJS('.copy-btn');
  },
};
</script>

<style>
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
  margin-left: 10px;
  padding: 5px 10px;
  background-color: #a7a7a7;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 10px;
}

.copy-btn:hover {
  background-color: #7e7d7d;
}

.code_block {
  background-color: rgb(206, 206, 206);
  border-radius: 10px;
  padding: 5px;
}
</style>
