export class Logger {
    constructor() {
        this.container = document.getElementById('log-container');
        this.maxLogs = 100; // 메모리 관리를 위해 최대 100줄만 유지
    }

    /**
     * 로그 추가 (타이핑 효과 없음 - 즉시 출력용)
     */
    add(message, type = 'system') {
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.innerHTML = message; // HTML 태그 허용 (색상 등)
        
        this.container.appendChild(entry);
        this.scrollToBottom();
        this.cleanup();
    }

    /**
     * 타이핑 효과와 함께 로그 출력 (RPG 감성)
     * @param {string} message 
     * @param {string} type 
     * @param {number} speed (ms)
     */
    typeWriter(message, type = 'system', speed = 30) {
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        this.container.appendChild(entry);
        
        let i = 0;
        const interval = setInterval(() => {
            entry.innerHTML += message.charAt(i);
            i++;
            this.scrollToBottom();
            if (i >= message.length) clearInterval(interval);
        }, speed);
        
        this.cleanup();
    }

    // 스크롤을 항상 최하단으로
    scrollToBottom() {
        this.container.scrollTop = this.container.scrollHeight;
    }

    // 오래된 로그 삭제
    cleanup() {
        while (this.container.children.length > this.maxLogs) {
            this.container.removeChild(this.container.firstChild);
        }
    }

    // 화면 흔들기 (피격 효과)
    shakeScreen() {
        document.body.classList.add('shake-screen');
        setTimeout(() => {
            document.body.classList.remove('shake-screen');
        }, 500);
    }
}
