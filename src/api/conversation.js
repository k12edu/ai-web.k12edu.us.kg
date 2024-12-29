export async function createNewConversation() {
    try {
        console.log('請求新的對話');
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
        return result.data.id;  // 回傳會話 ID
    } catch (error) {
        console.error('發送請求時出錯：', error);
        throw error;
    }
    }

    export async function sendMessageToBackend(question, conversationId) {
    try {
        if (conversationId === -1) {
        throw new Error('Invalid conversation ID');
        }

        const data = {
        question,
        stream: true,
        session_id: conversationId
        };

        console.log('發送訊息(流狀態)', data);
        
        const url = 'https://ai.k12edu.us.kg/chat';
        const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ragflow-hhOGY2ZDYwYzViYjExZWZiMWE1MDI0Mm`
        },
        body: JSON.stringify(data)
        });

        if (!response.ok && (response.status === 400 || response.status === 500)) {
        throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let result = '';
        let done = false;

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
                if (parsedData.data.answer.slice(0, 9) === "**ERROR**") {
                throw new Error('伺服器返回錯誤，請稍後再試。');
                }
                return parsedData.data.answer;
            } catch (error) {
                console.error('Failed to parse JSON:', error);
                throw error;
            }
            }
        }
        }
    } catch (error) {
        console.error('發送請求時出錯：', error);
        throw error;
    }
}