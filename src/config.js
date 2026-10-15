// ===== 配置（修改） =====
const CONFIG = {
    SUBJECTS: [
        { id: 'chi', n: '语文', cap: 150, type: 'arts' },
        { id: 'mat', n: '数学', cap: 150, type: 'sci' },
        { id: 'eng', n: '英语', cap: 150, type: 'arts' },
        { id: 'phy', n: '物理', cap: 100, type: 'sci' },
        { id: 'che', n: '化学', cap: 100, type: 'sci' },
        { id: 'bio', n: '生物', cap: 100, type: 'sci' }
    ],
    FACILITIES: [
        { id: 'desk', n: '课桌椅', lv: ['破木桌', '普通课桌', '人体工学椅'], p: [0, 2000, 6000], d: '降低复习压力' },
        { id: 'tech', n: '教学硬件', lv: ['粉笔黑板', '投影仪', '一体机'], p: [0, 3000, 8000], d: '提高学习效率' },
        { id: 'ac', n: '恒温系统', lv: ['无', '老式空调', '中央空调'], p: [0, 2500, 7000], d: '减免恶劣天气生病' },
        { id: 'music', n: '校园广播网', lv: ['无', '普通广播', '沉浸音响'], p: [0, 2000, 5000], d: '每回合恢复心情' },
        { id: 'psy', n: '心理宣泄室', lv: ['无', '兼职咨询', '专业咨询'], p: [0, 3000, 8000], d: '每回合大幅降低压力' }
    ],
    TALENTS: [
        { id: 't1', n: '解析眼', t: 'pos', cost: 1.2, type: 'sci', d: '理科学习效率+15%' },
        { id: 't2', n: '语感', t: 'pos', cost: 1.0, type: 'arts', d: '文科学习效率+15%' },
        { id: 't3', n: '大心脏', t: 'pos', cost: 1.0, type: 'all', d: '压力自然增长减半' },
        { id: 't4', n: '实验狂', t: 'pos', cost: 0.8, type: 'sci', d: '化学/生物提升+20%' },
        { id: 't5', n: '卷王', t: 'pos', cost: 1.5, type: 'all', d: '全科微弱加成+5%' },
        { id: 't6', n: '锦鲤', t: 'pos', cost: 0.8, type: 'all', d: '考试不易发挥失常' },
        { id: 't7', n: '乐天派', t: 'pos', cost: 0.7, type: 'arts', d: '心情极易恢复' },
        { id: 't_comp', n: '竞赛达人', t: 'pos', cost: 1.0, type: 'sci', d: '理科效率+10%' },
        { id: 't_money', n: '奖金激励', t: 'pos', cost: 0.8, type: 'all', d: '考试发挥更稳定' },
        { id: 'n1', n: '粗心', t: 'neg', cost: -0.5, type: 'all', d: '大考容易扣分' },
        { id: 'n2', n: '玻璃心', t: 'neg', cost: -0.8, type: 'all', d: '压力极易升高' },
        { id: 'n3', n: '偏科', t: 'neg', cost: -0.5, type: 'all', d: '大考随机发挥失常' },
        { id: 'n4', n: '网瘾', t: 'neg', cost: -0.6, type: 'sci', d: '有概率翘课打游戏，且可能传播' },
        { id: 'n5', n: '多愁善感', t: 'neg', cost: -0.5, type: 'all', d: '心情极易下降' }
    ],
    UNIS: [
        { min: 685, list: ['清华大学', '北京大学'] },
        { min: 650, list: ['复旦大学', '上海交大', '浙江大学', '中科大'] },
        { min: 600, list: ['重庆大学', '四川大学', '电子科大', '中南大学', '厦门大学'] },
        { min: 500, list: ['重庆邮电', '西南大学', '合肥工大'] },
        { min: 0, list: ['蓝翔技校', '家里蹲', '复读高中'] }
    ],
    EXAM_EVENTS: {
        'chi': [{ t: '作文偏题', v: -12 }, { t: '阅读灵光一闪', v: 8 }, { t: '默写忘了', v: -6 }, { t: '古文语感极佳', v: 10 }, { t: '作文扣题精准', v: 15 }, { t: '古诗鉴赏崩溃', v: -10 }],
        'mat': [{ t: '蒙对选择题', v: 5 }, { t: '大题全错', v: -12 }, { t: '忘写解扣分', v: -3 }, { t: '解析几何解出', v: 12 }, { t: '压轴题完美', v: 18 }, { t: '导数计算失误', v: -8 }],
        'eng': [{ t: '听力杂音', v: -8 }, { t: '阅读生词崩溃', v: -10 }, { t: '套用高级句型', v: 8 }, { t: '完形语感选对', v: 10 }, { t: '七选五全对', v: 15 }, { t: '作文跑题', v: -12 }],
        'phy': [{ t: '受力分析反', v: -8 }, { t: '没写单位', v: -4 }, { t: '压轴题完美', v: 14 }, { t: '实验题蒙对', v: 6 }, { t: '电磁场全对', v: 16 }, { t: '动量守恒算错', v: -10 }],
        'che': [{ t: '方程式配平失败', v: -6 }, { t: '推断看错条件', v: -10 }, { t: '有机推断全对', v: 12 }, { t: '实验方案满分', v: 10 }, { t: '计算点错', v: -4 }, { t: '工业流程全对', v: 14 }],
        'bio': [{ t: '遗传算错概率', v: -8 }, { t: '概念记混', v: -10 }, { t: '基因图谱看穿', v: 12 }, { t: '选择题全对', v: 10 }, { t: '实验设计完美', v: 14 }, { t: '生态填空全错', v: -6 }]
    },
    // ===== 全新事件列表（13个事件，更丰富） =====
    EVENTS: [
        { id: 'ev1', title: '🎮 沉迷游戏', desc: '某位同学周末偷偷跑去网吧通宵打游戏...', options: [
            { text: '严厉批评并没收手机', effect: (s) => { s.stress += 20; s.mood -= 15; } },
            { text: '找他谈心，了解原因', effect: (s) => { s.stress -= 10; s.mood += 5; } },
            { text: '通知家长共同教育 (需¥500)', condition: () => State.money >= 500, cost: 500, effect: (s) => { s.stress -= 20; s.mood += 5; s.mastery.mat += 2; s.mastery.eng += 2; } }
        ] },
        { id: 'ev2', title: '💡 突然顿悟', desc: '一位学生在刷题时突然打通了任督二脉！', options: [
            { text: '表扬并鼓励分享', effect: (s) => { s.mood += 15; s.mastery.mat += 5; s.mastery.phy += 5; s.stress -= 5; } },
            { text: '安排他给全班讲解', effect: (s) => { s.mood += 10; s.stress += 10; State.students.forEach(st => { st.mastery.mat += 2; st.mastery.phy += 2; }); } },
            { text: '奖励竞赛书 (需¥300)', condition: () => State.money >= 300, cost: 300, effect: (s) => { s.mood += 20; s.mastery.mat += 12; s.mastery.phy += 12; s.stress -= 5; } }
        ] },
        { id: 'ev3', title: '😵 心态崩溃', desc: '模拟卷太难，某位同学当场撕了卷子...', options: [
            { text: '严肃批评，树立纪律', effect: (s) => { s.stress += 30; s.mood -= 20; } },
            { text: '课后心理辅导', effect: (s) => { s.stress -= 20; s.mood += 10; s.mastery.chi += 2; s.mastery.eng += 2; } },
            { text: '安排去心理宣泄室 (需Lv≥1)', condition: () => State.fac.psy >= 1, effect: (s) => { s.stress -= 40; s.mood += 15; s.mastery.mat += 3; s.mastery.phy += 3; } }
        ] },
        { id: 'ev4', title: '📧 家长投诉', desc: '家长群里有人发长文吐槽作业太多...', options: [
            { text: '公开回应，安抚家长', effect: () => { State.students.forEach(s => { s.stress += 10; s.mood -= 5; }); } },
            { text: '召开线上家长会', effect: () => { State.money -= 200; State.students.forEach(s => { s.mood += 5; s.stress -= 5; }); } },
            { text: '减少作业量 (需1AP)', condition: () => State.ap >= 1, costAP: 1, effect: () => { State.students.forEach(s => { s.stress -= 15; s.mood += 10; }); } }
        ] },
        { id: 'ev5', title: '🏆 竞赛获奖', desc: '某位同学在学科竞赛中获奖，全班振奋！', options: [
            { text: '全校表扬，树立榜样', effect: (s) => { s.mood += 25; if (s.talents.length < 6 && !s.talents.some(t => t.id === 't_comp')) { s.talents.push({ id: 't_comp', n: '竞赛达人', t: 'pos', d: '理科效率+10%' }); } } },
            { text: '发放奖金鼓励', effect: (s) => { s.mood += 15; State.money -= 500; if (s.talents.length < 6 && !s.talents.some(t => t.id === 't_money')) { s.talents.push({ id: 't_money', n: '奖金激励', t: 'pos', d: '考试发挥更稳定' }); } } }
        ] },
        { id: 'ev6', title: '🤒 生病请假', desc: '换季流感，某位同学高烧缺席了本周课程。', options: [
            { text: '让他好好休息', effect: (s) => { s.sickTimer = 2; s.stress -= 15; } },
            { text: '安排同学送笔记', effect: (s) => { s.sickTimer = 1; s.mood += 8; s.mastery.chi += 2; s.mastery.eng += 2; } },
            { text: '请私人医生上门 (需¥1000)', condition: () => State.money >= 1000, cost: 1000, effect: (s) => { s.sickTimer = 0; s.mood += 10; s.stress -= 10; } }
        ] },
        { id: 'ev7', title: '📚 奋发图强', desc: '垫底的同学痛定思痛，决定逆袭！', options: [
            { text: '制定个人学习计划', effect: (s) => { s.mood += 10; CONFIG.SUBJECTS.forEach(sub => { s.mastery[sub.id] += 3; }); s.stress += 5; } },
            { text: '安排一对一辅导', effect: (s) => { s.mood += 10; s.mastery.mat += 8; s.mastery.eng += 8; s.stress += 8; } },
            { text: '购买额外习题 (需¥400)', condition: () => State.money >= 400, cost: 400, effect: (s) => { s.mood += 15; CONFIG.SUBJECTS.forEach(sub => { s.mastery[sub.id] += 6; }); s.stress += 10; } }
        ] },
        { id: 'ev8', title: '🎂 生日buff', desc: '班里给某位同学过了生日，心情大好！', options: [
            { text: '全班庆祝', effect: (s) => { s.mood += 20; s.stress -= 15; State.students.forEach(st => { st.mood += 5; }); } },
            { text: '送他一本好书', effect: (s) => { s.mood += 15; s.mastery.chi += 8; s.mastery.eng += 8; s.stress -= 5; } },
            { text: '组织生日派对 (需¥500)', condition: () => State.money >= 500, cost: 500, effect: (s) => { s.mood += 25; s.stress -= 20; State.students.forEach(st => { st.mood += 8; }); } }
        ] },
        { id: 'ev9', title: '😰 考前焦虑', desc: '大考临近，多名学生出现焦虑症状。', options: [
            { text: '开展考前心理辅导', effect: () => { State.students.forEach(s => { s.stress -= 10; s.mood += 5; s.mastery.chi += 1; s.mastery.eng += 1; }); } },
            { text: '组织放松活动', effect: () => { State.students.forEach(s => { s.stress -= 20; s.mood += 5; }); } },
            { text: '邀请专家讲座 (需¥800)', condition: () => State.money >= 800, cost: 800, effect: () => { State.students.forEach(s => { s.stress -= 25; s.mood += 10; CONFIG.SUBJECTS.forEach(sub => { s.mastery[sub.id] += 2; }); }); } }
        ] },
        { id: 'ev10', title: '🎯 目标明确', desc: '一位学生突然明确了自己的目标大学，动力十足！', options: [
            { text: '鼓励他制定计划', effect: (s) => { s.mood += 15; s.mastery.mat += 5; s.mastery.eng += 5; s.stress += 5; } },
            { text: '分享他的目标激励全班', effect: (s) => { s.mood += 10; State.students.forEach(st => { st.mood += 5; st.mastery.mat += 1; st.mastery.eng += 1; }); } },
            { text: '帮他联系目标大学学长 (需¥200)', condition: () => State.money >= 200, cost: 200, effect: (s) => { s.mood += 20; s.mastery.chi += 10; s.mastery.eng += 10; s.stress -= 5; } }
        ] },
        { id: 'ev11', title: '🌧️ 阴雨天', desc: '连续阴雨天气，班级气氛低迷。', options: [
            { text: '放轻松音乐调节气氛', effect: () => { State.students.forEach(s => { s.mood += 5; }); } },
            { text: '组织室内游戏', effect: () => { State.students.forEach(s => { s.stress -= 10; s.mood += 8; }); } },
            { text: '购买小零食安慰 (需¥300)', condition: () => State.money >= 300, cost: 300, effect: () => { State.students.forEach(s => { s.mood += 12; s.stress -= 10; }); } }
        ] },
        { id: 'ev12', title: '🌟 星光闪耀', desc: '班级在全校评比中获得优秀班级称号！', options: [
            { text: '拍照留念，张贴荣誉榜', effect: () => { State.students.forEach(s => { s.mood += 10; }); } },
            { text: '组织班级聚餐 (需¥600)', condition: () => State.money >= 600, cost: 600, effect: () => { State.students.forEach(s => { s.mood += 15; s.stress -= 15; }); } },
            { text: '申请班级经费奖励', effect: () => { State.money += 1000; State.students.forEach(s => { s.mood += 10; }); } }
        ] },
        // ===== 新增网瘾相关事件 =====
        { id: 'ev13', title: '🕹️ 抓现行！', desc: '你发现某位同学上课时偷偷用手机打游戏，影响极坏。', options: [
            { text: '没收手机并严厉批评 (消除网瘾)', effect: (s) => { 
                s.talents = s.talents.filter(t => t.id !== 'n4'); 
                s.mood -= 20; 
                s.stress += 20; 
                Game.log(`${s.name} 被没收手机，网瘾消除，但心情低落。`, "[网瘾]");
            }},
            { text: '课后心理辅导，引导正确使用 (需1AP)', condition: () => State.ap >= 1, costAP: 1, effect: (s) => { 
                s.talents = s.talents.filter(t => t.id !== 'n4'); 
                s.mood += 5; 
                s.stress -= 10; 
                s.mastery.chi += 2; 
                s.mastery.eng += 2; 
                Game.log(`${s.name} 通过心理辅导消除了网瘾。`, "[网瘾]");
            }},
            { text: '通知家长，加强管教 (需¥300)', condition: () => State.money >= 300, cost: 300, effect: (s) => { 
                s.talents = s.talents.filter(t => t.id !== 'n4'); 
                s.mood -= 10; 
                s.stress += 5; 
                s.mastery.mat += 4; 
                Game.log(`${s.name} 家长介入，网瘾消除。`, "[网瘾]");
            }}
        ] }
    ]
};

const SEASONS = { '8': '秋', '9': '秋', '10': '秋', '11': '冬', '12': '冬', '1': '冬', '2': '春', '3': '春', '4': '春', '5': '夏', '6': '夏' };
const WEATHER_POOL = {
    '秋': [{ i: '☀️', n: '秋高气爽' }, { i: '🌧️', n: '秋雨连绵' }],
    '冬': [{ i: '🌫️', n: '湿冷大雾', eff: 'cold' }, { i: '🌨️', n: '寒潮入侵', eff: 'cold' }],
    '春': [{ i: '🌤️', n: '春暖花开' }, { i: '🌧️', n: '春雨绵绵' }],
    '夏': [{ i: '🥵', n: '高温预警', eff: 'hot' }, { i: '⛈️', n: '狂风暴雨' }]
};

