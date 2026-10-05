// East Asian and Indic translations for descriptive construct chips.
const TRANSLATIONS = {
  ja: {
    'prose lines': '散文の行', comments: 'コメント', 'hex colors': '16進カラー',
    comparisons: '比較', '≈ translation': '≈ 翻訳', '☽ dream note': '☽ 夢のメモ',
    '◊ concept': '◊ コンセプト', 'comma lists': 'カンマ区切りリスト', 'indented children': 'インデントした子要素',
    'function calls': '関数呼び出し', 'text / list / math / color helpers': 'テキスト・リスト・数学・色のヘルパー',
    'the dream pager': '夢のページャー', 'named variations': '名前付きバリエーション',
    'variation in a name': '名前の中のバリエーション', 'fresh choice per call': '呼び出しごとの新しい選択',
    'cross product': '直積', 'dream count': '夢の数', 'unused variations': '未使用のバリエーション',
    'default values': 'デフォルト値', 'named arguments': '名前付き引数', 'if / else inside': '内部の if / else',
    'the Renders tab': 'レンダリングタブ', 'passing a block': 'ブロックを渡す', 'reusing a name': '名前の再利用',
    index: 'インデックス', 'repeated keys → lists': '繰り返すキー → リスト', 'typed parameters': '型付きパラメーター',
    'everything, together': 'すべてを一つに',
  },
  'zh-CN': {
    'prose lines': '散文行', comments: '注释', 'hex colors': '十六进制颜色',
    comparisons: '比较', '≈ translation': '≈ 翻译', '☽ dream note': '☽ 梦境笔记',
    '◊ concept': '◊ 概念', 'comma lists': '逗号列表', 'indented children': '缩进子项',
    'function calls': '函数调用', 'text / list / math / color helpers': '文本、列表、数学和颜色助手',
    'the dream pager': '梦境翻页器', 'named variations': '命名变体',
    'variation in a name': '名称中的变体', 'fresh choice per call': '每次调用重新选择',
    'cross product': '笛卡尔积', 'dream count': '梦境数量', 'unused variations': '未使用的变体',
    'default values': '默认值', 'named arguments': '命名参数', 'if / else inside': '内部 if / else',
    'the Renders tab': '渲染标签页', 'passing a block': '传入代码块', 'reusing a name': '复用名称',
    index: '索引', 'repeated keys → lists': '重复键 → 列表', 'typed parameters': '带类型参数',
    'everything, together': '全部组合起来',
  },
  ko: {
    'prose lines': '산문 줄', comments: '주석', 'hex colors': '16진수 색상',
    comparisons: '비교', '≈ translation': '≈ 번역', '☽ dream note': '☽ 드림 메모',
    '◊ concept': '◊ 콘셉트', 'comma lists': '쉼표 목록', 'indented children': '들여쓴 자식 항목',
    'function calls': '함수 호출', 'text / list / math / color helpers': '텍스트·목록·수학·색상 헬퍼',
    'the dream pager': '드림 페이지 이동', 'named variations': '이름 있는 변형',
    'variation in a name': '이름 안의 변형', 'fresh choice per call': '호출마다 새 선택',
    'cross product': '데카르트 곱', 'dream count': '드림 개수', 'unused variations': '사용하지 않은 변형',
    'default values': '기본값', 'named arguments': '이름 있는 인수', 'if / else inside': '내부 if / else',
    'the Renders tab': '렌더 탭', 'passing a block': '블록 전달', 'reusing a name': '이름 재사용',
    index: '인덱스', 'repeated keys → lists': '반복 키 → 목록', 'typed parameters': '타입 매개변수',
    'everything, together': '모두 함께',
  },
  hi: {
    'prose lines': 'गद्य पंक्तियाँ', comments: 'कमेंट', 'hex colors': 'हेक्स रंग',
    comparisons: 'तुलनाएँ', '≈ translation': '≈ अनुवाद', '☽ dream note': '☽ सपने का नोट',
    '◊ concept': '◊ अवधारणा', 'comma lists': 'कॉमा वाली सूचियाँ', 'indented children': 'इंडेंट किए बच्चे',
    'function calls': 'फ़ंक्शन कॉल', 'text / list / math / color helpers': 'टेक्स्ट, सूची, गणित और रंग हेल्पर',
    'the dream pager': 'सपना पेजर', 'named variations': 'नाम वाले विकल्प',
    'variation in a name': 'नाम में विकल्प', 'fresh choice per call': 'हर कॉल पर नया चुनाव',
    'cross product': 'कार्तीय गुणनफल', 'dream count': 'सपनों की संख्या', 'unused variations': 'अनुपयोगी विकल्प',
    'default values': 'डिफ़ॉल्ट मान', 'named arguments': 'नामित आर्ग्युमेंट', 'if / else inside': 'अंदर का if / else',
    'the Renders tab': 'रेंडर टैब', 'passing a block': 'ब्लॉक पास करना', 'reusing a name': 'नाम का फिर उपयोग',
    index: 'इंडेक्स', 'repeated keys → lists': 'दोहराई कुंजियाँ → सूचियाँ', 'typed parameters': 'टाइप वाले पैरामीटर',
    'everything, together': 'सब कुछ साथ',
  },
};

function localeMap(locale) {
  const normalized = String(locale || 'en');
  return TRANSLATIONS[normalized] || TRANSLATIONS[normalized.split('-')[0]] || null;
}

export function localizeConstructs(constructs = [], locale = 'en') {
  const translations = localeMap(locale);
  return constructs.map((construct) => translations?.[construct] || construct);
}
