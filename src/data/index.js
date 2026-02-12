// src/data/monsters.js 와 src/data/items.js 에서 데이터를 가져옵니다.
import { MONSTER_DB } from './monsters.js';
import { ITEM_DB } from './items.js';

// 배열을 순회하는 것보다 Map.get(id)가 훨씬 빠르므로(O(1)) 매핑을 해둡니다.
const MonsterMap = new Map(MONSTER_DB.map(m => [m.id, m]));
const ItemMap = new Map(ITEM_DB.map(i => [i.id, i]));

/**
 * ID로 몬스터 정보 조회
 */
export function getMonster(id) {
    return MonsterMap.get(id);
}

/**
 * ID로 아이템 정보 조회
 */
export function getItem(id) {
    return ItemMap.get(id);
}

/**
 * 랜덤 몬스터 뽑기 (레벨 범위 지정 가능)
 */
export function getRandomMonster(minLv = 1, maxLv = 100) {
    // 해당 레벨 범위의 몬스터만 필터링
    const candidates = MONSTER_DB.filter(m => m.lv >= minLv && m.lv <= maxLv);
    if (candidates.length === 0) return MONSTER_DB[0]; // 예외 처리
    
    const randomIndex = Math.floor(Math.random() * candidates.length);
    return candidates[randomIndex];
}

// 전체 DB도 필요할 수 있으니 내보냅니다.
export { MONSTER_DB, ITEM_DB };
