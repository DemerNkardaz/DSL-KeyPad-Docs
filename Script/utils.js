/**
 * @param {...(number|string)} codePoints - Неопределённое число кодовых позиций (число или строка).
 * Возвращает символ(ы) по кодовой позиции Unicode.
 * @returns {string} Символ или строка символов.
 */
function getUnicodeCharacters(...codePoints) {
	const toCodePoint = code => 
		typeof code === 'string' ? parseInt(code, 16) : code;

	return codePoints.map(code => String.fromCodePoint(toCodePoint(code))).join('');
}


/**
 * Возвращает строку со всеми символами Unicode из указанного диапазона или множества диапазонов.
 * @param {string} ranges - Диапазон(ы) в формате "XXXX-YYYY;ZZZZ-WWWW" (где XXXX, YYYY и т.д. — шестнадцатеричные кодовые позиции).
 * @param {string} [separator=""] - Разделитель между символами (по умолчанию — пустая строка).
 * @param {string} [prefix=""] - Символ, добавляемый перед каждым вставляемым символом (по умолчанию — пусто).
 * @returns {string} Строка символов из указанного диапазона(ов).
 */
function getUnicodeRange(ranges, separator = "", prefix = "") {
	const characters = [];

	ranges.split(';').forEach(range => {
		const [start, end] = range.split('-').map(code => parseInt(code, 16));
		if (isNaN(start) || isNaN(end) || start > end) {
			throw new Error(`Некорректный диапазон Unicode: ${range}`);
		}

		for (let codePoint = start; codePoint <= end; codePoint++) {
			characters.push(prefix + String.fromCodePoint(codePoint));
		}
	});

	return characters.join(separator);
}

/**
 * Возвращает строку копирайта от 2024 года до текущего года.
 * @returns {string} Строка копирайта, например, "© 2024-2025".
 */
function getCopyrightString() {
	const startYear = 2024;
	const currentYear = new Date().getFullYear();
	return language === 'en' ? `&COPY;&emsp14;${startYear}${currentYear > startYear ? `-${currentYear}` : ''}&emsp14;Yalla Nkardaz` : `&COPY;&emsp14;Я&#769;лла&nbsp;Нкарда&#769;з,&emsp14;${startYear}${currentYear > startYear ? `–${currentYear}` : ''}`;
}

// Пример использования:
console.log(getCopyrightString()); // Вывод: "© 2024-2025" (если текущий год 2025)


function scatterText(text, elementId) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Элемент с id "${elementId}" не найден`);
    return;
  }
  
	if (Array.isArray(text)) {
		const randomIndex = Math.floor(Math.random() * text.length);
		text = text[randomIndex];
	}
  
  const chars = [...text];
  const totalChars = chars.length;
  
  const positions = [];
  const minDistanceBase = 8;
  const maxAttempts = 100;
  
  function hasCollision(x, y, fontSize) {
    const charRadius = fontSize * 1.2;
    
    for (const pos of positions) {
      const dx = x - pos.x;
      const dy = y - pos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      const requiredDistance = minDistanceBase + charRadius + pos.radius;
      
      if (distance < requiredDistance) {
        return true;
      }
    }
    return false;
  }
  
  function generatePosition(index, fontSize, attemptNumber) {
    let x, y;
    const padding = fontSize * 2;
    
    if (attemptNumber < maxAttempts * 0.6) {
      const gridSize = Math.ceil(Math.sqrt(totalChars * 1.5));
      const cellWidth = (100 - padding * 2) / gridSize;
      const cellHeight = (100 - padding * 2) / gridSize;
      
      const cellIndex = (index * 7 + attemptNumber * 3) % (gridSize * gridSize);
      const cellRow = Math.floor(cellIndex / gridSize);
      const cellCol = cellIndex % gridSize;
      
      const jitterX = (Math.random() - 0.5) * cellWidth * 0.8;
      const jitterY = (Math.random() - 0.5) * cellHeight * 0.8;
      
      x = padding + cellCol * cellWidth + cellWidth / 2 + jitterX;
      y = padding + cellRow * cellHeight + cellHeight / 2 + jitterY;
      
    } else if (attemptNumber < maxAttempts * 0.85) {
      const rings = Math.ceil(Math.sqrt(totalChars / 2));
      const angleOffset = (index * 137.5 + attemptNumber * 45) % 360;
      const ringIndex = (index + attemptNumber) % rings;
      const radiusPercent = (ringIndex + 1) / rings;
      const maxRadius = 45
      
      const angle = angleOffset * Math.PI / 180;
      const radius = 10 + radiusPercent * maxRadius;
      
      x = 50 + radius * Math.cos(angle);
      y = 50 + radius * Math.sin(angle);
      
    } else {
      x = padding + Math.random() * (100 - padding * 2);
      y = padding + Math.random() * (100 - padding * 2);
    }
    
    x = Math.max(padding, Math.min(100 - padding, x));
    y = Math.max(padding, Math.min(100 - padding, y));
    
    return { x, y };
  }
  
  const html = chars.map((char, index) => {
    const fontSize = 2 + Math.random() * 2;
    const charRadius = fontSize * 1.2;
    let position = null;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const pos = generatePosition(index, fontSize, attempt);
      
      if (!hasCollision(pos.x, pos.y, fontSize)) {
        position = pos;
        positions.push({
          x: pos.x,
          y: pos.y,
          radius: charRadius
        });
        break;
      }
    }
    
    if (!position) {
      for (let attempt = 0; attempt < 50; attempt++) {
        const padding = fontSize * 1.5;
        const pos = {
          x: padding + Math.random() * (100 - padding * 2),
          y: padding + Math.random() * (100 - padding * 2)
        };
        
        const oldMinDistance = minDistanceBase;
        if (!hasCollision(pos.x, pos.y, fontSize * 0.8)) {
          position = pos;
          positions.push({
            x: pos.x,
            y: pos.y,
            radius: charRadius
          });
          break;
        }
      }
    }
    
    if (!position) {
      position = {
        x: 10 + Math.random() * 80,
        y: 10 + Math.random() * 80
      };
      positions.push({
        x: position.x,
        y: position.y,
        radius: charRadius
      });
    }
    
    const rotation = Math.random() * 360;
    
    return `<span style="position: absolute; left: ${position.x.toFixed(2)}%; top: ${position.y.toFixed(2)}%; font-size: ${fontSize.toFixed(2)}rem; transform: rotate(${rotation.toFixed(2)}deg); transform-origin: center; white-space: nowrap;">${char}</span>`;
  }).join('');
  
  element.innerHTML = html;
}

function animateScatterCollapse(elementId, duration = 20000) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Элемент с id "${elementId}" не найден`);
    return;
  }
  
  const spans = element.querySelectorAll('span');
  if (spans.length === 0) {
    console.warn('Нет спанов для анимации');
    return;
  }
  
  element.style.transition = `width ${duration}ms cubic-bezier(0.4, 0, 1, 1)`;
  element.style.width = '0%';
  
  setTimeout(() => {
    spans.forEach(span => {
      const currentLeft = parseFloat(span.style.left);
      const newLeft = 100 - currentLeft;
      span.style.left = `${newLeft.toFixed(2)}%`;
    });
    
    element.style.transition = `width ${duration}ms cubic-bezier(0, 0, 0.6, 1)`;
    element.style.width = '100%';
    
  }, duration);
}

function animateScatterCollapseLoop(elementId, duration = 20000) {
  animateScatterCollapse(elementId, duration);
  
  setInterval(() => {
    animateScatterCollapse(elementId, duration);
  }, duration * 2);
}