console.log('[Boss爬虫] 已就绪');

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  if (msg.type === 'scrape') {
    console.log('[Boss爬虫] 收到抓取指令...');

    var cards = document.querySelectorAll('.job-card-wrap');
    if (!cards.length) {
      cards = document.querySelectorAll('[class*="job-card"]');
    }

    if (!cards.length) {
      console.log('[Boss爬虫] 未找到职位卡片');
      sendResponse({ data: [], totalPages: 1, page: 1 });
      return;
    }

    console.log('[Boss爬虫] 找到 ' + cards.length + ' 个卡片');

    var totalPages = 1;
    var pageLinks = document.querySelectorAll('.options-pages a, .page-con a');
    if (pageLinks.length > 3) {
      var n = parseInt(pageLinks[pageLinks.length - 2].textContent);
      if (n > 0) totalPages = n;
    }
    var currentPage = parseInt(new URLSearchParams(location.search).get('page')) || 1;

    var data = [];
    for (var i = 0; i < cards.length; i++) {
      try {
        var card = cards[i];
        var getText = function(el) { return el ? el.textContent.trim() : ''; };

        var jobName = getText(card.querySelector('.job-name'));
        var salary = getText(card.querySelector('.salary') || card.querySelector('.red') || card.querySelector('[class*="salary"]') || card.querySelector('[class*="red"]'));
        var area = getText(card.querySelector('.job-area') || card.querySelector('[class*="area"]'));
        var companyName = getText(card.querySelector('.company-name'));
        var welfare = getText(card.querySelector('.info-desc') || card.querySelector('[class*="desc"]'));

        var tagLists = card.querySelectorAll('.tag-list');
        var experience = '', degree = '';
        if (tagLists.length >= 1) {
          var items = tagLists[0].querySelectorAll('li, span, div');
          var values = [];
          for (var j = 0; j < items.length; j++) {
            var t = items[j].textContent.trim();
            if (t) values.push(t);
          }
          if (values.length >= 2) { experience = values[0]; degree = values[1]; }
          else if (values.length === 1) { experience = values[0]; }
        }

        var excess = '';
        if (tagLists.length >= 2) {
          var excessItems = tagLists[1].querySelectorAll('li, span, div');
          excess = Array.prototype.map.call(excessItems, function(x) { return x.textContent.trim(); }).filter(function(x) { return x; }).join(', ');
        }

        var industry = '';
        var companyTag = card.querySelector('.company-tag-list');
        if (companyTag) {
          var indLi = companyTag.querySelector('li') || companyTag.querySelector('span');
          if (indLi) industry = indLi.textContent.trim();
        }

        // 兜底：遍历span找薪资
        if (!salary) {
          var allSpans = card.querySelectorAll('span');
          for (var s = 0; s < allSpans.length; s++) {
            var t = allSpans[s].textContent.trim();
            if (/[\d]+[kK]/.test(t) || /[\d]+[元月年]/.test(t)) { salary = t; break; }
          }
        }

        if (i === 0) {
          console.log('[Boss爬虫] 第1条样例:', JSON.stringify({
            company: companyName, job: jobName, salary: salary,
            welfare: welfare, area: area, exp: experience, degree: degree
          }));
        }

        if (jobName || companyName) {
          data.push({
            companyName: companyName, jobName: jobName, salary: salary,
            welfare: welfare, experience: experience, degree: degree,
            excess: excess, industry: industry, area: area
          });
        }
      } catch (e) {
        console.error('[Boss爬虫] 解析失败:', e);
      }
    }

    console.log('[Boss爬虫] 第' + currentPage + '/' + totalPages + '页, ' + data.length + '条');
    sendResponse({ data: data, totalPages: totalPages, page: currentPage });
    return true;
  }
});
