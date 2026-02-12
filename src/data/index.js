// src/data/index.js
import { MONSTER_DB } from './monsters.js';
import { ITEM_DB } from './items.js';
// 나중에 import { SKILL_DB } from './skills.js'; 추가

// 데이터를 ID로 빠르게 찾기 위한 Map 생성 (최적화)
// 배열 순회(find)보다 Map 조회(get)가 훨씬 빠릅니다.
const MonsterMap = new Map(MONSTER_DB.map(m => [m.id, m]));
const ItemMap = new Map(ITEM_DB.map(i => [i.id, i]));

// 필요한 것만 묶어서 내보내기
export { 
    MONSTER_DB, 
    ITEM_DB, 
    MonsterMap, 
    ItemMap 
};
