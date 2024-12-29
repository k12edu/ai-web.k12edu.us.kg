import { ref } from "vue";

// 定義並導出函數
export function useConversation() {
    const is_talk = ref(false);
    const conversationId = ref(-1);
    const api_url = "https://ai.k12edu.us.kg";

    // 創建新對話
    async function create_new_conversation() {
    try {
        const data = { name: "new session" };
        const response = await fetch(`${api_url}/new_session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error("Failed to create conversation");

        const result = await response.json();
        if (result.data?.id) {
        conversationId.value = result.data.id;
        }
    } catch (error) {
        console.error("Error:", error);
    }
    }

    // 發送訊息
    async function sendMessage(newMessage, messages) {
    if (newMessage.trim() === "" || is_talk.value) return;

    messages.push({ content: newMessage, isUser: true });
    const data = {
        question: newMessage,
        stream: true,
        session_id: conversationId.value, 
    };

    try {
        const response = await fetch(`${api_url}/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ragflow-hhOGY2ZDYwYzViYjExZWZiMWE1MDI0Mm',
        },
        body: JSON.stringify(data),
        });

        if (!response.ok) {
        throw new Error(`API請求錯誤，狀態：${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        let result = '';
        let firstPush = false;

        while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        result += decoder.decode(value, { stream: true });

        const lines = result.split('\n');
        result = lines.pop();

        for (let line of lines) {
            if (line.startsWith('data:')) {
            const jsonData = line.slice(5).trim();
            try {
                const parsedData = JSON.parse(jsonData);
                const answer = parsedData.data?.answer;
                if (answer) {
                if (answer.startsWith("**ERROR**") || answer.length >= 5000) {
                    messages.push({ content: '出現錯誤，請換一句話重新傳送!', isUser: false });
                    done = true;
                    break;
                }

                if (!firstPush) {
                    messages.push({ content: answer, isUser: false });
                    firstPush = true;
                } else {
                    messages[messages.length - 1].content = answer;
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
        messages.push({ content: "當前 AI 學習助手離線中，請稍後再嘗試與其交流", isUser: false });
    } finally {
        is_talk.value = false;
    }
    }

    // 返回函數
    return {
        is_talk,
        conversationId,
        create_new_conversation,
        sendMessage,
    };
}