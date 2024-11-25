// content.js
'use strict';
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getImageAndDescription") {
    const imageUrl = message.srcUrl;
    const pageUrl = window.location.href; // 獲取當前網頁網址

    // 獲取用戶選取的文字
    const selectedText = getSelectedText();
    if (selectedText) {
      copyToClipboard(selectedText); // 將選取的文本複製到剪貼板
      saveImageAndDescription(imageUrl, selectedText, pageUrl);
    } else {
      const description = findDescription(imageUrl);
      copyToClipboard(description); // 將找到的描述複製到剪貼板
      saveImageAndDescription(imageUrl, description, pageUrl);
    }
  }
});

// 獲取當前選取的文字
function getSelectedText() {
  const selection = window.getSelection();
  return selection.toString().trim();
}

// 自動複製文本到剪貼板
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    console.log('文本已複製到剪貼板:', text);
  } catch (err) {
    console.error('無法複製到剪貼板：', err);
  }
}

// 儲存圖片和描述 - 更新後的版本
function saveImageAndDescription(imageUrl, description, pageUrl) {
  // 保持原有的本地存儲邏輯，添加 sourceUrl
  chrome.storage.local.get({ images: [] }, (result) => {
    const images = result.images;
    images.push({ 
      url: imageUrl, 
      description: description,
      sourceUrl: pageUrl
    });
    chrome.storage.local.set({ images: images });
  });

  // 添加服務器存儲邏輯，包含 sourceUrl
  fetch('https://6dfa5122.tw.cpolar.io/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: imageUrl,
      description: description,
      sourceUrl: pageUrl // 添加來源網址
    })
  })
  .then(response => response.json())
  .then(data => {
    console.log('已成功保存到服務器:', data);
  })
  .catch(error => {
    console.error('保存到服務器時發生錯誤:', error);
    // 即使服務器保存失敗，本地存儲仍然會成功
  });
}

function findDescription(imageUrl) {
  // 找到所有的圖片元素
  const images = document.querySelectorAll("img");

  // 遍歷所有圖片，尋找與給定URL匹配的圖片
  for (let img of images) {
    if (img.src === imageUrl) {
      // 獲取該圖片的父元素
      const parent = img.parentElement;

      // 嘗試從圖片的父元素或周圍的元素中獲取說明
      let description = parent ? parent.innerText : "";

      // 如果父元素的文本內容不包含描述，則可以向上遍歷至祖先元素
      if (!description) {
        let ancestor = parent;
        while (ancestor && ancestor !== document.body) {
          ancestor = ancestor.parentElement;
          if (ancestor) {
            description = ancestor.innerText || description;
          }
        }
      }

      // 去除多餘的空格和換行，並返回找到的描述
      return description.trim();
    }
  }

  // 如果找不到描述，返回一個預設值
  return "未找到相關說明文字";
}