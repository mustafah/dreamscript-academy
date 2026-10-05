// Intro, tip, task, and hint translations for East Asian and Indic locales.
const CONTENT = {
  ja: {
    prose: {
      intro: [
        '<p>DreamScript ファイルは<strong>普通の文章</strong>から始まります。入力した各行が夢の断片、つまり AI アーティストが読む説明になります。見えるものを書いてみましょう。</p>',
        '<p><code>//</code> は行末までの<strong>コメント</strong>、<code>/* … */</code> は複数行を隠します。<strong>空行</strong>で新しい段落が始まります。</p>',
      ],
      tips: ['コメントは夢に届きません。メモとして使いましょう。', '絵文字はどこでも使えます。普通の文字として扱われます。'],
      tasks: {
        'add-line': { text: '夢に自分の新しい行を追加します。', hint: '最後の行の末尾をクリックして Enter を押し、別のものを描写します。' },
        comment: { text: '<code>//</code> でコメントを書き、右側に表示されないことを確認します。', hint: '<code>// my note</code> を独立した行に入力します。エディターだけに残ります。' },
      },
    },
    names: {
      intro: [
        '<p><strong>チルダ</strong> <code>~</code> で文章からコードへ移ります。<code>~ Subject = a lighthouse</code> が名前を<em>定義</em>し、以後の <code>~Subject</code> は値に置き換わります。</p>',
        '<p><strong>引用符は不要</strong>です。<code>=</code> の後は、数値やリスト、計算だと判断されるまで文章です。名前は大文字小文字を区別せず、空白も使えます。</p>',
      ],
      tips: ['<strong>Values</strong> タブで定義した名前を確認できます。', '名前の typo は <strong>Problems</strong> に候補として表示されます。'],
      tasks: {
        change: { text: '<code>Subject</code> の値を変え、使用箇所が変わる様子を見ます。', hint: '<code>~ Subject =</code> の後を編集します。引用符は不要です。' },
        'new-name': { text: '<code>~ Time = golden hour</code> のような3つ目の名前を定義し、<code>~Time</code> を使います。', hint: '<code>~ Time = golden hour</code> を追加し、文章に <code>~Time</code> を書きます。' },
      },
    },
  },
  'zh-CN': {
    prose: {
      intro: [
        '<p>DreamScript 文件从<strong>普通文字</strong>开始。你输入的每一行都是梦境的一部分，也是 AI 艺术家会读取的描述。现在只要写下你看到的东西。</p>',
        '<p><code>//</code> 会开始直到行尾的<strong>注释</strong>，<code>/* … */</code> 会隐藏多行内容。<strong>空行</strong>会开始新的段落。</p>',
      ],
      tips: ['注释不会进入梦境，可以用来写提醒。', '任何位置都可以使用 Emoji，它们只是字符。'],
      tasks: {
        'add-line': { text: '向梦境添加一行自己的文字。', hint: '点击最后一行末尾，按 Enter，然后描述你看到的另一件事。' },
        comment: { text: '用 <code>//</code> 写一条注释，看看它不会出现在右侧。', hint: '单独一行输入 <code>// my note</code>，它只留在编辑器里。' },
      },
    },
    names: {
      intro: [
        '<p><strong>波浪号</strong> <code>~</code> 可以从散文进入代码。<code>~ Subject = a lighthouse</code> 会<em>定义</em>名称；之后句子里的 <code>~Subject</code> 会替换为它的值。</p>',
        '<p><strong>不需要引号</strong>。<code>=</code> 后的内容都是文字，直到 DreamScript 判断它是数字、列表或数学表达式。名称不区分大小写，也可以包含空格。</p>',
      ],
      tips: ['打开 <strong>Values</strong> 标签查看定义的名称。', '名称拼写错误会在 <strong>Problems</strong> 中给出建议。'],
      tasks: {
        change: { text: '修改 <code>Subject</code> 的值，观察它的所有使用位置一起变化。', hint: '编辑 <code>~ Subject =</code> 后面的文字，不需要引号。' },
        'new-name': { text: '定义第三个名称，例如 <code>~ Time = golden hour</code>，并在句子中使用 <code>~Time</code>。', hint: '添加 <code>~ Time = golden hour</code>，再把 <code>~Time</code> 写进散文行。' },
      },
    },
  },
  ko: {
    prose: {
      intro: [
        '<p>DreamScript 파일은 <strong>평범한 글</strong>로 시작합니다. 입력한 일반적인 한 줄 한 줄이 AI 아티스트가 읽는 드림의 조각이 됩니다. 보이는 것을 써 보세요.</p>',
        '<p><code>//</code>는 줄 끝까지 <strong>주석</strong>을 만들고, <code>/* … */</code>는 여러 줄을 숨깁니다. <strong>빈 줄</strong>은 새 문단을 시작합니다.</p>',
      ],
      tips: ['주석은 드림에 들어가지 않으니 메모로 활용하세요.', '이모지는 어디서든 사용할 수 있는 문자입니다.'],
      tasks: {
        'add-line': { text: '드림에 나만의 새 줄을 추가하세요.', hint: '마지막 줄 끝을 클릭하고 Enter를 누른 뒤 다른 장면을 묘사하세요.' },
        comment: { text: '<code>//</code>로 주석을 쓰고 오른쪽에 나타나지 않는지 확인하세요.', hint: '<code>// my note</code>를 별도 줄에 입력하면 편집기에만 남습니다.' },
      },
    },
    names: {
      intro: [
        '<p><strong>물결표</strong> <code>~</code>는 글에서 코드로 나가는 표시입니다. <code>~ Subject = a lighthouse</code>로 이름을 <em>정의</em>하고, 문장 속 <code>~Subject</code>를 값으로 바꿉니다.</p>',
        '<p><strong>따옴표가 필요 없습니다.</strong> <code>=</code> 뒤는 숫자, 목록 또는 수학으로 인식될 때까지 글입니다. 이름은 대소문자를 구분하지 않고 공백도 포함할 수 있습니다.</p>',
      ],
      tips: ['<strong>Values</strong> 탭에서 정의한 이름을 확인하세요.', '이름의 오타는 <strong>Problems</strong>에서 친절하게 제안합니다.'],
      tasks: {
        change: { text: '<code>Subject</code> 값을 바꾸고 모든 사용 위치가 바뀌는지 확인하세요.', hint: '<code>~ Subject =</code> 뒤의 글을 편집하세요. 따옴표는 필요 없습니다.' },
        'new-name': { text: '<code>~ Time = golden hour</code>처럼 세 번째 이름을 정의하고 <code>~Time</code>을 사용하세요.', hint: '<code>~ Time = golden hour</code> 줄을 추가하고 산문에 <code>~Time</code>을 넣으세요.' },
      },
    },
  },
  hi: {
    prose: {
      intro: [
        '<p>DreamScript फ़ाइल <strong>साधारण लेखन</strong> से शुरू होती है। आपकी हर सामान्य पंक्ति सपने का हिस्सा है — AI कलाकार के लिए विवरण। अभी बस जो दिखता है वह लिखें।</p>',
        '<p><code>//</code> पंक्ति के अंत तक <strong>कमेंट</strong> शुरू करता है और <code>/* … */</code> कई पंक्तियाँ छिपाता है। <strong>खाली पंक्ति</strong> नया पैराग्राफ शुरू करती है।</p>',
      ],
      tips: ['कमेंट सपने तक नहीं पहुँचते, इसलिए उन्हें याद दिलाने के लिए उपयोग करें।', 'Emoji कहीं भी चलती हैं — वे केवल अक्षर हैं।'],
      tasks: {
        'add-line': { text: 'सपने में अपनी एक नई पंक्ति जोड़ें।', hint: 'आखिरी पंक्ति के अंत में क्लिक करें, Enter दबाएँ और कुछ और दिखने वाला लिखें।' },
        comment: { text: '<code>//</code> से कमेंट लिखें और देखें कि वह दाईं ओर नहीं आता।', hint: 'अलग पंक्ति में <code>// my note</code> लिखें। यह केवल संपादक में रहेगा।' },
      },
    },
    names: {
      intro: [
        '<p><strong>टिल्ड</strong> <code>~</code> गद्य से कोड में जाने का रास्ता है। <code>~ Subject = a lighthouse</code> नाम <em>परिभाषित</em> करता है; फिर वाक्य में <code>~Subject</code> उसका मान बन जाता है।</p>',
        '<p><strong>कोट्स की ज़रूरत नहीं</strong>। <code>=</code> के बाद सब टेक्स्ट है जब तक DreamScript संख्या, सूची या गणित न पहचाने। नाम बड़े-छोटे अक्षरों से स्वतंत्र हैं और उनमें स्पेस हो सकते हैं।</p>',
      ],
      tips: ['हर परिभाषित नाम देखने के लिए <strong>Values</strong> टैब खोलें।', 'नाम की टाइपो पर <strong>Problems</strong> में सुझाव मिलता है।'],
      tasks: {
        change: { text: '<code>Subject</code> का मान बदलें और उसके हर उपयोग को बदलते देखें।', hint: '<code>~ Subject =</code> के बाद का टेक्स्ट संपादित करें। कोट्स की ज़रूरत नहीं।' },
        'new-name': { text: '<code>~ Time = golden hour</code> जैसा तीसरा नाम बनाएँ और <code>~Time</code> का उपयोग करें।', hint: '<code>~ Time = golden hour</code> पंक्ति जोड़ें और गद्य में <code>~Time</code> लिखें।' },
      },
    },
  },
};
export { CONTENT };
