importScripts('lib/xlsx.full.min.js');

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  if (msg.type === 'page_data') {
    storeData(msg.data, sendResponse);
    return true;
  } else if (msg.type === 'export') {
    exportExcel(sendResponse);
    return true;
  } else if (msg.type === 'clear_data') {
    chrome.storage.local.set({ collected_data: {} }, function() {
      sendResponse({ ok: true });
    });
    return true;
  }
});

function storeData(rows, sendResponse) {
  chrome.storage.local.get('collected_data', function(result) {
    var data = result.collected_data || {};
    var key = 'data';
    if (!data[key]) data[key] = [];
    data[key].push.apply(data[key], rows);
    chrome.storage.local.set({ collected_data: data }, function() {
      sendResponse({ ok: true, total: data[key].length });
    });
  });
}

function exportExcel(sendResponse) {
  chrome.storage.local.get('collected_data', function(result) {
    var data = result.collected_data || {};
    var key = 'data';
    var items = data[key] || [];
    if (!items.length) {
      sendResponse({ count: 0 });
      return;
    }

    var rows = items.map(function(item) {
      return {
        '公司': item.companyName || '',
        '岗位': item.jobName || '',
        '薪资': item.salary || '',
        '福利': item.welfare || '',
        '经验要求': item.experience || '',
        '学历要求': item.degree || '',
        '加分项目': item.excess || '',
        '所属行业': item.industry || '',
        '位置': item.area || ''
      };
    });

    var wb = XLSX.utils.book_new();
    var ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    var base64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

    chrome.downloads.download({
      url: 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + base64,
      filename: 'boss_职位数据.xlsx',
      saveAs: true
    }, function() {
      sendResponse({ count: items.length });
    });
  });
}
