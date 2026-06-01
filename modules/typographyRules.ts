// Символы
export const E = {
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

export const punctuation = {
	leftSided: '\u00A1\u00BF\u2E18\u2E2E',
	rightSided: '\u203C\u2049\u2047\u2048\u203D.,!?\u2026',
};

export const wallet = '\\$\u20AC\u00A3\u00A5\u20BD\u20B4\u20A3\u20A4';

type BaseRule = {
	weight?: number;
};

export type RegExpReplaceRule = BaseRule & {
	kind: 'replace';
	rule: RegExp;
	replacement: string;
};

export type RegExpTransformRule = BaseRule & {
	kind: 'transform';
	rule: RegExp;
	transform: (match: RegExpExecArray) => string;
};

export type FunctionRule<T extends any[] = any[]> = BaseRule & {
	kind: 'function';
	rule: (text: string, ...args: T) => string;
	args?: T;
};

export type Rule = RegExpReplaceRule | RegExpTransformRule | FunctionRule;

function newRule(rule: RegExp, replacement: string, weight?: number): Rule;
function newRule(
	rule: RegExp,
	transform: (match: RegExpExecArray) => string,
	weight?: number
): Rule;
function newRule(
	rule: (text: string, ...args: any[]) => string,
	args?: any[],
	weight?: number
): Rule;

function newRule(
	rule: RegExp | ((text: string, ...args: any[]) => string),
	second?: string | ((match: RegExpExecArray) => string) | any[],
	weight: number = 0
): Rule {
	if (typeof rule === 'function') {
		return {
			kind: 'function',
			rule: rule as (text: string, ...args: any[]) => string,
			args: Array.isArray(second) ? (second as any[]) : [],
			weight,
		} as FunctionRule;
	}

	if (typeof second === 'string') {
		return {
			kind: 'replace',
			rule: rule as RegExp,
			replacement: second,
			weight,
		} as RegExpReplaceRule;
	}

	return {
		kind: 'transform',
		rule: rule as RegExp,
		transform: second as (match: RegExpExecArray) => string,
		weight,
	} as RegExpTransformRule;
}

interface QuoteSettings {
	outer: [string, string];
	inner: [string, string];
}

function smartQuotes(
	text: string,
	quotes: QuoteSettings = {
		outer: ['\u00AB', '\u00BB'],
		inner: ['\u201E', '\u201C'],
	}
): string {
	let result = '';
	// Stack tracks which quote char opened each level: '"' or "'"
	const stack: Array<'"' | "'"> = [];

	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		const prev = text[i - 1] ?? '';
		const next = text[i + 1] ?? '';

		if (char === '"') {
			const afterSpace = prev === '' || /\s/.test(prev);
			const beforeSpace = next === '' || /\s/.test(next);

			let isOpen: boolean;
			if (stack.length === 0) {
				isOpen = true;
			} else if (afterSpace && !beforeSpace) {
				isOpen = true;
			} else if (!afterSpace && beforeSpace) {
				isOpen = false;
			} else if (!afterSpace && !beforeSpace) {
				isOpen = false;
			} else {
				isOpen = false;
			}

			if (isOpen) {
				const q = stack.length === 0 ? quotes.outer : quotes.inner;
				result += q[0];
				stack.push('"');
			} else {
				// Find the matching '"' on the stack and pop it
				const matchIdx = [...stack].reverse().indexOf('"');
				if (matchIdx !== -1) {
					stack.splice(stack.length - 1 - matchIdx, 1);
				}
				const q = stack.length === 0 ? quotes.outer : quotes.inner;
				result += q[1];
			}
			continue;
		}

		if (char === "'") {
			const insideDoubleQuotes = stack.includes('"');

			// Apostrophe: letter directly before AND letter/digit directly after
			// e.g. it's, don't, o'clock — not a quote
			const isApostrophe =
				/[a-zA-Z\u0430-\u044F\u0410-\u042F\u0451\u0401]/.test(prev) &&
				/[a-zA-Z\u0430-\u044F\u0410-\u042F\u0451\u04010-9]/.test(next);

			if (isApostrophe || !insideDoubleQuotes) {
				// Pass through; the common apostrophe rule handles ' \u2192 \u2019
				result += char;
				continue;
			}

			// Inside double quotes: treat as inner quote
			const lastDoubleIdx = stack.lastIndexOf('"');
			const hasOpenSingle = stack.slice(lastDoubleIdx + 1).includes("'");

			// If no open single quote yet inside this double-quote level → opening.
			// If one is already open → closing (regardless of spacing).
			const isOpen = !hasOpenSingle;

			if (isOpen) {
				result += quotes.inner[0];
				stack.push("'");
			} else {
				const matchIdx = [...stack].reverse().indexOf("'");
				if (matchIdx !== -1) {
					stack.splice(stack.length - 1 - matchIdx, 1);
				}
				result += quotes.inner[1];
			}
			continue;
		}

		result += char;
	}

	return result;
}

export const typographyRules: Record<string, Rule[]> = {
	common: [
		// Whitespace cleanup
		newRule(/  +/g, ' '),
		newRule(/^\s|\s$/g, ''),

		// Dashes and special chars
		newRule(/(?<!\d)-(\d+)/g, `${E.minus}$1`),
		newRule(/(\d+)-(\d+)/g, `$1${E.endash}$2`),
		newRule(/(\d+|[XIVCMLDZ\u2160-\u2188]+)-(\d+|[XIVCMLDZ\u2160-\u2188]+)/g, `$1${E.endash}$2`),
		newRule(
			new RegExp(
				`([${E.minus}${E.emdash}-])(\\d+)[${E.minus}${E.endash}\\-]([${E.minus}${E.endash}\\-]?\\d+)`,
				'g'
			),
			`$1$2${E.ellipsis}$3`
		),
		newRule(/--/g, E.emdash),
		newRule(/\.\.\./g, E.ellipsis),

		// Apostrophe — runs after smartQuotes (weight 100) so only untouched ' remain
		newRule(/'/g, '\u2019', 200),
	],

	ru: [
		// 0::Разное
		newRule(/(\d+)[\s\u00A0](%|\u2030|\u2031)/g, '$1$2'),
		newRule(smartQuotes, [], 100),
		newRule(
			new RegExp(
				`(?<=[${punctuation.leftSided}«„\\(\\[])\\s+|(?<!\\s)\\s(?=[${punctuation.rightSided}»“\\)\\]])`,
				'g'
			),
			'',
			1000
		),
		newRule(/\.»/g, '».'),
		newRule(
			new RegExp(`(?<!\\d\\s)([${wallet}])\\s(\\d{1,3}(?:\\d{3})*(?:,\\d+)?|\\d+(?:,\\d+)?)`, 'g'),
			`$2${E.no_break_space}$1`
		),
		newRule(new RegExp(`(\\d+)\\s([${wallet}])`, 'g'), `$1${E.no_break_space}$2`),

		// 1::Тире
		newRule(new RegExp(`^(${E.emdash})\\s`, 'gm'), `$1${E.no_break_space}`),
		newRule(
			new RegExp(`(?<=[${punctuation.rightSided}])\\s${E.emdash}\\s`, 'g'),
			`${E.no_break_space}${E.emdash}${E.no_break_space}`
		),
		newRule(
			new RegExp(`(?<![${punctuation.rightSided}])\\s${E.emdash}\\s`, 'g'),
			`${E.no_break_space}${E.emdash} `
		),

		// 2::Цифры
		newRule(/(\d)(?=(\d{3})+(?!\d))/g, `$1${E.no_break_space}`),
		newRule(/(\d)\s(?=\d{3})/g, `$1${E.no_break_space}`),

		// 3::Инициалы
		newRule(
			/([A-ZА-ЯЁ]\.)[\s]([A-ZА-ЯЁ]\.)[\s]([A-ZА-ЯЁ][a-zа-яё]+)/g,
			`$1${E.thin_space}$2${E.thin_space}$3`
		),
		newRule(
			/([A-ZА-ЯЁ][a-zа-яё]+)[\s]([A-ZА-ЯЁ]\.)[\s]([A-ZА-ЯЁ]\.)/g,
			`$1${E.thin_space}$2${E.thin_space}$3`
		),

		// 4::Союзы и прочее
		newRule(/\s(б|бы|ж|же|ли|ль)(?![а-яА-Я])/gi, `${E.no_break_space}$1`),
		newRule(
			/\s(за|из|до|об|на|но|не|ни|то|от|по|со|или|для|над|под|при|что|если|через|после|перед|г\.|обл\.|кр\.|ст\.|пос\.|с\.|д\.|ул\.|пер\.|пр\.|пр-т\.|просп\.|пл\.|бул\.|б-р\.|наб\.|ш\.|туп\.|оф\.|кв\.|комн\.|под\.|мкр\.|уч\.|вл\.|влад\.|стр\.|корп\.|литер|эт\.|пгт\.|гл\.|рис\.|илл\.|п\.|c\.|№|§|АО|ОАО|ЗАО|ООО|ПАО)\s/gi,
			` $1${E.no_break_space}`
		),

		// 5::Одиночные буквы
		newRule(/(?<![а-яА-ЯёЁa-zA-Z])([а-яА-ЯёЁa-zA-Z])\s/g, `$1${E.no_break_space}`),

		// 6::Конец абзаца
		newRule(
			new RegExp(
				`(?<=[а-яА-ЯёЁa-zA-Z])\\s(?=[а-яА-ЯёЁa-zA-Z]{1,12}[${punctuation.rightSided}]*$)`,
				'gm'
			),
			E.no_break_space
		),
	],

	en: [
		newRule(smartQuotes, [{ outer: ['“', '”'], inner: ['‘', '’'] }], 100),
		newRule(
			new RegExp(
				`(?<=[${punctuation.leftSided}“‘\\(\\[])\\s+|(?<!\\s)\\s(?=[${punctuation.rightSided}”’\\)\\]])`,
				'g'
			),
			'',
			1000
		),
		newRule(new RegExp(`([${wallet}])\\s?(\\d+)`, 'g'), `$1$2`),
		newRule(/fi/g, '\uFB01'),
		newRule(/fl/g, '\uFB02'),
		newRule(/ffi/g, '\uFB03'),
		newRule(/ffl/g, '\uFB04'),
	],
};

export function registerRule(locale: string, rule: Rule) {
	if (!typographyRules[locale]) {
		typographyRules[locale] = [];
	}

	typographyRules[locale].push(rule);
}
