export default async function copyToClipboard(text: string) {
  let successful = false;

  // 尝试使用现代 Clipboard API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
    successful = true;
  } else {
    // 如果 Clipboard API 不可用，则使用老式方法
    const textArea = document.createElement('textarea');
    textArea.value = text;

    // 防止页面滚动到顶部
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';

    document.body.appendChild(textArea);
    textArea.select();
    try {
      successful = document.execCommand('copy');
    } catch (err) {
      console.log(err);
    } finally {
      document.body.removeChild(textArea);
    }
  }

  return successful ? Promise.resolve() : Promise.reject();
}
