// popup.js
'use strict';
document.addEventListener("DOMContentLoaded", () => {
  const imageContainer = document.getElementById("imageContainer");
  
  // 創建按鈕容器
  const buttonContainer = document.createElement("div");
  buttonContainer.className = "button-container";
  
  // 添加刷新按鈕
  const refreshButton = document.createElement("button");
  refreshButton.textContent = "刷新";
  refreshButton.onclick = loadImages;
  
  // 添加清除按鈕
  const clearButton = document.createElement("button");
  clearButton.textContent = "清除所有";
  clearButton.onclick = clearAllImages;
  
  buttonContainer.appendChild(refreshButton);
  buttonContainer.appendChild(clearButton);
  document.body.insertBefore(buttonContainer, imageContainer);
  
  // 初始加載圖片
  loadImages();
});

function loadImages() {
  const imageContainer = document.getElementById("imageContainer");
  imageContainer.innerHTML = ''; // 清空現有內容
  
  // 從服務器獲取數據
  fetch('https://6549dd43.tw.cpolar.io/data')
    .then(response => response.json())
    .then(serverImages => {
      // 從 Chrome storage 獲取數據
      chrome.storage.local.get("images", (result) => {
        const localImages = result.images || [];
        
        // 合併並去重
        const allImages = [...serverImages, ...localImages];
        const uniqueImages = Array.from(new Set(allImages.map(item => item.url)))
          .map(url => {
            return allImages.find(item => item.url === url);
          });
        
        // 渲染圖片
        uniqueImages.forEach((item) => {
          const imageCard = createImageCard(item);
          imageContainer.appendChild(imageCard);
        });
      });
    })
    .catch(error => {
      console.error('Error fetching data:', error);
      // 如果服務器無法訪問，至少顯示本地數據
      chrome.storage.local.get("images", (result) => {
        const localImages = result.images || [];
        localImages.forEach((item) => {
          const imageCard = createImageCard(item);
          imageContainer.appendChild(imageCard);
        });
      });
    });
}

function createImageCard(item) {
  const card = document.createElement("div");
  card.className = "image-card";
  
  const imgElem = document.createElement("img");
  imgElem.src = item.url;
  imgElem.onclick = () => window.open(item.url);
  
  const descElem = document.createElement("p");
  descElem.textContent = item.description;
  
  const deleteButton = document.createElement("button");
  deleteButton.textContent = "刪除";
  deleteButton.onclick = () => deleteImage(item.url);
  
  card.appendChild(imgElem);
  card.appendChild(descElem);
  card.appendChild(deleteButton);
  
  return card;
}

function clearAllImages() {
  if (confirm("確定要清除所有圖片嗎？")) {
    // 清除本地存儲
    chrome.storage.local.set({ images: [] });
    
    // 清除服務器數據（需要在 Flask 服務器添加對應的路由）
    fetch('https://6549dd43.tw.cpolar.io/clear', {
      method: 'POST'
    }).catch(error => console.error('Error clearing server data:', error));
    
    // 重新加載顯示
    loadImages();
  }
}

function deleteImage(url) {
  // 從本地存儲中刪除
  chrome.storage.local.get("images", (result) => {
    const images = result.images || [];
    const filteredImages = images.filter(item => item.url !== url);
    chrome.storage.local.set({ images: filteredImages });
  });
  
  // 從服務器刪除（需要在 Flask 服務器添加對應的路由）
  fetch('https://6549dd43.tw.cpolar.io/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ url: url })
  }).catch(error => console.error('Error deleting from server:', error));
  
  // 重新加載顯示
  loadImages();
}