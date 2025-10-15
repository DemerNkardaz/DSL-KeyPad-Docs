const SUPPORTED_LANGUAGES = ['en-US', 'ru-RU'];
const locale = new Intl.DateTimeFormat().resolvedOptions().locale;
const language = SUPPORTED_LANGUAGES.includes(locale) ? locale : 'en-US';
const randomLetters = [
	"ǷÞꝨØŮÇǢꜨẞꟕƱẳᵶᾆἣϞѬꙊԘꙐѦЏꙞꚎ🜍♅⯠⯡☿🝻☯☰☶ᛗᛟᛉ☥⚚☤⸙☧", // Random
	"🜁🜃🜂🜄🝇🝞🜲🜅🜆🜉🜊🜍🜏🜔🝁🜿🜶🝘🝗🝛🜩🜪🜾🜠🜑☿☉☾♁🝪🝩🜯🜥🜹🜘🜛", // Alchemy
	"☉☾☿♀🜨♂♃♄♅♆⯠⯡⯢⯣⯤⯥⯦⯧♇⯓⯔⯕⯖⚳⯲⯰⯱🝻🝼🝽🝾🝿⯗⯘⚶⚷⯙⯚⚴⚵⚸⯝", // Astrology
	"♈♉♊♋♌♍♎♏♐♑♒♓⛎︎☊☋☌☍⚹⚺⚻⚼℞⯳⯴⯵⯶⯷⯸🝴🝵🝶", // Zodiacs and second astrology
	"☯︎⚋⚊⚏⚎⚍⚌☰☱☲☳☴☵☶☷䷀䷁䷂䷃䷄䷅䷆䷇䷈䷉", // Yijing
	"🩠🩡🩡🩢🩢🩣🩣🩤🩤🩥🩥🩦🩦🩦🩦🩦🩧🩨🩨🩩🩩🩪🩪🩫🩫🩬🩬🩭🩭🩭🩭🩭", // Xiangqi
	"♚♛♜♜♝♝♞♞♟♟♟♟♟♟♟♟🩉🩑🩒🩓", // Chess
	"¤₠₳¢₵₡$₯֏߾€₣₲₭₾₦£₶₷₽₴₤₺₹₩¥円元₫₮₸₪₱₿", // Wallets
	"ᚨᛒᛞᛖᚠᚷᚺᛁᛇᛃᚲᛚᛗᚾᛜᛟᛈᚱᛊᛏᚦᚹᛉᚪᚫᚳᛠᚸᚻᛄᛡᛤᛣᛝᚩᛢᛋᛥᚣᛮᛯᛰ", // Runes
	"ⰀⰁⰂⰃⰄⰅⰆⰇⰈⰊⰉⰋⰌⰍⰎⰏⰐⰑⰒⰓⰔⰕⰫⰖⰗⰘⰙⰚⰜⰝⰞⰛⰟⰠⰡⰦⰢⰣⰤⰧⰨⰩⰪⰬ", // Glagolitic
	"𐰀𐰃𐰆𐰇𐰲𐰢𐰭𐰯𐱁𐰔𐰡𐰨𐰪𐰦𐱈𐰉𐰋𐰑𐰓𐰞𐰠𐰣𐰤𐰺𐰼𐰽𐰾𐱃𐱅𐰖𐰘𐰍𐰏𐰴𐰚𐰸𐰜𐰶𐰱𐰿𐰰𐱇", // Old Turkic Orkhon
	"𐌰𐌱𐌳𐌴𐍆𐌲𐌷𐍈𐌹𐌺𐌻𐌼𐌽𐍉𐍀𐌵𐍂𐍃𐍄𐌸𐌿𐍅𐍇𐌾𐌶𐍁𐍊", // Gothic
	"ࠀࠏࠁࠅࠃࠐࠂࠄࠇࠊࠋࠌࠍࠒࠓࠔࠑࠎࠕࠈࠉࠆ࠾࠰࠼࠽࠱࠲࠻࠳࠴࠵࠶࠸࠹࠺࠷", // Samaritan
	"ЈЇѶЎӰӮҚѮѪꙚѦѰӨѠӢӤꚖꚎҨҺҰЋЂӁꙐꙞѲЉѢѤꙒѬѨꙈ",
	"ꜲÆꜴꜶꜸꜼȸꭡﬀﬁﬂﬄﬃĲ℔ŒꝎȢﬅﬆꜨᵫẞꝠ",
	"ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅪⅫⅬⅭⅮⅯↁↂↇↈ"
];

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

releaseInfoPromise.then(info => {
  releaseInfoCache = info;
});

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
      throw new Error('Не найдено ни одной версии');
    }
    
    // Получаем имя через GitHub API (60 запросов/час)
    let releaseName = `DSL KeyPad ${latestVersion}`;
    try {
      const githubResponse = await fetch(
        'https://api.github.com/repos/DemerNkardaz/DSL-KeyPad/releases/latest'
      );
      
      if (githubResponse.ok) {
        const githubData = await githubResponse.json();
        releaseName = githubData.name || releaseName;
      }
    } catch (error) {
      console.warn('Не удалось получить имя релиза с GitHub:', error);
    }
    
    return {
      success: true,
      version: latestVersion,
      name: releaseName,
      downloadUrl: `https://github.com/DemerNkardaz/DSL-KeyPad/releases/download/${latestVersion}/DSL-KeyPad-${latestVersion}.zip`
    };
    
  } catch (error) {
    console.error('Ошибка получения информации о релизе:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Теперь можно использовать синхронно
function DownloadLastRelease() {
  if (!releaseInfoCache) {
    console.error('Информация о релизе ещё загружается');
    alert('Пожалуйста, подождите загрузки информации о релизе');
    return false;
  }
  
  if (!releaseInfoCache.success) {
    console.error('Не удалось получить информацию о релизе:', releaseInfoCache.error);
    alert('Не удалось получить информацию о последнем релизе');
    return false;
  }
  
  const link = document.createElement('a');
  link.href = releaseInfoCache.downloadUrl;
  link.download = `DSL-KeyPad-${releaseInfoCache.version}.zip`;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  
  link.click();
  
  console.log(`Начато скачивание релиза ${releaseInfoCache.version}`);
  return false;
}