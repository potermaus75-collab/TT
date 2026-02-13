import { Dice } from './core/dice.js';
import { Logger } from './core/logger.js';
import { Player } from './core/player.js';
import { CombatManager } from './core/combat.js';
import { getRandomMonster, getItem, MONSTER_DB, ITEM_DB } from './data/index.js';

class Game {
    constructor() {
        this.logger = new Logger();
        this.dice = new Dice();
        this.player = new Player(this.logger);
        this.combat = new CombatManager(this.player, this.dice, this.logger);
        
        window.game = this; 
        this.ui = {
            closeModals: () => {
                document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
            },
            add: (msg, type) => this.logger.add(msg, type)
        };

        this.isChoiceActive = false;

        this.bindEvents();
    }

    bindEvents() {
        // 타이틀 화면 시작 버튼
        document.getElementById('btn-start').onclick = () => {
            const nameInput = document.getElementById('input-name');
            const name = nameInput.value.trim();
            if (name.length < 1) {
                alert("이름을 입력해주세요!");
                return;
            }
            this.startGame(name);
        };

        // 하단 메뉴 버튼
        document.querySelectorAll('#action-bar .btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleMenu(e.target.dataset.action));
        });
    }

    startGame(name) {
        // 타이틀 숨기고 게임 화면 표시
        document.getElementById('title-screen').classList.add('hidden');
        document.getElementById('game-container').classList.remove('hidden');

        // 로드 시도
        if (this.player.loadData(name)) {
            this.logger.add(`👋 돌아오셨군요, ${name}님!`, "system");
        } else {
            this.player.reset(name);
            this.logger.add(`⚔️ 새로운 모험이 시작됩니다. 환영합니다, ${name}!`, "system");
            this.player.saveData(true); // 첫 저장
        }
        this.player.updateUI();
    }

    goToTitle() {
        document.getElementById('game-container').classList.add('hidden');
        document.getElementById('title-screen').classList.remove('hidden');
        document.getElementById('input-name').value = "";
        
        // 상태창 등 초기화
        this.ui.closeModals();
        this.logger.container.innerHTML = '<div class="log-entry system">시스템 로딩 완료...</div>';
    }

    handleMenu(action) {
        if (this.combat.isBattle) return;
        if (this.isChoiceActive) return;
        if (this.player.hp <= 0) return; // 죽으면 조작 불가

        switch(action) {
            case 'explore': this.explore(); break;
            case 'inventory': this.openInventory(); break;
            case 'status': this.openStatus(); break;
            case 'encyclopedia': this.openEncyclopedia(); break;
        }
    }

    async explore() {
        // 1. 상태 체크 (배고픔 데미지로 사망 시 즉시 중단)
        const isDead = this.player.consumeStamina(3);
        if (isDead) {
            this.player.die();
            return;
        }

        if (this.player.fatigue >= 100) {
            this.logger.add("💤 너무 피곤해서 움직일 수 없습니다. 여관을 찾으세요!", "event");
            return;
        }

        // 2. 랜덤 이벤트
        const roll = Math.random();

        if (roll < 0.35) {
            // [전투] 35%
            const mob = getRandomMonster(this.player.lv, this.player.lv + 2);
            this.combat.startBattle(mob, (win, enemy) => this.resolveCombatResult(win, enemy));

        } else if (roll < 0.50) {
            // [보물상자] 15%
            const foundGold = Math.floor(Math.random() * 50) + 10;
            this.logger.add(`🎁 낡은 보물상자를 발견했습니다! ${foundGold}G 획득!`, "loot");
            this.player.gold += foundGold;
            this.player.updateUI();

        } else if (roll < 0.60) {
            // [떠돌이 상인] 10%
            this.logger.add("👋 길가에서 떠돌이 상인을 만났습니다.", "event");
            this.openShop();

        } else if (roll < 0.70) {
            // [여관 발견] 10%
            this.foundInn();

        } else if (roll < 0.92) {
            // [선택지 이벤트] 22%
            await this.runChoiceEvent();

        } else {
            // [일반] 8%
            const msgs = ["숲길을 걷습니다...", "바람이 상쾌합니다.", "어디선가 새소리가 들립니다."];
            this.logger.add(msgs[Math.floor(Math.random()*msgs.length)]);
        }
    }

    resolveCombatResult(win, enemy) {
        if (win) {
            if (enemy) {
                const goldReward = enemy.lv * 10 + Math.floor(Math.random() * 10);
                this.logger.add(`🎉 ${enemy.name} 처치!`, "loot");
                this.player.gainExp(enemy.exp);
                this.player.gold += goldReward;
                this.logger.add(`💰 ${goldReward} Gold 획득!`, "loot");
                
                if(enemy.drop) {
                    this.player.addItem(enemy.drop);
                    const item = getItem(enemy.drop);
                    if(item) this.logger.add(`📦 [${item.name}] 획득!`, "loot");
                }
            } else {
                this.logger.add("💨 무사히 도망쳤습니다.");
            }
        } else {
            this.player.die();
            return;
        }
        this.player.saveData(true); // 전투 종료 후 자동 저장
    }

    pickEventChoice(title, options) {
        return new Promise((resolve) => {
            const modal = document.getElementById('modal-choice');
            const titleEl = document.getElementById('choice-title');
            const descEl = document.getElementById('choice-desc');
            const list = document.getElementById('choice-list');

            this.isChoiceActive = true;
            titleEl.textContent = title;
            descEl.textContent = '선택지를 터치해 진행하세요.';
            list.innerHTML = '';

            const finish = (idx) => {
                modal.classList.add('hidden');
                this.isChoiceActive = false;
                resolve(idx);
            };

            options.forEach((opt, idx) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'choice-btn';
                btn.textContent = `${idx + 1}) ${opt}`;
                btn.onclick = () => finish(idx);
                list.appendChild(btn);
            });

            modal.classList.remove('hidden');
        });
    }

    async runChoiceEvent() {
        const stats = this.player.getCombatStats();

        const events = [
            async () => {
                this.logger.add("🌉 무너진 다리 앞에 섰습니다.", "event");
                const idx = await this.pickEventChoice("무너진 다리", ["힘으로 잔해를 밀어 길을 만든다", "민첩하게 아래 협곡을 점프한다"]);
                if (idx === 0) {
                    this.logger.add("선택: 힘으로 길을 만든다.", "system");
                    if (stats.str >= 14) {
                        const gold = 20 + Math.floor(Math.random() * 21);
                        this.player.gold += gold;
                        this.logger.add(`✅ STR 판정 성공! 다리 아래 상자에서 ${gold}G를 발견했습니다.`, "loot");
                    } else {
                        this.player.hp = Math.max(1, this.player.hp - 12);
                        this.player.fatigue = Math.min(100, this.player.fatigue + 10);
                        this.logger.add("❌ STR 판정 실패. 돌무더기에 다쳐 HP -12, 피로 +10.", "battle");
                    }
                    this.player.updateUI();
                    return;
                }

                this.logger.add("선택: 협곡 점프.", "system");
                if (stats.dex >= 14) {
                    this.player.gainExp(20);
                    this.logger.add("✅ DEX 판정 성공! 멋지게 착지하며 EXP +20.", "event");
                } else {
                    this.player.hp = Math.max(1, this.player.hp - 15);
                    this.logger.add("❌ DEX 판정 실패. 발을 헛디뎌 HP -15.", "battle");
                    this.player.updateUI();
                }
            },
            async () => {
                this.logger.add("🧪 수상한 연금술사가 다가왔습니다.", "event");
                const idx = await this.pickEventChoice("수상한 연금술사", ["말빨로 가격 흥정한다", "실험약을 그냥 마셔본다"]);
                if (idx === 0) {
                    this.logger.add("선택: 가격 흥정.", "system");
                    if (stats.cha >= 14) {
                        this.player.addItem(9, 1);
                        this.logger.add("✅ CHA 판정 성공! 하급 포션 1개를 공짜로 얻었습니다.", "loot");
                    } else {
                        this.player.gold = Math.max(0, this.player.gold - 15);
                        this.logger.add("❌ CHA 판정 실패. 바가지로 15G를 잃었습니다.", "battle");
                        this.player.updateUI();
                    }
                    return;
                }

                this.logger.add("선택: 실험약 시음.", "system");
                if (Math.random() < 0.5) {
                    this.player.heal(25, 'hp');
                    this.logger.add("✨ 약이 잘 맞았습니다! HP +25.", "heal");
                } else {
                    this.player.hp = Math.max(1, this.player.hp - 10);
                    this.player.fatigue = Math.min(100, this.player.fatigue + 15);
                    this.logger.add("☠️ 부작용 발생! HP -10, 피로 +15.", "battle");
                    this.player.updateUI();
                }
            },
            async () => {
                this.logger.add("📜 고대 룬석이 빛을 냅니다.", "event");
                const idx = await this.pickEventChoice("고대 룬석", ["룬을 해독한다", "힘으로 부숴 핵만 챙긴다"]);
                if (idx === 0) {
                    this.logger.add("선택: 룬 해독.", "system");
                    if (stats.int >= 14) {
                        this.player.gainExp(35);
                        this.player.addItem(14, 1);
                        this.logger.add("✅ INT 판정 성공! 고대 지식을 얻어 EXP +35, 하급 마나 포션 1개 획득.", "loot");
                    } else {
                        this.player.mp = Math.max(0, this.player.mp - 15);
                        this.logger.add("❌ INT 판정 실패. 정신 충격으로 MP -15.", "battle");
                        this.player.updateUI();
                    }
                    return;
                }

                this.logger.add("선택: 룬석 파괴.", "system");
                const mob = getRandomMonster(Math.max(1, this.player.lv - 1), this.player.lv + 1);
                this.logger.add(`💥 봉인이 깨지며 ${mob.name}가 나타났습니다!`, "battle");
                this.combat.startBattle(mob, (win, enemy) => this.resolveCombatResult(win, enemy));
            },
            async () => {
                this.logger.add("🎲 노상 도박꾼이 승부를 제안합니다.", "event");
                const idx = await this.pickEventChoice("노상 도박", ["차분히 속임수를 간파한다(CHA)", "손놀림으로 주사위를 바꿔치기한다(DEX)"]);
                if (idx === 0) {
                    this.logger.add("선택: 속임수 간파.", "system");
                    if (stats.cha >= 13) {
                        const gold = 30;
                        this.player.gold += gold;
                        this.logger.add(`✅ CHA 판정 성공! ${gold}G를 따냈습니다.`, "loot");
                    } else {
                        this.player.gold = Math.max(0, this.player.gold - 20);
                        this.logger.add("❌ CHA 판정 실패. 20G를 잃었습니다.", "battle");
                    }
                    this.player.updateUI();
                    return;
                }

                this.logger.add("선택: 바꿔치기.", "system");
                if (stats.dex >= 15) {
                    this.player.gold += 45;
                    this.logger.add("✅ DEX 판정 성공! 화려한 손기술로 45G 획득.", "loot");
                    this.player.updateUI();
                } else {
                    this.logger.add("❌ DEX 판정 실패. 들켜서 전투가 발생합니다!", "battle");
                    const mob = getRandomMonster(this.player.lv, this.player.lv + 1);
                    this.combat.startBattle(mob, (win, enemy) => this.resolveCombatResult(win, enemy));
                }
            },
            async () => {
                this.logger.add("🍄 독특한 버섯 군락을 발견했습니다.", "event");
                const idx = await this.pickEventChoice("버섯 군락", ["지식을 믿고 안전한 버섯만 채집(INT)", "그냥 많이 뜯어 먹는다"]);
                if (idx === 0) {
                    this.logger.add("선택: 안전 채집.", "system");
                    if (stats.int >= 13) {
                        this.player.addItem(5, 1);
                        this.player.hunger = Math.min(100, this.player.hunger + 15);
                        this.logger.add("✅ INT 판정 성공! 생선구이 대용 식재료를 확보해 포만감 +15, 아이템 1개 획득.", "loot");
                    } else {
                        this.player.hp = Math.max(1, this.player.hp - 8);
                        this.logger.add("❌ INT 판정 실패. 독버섯을 건드려 HP -8.", "battle");
                    }
                    this.player.updateUI();
                    return;
                }

                this.logger.add("선택: 무지성 시식.", "system");
                if (Math.random() < 0.4) {
                    this.player.hunger = Math.min(100, this.player.hunger + 25);
                    this.logger.add("😋 운 좋게 식용 버섯! 포만감 +25.", "heal");
                } else {
                    this.player.hp = Math.max(1, this.player.hp - 14);
                    this.player.fatigue = Math.min(100, this.player.fatigue + 10);
                    this.logger.add("🤢 식중독 증상! HP -14, 피로 +10.", "battle");
                }
                this.player.updateUI();
            },
            async () => {
                this.logger.add("⛏️ 폐광 입구가 열려 있습니다.", "event");
                const idx = await this.pickEventChoice("폐광 탐사", ["힘으로 암석을 치워 깊이 들어간다(STR)", "소리만 듣고 위험하면 후퇴한다"]);
                if (idx === 0) {
                    this.logger.add("선택: 강행 채굴.", "system");
                    if (stats.str >= 15) {
                        this.player.gold += 55;
                        this.player.gainExp(15);
                        this.logger.add("✅ STR 판정 성공! 광맥을 찾아 55G + EXP 15.", "loot");
                    } else {
                        this.logger.add("❌ STR 판정 실패. 낙석 소리에 괴물이 몰려옵니다!", "battle");
                        const mob = getRandomMonster(this.player.lv, this.player.lv + 2);
                        this.combat.startBattle(mob, (win, enemy) => this.resolveCombatResult(win, enemy));
                        return;
                    }
                    this.player.updateUI();
                    return;
                }

                this.logger.add("선택: 안전 후퇴.", "system");
                this.player.fatigue = Math.max(0, this.player.fatigue - 8);
                this.logger.add("🧭 무리하지 않고 물러났습니다. 피로 -8.", "heal");
                this.player.updateUI();
            },
            async () => {
                this.logger.add("🗡️ 숲 도적이 길을 막습니다.", "event");
                const idx = await this.pickEventChoice("숲 도적과 조우", ["빠르게 선제 기습한다(DEX)", "말로 설득해 통과한다(CHA)"]);
                if (idx === 0) {
                    this.logger.add("선택: 선제 기습.", "system");
                    if (stats.dex >= 14) {
                        this.player.gold += 35;
                        this.player.gainExp(10);
                        this.logger.add("✅ DEX 판정 성공! 도적을 흩어지게 하고 35G + EXP 10 획득.", "loot");
                        this.player.updateUI();
                    } else {
                        this.logger.add("❌ DEX 판정 실패. 역습을 받아 전투 돌입!", "battle");
                        const mob = getRandomMonster(this.player.lv, this.player.lv + 1);
                        this.combat.startBattle(mob, (win, enemy) => this.resolveCombatResult(win, enemy));
                    }
                    return;
                }

                this.logger.add("선택: 설득 시도.", "system");
                if (stats.cha >= 15) {
                    this.player.gainExp(25);
                    this.logger.add("✅ CHA 판정 성공! 분쟁 없이 지나가며 EXP +25.", "event");
                } else {
                    this.player.gold = Math.max(0, this.player.gold - 25);
                    this.logger.add("❌ CHA 판정 실패. 통행료 25G를 빼앗겼습니다.", "battle");
                }
                this.player.updateUI();
            },
            async () => {
                this.logger.add("🩹 부상당한 정찰병이 구조를 요청합니다.", "event");
                const idx = await this.pickEventChoice("정찰병 구조", ["응급 처치를 해준다(INT)", "용기를 북돋우며 인솔한다(CHA)"]);
                if (idx === 0) {
                    this.logger.add("선택: 응급 처치.", "system");
                    if (stats.int >= 13) {
                        this.player.gainExp(30);
                        this.player.addItem(1, 2);
                        this.logger.add("✅ INT 판정 성공! 정찰병이 약초 2개와 EXP 30으로 보답했습니다.", "loot");
                    } else {
                        this.player.fatigue = Math.min(100, this.player.fatigue + 12);
                        this.logger.add("❌ INT 판정 실패. 처치가 꼬여 피로 +12.", "battle");
                        this.player.updateUI();
                    }
                    return;
                }

                this.logger.add("선택: 사기 진작 인솔.", "system");
                if (stats.cha >= 13) {
                    this.player.gold += 25;
                    this.player.gainExp(15);
                    this.logger.add("✅ CHA 판정 성공! 안전 귀환 보상으로 25G + EXP 15.", "loot");
                } else {
                    this.player.hp = Math.max(1, this.player.hp - 10);
                    this.logger.add("❌ CHA 판정 실패. 이동 중 습격으로 HP -10.", "battle");
                }
                this.player.updateUI();
            },
            async () => {
                this.logger.add("🌀 균열에서 불안정한 마력이 새어 나옵니다.", "event");
                const idx = await this.pickEventChoice("마력 균열", ["지능으로 봉인진을 재구성한다(INT)", "민첩하게 파편을 피해 핵을 훔친다(DEX)"]);
                if (idx === 0) {
                    this.logger.add("선택: 봉인진 재구성.", "system");
                    if (stats.int >= 16) {
                        this.player.gainExp(45);
                        this.player.addItem(14, 1);
                        this.logger.add("✅ INT 판정 성공! 균열 봉합 완료. EXP +45, 하급 마나 포션 1개 획득.", "loot");
                    } else {
                        this.player.mp = Math.max(0, this.player.mp - 20);
                        this.logger.add("❌ INT 판정 실패. 역류로 MP -20.", "battle");
                        this.player.updateUI();
                    }
                    return;
                }

                this.logger.add("선택: 핵 탈취.", "system");
                if (stats.dex >= 16) {
                    this.player.gold += 60;
                    this.logger.add("✅ DEX 판정 성공! 마력 결정을 팔아 60G를 얻었습니다.", "loot");
                    this.player.updateUI();
                } else {
                    this.logger.add("❌ DEX 판정 실패. 균열 수호체와 전투!", "battle");
                    const mob = getRandomMonster(this.player.lv + 1, this.player.lv + 3);
                    this.combat.startBattle(mob, (win, enemy) => this.resolveCombatResult(win, enemy));
                }
            }
        ];

        const picked = events[Math.floor(Math.random() * events.length)];
        await picked();
    }

    openShop() {
        const list = document.getElementById('shop-list');
        list.innerHTML = '';
        
        // 매력(CHA)에 따른 할인율 계산 (1 CHA당 1% 할인, 최대 50%)
        const cha = this.player.getCombatStats().cha;
        const discountRate = Math.min(0.5, cha * 0.01);
        
        document.getElementById('shop-msg').innerText = 
            discountRate > 0 ? `(매력 보너스: ${Math.floor(discountRate*100)}% 할인 적용 중)` : "필요한 물건이 있나?";

        const saleItems = [1, 5, 8, 9, 21, 28, 101, 151]; 
        
        saleItems.forEach(id => {
            const item = getItem(id);
            if(!item) return;
            
            let originalPrice = item.val * 2;
            let finalPrice = Math.floor(originalPrice * (1 - discountRate));

            const div = document.createElement('div');
            div.className = 'inv-item';
            div.innerHTML = `
                <div class="item-name">${item.name}</div>
                <div class="item-price">💰 ${finalPrice}G</div>
            `;
            div.onclick = () => this.buyItem(item, finalPrice);
            list.appendChild(div);
        });

        document.getElementById('modal-shop').classList.remove('hidden');
    }

    buyItem(item, price) {
        if (this.player.gold >= price) {
            this.player.gold -= price;
            this.player.addItem(item.id, 1);
            this.logger.add(`🛒 ${item.name} 구매 완료!`, "loot");
            this.player.updateUI();
        } else {
            alert("골드가 부족합니다!");
        }
    }

    foundInn() {
        const cost = 50;
        if (confirm(`🏨 숲속의 낡은 여관을 발견했습니다.\n${cost}골드를 내고 푹 쉬시겠습니까?\n(체력/정신력/피로도 완전 회복)`)) {
            if (this.player.gold >= cost) {
                this.player.gold -= cost;
                this.player.heal(9999, 'hp');
                this.player.heal(9999, 'mp'); // Mental
                this.player.fatigue = 0;
                this.player.hunger = 100; 
                this.logger.add("🛌 여관에서 푹 쉬었습니다. 컨디션 최고!", "heal");
                this.player.updateUI();
            } else {
                this.logger.add("💸 돈이 없어서 쫓겨났습니다...", "battle");
            }
        } else {
            this.logger.add("여관을 지나쳤습니다.");
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

            const isEquipped = (p.equipment.weapon?.id === item.id) || 
                               (p.equipment.armor?.id === item.id) || 
                               (p.equipment.acc?.id === item.id);

            const div = document.createElement('div');
            div.className = `inv-item ${isEquipped ? 'equipped' : ''}`;
            let badge = isEquipped ? '<span class="equip-badge">E</span>' : '';
            
            div.innerHTML = `
                ${badge}
                <div class="item-name">${item.name}</div>
                <div class="item-count">x${slot.count}</div>
            `;
            
            div.onclick = () => {
                const updated = p.useItem(slot.id);
                if(updated) this.openInventory();
            };
            list.appendChild(div);
        });

        document.getElementById('modal-inventory').classList.remove('hidden');
    }

    openStatus() {
        const p = this.player;
        const s = p.getCombatStats();
        const base = p.baseStats;

        const makeRow = (label, key, val, total) => `
            <div class="stat-row">
                <span>${label} <small>(기본${val})</small></span>
                <div>
                    <span id="val-${key}">${total}</span>
                    <button class="btn-up" onclick="game.upStat('${key}')" ${p.statPoints > 0 ? '' : 'disabled'}>+</button>
                </div>
            </div>
        `;

        const detailHTML = `
            ${makeRow("💪 힘(STR)", "str", base.str, s.str)}
            ${makeRow("🧠 지능(INT)", "int", base.int, s.int)}
            ${makeRow("🏃 민첩(DEX)", "dex", base.dex, s.dex)}
            ${makeRow("✨ 매력(CHA)", "cha", base.cha, s.cha)}
            <hr>
            <div class="stat-row"><span>⚔️ 공격력</span> <span>${s.atk} (무기반영)</span></div>
            <div class="stat-row"><span>🛡️ 방어력</span> <span>${s.def} (장비)</span></div>
            <div class="stat-row"><span>⚡ 치명타</span> <span>${s.critChance}%</span></div>
            <div class="stat-row"><span>💨 회피율</span> <span>${s.evasion}%</span></div>
            <div class="stat-equip">
                <p>🗡️: ${p.equipment.weapon ? p.equipment.weapon.name : '-'}</p>
                <p>🛡️: ${p.equipment.armor ? p.equipment.armor.name : '-'}</p>
                <p>💍: ${p.equipment.acc ? p.equipment.acc.name : '-'}</p>
            </div>
        `;
        
        document.getElementById('stat-detail-area').innerHTML = detailHTML;
        document.getElementById('sp-display').innerText = `남은 포인트(SP): ${p.statPoints}`;
        document.getElementById('modal-status').classList.remove('hidden');
    }

    upStat(key) {
        if (this.player.raiseStat(key)) {
            this.openStatus();
        } else {
            alert("포인트가 부족합니다!");
        }
    }

    openEncyclopedia() {
        this.switchDex('monster');
        document.getElementById('modal-encyclopedia').classList.remove('hidden');
    }

    switchDex(type) {
        const list = document.getElementById('dex-list');
        list.innerHTML = '';
        
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        const btnIdx = type === 'monster' ? 0 : 1;
        document.querySelectorAll('.tab-btn')[btnIdx].classList.add('active');

        if (type === 'monster') {
            MONSTER_DB.forEach(m => {
                const div = document.createElement('div');
                div.className = 'dex-item';
                div.innerHTML = `
                    <span class="name">[Lv.${m.lv}] ${m.name}</span>
                    <span class="desc">HP:${m.hp}</span>
                `;
                list.appendChild(div);
            });
        } else {
            ITEM_DB.forEach(i => {
                const div = document.createElement('div');
                div.className = 'dex-item';
                div.innerHTML = `
                    <span class="name">${i.name}</span>
                    <span class="desc">${i.val}G</span>
                `;
                list.appendChild(div);
            });
        }
    }
}

window.onload = () => new Game();
