
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'Chapter 6',
    title: 'URLをセット',
    type: 'normal',
    contexts: ['selection']
  });
});
chrome.contextMenus.onClicked.addListener(async (info) => {
  chrome.storage.sync.set(
    {
      targetURL: info.linkUrl
    }
  )
});
