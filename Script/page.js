document.addEventListener('DOMContentLoaded', async () => {
	console.log('Page loaded and DOM is ready.');
	await loadLocale(language);
	document.documentElement.setAttribute('lang', language);

	scatterText(randomLetters, "random-letters");
	setTimeout(() => animateScatterCollapseLoop('random-letters'), 8000);

	const mainTitle = document.querySelector('#main-title');
	const buttonDownloadLatest = document.querySelector('#btn-download-latest');
	buttonDownloadLatest.addEventListener('click', DownloadLastRelease);
	
	const info = await releaseInfoPromise;
	
	if (info.success) {
		buttonDownloadLatest.setAttribute('title', `Download ${info.name}`);
		let infoStatus = returnHellenicStatus(info.name);
		textStatus = infoStatus !== null ? `${infoStatus}` : '';
		localizedStatus = infoStatus !== null ? `${infoStatus.toLowerCase()}` : '';

		mainTitle.textContent = "DSL KeyPad" + (info.version !== '' ? ` ${info.version}` : '') + (localizedStatus !== '' ? ` ${readLocale(`hellenic_alphabet.${localizedStatus}`)}` : '');
		
	} else {
		buttonDownloadLatest.setAttribute('title', 'Download DSL KeyPad');
		console.warn('Не удалось загрузить информацию о версии');
	}
	
	const intershowRandomLetter = document.querySelector('.content-intershow-header-random-letter');
	const intershowRandomLetterkeys = Object.keys(titleRandomLetters);
	const intershowRandomLetterRandomKey = intershowRandomLetterkeys[Math.floor(Math.random() * intershowRandomLetterkeys.length)];

	const intershowRandomLetterP1 = intershowRandomLetter.querySelector('p:first-child');
	const intershowRandomLetterP2 = intershowRandomLetter.querySelector('p:last-child');
	intershowRandomLetterP1.textContent = intershowRandomLetterRandomKey;
	intershowRandomLetterP2.setAttribute('data-locale', 'random_letter.' + titleRandomLetters[intershowRandomLetterRandomKey]);



	document.body.addEventListener('click', (event) => {
		const target = event.target;



		if (target.classList.contains('alternative-modes-header-tab-button') || target.closest('.alternative-modes-header-tab-button')) {
			const button = target.classList.contains('alternative-modes-header-tab-button') ? target : target.closest('.alternative-modes-header-tab-button');
			const allTabButtons = document.querySelectorAll('.alternative-modes-header-tab-button');

			allTabButtons.forEach(btn => btn.classList.remove('active'));
			button.classList.add('active');
		}
	});



	
	if (document.querySelector('.alternative-modes-header-tab-button') && !document.querySelector('.alternative-modes-header-tab-button.active')) {
		document.querySelector('.alternative-modes-header-tab-button').click();
	}
	document.querySelector('.content-footer').innerHTML = getCopyrightString();

	// Вставка <p> элемента с Unicode диапазоном
	const descriptionElement = document.querySelector('.alternative-mode-description');
	if (descriptionElement) {
		const unicodeContent = getUnicodeRange("0300-034E", " ", "\u25CC");
		const paragraph = document.createElement('p');
		paragraph.textContent = unicodeContent;
		descriptionElement.appendChild(paragraph);
	}


	document.querySelectorAll('details').forEach(async (el) => {
		if (!el.open) {
			el.classList.add('closed');
		}
		new Accordion(el);
	});


	const elements = document.querySelectorAll('[data-locale]');
	elements.forEach(localizeElement);



	const temporaryInvisibleTexts = document.querySelectorAll('.text-invisible');
	temporaryInvisibleTexts.forEach((el) => el.classList.remove('text-invisible'));
	
});

function handleElementClick(element) {
	console.log('Handling click for element:', element);
}



// // Пример использования:
// console.log(getUnicodeCharacters('1F600')); // Вывод: 😀
// console.log(getUnicodeCharacters('1F600', '1F601', '1F602')); // Вывод: 😀😁😂
// console.log(getUnicodeCharacters(0x1F600, 0x1F601)); // Вывод: 😀😁 (поддержка чисел сохраняется)

// // Пример использования:
// console.log(getUnicodeRange("1E000-1E006;1E008-1E018;1E01B-1E021;1E023-1E024;1E026-1E02A", "", "\u25CC")); 
// console.log(getUnicodeRange("2C00-2C5F"));
// console.log(getUnicodeRange("2C00-2C05", ", "));