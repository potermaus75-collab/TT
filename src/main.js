import { Dice } from './core/dice.js';
import { Logger } from './core/logger.js';
import { Player } from './core/player.js';
import { CombatManager } from './core/combat.js';
import { getRandomMonster, getItem } from './data/index.js';

class Game {
    constructor() {
        this.logger = new Logger();
        this.dice = new Dice();
        this.player = new Player(this.logger);
        this.combat = new CombatManager(this.player, this.dice, this.logger);
        
        this.bindEvents();
        this.ui = {
            closeModals: () => {
                document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
            }
        };

        // 전역 접근 가능하게 (HTML onclick 등에서 사용)
        window.game = this;
    }

    bindEvents() {
        // 하단 메뉴 버튼
        document.querySelectorAll('#action-bar .btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleMenu(e.target.dataset.action));
        });
    }

    handleMenu(action) {
        if (this.combat.isBattle) return; // 전투 중엔 메뉴 잠금

        switch(action) {
            case 'explore': this.explore(); break;
            case 'inventory': this.openInventory(); break;
            case 'status': this.openStatus(); break;
            case 'rest': this.rest(); break;
        }
    }

    // 탐험
    explore() {
        this.player.consumeStamina(3);
        if (this.player.hp <= 0) {
            this.logger.add("💀 기력이 다해 쓰러졌습니다...", "battle");
            return;
        }

        const roll = Math.random();
        if (roll < 0.4) {
            // 몬스터 조우
            const mob = getRandomMonster(this.player.lv, this.player.lv+2);
            this.combat.startBattle(mob, (win, enemy) => {
                if (win) {
                    this.logger.add(`🎉 ${enemy.name} 처치! 경험치 +${enemy.exp}`, "loot");
                    this.player.gainExp(enemy.exp);
                    // 아이템 드랍
                    if(enemy.drop) {
                        this.player.addItem(enemy.drop);
                        const dropItem = getItem(enemy.drop);
                        if(dropItem) this.logger.add(`📦 [${dropItem.name}] 획득!`, "loot");
                    }
                } else {
                    this.logger.add("💀 사망했습니다...", "battle");
                }
            });
        } else {
            this.logger.add("🍃 평화로운 숲길을 걷습니다.");
        }
    }

    // 인벤토리 열기
    openInventory() {
        const list = document.getElementById('inventory-list');
        list.innerHTML = '';

        if(this.player.inventory.length === 0) {
            list.innerHTML = '<p>가방이 비어있습니다.</p>';
        }

        this.player.inventory.forEach(slot => {
            const item = getItem(slot.id);
            if(!item) return;

            const div = document.createElement('div');
            div.className = 'inv-item';
            div.innerHTML = `
                <div>${item.name}</div>
                <div style="color:#aaa">x${slot.count}</div>
            `;
            div.onclick = () => {
                const used = this.player.useItem(slot.id);
                if(used) {
                    this.openInventory(); // 갱신
                    // this.ui.closeModals(); // 사용 후 닫을거면 주석 해제
                }
            };
            list.appendChild(div);
        });

        document.getElementById('modal-inventory').classList.remove('hidden');
    }

    // 상태창 열기
    openStatus() {
        const p = this.player;
        document.getElementById('stat-fight-count').innerText = p.fightCount;
        document.getElementById('stat-exp').innerText = `${p.exp} / ${p.nextExp}`;
        
        // 장비 표시
        const equipList = document.getElementById('stat-equip-list');
        const w = p.equipment.weapon ? p.equipment.weapon.name : "(없음)";
        const a = p.equipment.armor ? p.equipment.armor.name : "(없음)";
        equipList.innerHTML = `<p>⚔️ 무기: ${w}</p><p>🛡️ 방어구: ${a}</p>`;

        // 버프 표시
        const buffList = document.getElementById('stat-buff-list');
        if(p.buffs.length === 0) buffList.innerHTML = '<p class="empty-msg">없음</p>';
        else {
            buffList.innerHTML = p.buffs.map(b => `<p>${b.desc} (${b.turn}턴 남음)</p>`).join('');
        }

        document.getElementById('modal-status').classList.remove('hidden');
    }

    rest() {
        this.logger.add("⛺ 잠시 휴식을 취합니다. (체력 회복)", "event");
        this.player.heal(30, 'hp');
        this.player.consumeStamina(10); // 휴식은 배고픔 많이 깎임
    }
}

window.onload = () => new Game();
