import { Dice } from './core/dice.js';
import { Logger } from './core/logger.js';
import { Player } from './core/player.js';
import { CombatManager } from './core/combat.js';
import { getRandomMonster, getItem } from './data/index.js';

class Game {
    constructor() {
        try {
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
            window.game = this; // 전역 접근 허용
            this.logger.add("게임이 정상적으로 로드되었습니다.");
        } catch (e) {
            console.error(e);
            alert("게임 로딩 중 오류 발생! 콘솔을 확인하세요.");
        }
    }

    bindEvents() {
        document.querySelectorAll('#action-bar .btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleMenu(e.target.dataset.action));
        });
    }

    handleMenu(action) {
        if (this.combat.isBattle) return; // 전투 중 메뉴 잠금
        switch(action) {
            case 'explore': this.explore(); break;
            case 'inventory': this.openInventory(); break;
            case 'status': this.openStatus(); break;
            case 'rest': this.rest(); break;
        }
    }

    explore() {
        if (this.player.hp <= 0) {
            this.logger.add("💀 체력이 없어 움직일 수 없습니다. 휴식하세요.", "battle");
            return;
        }
        this.player.consumeStamina(3);

        const roll = Math.random();
        if (roll < 0.4) {
            // 몬스터 조우
            const mob = getRandomMonster(this.player.lv, this.player.lv+2);
            this.combat.startBattle(mob, (win, enemy) => {
                if (win) {
                    if (enemy) { // 처치 시
                        this.logger.add(`🎉 <b>${enemy.name}</b> 처치!`, "loot");
                        this.player.gainExp(enemy.exp);
                        
                        if(enemy.drop) {
                            this.player.addItem(enemy.drop);
                            const item = getItem(enemy.drop);
                            if(item) this.logger.add(`📦 [${item.name}] 획득!`, "loot");
                        }
                    } else { // 도망 시
                        this.logger.add("💨 무사히 도망쳤습니다.");
                    }
                } else {
                    this.logger.add("💀 사망했습니다...", "battle");
                }
            });
        } else {
            const msgs = ["숲길을 걷습니다...", "바람이 붑니다.", "조용합니다."];
            this.logger.add(msgs[Math.floor(Math.random()*msgs.length)]);
        }
    }

    openInventory() {
        const list = document.getElementById('inventory-list');
        list.innerHTML = '';
        const p = this.player;

        if(p.inventory.length === 0) list.innerHTML = '<p>가방이 비어있습니다.</p>';

        p.inventory.forEach(slot => {
            const item = getItem(slot.id);
            if(!item) return;

            // 장착 여부 확인 (E 표시용)
            const isEquipped = (p.equipment.weapon?.id === item.id) || 
                               (p.equipment.armor?.id === item.id) || 
                               (p.equipment.acc?.id === item.id);

            const div = document.createElement('div');
            div.className = `inv-item ${isEquipped ? 'equipped' : ''}`;
            
            // E 배지 HTML
            let badge = isEquipped ? '<span class="equip-badge">E</span>' : '';
            
            div.innerHTML = `
                ${badge}
                <div class="item-name">${item.name}</div>
                <div class="item-count">x${slot.count}</div>
            `;
            
            div.onclick = () => {
                const updated = p.useItem(slot.id);
                if(updated) this.openInventory(); // 목록 갱신
            };
            list.appendChild(div);
        });

        document.getElementById('modal-inventory').classList.remove('hidden');
    }

    openStatus() {
        const p = this.player;
        const s = p.getCombatStats(); // 종합 스탯

        // 상세 정보 HTML 구성
        const detailHTML = `
            <div class="stat-row"><span>⚔️ 공격력</span> <span>${s.atk}</span></div>
            <div class="stat-row"><span>🛡️ 방어력</span> <span>${s.def}</span></div>
            <div class="stat-row"><span>💪 근력(STR)</span> <span>${s.str}</span></div>
            <div class="stat-row"><span>🏃 민첩(DEX)</span> <span>${s.dex}</span></div>
            <div class="stat-row"><span>🧠 지능(INT)</span> <span>${s.int}</span></div>
            <div class="stat-row"><span>🍀 행운(LUK)</span> <span>${s.luk}</span></div>
            <hr>
            <div class="stat-row"><span>⚔️ 전투 횟수</span> <span>${p.fightCount}회</span></div>
            <div class="stat-row"><span>📈 경험치</span> <span>${p.exp} / ${p.nextExp}</span></div>
            <hr>
            <div class="stat-equip">
                <p>🗡️ 무기: ${p.equipment.weapon ? p.equipment.weapon.name : '(없음)'}</p>
                <p>🛡️ 방어: ${p.equipment.armor ? p.equipment.armor.name : '(없음)'}</p>
                <p>💍 장신: ${p.equipment.acc ? p.equipment.acc.name : '(없음)'}</p>
            </div>
        `;
        
        document.getElementById('stat-detail-area').innerHTML = detailHTML;
        document.getElementById('modal-status').classList.remove('hidden');
    }

    rest() {
        this.logger.add("⛺ 휴식을 취해 체력을 회복합니다.", "event");
        this.player.heal(30, 'hp');
        this.player.heal(10, 'mp');
        this.player.consumeStamina(5);
    }
}

// 안전한 시작
window.onload = () => new Game();
