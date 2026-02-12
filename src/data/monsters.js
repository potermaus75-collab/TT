/* =========================================
   MONSTER DATABASE (Total: 100)
   Fields: id, name, lv, hp, atk, def, exp, drop(itemId)
   ========================================= */
const MONSTER_DB = [
  // [Lv 1~10] 초반 야수 및 해충
  {id:1, name:"병든 쥐", lv:1, hp:10, atk:2, def:0, exp:5, drop:1},
  {id:2, name:"거대 바퀴벌레", lv:1, hp:12, atk:3, def:0, exp:6, drop:1},
  {id:3, name:"성난 들개", lv:2, hp:18, atk:4, def:1, exp:8, drop:52},
  {id:4, name:"숲 슬라임", lv:2, hp:20, atk:2, def:0, exp:8, drop:1},
  {id:5, name:"독거미", lv:3, hp:22, atk:5, def:1, exp:10, drop:2},
  {id:6, name:"도둑 까마귀", lv:3, hp:15, atk:6, def:2, exp:10, drop:180},
  {id:7, name:"붉은 여우", lv:4, hp:25, atk:5, def:2, exp:12, drop:52},
  {id:8, name:"멧돼지", lv:4, hp:35, atk:7, def:3, exp:15, drop:51},
  {id:9, name:"동굴 박쥐", lv:5, hp:20, atk:6, def:1, exp:15, drop:3},
  {id:10, name:"떠돌이 늑대", lv:5, hp:40, atk:8, def:3, exp:18, drop:53},

  // [Lv 11~20] 인간형 및 하급 몬스터
  {id:11, name:"고블린 정찰병", lv:6, hp:35, atk:9, def:2, exp:20, drop:101},
  {id:12, name:"고블린 전사", lv:7, hp:45, atk:10, def:4, exp:25, drop:102},
  {id:13, name:"코볼트 도굴꾼", lv:7, hp:40, atk:11, def:2, exp:25, drop:181},
  {id:14, name:"코볼트 궁수", lv:8, hp:35, atk:13, def:1, exp:28, drop:103},
  {id:15, name:"오크 하급병", lv:9, hp:60, atk:12, def:5, exp:35, drop:104},
  {id:16, name:"탈영병", lv:9, hp:55, atk:14, def:4, exp:35, drop:105},
  {id:17, name:"산적", lv:10, hp:60, atk:15, def:5, exp:40, drop:106},
  {id:18, name:"산적 두목", lv:10, hp:80, atk:18, def:6, exp:50, drop:107},
  {id:19, name:"홉고블린", lv:11, hp:70, atk:16, def:6, exp:55, drop:108},
  {id:20, name:"하피", lv:11, hp:50, atk:19, def:3, exp:55, drop:182},

  // [Lv 21~30] 언데드 및 마법 생물
  {id:21, name:"스켈레톤 병사", lv:12, hp:45, atk:20, def:8, exp:60, drop:109},
  {id:22, name:"스켈레톤 궁수", lv:13, hp:40, atk:22, def:5, exp:65, drop:110},
  {id:23, name:"움직이는 갑옷", lv:14, hp:100, atk:15, def:15, exp:70, drop:151},
  {id:24, name:"좀비", lv:14, hp:120, atk:12, def:0, exp:70, drop:4},
  {id:25, name:"구울", lv:15, hp:90, atk:24, def:5, exp:80, drop:4},
  {id:26, name:"미믹", lv:15, hp:80, atk:30, def:10, exp:100, drop:183},
  {id:27, name:"가고일", lv:16, hp:110, atk:22, def:12, exp:90, drop:184},
  {id:28, name:"그림자 망령", lv:17, hp:60, atk:28, def:99, exp:95, drop:185},
  {id:29, name:"레이스", lv:18, hp:80, atk:30, def:10, exp:100, drop:186},
  {id:30, name:"뱀파이어 하수인", lv:19, hp:100, atk:32, def:8, exp:110, drop:187},

  // [Lv 31~40] 중급 마수
  {id:31, name:"웨어울프", lv:20, hp:150, atk:35, def:10, exp:130, drop:111},
  {id:32, name:"그리폰", lv:21, hp:180, atk:38, def:12, exp:140, drop:188},
  {id:33, name:"와이번", lv:22, hp:200, atk:40, def:15, exp:150, drop:112},
  {id:34, name:"맨티코어", lv:23, hp:210, atk:42, def:14, exp:160, drop:189},
  {id:35, name:"트롤", lv:24, hp:300, atk:25, def:5, exp:170, drop:54},
  {id:36, name:"트롤 광전사", lv:25, hp:350, atk:45, def:8, exp:190, drop:113},
  {id:37, name:"오우거", lv:26, hp:400, atk:50, def:10, exp:210, drop:114},
  {id:38, name:"오우거 메이지", lv:27, hp:300, atk:55, def:12, exp:230, drop:135},
  {id:39, name:"사이클롭스", lv:28, hp:450, atk:60, def:15, exp:250, drop:115},
  {id:40, name:"바실리스크", lv:29, hp:250, atk:50, def:20, exp:270, drop:190},

  // [Lv 41~50] 정령 및 골렘
  {id:41, name:"진흙 골렘", lv:30, hp:300, atk:40, def:25, exp:280, drop:191},
  {id:42, name:"바위 골렘", lv:31, hp:400, atk:50, def:35, exp:300, drop:191},
  {id:43, name:"강철 골렘", lv:32, hp:500, atk:60, def:45, exp:330, drop:192},
  {id:44, name:"불의 정령", lv:33, hp:200, atk:70, def:10, exp:310, drop:193},
  {id:45, name:"물의 정령", lv:33, hp:300, atk:50, def:20, exp:310, drop:194},
  {id:46, name:"바람의 정령", lv:34, hp:150, atk:65, def:30, exp:320, drop:195},
  {id:47, name:"땅의 정령", lv:34, hp:450, atk:45, def:40, exp:320, drop:196},
  {id:48, name:"얼음 정령", lv:35, hp:250, atk:60, def:25, exp:330, drop:197},
  {id:49, name:"뇌전의 정령", lv:35, hp:200, atk:80, def:15, exp:350, drop:198},
  {id:50, name:"어둠의 정령", lv:36, hp:220, atk:75, def:20, exp:360, drop:199},

  // [Lv 51~60] 심연의 존재들
  {id:51, name:"심연의 감시자", lv:38, hp:350, atk:80, def:25, exp:400, drop:116},
  {id:52, name:"공허충", lv:39, hp:300, atk:85, def:15, exp:410, drop:200},
  {id:53, name:"촉수 괴물", lv:40, hp:500, atk:70, def:30, exp:430, drop:5},
  {id:54, name:"얼굴 없는 자", lv:41, hp:400, atk:90, def:20, exp:450, drop:136},
  {id:55, name:"카오스 비스트", lv:42, hp:550, atk:95, def:35, exp:480, drop:117},
  {id:56, name:"마인드 플레이어", lv:43, hp:300, atk:100, def:10, exp:500, drop:137},
  {id:57, name:"비홀더", lv:44, hp:450, atk:110, def:25, exp:530, drop:138},
  {id:58, name:"나가 가드", lv:45, hp:500, atk:90, def:40, exp:550, drop:118},
  {id:59, name:"나가 로열가드", lv:46, hp:600, atk:100, def:50, exp:580, drop:119},
  {id:60, name:"크라켄의 촉수", lv:47, hp:800, atk:120, def:40, exp:600, drop:156},

  // [Lv 61~70] 고대 종족 (엘리트)
  {id:61, name:"고대 미노타우루스", lv:50, hp:1000, atk:130, def:60, exp:700, drop:120},
  {id:62, name:"켄타우로스 족장", lv:51, hp:900, atk:125, def:50, exp:720, drop:121},
  {id:63, name:"스핑크스", lv:52, hp:800, atk:140, def:55, exp:750, drop:139},
  {id:64, name:"키메라", lv:53, hp:1100, atk:135, def:50, exp:780, drop:122},
  {id:65, name:"히드라", lv:54, hp:1500, atk:120, def:40, exp:800, drop:55},
  {id:66, name:"피닉스", lv:55, hp:1000, atk:150, def:60, exp:850, drop:140},
  {id:67, name:"드레이크", lv:56, hp:1200, atk:140, def:70, exp:900, drop:123},
  {id:68, name:"서리 거인", lv:57, hp:1800, atk:160, def:80, exp:950, drop:158},
  {id:69, name:"화염 거인", lv:58, hp:1800, atk:170, def:75, exp:980, drop:159},
  {id:70, name:"폭풍 거인", lv:59, hp:1600, atk:180, def:70, exp:1000, drop:124},

  // [Lv 71~80] 악마 군단
  {id:71, name:"임프", lv:60, hp:400, atk:100, def:30, exp:600, drop:6},
  {id:72, name:"서큐버스", lv:62, hp:700, atk:150, def:40, exp:1050, drop:160},
  {id:73, name:"인큐버스", lv:62, hp:750, atk:155, def:45, exp:1080, drop:160},
  {id:74, name:"헬하운드", lv:64, hp:900, atk:160, def:50, exp:1100, drop:53},
  {id:75, name:"나이트메어", lv:65, hp:1000, atk:170, def:55, exp:1150, drop:125},
  {id:76, name:"둠 가드", lv:66, hp:1500, atk:180, def:80, exp:1200, drop:161},
  {id:77, name:"핏 핀드", lv:67, hp:1800, atk:190, def:85, exp:1300, drop:126},
  {id:78, name:"발록", lv:68, hp:2000, atk:200, def:90, exp:1400, drop:127},
  {id:79, name:"아크 데몬", lv:69, hp:2200, atk:210, def:95, exp:1500, drop:141},
  {id:80, name:"타락한 천사", lv:70, hp:1800, atk:230, def:80, exp:1600, drop:142},

  // [Lv 81~90] 용족 (보스급)
  {id:81, name:"레드 드래곤 해츨링", lv:72, hp:1500, atk:180, def:100, exp:1500, drop:128},
  {id:82, name:"그린 드래곤", lv:74, hp:2500, atk:200, def:120, exp:2000, drop:162},
  {id:83, name:"블루 드래곤", lv:76, hp:2800, atk:220, def:130, exp:2200, drop:163},
  {id:84, name:"화이트 드래곤", lv:78, hp:3000, atk:210, def:140, exp:2300, drop:164},
  {id:85, name:"블랙 드래곤", lv:80, hp:3500, atk:250, def:150, exp:2500, drop:165},
  {id:86, name:"레드 드래곤", lv:82, hp:4000, atk:280, def:160, exp:2800, drop:166},
  {id:87, name:"골드 드래곤", lv:84, hp:4500, atk:300, def:180, exp:3200, drop:167},
  {id:88, name:"본 드래곤", lv:86, hp:3800, atk:320, def:140, exp:3500, drop:143},
  {id:89, name:"드래곤 로드", lv:88, hp:6000, atk:350, def:200, exp:4000, drop:129},
  {id:90, name:"에인션트 드래곤", lv:90, hp:8000, atk:400, def:250, exp:5000, drop:168},

  // [Lv 91~100] 신화적 존재 (엔드 콘텐츠)
  {id:91, name:"리치", lv:91, hp:3000, atk:450, def:100, exp:5500, drop:144},
  {id:92, name:"리치 킹", lv:92, hp:5000, atk:500, def:200, exp:6000, drop:145},
  {id:93, name:"죽음의 기사", lv:93, hp:6000, atk:550, def:300, exp:6500, drop:130},
  {id:94, name:"크툴루의 화신", lv:94, hp:9999, atk:600, def:100, exp:7000, drop:200},
  {id:95, name:"혼돈의 제왕", lv:95, hp:8000, atk:650, def:350, exp:7500, drop:131},
  {id:96, name:"시간의 수호자", lv:96, hp:10000, atk:500, def:500, exp:8000, drop:169},
  {id:97, name:"공간의 파괴자", lv:97, hp:9000, atk:700, def:300, exp:8500, drop:170},
  {id:98, name:"신 살해자", lv:98, hp:12000, atk:800, def:400, exp:9000, drop:132},
  {id:99, name:"창조주의 그림자", lv:99, hp:15000, atk:900, def:500, exp:9500, drop:146},
  {id:100, name:"더 엔드(The End)", lv:100, hp:20000, atk:999, def:999, exp:10000, drop:200}
];


export { MONSTER_DB };
