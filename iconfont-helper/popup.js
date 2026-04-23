// 等待页面加载完成
window.addEventListener('load', function() {
  // 初始化
  init();
});

function init() {
  // 获取按钮元素
  const selectAllButton = document.getElementById('select-all');
  const selectInvertButton = document.getElementById('select-invert');
  const downloadSelectedButton = document.getElementById('download-selected');
  
  // 添加点击事件
  selectAllButton.addEventListener('click', function() {
    sendMessage({ type: 'select-all' });
  });
  
  selectInvertButton.addEventListener('click', function() {
    sendMessage({ type: 'select-invert' });
  });
  
  downloadSelectedButton.addEventListener('click', function() {
    sendMessage({ type: 'download-selected' });
  });
  
  // 监听消息
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.type === 'selection-changed') {
      updateDownloadButton();
    }
  });
  
  // 初始更新下载按钮状态
  updateDownloadButton();
};

// 发送消息到 content script
function sendMessage(message) {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs.length > 0) {
      chrome.tabs.sendMessage(tabs[0].id, message, function(response) {
        console.log('Response:', response);
      });
    }
  });
}

// 更新下载按钮状态
function updateDownloadButton() {
  const downloadSelectedButton = document.getElementById('download-selected');
  
  // 发送消息到 content script 检查是否有选中的图标
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs.length > 0) {
      // 由于 content script 没有直接的方法来获取选中的图标数量，我们可以通过注入代码来实现
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: function() {
          const selectedItems = document.querySelectorAll('.iconfont-helper-selected');
          return selectedItems.length;
        }
      }, function(results) {
        if (results && results[0]) {
          const selectedCount = results[0].result;
          if (selectedCount > 0) {
            downloadSelectedButton.disabled = false;
            downloadSelectedButton.textContent = `下载选中图标 (${selectedCount})`;
          } else {
            downloadSelectedButton.disabled = true;
            downloadSelectedButton.textContent = '下载选中图标';
          }
        }
      });
    }
  });
}