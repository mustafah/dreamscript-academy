// Intro, tip, task, and hint translations for Arabic and European locales.
const CONTENT = {
  ar: {
    prose: {
      intro: [
        '<p>يبدأ ملف DreamScript بـ<strong>كتابة عادية</strong>. كل سطر تكتبه هو جزء من الحلم — وصف سيقرأه فنان ذكاء اصطناعي. لا يوجد ما تتعلمه بعد: اكتب ما تراه.</p>',
        '<p>يساعدك رمزان على إبقاء الملاحظات خارج الحلم. يبدأ <code>//</code> <strong>تعليقًا</strong> حتى نهاية السطر، بينما يخفي <code>/* … */</code> كل ما بين العلامتين حتى عبر عدة أسطر. يبدأ <strong>السطر الفارغ</strong> فقرة جديدة.</p>',
      ],
      tips: ['لا تصل التعليقات إلى الحلم، فاستخدمها لكتابة تذكيراتك.', 'الإيموجي مرحّب به في أي مكان — فهو مجرد محارف.'],
      tasks: {
        'add-line': { text: 'أضف سطرًا جديدًا من اختيارك إلى الحلم.', hint: 'انقر في نهاية السطر الأخير، اضغط Enter، ثم صف شيئًا آخر تراه.' },
        comment: { text: 'اكتب تعليقًا باستخدام <code>//</code> ولاحظ أنه لا يظهر على اليمين.', hint: 'اكتب <code>// my note</code> في سطر مستقل. يبقى في المحرر لا في تبويب الحلم.' },
      },
    },
    names: {
      intro: [
        '<p>علامة <strong>التلدة</strong> <code>~</code> هي طريقك من النثر إلى الكود. يعرّف <code>~ Subject = a lighthouse</code> اسمًا؛ وبعدها يُستبدل <code>~Subject</code> داخل أي جملة بقيمته.</p>',
        '<p>لاحظ ما ينقص: <strong>لا توجد علامات اقتباس</strong>. كل ما بعد <code>=</code> نص حتى يرى DreamScript سببًا لاعتباره رقمًا أو قائمة أو عملية حسابية. الأسماء مرنة أيضًا — <code>Subject</code> و<code>subject</code> و<code>SUBJECT</code> اسم واحد، ويمكن أن تحتوي مسافات.</p>',
      ],
      tips: ['افتح تبويب <strong>Values</strong> لترى كل اسم عرّفته.', 'يعطيك الخطأ الإملائي في الاسم اقتراحًا لطيفًا في <strong>Problems</strong>.'],
      tasks: {
        change: { text: 'غيّر قيمة <code>Subject</code> وشاهد تغيّر كل استخداماتها.', hint: 'عدّل النص بعد <code>~ Subject =</code>. لا تحتاج إلى علامات اقتباس.' },
        'new-name': { text: 'عرّف اسمًا ثالثًا، مثل <code>~ Time = golden hour</code>، واستخدمه مع <code>~Time</code>.', hint: 'أضف السطر <code>~ Time = golden hour</code> ثم اكتب <code>~Time</code> داخل سطر النثر.' },
      },
    },
  },
  fr: {
    prose: {
      intro: [
        '<p>Un fichier DreamScript commence par de l’<strong>écriture simple</strong>. Chaque ligne ordinaire devient un fragment du rêve — la description que l’artiste IA lira. Écrivez simplement ce que vous voyez.</p>',
        '<p><code>//</code> lance un <strong>commentaire</strong> jusqu’à la fin de la ligne, tandis que <code>/* … */</code> masque plusieurs lignes. Une <strong>ligne vide</strong> commence un nouveau paragraphe.</p>',
      ],
      tips: ['Les commentaires ne vont jamais dans le rêve : utilisez-les comme pense-bêtes.', 'Les emoji sont acceptés partout : ce sont de simples caractères.'],
      tasks: {
        'add-line': { text: 'Ajoutez une nouvelle ligne de votre choix au rêve.', hint: 'Cliquez à la fin de la dernière ligne, appuyez sur Entrée et décrivez autre chose.' },
        comment: { text: 'Écrivez un commentaire avec <code>//</code> et vérifiez qu’il n’apparaît pas à droite.', hint: 'Tapez <code>// my note</code> sur sa propre ligne. Il reste dans l’éditeur.' },
      },
    },
    names: {
      intro: [
        '<p>Le <strong>tilde</strong> <code>~</code> vous fait passer de la prose au code. <code>~ Subject = a lighthouse</code> <em>définit</em> un nom ; ensuite <code>~Subject</code> est remplacé par sa valeur.</p>',
        '<p>Pas de <strong>guillemets</strong> : tout ce qui suit <code>=</code> est du texte jusqu’à ce que DreamScript reconnaisse un nombre, une liste ou un calcul. Les noms ignorent la casse et peuvent contenir des espaces.</p>',
      ],
      tips: ['Ouvrez l’onglet <strong>Values</strong> pour voir les noms définis.', 'Une faute dans un nom déclenche une suggestion dans <strong>Problems</strong>.'],
      tasks: {
        change: { text: 'Changez la valeur de <code>Subject</code> et observez tous ses usages changer.', hint: 'Modifiez le texte après <code>~ Subject =</code>. Les guillemets sont inutiles.' },
        'new-name': { text: 'Définissez un troisième nom, par exemple <code>~ Time = golden hour</code>, et utilisez <code>~Time</code>.', hint: 'Ajoutez la ligne <code>~ Time = golden hour</code>, puis écrivez <code>~Time</code> dans la prose.' },
      },
    },
  },
  es: {
    prose: {
      intro: [
        '<p>Un archivo DreamScript empieza como <strong>texto normal</strong>. Cada línea se convierte en un fragmento del sueño — la descripción que leerá un artista de IA. Escribe lo que ves.</p>',
        '<p><code>//</code> inicia un <strong>comentario</strong> hasta el final de la línea y <code>/* … */</code> oculta varias líneas. Una <strong>línea vacía</strong> empieza otro párrafo.</p>',
      ],
      tips: ['Los comentarios nunca llegan al sueño: úsalos para dejar recordatorios.', 'Los emoji funcionan en cualquier lugar; solo son caracteres.'],
      tasks: {
        'add-line': { text: 'Añade una línea nueva al sueño.', hint: 'Haz clic al final de la última línea, pulsa Enter y describe algo más.' },
        comment: { text: 'Escribe un comentario con <code>//</code> y comprueba que no aparece a la derecha.', hint: 'Escribe <code>// my note</code> en una línea propia. Se queda en el editor.' },
      },
    },
    names: {
      intro: [
        '<p>La <strong>tilde</strong> <code>~</code> te lleva de la prosa al código. <code>~ Subject = a lighthouse</code> <em>define</em> un nombre; después <code>~Subject</code> se sustituye por su valor.</p>',
        '<p>No hacen falta <strong>comillas</strong>: todo después de <code>=</code> es texto hasta que DreamScript detecta un número, una lista o matemáticas. Los nombres ignoran mayúsculas y pueden tener espacios.</p>',
      ],
      tips: ['Abre la pestaña <strong>Values</strong> para ver todos los nombres.', 'Un error tipográfico recibe una sugerencia amable en <strong>Problems</strong>.'],
      tasks: {
        change: { text: 'Cambia el valor de <code>Subject</code> y observa cómo cambia cada uso.', hint: 'Edita el texto después de <code>~ Subject =</code>. No necesitas comillas.' },
        'new-name': { text: 'Define un tercer nombre, por ejemplo <code>~ Time = golden hour</code>, y úsalo con <code>~Time</code>.', hint: 'Añade <code>~ Time = golden hour</code> y escribe <code>~Time</code> en la prosa.' },
      },
    },
  },
  de: {
    prose: {
      intro: [
        '<p>Eine DreamScript-Datei beginnt mit <strong>normalem Text</strong>. Jede gewöhnliche Zeile wird zu einem Traumfragment — der Beschreibung für ein KI-Kunstmodell. Schreibe einfach, was du siehst.</p>',
        '<p><code>//</code> startet einen <strong>Kommentar</strong> bis zum Zeilenende, <code>/* … */</code> blendet mehrere Zeilen aus. Eine <strong>leere Zeile</strong> beginnt einen neuen Absatz.</p>',
      ],
      tips: ['Kommentare erreichen den Traum nie; nutze sie als Notizen.', 'Emoji funktionieren überall — sie sind einfach Zeichen.'],
      tasks: {
        'add-line': { text: 'Füge eine eigene Zeile zum Traum hinzu.', hint: 'Klicke ans Ende der letzten Zeile, drücke Enter und beschreibe etwas Neues.' },
        comment: { text: 'Schreibe einen Kommentar mit <code>//</code> und beobachte, dass er rechts nicht erscheint.', hint: 'Tippe <code>// my note</code> in eine eigene Zeile. Er bleibt im Editor.' },
      },
    },
    names: {
      intro: [
        '<p>Mit der <strong>Tilde</strong> <code>~</code> wechselst du von Prosa zu Code. <code>~ Subject = a lighthouse</code> <em>definiert</em> einen Namen; später wird <code>~Subject</code> durch seinen Wert ersetzt.</p>',
        '<p>Keine <strong>Anführungszeichen</strong>: Alles nach <code>=</code> ist Text, bis DreamScript eine Zahl, Liste oder Rechnung erkennt. Namen ignorieren Groß-/Kleinschreibung und dürfen Leerzeichen enthalten.</p>',
      ],
      tips: ['Im Tab <strong>Values</strong> siehst du alle definierten Namen.', 'Ein Tippfehler in einem Namen erzeugt einen Vorschlag unter <strong>Problems</strong>.'],
      tasks: {
        change: { text: 'Ändere den Wert von <code>Subject</code> und beobachte alle Verwendungen.', hint: 'Bearbeite den Text nach <code>~ Subject =</code>. Anführungszeichen brauchst du nicht.' },
        'new-name': { text: 'Definiere einen dritten Namen, etwa <code>~ Time = golden hour</code>, und verwende <code>~Time</code>.', hint: 'Füge <code>~ Time = golden hour</code> hinzu und schreibe <code>~Time</code> in die Prosa.' },
      },
    },
  },
  'pt-BR': {
    prose: {
      intro: [
        '<p>Um arquivo DreamScript começa como <strong>texto comum</strong>. Cada linha vira um fragmento do sonho — a descrição que um artista de IA vai ler. Escreva o que você vê.</p>',
        '<p><code>//</code> inicia um <strong>comentário</strong> até o fim da linha e <code>/* … */</code> esconde várias linhas. Uma <strong>linha vazia</strong> começa outro parágrafo.</p>',
      ],
      tips: ['Comentários nunca chegam ao sonho; use-os como lembretes.', 'Emoji pode aparecer em qualquer lugar: são apenas caracteres.'],
      tasks: {
        'add-line': { text: 'Adicione uma linha sua ao sonho.', hint: 'Clique no fim da última linha, pressione Enter e descreva outra coisa.' },
        comment: { text: 'Escreva um comentário com <code>//</code> e note que ele não aparece à direita.', hint: 'Digite <code>// my note</code> em uma linha própria. Ele fica no editor.' },
      },
    },
    names: {
      intro: [
        '<p>O <strong>til</strong> <code>~</code> leva você da prosa ao código. <code>~ Subject = a lighthouse</code> <em>define</em> um nome; depois <code>~Subject</code> é substituído pelo valor.</p>',
        '<p>Sem <strong>aspas</strong>: tudo depois de <code>=</code> é texto até o DreamScript reconhecer número, lista ou matemática. Nomes ignoram maiúsculas e podem ter espaços.</p>',
      ],
      tips: ['Abra a aba <strong>Values</strong> para ver cada nome definido.', 'Um erro de digitação sugere o nome certo em <strong>Problems</strong>.'],
      tasks: {
        change: { text: 'Mude o valor de <code>Subject</code> e veja todos os usos mudarem.', hint: 'Edite o texto depois de <code>~ Subject =</code>. Não precisa de aspas.' },
        'new-name': { text: 'Defina um terceiro nome, como <code>~ Time = golden hour</code>, e use <code>~Time</code>.', hint: 'Adicione <code>~ Time = golden hour</code> e escreva <code>~Time</code> na prosa.' },
      },
    },
  },
};
export { CONTENT };
