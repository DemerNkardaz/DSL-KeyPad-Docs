let localeData = null;
let localePromise = null;

async function loadLocale(locale) {
  if (!localePromise) {
    localePromise = fetch(`./Data/locale_${locale}.json`)
      .then(response => response.json())
      .then(data => {
        localeData = data;
        return data;
      });
  }
  return localePromise;
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function localizeElement(element) {
  const path = element.getAttribute('data-locale');
  const addSpace = element.getAttribute('data-locale-space') === 'True';
	let translation = getNestedValue(localeData, path);
	
	if (Array.isArray(translation)) {
		translation = translation.join('');
	}

  if (translation !== undefined) {
    element.innerHTML = addSpace ? ` ${translation}` : translation;
  }
}

function readLocale(dataLocale) {
	let translation = getNestedValue(localeData, dataLocale);
	
	if (Array.isArray(translation)) {
		translation = translation.join('');
	}
	
	return translation;
}

loadLocale(language);