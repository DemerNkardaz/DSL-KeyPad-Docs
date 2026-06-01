// Символы
const E = {
	emdash: '\u2014',
	endash: '\u2013',
	minus: '\u2212',
	ellipsis: '\u2026',
	no_break_space: '\u00A0',
	thin_space: '\u2009',
	ensp: '\u2002',
	emsp: '\u2003',
	space: ' ',
};

const punctuation = {
	leftSided: '\u00A1\u00BF\u2E18\u2E2E',
	rightSided: '\u203C\u2049\u2047\u2048\u203D.,!?\u2026',
};

const wallet = '\\$\u20AC\u00A3\u00A5\u20BD\u20B4\u20A3\u20A4';

export type Rule = [RegExp, string] | [(text: string) => string, ''];

interface QuoteSettings {
  outer: [string, string];
  inner: [string, string];
}

function smartQuotes(
	text: string,
  quotes: QuoteSettings = {
    outer: ['«', '»'],
    inner: ['„', '“'],
  }
): string {
	let result = '';
	let level = 0;

	for (let i = 0; i < text.length; i++) {
		const char = text[i];

		if (char !== '"') {
			result += char;
			continue;
		}

		const prev = text[i - 1] ?? '';
		const next = text[i + 1] ?? '';

		const afterSpace = prev === '' || /\s/.test(prev);
		const beforeSpace = next === '' || /\s/.test(next);

		let isOpen: boolean;

		if (level === 0) {
			isOpen = true;
		} else if (afterSpace && !beforeSpace) {
			isOpen = true;
		} else if (!afterSpace && beforeSpace) {
			isOpen = false;
		} else if (!afterSpace && !beforeSpace) {
			isOpen = false;
		} else {
			isOpen = level === 0;
		}

    if (isOpen) {
      const q = level === 0 ? quotes.outer : quotes.inner;
      result += q[0];
      level++;
    } else {
      level = Math.max(0, level - 1);
      const q = level === 0 ? quotes.outer : quotes.inner;
      result += q[1];
    }
	}

	return result;
}

export const typographyRules: Record<string, Rule[]> = {
  common: [
    // Whitespace cleanup
    [/  +/g, ' '],
    [/^\s|\s$/g, ''],

    // Dashes and special chars
    [/(?<!\d)-(\d+)/g, `${E.minus}$1`],
    [/(\d+)-(\d+)/g, `$1${E.endash}$2`],
    [/(\d+|[XIVCMLDZ\u2160-\u2188]+)-(\d+|[XIVCMLDZ\u2160-\u2188]+)/g, `$1${E.endash}$2`],
    [
      new RegExp(
        `([${E.minus}${E.emdash}-])(\\d+)[${E.minus}${E.endash}\\-]([${E.minus}${E.endash}\\-]?\\d+)`,
        'g'
      ),
      `$1$2${E.ellipsis}$3`,
    ],
    [/--/g, E.emdash],
    [/\.\.\./g, E.ellipsis],

    // Apostrophe
    [/'/g, '\u2019'],
  ],

  ru: [
    // 0::Разное
    [/(\d+)[\s\u00A0](%|\u2030|\u2031)/g, '$1$2'],
    [(text: string) => smartQuotes(text), ''],
    [
      new RegExp(
        `(?<=[${punctuation.leftSided}«„\\(\\[])\\s+|(?<!\\s)\\s(?=[${punctuation.rightSided}»"'\\)\\]])`,
        'g'
      ),
      '',
    ],
    [/\.»/g, '».'],
    [
      new RegExp(`(?<!\\d\\s)([${wallet}])\\s(\\d{1,3}(?:\\d{3})*(?:,\\d+)?|\\d+(?:,\\d+)?)`, 'g'),
      `$2${E.no_break_space}$1`,
    ],
    [new RegExp(`(\\d+)\\s([${wallet}])`, 'g'), `$1${E.no_break_space}$2`],

    // 1::Тире
    [new RegExp(`^(${E.emdash})\\s`, 'gm'), `$1${E.no_break_space}`],
    [
      new RegExp(`(?<=[${punctuation.rightSided}])\\s${E.emdash}\\s`, 'g'),
      `${E.no_break_space}${E.emdash}${E.no_break_space}`,
    ],
    [
      new RegExp(`(?<![${punctuation.rightSided}])\\s${E.emdash}\\s`, 'g'),
      `${E.no_break_space}${E.emdash} `,
    ],

    // 2::Цифры
    [/(\d)(?=(\d{3})+(?!\d))/g, `$1${E.no_break_space}`],
    [/(\d)\s(?=\d{3})/g, `$1${E.no_break_space}`],

    // 3::Инициалы
    [
      /([A-ZА-ЯЁ]\.)[\s]([A-ZА-ЯЁ]\.)[\s]([A-ZА-ЯЁ][a-zа-яё]+)/g,
      `$1${E.thin_space}$2${E.thin_space}$3`,
    ],
    [
      /([A-ZА-ЯЁ][a-zа-яё]+)[\s]([A-ZА-ЯЁ]\.)[\s]([A-ZА-ЯЁ]\.)/g,
      `$1${E.thin_space}$2${E.thin_space}$3`,
    ],

    // 4::Союзы и прочее
    [/\s(б|бы|ж|же|ли|ль)(?![а-яА-Я])/gi, `${E.no_break_space}$1`],
    [
      /\s(за|из|до|об|на|но|не|ни|то|от|по|со|или|для|над|под|при|что|если|через|после|перед|г\.|обл\.|кр\.|ст\.|пос\.|с\.|д\.|ул\.|пер\.|пр\.|пр-т\.|просп\.|пл\.|бул\.|б-р\.|наб\.|ш\.|туп\.|оф\.|кв\.|комн\.|под\.|мкр\.|уч\.|вл\.|влад\.|стр\.|корп\.|литер|эт\.|пгт\.|гл\.|рис\.|илл\.|п\.|c\.|№|§|АО|ОАО|ЗАО|ООО|ПАО)\s/gi,
      ` $1${E.no_break_space}`,
    ],

    // 5::Одиночные буквы
    [/(?<![а-яА-ЯёЁa-zA-Z])([а-яА-ЯёЁa-zA-Z])\s/g, `$1${E.no_break_space}`],

    // 6::Конец абзаца
    [
      new RegExp(
        `(?<=[а-яА-ЯёЁa-zA-Z])\\s(?=[а-яА-ЯёЁa-zA-Z]{1,12}[${punctuation.rightSided}]*$)`,
        'gm'
      ),
      E.no_break_space,
    ],
  ],
  en: [
    [
      (text: string) =>
        smartQuotes(text, {
          outer: ['“', '”'],
          inner: ['‘', '’'],
        }),
			'',
		],
		[new RegExp(`([${wallet}])\\s?(\\d+)`, 'g'), `$1$2`],

		[/fi/g, '\uFB01'],
		[/fl/g, '\uFB02'],
	],
};
