const SUPPORTED_LANGUAGES = ['en', 'ru'];
const userLanguage = navigator.language.slice(0, 2).toLowerCase();
const language = SUPPORTED_LANGUAGES.includes(userLanguage) ? userLanguage : 'en';
const releaseInfo = getLatestReleaseInfo();





async function getLatestReleaseInfo() {
  try {
    const response = await fetch(
      'https://data.jsdelivr.com/v1/package/gh/DemerNkardaz/DSL-KeyPad'
    );
    
    if (!response.ok) {
      throw new Error(`jsDelivr API error: ${response.status}`);
    }
    
    const data = await response.json();
    const latestVersion = data.versions[0];
    
    if (!latestVersion) {
      throw new Error('Не найдено ни одной версии');
    }
    
    return {
      success: true,
      version: latestVersion,
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


async function DownloadLastRelease() {
  const info = await releaseInfo;
  
  if (!info.success) {
    console.error('Не удалось получить информацию о релизе:', info.error);
    alert('Не удалось получить информацию о последнем релизе');
    return false;
  }
  
  const link = document.createElement('a');
  link.href = info.downloadUrl;
  link.download = `DSL-KeyPad-${info.version}.zip`;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  
  link.click();
  
  console.log(`Начато скачивание релиза ${info.version}`);
  return false;
}