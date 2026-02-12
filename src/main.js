import { Dice } from './core/dice.js';
import { Logger } from './core/logger.js';
import { Player } from './core/player.js';
import { CombatManager } from './core/combat.js';
import { getRandomMonster } from './data/index.js';

// 게임 상태 상수
const GameState = {
    EXPLORE: 'explore',
    BATTLE: 'battle',
    EVENT: 'event',
    DEAD: 'dead'
};

class Game {
    constructor() {
        // 1. 코어 모듈 초기화
        this.logger = new Logger();
        this.dice = new Dice();
        this.player = new Player(this.logger);
        this.combat = new CombatManager(this.player, this.dice, this.logger);

        // 2. 초기 상태 설정
        this.state = GameState.EXPLORE;
        
        // 3. 버튼 이벤트 연결
        this.bindEvents();
        
        // 4. 게임 시작 메시지
        this.logger.typeWriter("어둠의 숲에 오신 것을 환영합니다... 당신의 여정이 시작됩니다.", "system");
        this.updateButtons();
    }

    /**
     * 버튼 클릭 이벤트 바인딩
     */
    bindEvents() {
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleInput(action);
            });
        });
    }

    /**
     * 유저 입력 처리 (상태 머신)
     */
    handleInput(action) {
        if (this.state === GameState.DEAD) return;

        // --- 탐험 상태일 때 ---
        if (this.state === GameState.EXPLORE) {
            switch(action) {
                case 'explore': this.explore(); break;
                case 'rest': this.rest(); break;
                case 'inventory': this.logger.add("아직 가방을 열 수 없습니다. (구현 예정)", "system"); break;
                case 'status': this.logger.add(`현재 상태: 배고픔(${this.player.hunger}), 피로도(${this.player.fatigue})`, "system"); break;
            }
        } 
        // --- 전투 상태일 때 ---
        else if (this.state === GameState.BATTLE) {
            switch(action) {
                case 'explore': // 전투 중엔 이 버튼이 '공격' 역할
                    this.combat.playerAttack(); 
                    break;
                case 'rest': // 전투 중엔 이 버튼이 '도망' 역할
                    if (this.combat.tryRun()) {
                        this.state = GameState.EXPLORE;
                        this.updateButtons();
                    }
                    break;
                case 'inventory':
                    this.logger.add("전투 중엔 가방을 뒤질 여유가 없습니다!", "battle");
                    break;
            }
        }
    }

    /**
     * 탐험 로직
     */
    explore() {
        // 1. 생존 수치 소모
        this.player.consumeStamina(5);
        if (this.player.hp <= 0) {
            this.gameOver();
            return;
        }

        // 2. 랜덤 인카운터 (주사위 굴림)
        const roll = this.dice.roll();
        
        // 1~8: 아무 일도 없음 (걷기)
        if (roll <= 8) {
            const texts = ["낙엽 밟는 소리가 들립니다.", "음산한 바람이 붑니다.", "멀리서 짐승의 울음소리가 들립니다."];
            this.logger.add(texts[Math.floor(Math.random() * texts.length)]);
        } 
        // 9~16: 몬스터 조우 (전투)
        else if (roll <= 16) {
            this.startEncounter();
        } 
        // 17~20: 긍정적 이벤트
        else {
            this.logger.add("✨ 운 좋게 쉴만한 장소를 발견했습니다. (체력 소량 회복)", "event");
            this.player.heal(10, 'hp');
        }
    }

    /**
     * 전투 시작
     */
    startEncounter() {
        this.state = GameState.BATTLE;
        this.updateButtons();

        // 플레이어 레벨에 맞는 몬스터 소환
        const monster = getRandomMonster(this.player.lv, this.player.lv + 2);
        
        // CombatManager에게 위임
        this.combat.startBattle(monster, (isWin) => {
            if (isWin) {
                this.state = GameState.EXPLORE;
                this.updateButtons();
            } else {
                this.gameOver();
            }
        });
    }

    /**
     * 휴식 로직
     */
    rest() {
        this.logger.add("잠시 휴식을 취합니다... (체력/마나 회복)", "event");
        this.player.heal(20, 'hp');
        this.player.heal(10, 'mp');
        // 휴식도 배고픔은 소모됨
        this.player.consumeStamina(2);
    }

    /**
     * 게임 오버
     */
    gameOver() {
        this.state = GameState.DEAD;
        this.logger.add("💀 <b>YOU DIED</b>. 새로고침하여 다시 시작하세요.", "enemy");
        this.updateButtons();
    }

    /**
     * 상태에 따른 버튼 UI 변경
     */
    updateButtons() {
        const btnExplore = document.querySelector('[data-action="explore"]');
        const btnRest = document.querySelector('[data-action="rest"]');
        const btnInv = document.querySelector('[data-action="inventory"]');
        const btnStat = document.querySelector('[data-action="status"]');

        if (this.state === GameState.BATTLE) {
            btnExplore.innerText = "⚔️ 공격";
            btnRest.innerText = "🏃 도망";
            btnInv.innerText = "💊 아이템";
            btnStat.disabled = true; // 전투 중 상태창 잠금
            
            // 스타일 변경 (긴박함)
            btnExplore.style.background = "#8b0000";
        } else {
            btnExplore.innerText = "🔍 탐험하기";
            btnRest.innerText = "⛺ 휴식";
            btnInv.innerText = "🎒 가방";
            btnStat.disabled = false;
            
            // 스타일 복구
            btnExplore.style.background = "#333";
        }
    }
}

// === 게임 진입점 ===
window.onload = () => {
    const game = new Game();
    window.game = game; // 디버깅용 전역 변수 노출
};
