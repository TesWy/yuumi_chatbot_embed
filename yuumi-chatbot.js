// File: yuumi-chatbot-loader.js

(function() { // Sử dụng IIFE (Immediately Invoked Function Expression) để tránh xung đột biến global

    // ===================================================================================
    // THAY THẾ URL API HEROKU CỦA BẠN VÀO ĐÂY
    // ===================================================================================
    const CHAT_API_URL = 'https://chatbot-yuumi-a4fc4e39a892.herokuapp.com/chat'; // << THAY THẾ BẰNG URL THỰC!
    // ===================================================================================

    let userId = localStorage.getItem('yuumiChatUserId');
    if (!userId) {
        userId = 'yuumi_user_' + Math.random().toString(36).substr(2, 9) + Date.now();
        localStorage.setItem('yuumiChatUserId', userId);
    }

    let isChatWidgetFullyOpen = false; // Trạng thái widget có đang mở rộng hoàn toàn hay không

    // --- Phần 1: Tạo HTML cho Widget ---
    function createChatWidgetHTML() {
        const widgetContainer = document.createElement('div');
        widgetContainer.id = 'yuumi-chat-container';

        widgetContainer.innerHTML = `
            <div id="yuumi-chat-widget" class="yuumi-chat-widget">
                <div class="yuumi-chat-header">
                    <span>Chat với Bot Yuumi</span>
                    <span id="yuumi-chat-toggle-icon" class="yuumi-chat-toggle-icon">+</span>
                </div>
                <div class="yuumi-chat-body" style="display: none;">
                    <!-- Tin nhắn sẽ được thêm vào đây -->
                </div>
                <div class="yuumi-chat-footer" style="display: none;">
                    <input type="text" id="yuumi-chat-input" placeholder="Nhập tin nhắn..." autocomplete="off" />
                    <button id="yuumi-send-button" title="Gửi tin nhắn">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20px" height="20px"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                    </button>
                </div>
            </div>
            <button id="yuumi-open-chat-button-float" class="yuumi-open-chat-button-float">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="28px" height="28px"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
            </button>
        `;
        document.body.appendChild(widgetContainer);
    }

    // --- Phần 2: Inject CSS ---
    function injectCSS() {
        const style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = `
            #yuumi-chat-container {}

            .yuumi-chat-widget {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 360px; /* Tăng chiều rộng một chút */
                border: 1px solid #e0e0e0;
                border-radius: 12px; /* Bo góc nhiều hơn */
                background-color: #ffffff;
                box-shadow: 0 5px 20px rgba(0,0,0,0.15);
                display: flex;
                flex-direction: column;
                font-family: Arial, sans-serif; /* Font phổ biến */
                z-index: 2147483647; /* Max z-index */
                overflow: hidden; /* Để border-radius áp dụng cho cả header/footer */
                transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.3s ease-in-out, height 0.3s ease-in-out;
                transform: translateY(calc(100% - 54px)); /* 54px là chiều cao header */
                opacity: 1; /* Luôn hiện thanh header */
                height: 54px; /* Chiều cao ban đầu chỉ là header */
            }
            .yuumi-chat-widget.yuumi-fully-open {
                 transform: translateY(0);
                 height: 500px; /* Chiều cao khi mở rộng */
            }
            .yuumi-chat-header {
                background-color: #007AFF; /* Màu xanh dương của Apple */
                color: white;
                padding: 15px; /* Tăng padding */
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-weight: bold;
                font-size: 16px;
                height: 54px;
                box-sizing: border-box;
            }
            .yuumi-chat-toggle-icon {
                font-size: 24px;
                font-weight: bold;
                transition: transform 0.3s ease;
            }
            .yuumi-chat-widget.yuumi-fully-open .yuumi-chat-toggle-icon {
                transform: rotate(45deg); /* Dấu X khi mở */
            }
            .yuumi-chat-body {
                flex-grow: 1;
                overflow-y: auto;
                padding: 15px;
                display: flex;
                flex-direction: column;
                background-color: #f4f6f8; /* Màu nền nhẹ nhàng */
            }
            .yuumi-message {
                margin-bottom: 12px;
                padding: 10px 15px;
                border-radius: 20px; /* Bo tròn hơn */
                max-width: 85%; /* Rộng hơn một chút */
                line-height: 1.45;
                font-size: 14.5px;
                word-wrap: break-word;
            }
            .yuumi-message.yuumi-user {
                background-color: #007AFF;
                color: white;
                align-self: flex-end;
                border-bottom-right-radius: 6px;
            }
            .yuumi-message.yuumi-bot {
                background-color: #e5e5ea; /* Màu xám nhạt của Apple Messages */
                color: black;
                align-self: flex-start;
                border-bottom-left-radius: 6px;
            }
            .yuumi-message p { margin: 0; }
            .yuumi-chat-footer {
                padding: 12px 15px;
                display: flex;
                align-items: center;
                border-top: 1px solid #e0e0e0;
                background-color: #ffffff;
            }
            #yuumi-chat-input {
                flex-grow: 1;
                border: 1px solid #d1d1d6;
                border-radius: 20px;
                padding: 10px 15px;
                margin-right: 10px;
                font-size: 14.5px;
                outline: none;
            }
            #yuumi-chat-input:focus {
                border-color: #007AFF;
                box-shadow: 0 0 0 2px rgba(0,122,255,0.2);
            }
            #yuumi-send-button {
                background-color: transparent;
                color: #007AFF;
                border: none;
                padding: 8px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background-color 0.2s ease;
            }
            #yuumi-send-button:hover { background-color: #f0f0f0; }
            #yuumi-send-button svg { display: block; }

            .yuumi-open-chat-button-float {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 60px;
                height: 60px;
                background-color: #007AFF;
                color: white;
                border: none;
                border-radius: 50%;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2147483646; /* Thấp hơn widget một chút */
                transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
                opacity: 1;
                transform: scale(1);
            }
            .yuumi-chat-widget.yuumi-fully-open ~ .yuumi-open-chat-button-float {
                opacity: 0;
                transform: scale(0.8);
                pointer-events: none; /* Không cho click khi ẩn */
            }
        `;
        document.head.appendChild(style);
    }

    // --- Phần 3: Logic Chat JavaScript ---
    function initializeChatLogic() {
        const chatWidgetEl = document.getElementById('yuumi-chat-widget');
        const chatBodyEl = chatWidgetEl.querySelector('.yuumi-chat-body');
        const chatInputEl = document.getElementById('yuumi-chat-input');
        const sendButtonEl = document.getElementById('yuumi-send-button');
        const openChatButtonFloatEl = document.getElementById('yuumi-open-chat-button-float');
        const chatHeaderEl = chatWidgetEl.querySelector('.yuumi-chat-header');
        const toggleIconEl = document.getElementById('yuumi-chat-toggle-icon');

        // Lấy userId từ localStorage hoặc tạo mới
        let userId = localStorage.getItem('yuumiChatUserId');
        if (!userId) {
            userId = 'yuumi_user_' + Math.random().toString(36).substr(2, 9) + Date.now();
            localStorage.setItem('yuumiChatUserId', userId);
        }
        console.log("Yuumi Chatbot Initialized with UserID:", userId); // Để debug

        let isChatWidgetFullyOpen = false; // Trạng thái widget có đang mở rộng hoàn toàn hay không

        function toggleFullChatWindow() {
            isChatWidgetFullyOpen = !isChatWidgetFullyOpen;
            if (isChatWidgetFullyOpen) {
                chatWidgetEl.classList.add('yuumi-fully-open');
                chatBodyEl.style.display = 'flex';
                chatWidgetEl.querySelector('.yuumi-chat-footer').style.display = 'flex';
                toggleIconEl.innerHTML = '✕'; // Dấu X
                openChatButtonFloatEl.style.opacity = '0';
                openChatButtonFloatEl.style.visibility = 'hidden';
                chatInputEl.focus();
            } else {
                chatWidgetEl.classList.remove('yuumi-fully-open');
                setTimeout(() => {
                    if (!isChatWidgetFullyOpen) {
                        chatBodyEl.style.display = 'none';
                        chatWidgetEl.querySelector('.yuumi-chat-footer').style.display = 'none';
                    }
                }, 300);
                toggleIconEl.textContent = '+';
                openChatButtonFloatEl.style.opacity = '1';
                openChatButtonFloatEl.style.visibility = 'visible';
            }
        }

        openChatButtonFloatEl.addEventListener('click', toggleFullChatWindow);
        chatHeaderEl.addEventListener('click', toggleFullChatWindow);

        function addMessageToChat(text, senderClass) {
            const messageDiv = document.createElement('div');
            messageDiv.classList.add('yuumi-message', senderClass);
            const p = document.createElement('p');
            p.innerHTML = text.replace(/\n/g, '<br>');
            messageDiv.appendChild(p);
            chatBodyEl.appendChild(messageDiv);
            // Cuộn xuống tin nhắn mới nhất một cách mượt mà hơn
            chatBodyEl.scrollTo({
                top: chatBodyEl.scrollHeight,
                behavior: 'smooth'
            });
        }

        async function sendMessage(messageTextForApi) {
            const messageToSend = typeof messageTextForApi === 'string' ? messageTextForApi : chatInputEl.value.trim();

            // Chỉ thêm vào UI và xóa input nếu là tin nhắn từ người dùng thực sự gõ
            if (typeof messageTextForApi !== 'string') {
                if (!messageToSend) return; // Không gửi nếu input rỗng
                addMessageToChat(messageToSend, 'yuumi-user');
                chatInputEl.value = ''; // Xóa input sau khi người dùng gửi
            }

            chatInputEl.disabled = true;
            sendButtonEl.disabled = true;
            sendButtonEl.style.cursor = 'default';

            // Tùy chọn: Thêm "Bot is typing..." indicator
            // const typingIndicatorId = 'typing-' + Date.now();
            // addMessageToChat('Yuumi đang soạn tin...', 'yuumi-bot yuumi-typing-indicator');
            // const typingIndicator = chatBodyEl.querySelector('.yuumi-typing-indicator');


            try {
                const response = await fetch(CHAT_API_URL, { // Đảm bảo CHAT_API_URL đã được định nghĩa ở đầu file
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: userId, message: messageToSend }),
                });

                // if (typingIndicator) typingIndicator.remove(); // Xóa typing indicator

                if (!response.ok) {
                    const errorText = await response.text().catch(() => 'Không thể đọc phản hồi lỗi từ server.');
                    console.error(`API Error ${response.status}: ${errorText}`);
                    addMessageToChat(`Xin lỗi, có lỗi từ server (mã ${response.status}). Vui lòng thử lại sau.`, 'yuumi-bot');
                    return; // Dừng lại nếu API lỗi
                }

                const data = await response.json();
                if (data.bot_response) {
                    addMessageToChat(data.bot_response, 'yuumi-bot');
                } else {
                    console.warn("Received empty bot_response from API:", data);
                    addMessageToChat("Có vẻ Yuumi không có gì để nói thêm lúc này.", "yuumi-bot");
                }

            } catch (error) {
                // if (typingIndicator) typingIndicator.remove(); // Đảm bảo xóa nếu có lỗi fetch
                console.error('Yuumi Chatbot Fetch Error:', error);
                addMessageToChat('Xin lỗi, đã có lỗi xảy ra khi kết nối tới chatbot. Vui lòng kiểm tra lại kết nối mạng và thử lại sau.', 'yuumi-bot');
            } finally {
                chatInputEl.disabled = false;
                sendButtonEl.disabled = false;
                sendButtonEl.style.cursor = 'pointer';
                // Chỉ focus nếu widget đang mở và đó là tin nhắn người dùng (không phải tin nhắn khởi tạo)
                if (isChatWidgetFullyOpen && typeof messageTextForApi !== 'string') {
                    chatInputEl.focus();
                }
            }
        }

        sendButtonEl.addEventListener('click', () => sendMessage());
        chatInputEl.addEventListener('keypress', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // --- TỰ ĐỘNG GỬI REQUEST KHỞI TẠO ĐỂ NHẬN LỜI CHÀO TỪ BACKEND ---
        function sendInitialGreetingRequest() {
            console.log("Yuumi Chatbot: Sending initial greeting request for user:", userId);
            // Gửi một message đặc biệt mà backend sẽ nhận diện để trả về lời chào
            sendMessage("__INITIAL_GREETING_FROM_CLIENT__");
        }

        // Gọi hàm gửi request khởi tạo sau một khoảng trễ nhỏ để DOM kịp render
        // và có thể widget đã bắt đầu hiển thị (nếu không ẩn hoàn toàn ban đầu)
        // Điều này cũng giúp tránh việc gọi API quá sớm nếu có các script khác đang chạy.
        setTimeout(sendInitialGreetingRequest, 500); // Có thể điều chỉnh thời gian trễ này

    } // Kết thúc initializeChatLogic

// --- Phần 4: Chạy tất cả khi DOM đã sẵn sàng --- (Giữ nguyên)
function main() {
createChatWidgetHTML();
injectCSS();
initializeChatLogic();
}
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', main);
} else {
main();
}

})(); // Kết thúc IIFE