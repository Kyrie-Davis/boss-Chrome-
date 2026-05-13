document.getElementById('btnScrape').addEventListener('click', function() {
  var status = document.getElementById('status');
  status.textContent = '抓取中...';

  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    var tab = tabs[0];
    if (!tab.url.includes('zhipin.com')) {
      status.textContent = '请先在 zhipin.com 搜索页面操作';
      return;
    }

    chrome.tabs.sendMessage(tab.id, { type: 'scrape' }, function(response) {
      if (chrome.runtime.lastError) {
        status.textContent = '请刷新页面后再试';
        return;
      }
      if (!response || !response.data.length) {
        status.textContent = '未找到职位（页面可能未加载完）';
        return;
      }

      chrome.runtime.sendMessage({ type: 'page_data', data: response.data }, function() {
        updateCount();
        status.textContent = '已抓取 ' + response.data.length + ' 条 (第' + response.page + '/' + response.totalPages + '页)';
      });
    });
  });
});

document.getElementById('btnExport').addEventListener('click', function() {
  chrome.runtime.sendMessage({ type: 'export' }, function(response) {
    if (response && response.count > 0) {
      document.getElementById('status').textContent = '已导出 ' + response.count + ' 条';
    } else {
      document.getElementById('status').textContent = '无数据可导出';
    }
  });
});

document.getElementById('btnClear').addEventListener('click', function() {
  chrome.runtime.sendMessage({ type: 'clear_data' }, function() {
    document.getElementById('count').textContent = '0';
    document.getElementById('status').textContent = '已清空';
  });
});

function updateCount() {
  chrome.storage.local.get('collected_data', function(result) {
    var data = result.collected_data || {};
    var total = 0;
    for (var key in data) {
      if (data.hasOwnProperty(key)) total += data[key].length;
    }
    document.getElementById('count').textContent = total;
  });
}

updateCount();
