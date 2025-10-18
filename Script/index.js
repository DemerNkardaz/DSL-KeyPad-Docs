
const SUPPORTED_LANGUAGES = ['en-US', 'ru-RU'];
const urlParams = new URLSearchParams(window.location.search);
const deviceIsMobile = (() => {
  const ua = navigator.userAgent || navigator.vendor || window.opera;

  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet|Kindle|Silk|nexus\s*[0-9]+|playbook|BB10|MeeGo|Tizen|Sailfish/i.test(ua);

  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  const isSmallScreen = Math.min(window.screen.width, window.screen.height) < 900;

  return isMobileUA || (isTouch && isSmallScreen);
})();


function detectLanguage() {
	const urlLang = urlParams.get('tl');
	if (urlLang && SUPPORTED_LANGUAGES.includes(urlLang)) {
		return urlLang;
	}

	const browserLanguages = navigator.languages || [navigator.language || navigator.userLanguage];

	for (const lang of browserLanguages) {
		if (SUPPORTED_LANGUAGES.includes(lang)) {
			return lang;
		}
	}

	for (const lang of browserLanguages) {
		const baseLang = lang.split('-')[0];
		const match = SUPPORTED_LANGUAGES.find(supported =>
			supported.startsWith(baseLang)
		);
		if (match) {
			return match;
		}
	}

	return 'en-US';
}

const language = detectLanguage();
const randomLetters = [
	"\u01F7\u00DE\uA768\u00D8\u016E\u00C7\u01E2\uA728\u1E9E\uA7D5\u01B1\u1EB3\u1D76\u1F86\u1F23\u03DE\u046C\uA64A\u0518\uA650\u0466\u040F\uA65E\uA68E\uD83D\uDF0D\u2645\u2BE0\u2BE1\u263F\uD83D\uDF7B\u262F\u2630\u2636\u16D7\u16DF\u16C9\u2625\u269A\u2624\u2E19\u2627", // Random
	"\uD83D\uDF01\uD83D\uDF03\uD83D\uDF02\uD83D\uDF04\uD83D\uDF47\uD83D\uDF5E\uD83D\uDF32\uD83D\uDF05\uD83D\uDF06\uD83D\uDF09\uD83D\uDF0A\uD83D\uDF0D\uD83D\uDF0F\uD83D\uDF14\uD83D\uDF41\uD83D\uDF3F\uD83D\uDF36\uD83D\uDF58\uD83D\uDF57\uD83D\uDF5B\uD83D\uDF29\uD83D\uDF2A\uD83D\uDF3E\uD83D\uDF20\uD83D\uDF11\u263F\u2609\u263E\u2641\uD83D\uDF6A\uD83D\uDF69\uD83D\uDF2F\uD83D\uDF25\uD83D\uDF39\uD83D\uDF18\uD83D\uDF1B", // Alchemy
	"\u2609\u263E\u263F\u2640\uD83D\uDF28\u2642\u2643\u2644\u2645\u2646\u2BE0\u2BE1\u2BE2\u2BE3\u2BE4\u2BE5\u2BE6\u2BE7\u2647\u2BD3\u2BD4\u2BD5\u2BD6\u26B3\u2BF2\u2BF0\u2BF1\uD83D\uDF7B\uD83D\uDF7C\uD83D\uDF7D\uD83D\uDF7E\uD83D\uDF7F\u2BD7\u2BD8\u26B6\u26B7\u2BD9\u2BDA\u26B4\u26B5\u26B8\u2BDD", // Astrology
	"\u2648\u2649\u264A\u264B\u264C\u264D\u264E\u264F\u2650\u2651\u2652\u2653\u26CE\uFE0E\u260A\u260B\u260C\u260D\u26B9\u26BA\u26BB\u26BC\u211E\u2BF3\u2BF4\u2BF5\u2BF6\u2BF7\u2BF8\uD83D\uDF74\uD83D\uDF75\uD83D\uDF76", // Zodiacsandsecondastrology
	"\u262F\uFE0E\u268B\u268A\u268F\u268E\u268D\u268C\u2630\u2631\u2632\u2633\u2634\u2635\u2636\u2637\u4DC0\u4DC1\u4DC2\u4DC3\u4DC4\u4DC5\u4DC6\u4DC7\u4DC8\u4DC9", // Yijing
	"\uD83E\uDE60\uD83E\uDE61\uD83E\uDE61\uD83E\uDE62\uD83E\uDE62\uD83E\uDE63\uD83E\uDE63\uD83E\uDE64\uD83E\uDE64\uD83E\uDE65\uD83E\uDE65\uD83E\uDE66\uD83E\uDE66\uD83E\uDE66\uD83E\uDE66\uD83E\uDE66\uD83E\uDE67\uD83E\uDE68\uD83E\uDE68\uD83E\uDE69\uD83E\uDE69\uD83E\uDE6A\uD83E\uDE6A\uD83E\uDE6B\uD83E\uDE6B\uD83E\uDE6C\uD83E\uDE6C\uD83E\uDE6D\uD83E\uDE6D\uD83E\uDE6D\uD83E\uDE6D\uD83E\uDE6D", // Xiangqi
	"\u265A\u265B\u265C\u265C\u265D\u265D\u265E\u265E\u265F\u265F\u265F\u265F\u265F\u265F\u265F\u265F\uD83E\uDE49\uD83E\uDE51\uD83E\uDE52\uD83E\uDE53", // Chess
	"\u00A4\u20A0\u20B3\u00A2\u20B5\u20A1\u0024\u20AF\u058F\u07FE\u20AC\u20A3\u20B2\u20AD\u20BE\u20A6\u00A3\u20B6\u20B7\u20BD\u20B4\u20A4\u20BA\u20B9\u20A9\u00A5\u5186\u5143\u20AB\u20AE\u20B8\u20AA\u20B1\u20BF", // Wallets
	"\u16A8\u16D2\u16DE\u16D6\u16A0\u16B7\u16BA\u16C1\u16C7\u16C3\u16B2\u16DA\u16D7\u16BE\u16DC\u16DF\u16C8\u16B1\u16CA\u16CF\u16A6\u16B9\u16C9\u16AA\u16AB\u16B3\u16E0\u16B8\u16BB\u16C4\u16E1\u16E4\u16E3\u16DD\u16A9\u16E2\u16CB\u16E5\u16A3\u16EE\u16EF\u16F0", // Runes
	"\u2C00\u2C01\u2C02\u2C03\u2C04\u2C05\u2C06\u2C07\u2C08\u2C0A\u2C09\u2C0B\u2C0C\u2C0D\u2C0E\u2C0F\u2C10\u2C11\u2C12\u2C13\u2C14\u2C15", // Glagolitic
	"\u2C2B\u2C16\u2C17\u2C18\u2C19\u2C1A\u2C1C\u2C1D\u2C1E\u2C1B\u2C1F\u2C20\u2C21\u2C26\u2C22\u2C23\u2C24\u2C27\u2C28\u2C29\u2C2A\u2C2C", // Glagolitic
	"\uD803\uDC00\uD803\uDC03\uD803\uDC06\uD803\uDC07\uD803\uDC32\uD803\uDC22\uD803\uDC2D\uD803\uDC2F\uD803\uDC41\uD803\uDC14\uD803\uDC21\uD803\uDC28\uD803\uDC2A\uD803\uDC26\uD803\uDC48\uD803\uDC09\uD803\uDC0B\uD803\uDC11\uD803\uDC13\uD803\uDC1E\uD803\uDC20\uD803\uDC23\uD803\uDC24\uD803\uDC3A\uD803\uDC3C\uD803\uDC3D\uD803\uDC3E\uD803\uDC43\uD803\uDC45\uD803\uDC16\uD803\uDC18\uD803\uDC0D\uD803\uDC0F\uD803\uDC34\uD803\uDC1A\uD803\uDC38\uD803\uDC1C\uD803\uDC36\uD803\uDC31\uD803\uDC3F\uD803\uDC30\uD803\uDC47", // OldTurkicOrkhon
	"\uD800\uDF30\uD800\uDF31\uD800\uDF33\uD800\uDF34\uD800\uDF46\uD800\uDF32\uD800\uDF37\uD800\uDF48\uD800\uDF39\uD800\uDF3A\uD800\uDF3B\uD800\uDF3C\uD800\uDF3D\uD800\uDF49\uD800\uDF40\uD800\uDF35\uD800\uDF42\uD800\uDF43\uD800\uDF44\uD800\uDF38\uD800\uDF3F\uD800\uDF45\uD800\uDF47\uD800\uDF3E\uD800\uDF36\uD800\uDF41\uD800\uDF4A", // Gothic
	"\u0800\u080F\u0801\u0805\u0803\u0810\u0802\u0804\u0807\u080A\u080B\u080C\u080D\u0812\u0813\u0814\u0811\u080E\u0815\u0808\u0809\u0806\u083E\u0830\u083C\u083D\u0831\u0832\u083B\u0833\u0834\u0835\u0836\u0838\u0839\u083A\u0837", // Samaritan
	"\u0408\u0407\u0476\u040E\u04F0\u04EE\u049A\u046E\u046A\uA65A\u0466\u0470\u04E8\u0460\u04E2\u04E4\uA696\uA68E\u04A8\u04BA\u04B0\u040B\u0402\u04C1\uA650\uA65E\u0472\u0409\u0462\u0464\uA652\u046C\u0468\uA648",
	"\uA732\u00C6\uA734\uA736\uA738\uA73C\u0238\uAB61\uFB00\uFB01\uFB02\uFB04\uFB03\u0132\u2114\u0152\uA74E\u0222\uFB05\uFB06\uA728\u1D6B\u1E9E\uA760", // Latin
	"\u2160\u2161\u2162\u2163\u2164\u2165\u2166\u2167\u2168\u2169\u216A\u216B\u216C\u216D\u216E\u216F\u2181\u2182\u2187\u2188" // Roman
];

const titleRandomLetters = {
	// "\u046C": "big_yus_iotified",
	// "\u262F\uFE0E": "yin_yang",
	// "\u2631": "trigram_dui",
	// "\u2634": "trigram_xun",
	// "\u2635": "trigram_kan",
	// "\u4DCA": "hexagram_tai",
	// "\u4DDD": "hexagram_li",
	// "\uD834\uDF0C": "tetragram_shang",
	// "\uD834\uDF1D": "tetragram_le",
	// "\u2640\uFE0E": "copper_venus",
	// "\u2642\uFE0E": "iron_mars",
	// "\uD83D\uDF0D": "sulfur",
	// "\u2BE1": "hades",
	// "\u2BE0": "cupido",
	// "\u2BE6": "vulcanus",
	// "\u2625": "ankh",
	// "\u269A\u2624": "caduceus",
	// "\u20A9": "korean_won",
	// "\u00A5": "japanese_yen",
	// "\u232C": "benzene_ring",
	// "\uA68E": "abkhazian_tswe",
	// "\uA65E": "romanian_yn",
	// "\u00DE": "thorn",
	// "\uA7BC": "egyptological_yod",
	// "\u1FAE": "omega_psili_perispomeni_prosgegrammeni",
	// "\u0800": "samaritan_alaf",
	// "\u16C9": "algiz",
	// "\u16A0": "fehu",
	// "\u16DF": "othala",
	// "\u16EF": "tvimadur",
	// "\uD803\uDC0B": "orkhon_aeb",
	// "\uD803\uDC43": "orkhon_at",
	// "\uD803\uDC0C": "yenisei_aeb",
	// "\uD803\uDC44": "yenisei_at",
	// "\u028A": "ipa_near_close_near_back_rounded_vowel",
	// "\u02A1": "ipa_epiglottal_polsive",
	"\uD83E\uDE51": "chess_knight_queen",
	// "\uD83C\uDCBD": "card_queen_of_hearts",
	// "\uD83C\uDCDC": "card_knight_of_clubs",
	// "\uD83E\uDE67": "xiangqi_jiang",
	// "\uD83E\uDE60": "xiangqi_shuai",
	// "\uD83E\uDE62": "xiangqi_xiang",
}

const YiJingRing = () => generateRings(
	[
		'\u262F',
		'\u268C\u268E\u268F[ym:\u268D]',
		'\u2630\u2634\u2635\u2636\u2637\u2633\u2632\u2631',
		'\u4DC0\u4DC2\u4DC4\u4DC6\u4DC8\u4DCA\u4DCC\u4DCE\u4DD0\u4DD2\u4DD4\u4DD6\u4DD8\u4DDA\u4DDC\u4DDE\u4DE0\u4DE2\u4DE4\u4DE6\u4DE8\u4DEA\u4DEC\u4DEE\u4DF0\u4DF2\u4DF4\u4DF6\u4DF8\u4DFA\u4DFC\u4DFE\u4DC1\u4DC3\u4DC5\u4DC7\u4DC9\u4DCB\u4DCD\u4DCF\u4DD1\u4DD3\u4DD5\u4DD7\u4DD9\u4DDB\u4DDD\u4DDF\u4DE1\u4DE3\u4DE5\u4DE7\u4DE9\u4DEB\u4DED\u4DEF\u4DF1\u4DF3\u4DF5\u4DF7\u4DF9\u4DFB\u4DFD\u4DFF'
	],
	256,
	'random-letters',
	{
		1280: 200,
		900: 150,
		700: 128,
		600: 100,
	}
).animate([0, 1, 2, 3], [-120, 120, -120, 120]);
const TaiXuanJingRing = () => generateRings(
	[
		'\uD834\uDF00\u268A\u268B',
		'\u268C\u268E\u268F\u268D\uD834\uDF01\uD834\uDF02\uD834\uDF03\uD834\uDF04\uD834\uDF05',
		'\uD834\uDF06\uD834\uDF07\uD834\uDF08\uD834\uDF09\uD834\uDF0A\uD834\uDF0B\uD834\uDF0C\uD834\uDF0D\uD834\uDF0E\uD834\uDF0F\uD834\uDF10\uD834\uDF11\uD834\uDF12\uD834\uDF13\uD834\uDF14\uD834\uDF15\uD834\uDF16\uD834\uDF17\uD834\uDF18\uD834\uDF19\uD834\uDF1A\uD834\uDF1A\uD834\uDF1B\uD834\uDF1C\uD834\uDF1D\uD834\uDF1E\uD834\uDF1F\uD834\uDF20\uD834\uDF21\uD834\uDF22\uD834\uDF23\uD834\uDF24\uD834\uDF25\uD834\uDF26\uD834\uDF27\uD834\uDF28\uD834\uDF29\uD834\uDF2A\uD834\uDF2B\uD834\uDF2C\uD834\uDF2D\uD834\uDF2E\uD834\uDF2F\uD834\uDF30\uD834\uDF31\uD834\uDF32\uD834\uDF33\uD834\uDF34\uD834\uDF35\uD834\uDF36\uD834\uDF37\uD834\uDF38\uD834\uDF39\uD834\uDF3A\uD834\uDF3B\uD834\uDF3C\uD834\uDF3D\uD834\uDF3E\uD834\uDF3F\uD834\uDF40\uD834\uDF41\uD834\uDF42\uD834\uDF43\uD834\uDF44\uD834\uDF45\uD834\uDF46\uD834\uDF47\uD834\uDF48\uD834\uDF49\uD834\uDF4A\uD834\uDF4B\uD834\uDF4C\uD834\uDF4D\uD834\uDF4E\uD834\uDF4F\uD834\uDF50\uD834\uDF51\uD834\uDF52\uD834\uDF53\uD834\uDF54\uD834\uDF55\uD834\uDF56'
	],
	256,
	'random-letters',
	{
		1280: 200,
		900: 150,
		700: 128,
		600: 100,
	},
	0.55
).animate([0, 1, 2], [-120, 120, -120]);
const ChessInit = deviceIsMobile ? false : () => new AutoChess('#random-letters', {scale: 0.72});


const titleRandomLettersAttachedCalls = {
	"\u262F\uFE0E": YiJingRing,
	"\u2631": YiJingRing,
	"\u2634": YiJingRing,
	"\u2635": YiJingRing,
	"\u4DCA": YiJingRing,
	"\u4DDD": YiJingRing,
	"\uD834\uDF0C": TaiXuanJingRing,
	"\uD834\uDF1D": TaiXuanJingRing,
	"\uD83E\uDE51": ChessInit,
}

const hellenicPairs = {
	'α': 'Alpha',
	'β': 'Beta',
	'γ': 'Gamma',
	'δ': 'Delta',
	'ε': 'Epsilon',
	'ζ': 'Zeta',
	'η': 'Eta',
	'θ': 'Theta',
	'ι': 'Iota',
	'κ': 'Kappa',
	'λ': 'Lambda',
	'μ': 'Mu',
	'ν': 'Nu',
	'ξ': 'Xi',
	'ο': 'Omicron',
	'π': 'Pi',
	'ρ': 'Rho',
	'σ': 'Sigma',
	'τ': 'Tau',
	'υ': 'Upsilon',
	'φ': 'Phi',
	'χ': 'Chi',
	'ψ': 'Psi',
	'ω': 'Omega'
};

function returnHellenicStatus(string) {
	const match = string.match(/[α-ω]/i);
	return match ? hellenicPairs[match[0]] : null;
}

const releaseInfoPromise = getLatestReleaseInfo();
let releaseInfoCache = null;

releaseInfoPromise.then(info => { releaseInfoCache = info });

async function getLatestReleaseInfo() {
	try {
		const jsdelivrResponse = await fetch(
			'https://data.jsdelivr.com/v1/package/gh/DemerNkardaz/DSL-KeyPad'
		);

		if (!jsdelivrResponse.ok) {
			throw new Error(`jsDelivr API error: ${jsdelivrResponse.status}`);
		}

		const jsdelivrData = await jsdelivrResponse.json();
		const latestVersion = jsdelivrData.versions[0];

		if (!latestVersion) {
			throw new Error('No latest version found');
		}

		let releaseName = `DSL KeyPad ${latestVersion}`;
		try {
			const githubResponse = await fetch(
				'https://api.github.com/repos/DemerNkardaz/DSL-KeyPad/releases/latest'
			);

			if (githubResponse.ok) {
				const githubData = await githubResponse.json();
				releaseName = githubData.name || releaseName;
			}
		} catch (error) { }

		return {
			success: true,
			version: latestVersion,
			name: releaseName,
			downloadUrl: `https://github.com/DemerNkardaz/DSL-KeyPad/releases/download/${latestVersion}/DSL-KeyPad-${latestVersion}.zip`
		};

	} catch (error) {
		return {
			success: false,
			error: error.message
		};
	}
}

function DownloadLastRelease() {
	if (!releaseInfoCache) {
		return false;
	}

	if (!releaseInfoCache.success) {
		return false;
	}

	const link = document.createElement('a');
	link.href = releaseInfoCache.downloadUrl;
	link.download = `DSL-KeyPad-${releaseInfoCache.version}.zip`;
	link.target = '_blank';
	link.rel = 'noopener noreferrer';

	link.click();

	return false;
}