/*
 * Compact lesson-aware copy for lessons without a hand-written translation.
 * Detailed entries are still preferred by i18n-lessons.js.
 */
import { LABELS as CORE_LABELS } from './i18n-lesson-labels-core.js';
import { LABELS as EAST_LABELS } from './i18n-lesson-labels-east.js';

const LABELS = { ...CORE_LABELS, ...EAST_LABELS };

const PHRASES = {
  ar: {
    introA: 'في درس <strong>{topic}</strong> تتدرّب على الفكرة التي يوضحها {one}. اربطها بوصف حلم قابل للتجربة بدل حفظ القاعدة فقط.',
    introB: 'اقرأ أمثلة {topic} ثم غيّر قيمة واحدة. البنى الأساسية هنا هي {all}؛ راقب الحلم والقيم بعد كل تعديل.',
    tipA: 'استخدم {one} كنقطة بداية، وراجع تبويب <strong>Dream</strong> أو <strong>Values</strong> لترى أثر {topic}.',
    tipB: 'إذا توقفت، ارجع إلى {all} وجرّب أصغر تغيير ممكن قبل توسيع المثال.',
    taskA: 'طبّق فكرة <strong>{topic}</strong> في هذه المهمة باستخدام {example}.',
    taskB: 'وسّع تجربة <strong>{topic}</strong> في المهمة التالية باستخدام {example}.',
    hintA: 'ابدأ من {example}، ثم غيّر جزءًا واحدًا وتحقق من النتيجة في الحلم.',
    hintB: 'استخدم {example} كما هو أولًا، ثم عدّل القيمة أو البنية وراجع الأخطاء والقيم.',
    starter: 'الملف الابتدائي',
  },
  fr: {
    introA: 'Dans la leçon <strong>{topic}</strong>, vous explorez l’idée montrée par {one}. Reliez-la à un rêve testable au lieu de mémoriser une règle isolée.',
    introB: 'Lisez les exemples de {topic}, puis changez une seule valeur. Les formes clés sont {all} : observez le rêve et les valeurs après chaque modification.',
    tipA: 'Commencez avec {one}, puis consultez les onglets <strong>Dream</strong> ou <strong>Values</strong> pour voir l’effet de {topic}.',
    tipB: 'En cas de doute, revenez à {all} et faites le plus petit changement possible avant d’élargir l’exemple.',
    taskA: 'Mettez l’idée de <strong>{topic}</strong> en pratique avec {example}.',
    taskB: 'Approfondissez <strong>{topic}</strong> dans la tâche suivante en utilisant {example}.',
    hintA: 'Partez de {example}, modifiez une seule partie, puis vérifiez le résultat dans le rêve.',
    hintB: 'Essayez d’abord {example} tel quel, puis changez la valeur ou la structure et consultez les erreurs et les valeurs.',
    starter: 'le fichier de départ',
  },
  es: {
    introA: 'En la lección <strong>{topic}</strong> exploras la idea que muestra {one}. Conéctala con un sueño que puedas probar, no solo con una regla de memoria.',
    introB: 'Lee los ejemplos de {topic} y cambia un solo valor. Las formas clave son {all}; observa el sueño y los valores después de cada cambio.',
    tipA: 'Empieza con {one} y revisa las pestañas <strong>Dream</strong> o <strong>Values</strong> para ver el efecto de {topic}.',
    tipB: 'Si te atascas, vuelve a {all} y haz el cambio más pequeño antes de ampliar el ejemplo.',
    taskA: 'Pon en práctica la idea de <strong>{topic}</strong> usando {example}.',
    taskB: 'Lleva <strong>{topic}</strong> un paso más allá en la siguiente tarea con {example}.',
    hintA: 'Parte de {example}, cambia una sola parte y comprueba el resultado en el sueño.',
    hintB: 'Prueba primero {example} tal cual; después cambia el valor o la estructura y revisa errores y valores.',
    starter: 'el archivo inicial',
  },
  de: {
    introA: 'In der Lektion <strong>{topic}</strong> erkundest du die Idee hinter {one}. Verknüpfe sie mit einem prüfbaren Traum, statt nur eine Regel auswendig zu lernen.',
    introB: 'Lies die Beispiele zu {topic} und ändere einen Wert. Die wichtigsten Formen sind {all}; beobachte Traum und Werte nach jeder Änderung.',
    tipA: 'Beginne mit {one} und öffne <strong>Dream</strong> oder <strong>Values</strong>, um die Wirkung von {topic} zu sehen.',
    tipB: 'Wenn du festhängst, gehe zu {all} zurück und ändere zuerst nur die kleinste mögliche Stelle.',
    taskA: 'Setze die Idee von <strong>{topic}</strong> mit {example} praktisch um.',
    taskB: 'Vertiefe <strong>{topic}</strong> in der nächsten Aufgabe mit {example}.',
    hintA: 'Starte mit {example}, ändere genau einen Teil und prüfe danach den Traum.',
    hintB: 'Probiere {example} zuerst unverändert aus; passe dann Wert oder Struktur an und prüfe Fehler und Werte.',
    starter: 'die Starterdatei',
  },
  'pt-BR': {
    introA: 'Na lição <strong>{topic}</strong>, você explora a ideia mostrada por {one}. Relacione-a a um sonho que possa testar, em vez de apenas decorar uma regra.',
    introB: 'Leia os exemplos de {topic} e mude um único valor. As formas principais são {all}; observe o sonho e os valores depois de cada mudança.',
    tipA: 'Comece com {one} e confira as abas <strong>Dream</strong> ou <strong>Values</strong> para ver o efeito de {topic}.',
    tipB: 'Se travar, volte a {all} e faça a menor alteração possível antes de ampliar o exemplo.',
    taskA: 'Pratique a ideia de <strong>{topic}</strong> usando {example}.',
    taskB: 'Leve <strong>{topic}</strong> um passo adiante na próxima tarefa com {example}.',
    hintA: 'Comece por {example}, mude uma parte e confira o resultado no sonho.',
    hintB: 'Teste {example} primeiro como está; depois altere o valor ou a estrutura e revise erros e valores.',
    starter: 'o arquivo inicial',
  },
  ja: {
    introA: '<strong>{topic}</strong> のレッスンでは、{one} が示す考え方を試します。規則を覚えるだけでなく、実際に検証できる夢へつなげましょう。',
    introB: '{topic} の例を読み、値を一つだけ変えてみます。基本の形は {all} です。変更するたびに夢と値を確認しましょう。',
    tipA: 'まず {one} から始め、<strong>Dream</strong> または <strong>Values</strong> タブで {topic} の効果を確かめます。',
    tipB: '迷ったら {all} に戻り、例を広げる前に最小の変更を試しましょう。',
    taskA: '{example} を使って <strong>{topic}</strong> の考え方を練習します。',
    taskB: '次の課題では {example} を使い、<strong>{topic}</strong> をもう一歩深めます。',
    hintA: '{example} から始めて一箇所だけ変え、夢に反映された結果を確認します。',
    hintB: 'まず {example} をそのまま試し、値や構造を変えてからエラーと値を確認します。',
    starter: 'スターターコード',
  },
  'zh-CN': {
    introA: '在<strong>{topic}</strong>这一课中，你会练习 {one} 所展示的思路。不要只记规则，把它连接到可以验证的梦境上。',
    introB: '先阅读 {topic} 的示例，再只修改一个值。这里的关键形式是 {all}；每次修改后都观察梦境和值。',
    tipA: '先从 {one} 开始，再查看 <strong>Dream</strong> 或 <strong>Values</strong> 标签，确认 {topic} 带来的变化。',
    tipB: '遇到困难时回到 {all}，先做最小的修改，再扩展示例。',
    taskA: '使用 {example}，练习<strong>{topic}</strong>的核心思路。',
    taskB: '在下一项任务中使用 {example}，继续深入<strong>{topic}</strong>。',
    hintA: '从 {example} 开始，只改动一个部分，然后在梦境中检查结果。',
    hintB: '先直接运行 {example}，再修改值或结构，并查看错误和值。',
    starter: '起始代码',
  },
  ko: {
    introA: '<strong>{topic}</strong> 레슨에서는 {one}이 보여 주는 생각을 직접 연습합니다. 규칙을 외우는 데서 멈추지 말고 확인할 수 있는 드림으로 연결해 보세요.',
    introB: '{topic} 예제를 읽고 값 하나만 바꿔 보세요. 핵심 형태는 {all}이며, 바꿀 때마다 드림과 값을 확인합니다.',
    tipA: '먼저 {one}에서 시작하고 <strong>Dream</strong> 또는 <strong>Values</strong> 탭에서 {topic}의 변화를 확인하세요.',
    tipB: '막히면 {all}로 돌아가 예제를 키우기 전에 가장 작은 변경부터 시도하세요.',
    taskA: '{example}을 사용해 <strong>{topic}</strong>의 핵심을 연습하세요.',
    taskB: '다음 과제에서 {example}을 사용해 <strong>{topic}</strong>을 한 단계 더 확장하세요.',
    hintA: '{example}에서 시작해 한 부분만 바꾼 뒤 드림에 나타난 결과를 확인하세요.',
    hintB: '먼저 {example}을 그대로 실행하고, 값이나 구조를 바꾼 다음 오류와 값을 살펴보세요.',
    starter: '스타터 코드',
  },
  hi: {
    introA: '<strong>{topic}</strong> के पाठ में आप {one} से दिखने वाले विचार का अभ्यास करेंगे। केवल नियम याद न करें; इसे जाँचे जा सकने वाले सपने से जोड़ें।',
    introB: '{topic} के उदाहरण पढ़ें और केवल एक मान बदलें। मुख्य रूप {all} हैं; हर बदलाव के बाद सपना और मान देखें।',
    tipA: '{one} से शुरू करें और <strong>Dream</strong> या <strong>Values</strong> टैब में {topic} का असर जाँचें।',
    tipB: 'अटकने पर {all} पर लौटें और उदाहरण बढ़ाने से पहले सबसे छोटा बदलाव आज़माएँ।',
    taskA: '{example} का उपयोग करके <strong>{topic}</strong> के विचार का अभ्यास करें।',
    taskB: 'अगले कार्य में {example} के साथ <strong>{topic}</strong> को एक कदम आगे बढ़ाएँ।',
    hintA: '{example} से शुरू करें, एक ही हिस्सा बदलें और सपने में परिणाम जाँचें।',
    hintB: 'पहले {example} को जैसा है वैसा चलाएँ; फिर मान या संरचना बदलकर त्रुटियाँ और मान देखें।',
    starter: 'स्टार्टर कोड',
  },
};

const REGIONAL_PHRASES = {
  'ar-EG': {
    introA: 'في درس <strong>{topic}</strong> هتتدرّب على الفكرة اللي بيوضحها {one}. اربطها بوصف حلم تقدر تجرّبه بدل ما تحفظ القاعدة وخلاص.',
    introB: 'اقرأ أمثلة {topic} وغيّر قيمة واحدة بس. الأشكال الأساسية هنا {all}؛ وبص على الحلم والقيم بعد كل تعديل.',
    tipA: 'ابدأ بـ {one} وافتح تبويب <strong>Dream</strong> أو <strong>Values</strong> عشان تشوف تأثير {topic}.',
    tipB: 'لو اتعطلت، ارجع لـ {all} وجرّب أصغر تغيير ممكن قبل ما تكبّر المثال.',
    taskA: 'طبّق فكرة <strong>{topic}</strong> في المهمة دي باستخدام {example}.',
    taskB: 'وسّع تجربة <strong>{topic}</strong> في المهمة اللي بعدها باستخدام {example}.',
    hintA: 'ابدأ من {example}، غيّر جزء واحد، وبعدين اتأكد من النتيجة في الحلم.',
    hintB: 'جرّب {example} زي ما هو الأول، وبعدها عدّل القيمة أو البنية وراجع الأخطاء والقيم.',
    starter: 'ملف البداية',
  },
  'ar-SA': {
    introA: 'في درس <strong>{topic}</strong> تتدرّب على الفكرة اللي يوضحها {one}. اربطها بوصف حلم تقدر تختبره، مو بس تحفظ القاعدة.',
    introB: 'اقرأ أمثلة {topic} وغيّر قيمة وحدة. الأشكال الأساسية هنا {all}؛ وراقب الحلم والقيم بعد كل تعديل.',
    tipA: 'ابدأ بـ {one} وافتح تبويب <strong>Dream</strong> أو <strong>Values</strong> عشان تشوف أثر {topic}.',
    tipB: 'إذا وقفت معك، ارجع لـ {all} وجرّب أصغر تغيير قبل ما توسّع المثال.',
    taskA: 'طبّق فكرة <strong>{topic}</strong> في هالمهمة باستخدام {example}.',
    taskB: 'طوّر تجربة <strong>{topic}</strong> في المهمة التالية باستخدام {example}.',
    hintA: 'ابدأ من {example}، غيّر جزء واحد، وتحقق من النتيجة في الحلم.',
    hintB: 'استخدم {example} أولًا مثل ما هو، ثم عدّل القيمة أو البنية وراجع الأخطاء والقيم.',
    starter: 'ملف البداية',
  },
};

const LOCALE_ALIASES = {
  ar: 'ar',
  'ar-eg': 'ar-EG',
  'ar-sa': 'ar-SA',
  fr: 'fr',
  es: 'es',
  de: 'de',
  'pt-br': 'pt-BR',
  ja: 'ja',
  'zh-cn': 'zh-CN',
  ko: 'ko',
  hi: 'hi',
};

function localeKey(locale) {
  const raw = String(locale || '').trim().toLowerCase();
  return LOCALE_ALIASES[raw] || LOCALE_ALIASES[raw.split('-')[0]] || null;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character]));
}

function format(template, values) {
  return template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
}

function code(value) {
  return `<code>${escapeHtml(value)}</code>`;
}

function decodeHtml(value) {
  return String(value).replace(/&(amp|lt|gt|quot|#39|#x27);/g, (entity) => ({
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#x27;': "'",
  }[entity]));
}

function sourceExamples(...texts) {
  const examples = texts.flatMap((text) => (
    [...String(text || '').matchAll(/<code>([\s\S]*?)<\/code>/g)]
      .map((match) => decodeHtml(match[1]))
  ));
  return [...new Set(examples)];
}

function topicFor(lesson, locale) {
  const baseLocale = locale.split('-')[0];
  return LABELS[locale]?.[lesson.id]?.[0]
    || LABELS[baseLocale]?.[lesson.id]?.[0]
    || lesson.title
    || lesson.id;
}

export function fallbackLessonContent(lesson, locale, constructs = lesson.construct || []) {
  const language = localeKey(locale);
  if (!language) return null;
  const phrases = PHRASES[language] || REGIONAL_PHRASES[language];
  const safeTopic = escapeHtml(topicFor(lesson, language));
  const safeConstructs = constructs.length ? constructs : [lesson.id];
  const one = code(safeConstructs[0]);
  const all = safeConstructs.map(code).join(' · ');
  const content = {
    intro: lesson.intro.map((_, index) => `<p>${format(
      phrases[index === 0 ? 'introA' : 'introB'],
      { topic: safeTopic, one, all },
    )}</p>`),
    tips: lesson.tips.map((_, index) => format(
      phrases[index === 0 ? 'tipA' : 'tipB'],
      { topic: safeTopic, one, all },
    )),
    tasks: {},
  };

  lesson.tasks.forEach((task, index) => {
    const examples = sourceExamples(task.text, task.hint);
    const example = examples.length
      ? examples.map(code).join(' · ')
      : phrases.starter;
    const values = { topic: safeTopic, example };
    content.tasks[task.id] = {
      text: format(phrases[index === 0 ? 'taskA' : 'taskB'], values),
      hint: format(phrases[index === 0 ? 'hintA' : 'hintB'], values),
    };
  });
  return content;
}
