// 等待页面加载完成
window.addEventListener('load', function() {
  // 初始化
  init();
});

function init() {
  // 为每个图标添加选择框
  addCheckboxes();
  
  // 监听消息
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    switch (message.type) {
      case 'select-all':
        selectAll();
        break;
      case 'select-invert':
        selectInvert();
        break;
      case 'download-selected':
        downloadSelected();
        break;
    }
    sendResponse('success');
  });
}

// 添加选择框
function addCheckboxes() {
  // 尝试多种选择器来找到图标项
  const iconListItems = document.querySelectorAll('.block-icon-list > li, .icon-list > li, .block-icon');
  iconListItems.forEach(item => {
    // 检查是否已经添加了选择框
    if (!item.querySelector('.iconfont-helper-checkbox')) {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'iconfont-helper-checkbox';
      
      // 添加点击事件
      checkbox.addEventListener('change', function() {
        console.log('Checkbox changed:', this.checked);
        if (this.checked) {
          item.classList.add('iconfont-helper-selected');
          console.log('Added selected class to item:', item);
        } else {
          item.classList.remove('iconfont-helper-selected');
          console.log('Removed selected class from item:', item);
        }
        // 尝试通知 popup 页面更新选择状态
        chrome.runtime.sendMessage({ type: 'selection-changed' }).catch(function(error) {
          // 忽略错误，因为 popup 页面可能没有打开
        });
      });
      
      // 添加到图标项
      item.style.position = 'relative';
      item.appendChild(checkbox);
    }
  });
  
  console.log('Added checkboxes to', iconListItems.length, 'items');
}

// 全选
function selectAll() {
  const checkboxes = document.querySelectorAll('.iconfont-helper-checkbox');
  checkboxes.forEach(checkbox => {
    checkbox.checked = true;
    checkbox.parentElement.classList.add('iconfont-helper-selected');
  });
  console.log('Selected all', checkboxes.length, 'items');
  // 尝试通知 popup 页面更新选择状态
  chrome.runtime.sendMessage({ type: 'selection-changed' }).catch(function(error) {
    // 忽略错误，因为 popup 页面可能没有打开
  });
}

// 反选
function selectInvert() {
  const checkboxes = document.querySelectorAll('.iconfont-helper-checkbox');
  checkboxes.forEach(checkbox => {
    checkbox.checked = !checkbox.checked;
    if (checkbox.checked) {
      checkbox.parentElement.classList.add('iconfont-helper-selected');
    } else {
      checkbox.parentElement.classList.remove('iconfont-helper-selected');
    }
  });
  console.log('Inverted selection for', checkboxes.length, 'items');
  // 尝试通知 popup 页面更新选择状态
  chrome.runtime.sendMessage({ type: 'selection-changed' }).catch(function(error) {
    // 忽略错误，因为 popup 页面可能没有打开
  });
}

let svgNameList = []
// 下载选中的图标
function downloadSelected() {
  const selectedItems = document.querySelectorAll('.iconfont-helper-selected');
  if (selectedItems.length === 0) {
    alert('请先选择要下载的图标');
    return;
  }
  
  console.log('Selected items count:', selectedItems.length);
  
  // 创建 JSZip 实例
  const zip = new JSZip();
  let addedCount = 0;
  const selectedItemNames = []
  
  // 遍历选中的图标
  selectedItems.forEach((item, index) => {
    console.log('Processing item:', index + 1);
    
    // 找到 svg 元素（尝试多种选择器）
    let svgElement = item.querySelector('.icon-twrap > svg.icon');
    if (!svgElement) {
      svgElement = item.querySelector('svg.icon');
    }
    if (!svgElement) {
      svgElement = item.querySelector('svg');
    }
    
    if (svgElement) {
      // 获取 svg 内容
      const svgContent = svgElement.outerHTML;
      
      // 尝试获取图标名称（尝试多种选择器）
      let fileName = '';
      let iconNameElement = item.querySelector('.icon-name > span');
      fileName = iconNameElement?.innerText || ''
      console.log('Icon name 1:', fileName);
      if (!iconNameElement) {
        iconNameElement = item.querySelector('.icon-name');
        fileName = iconNameElement?.title || ''
        console.log('Icon name 2:', fileName);
      }
      
      if (iconNameElement) {
        // 保留中文字符，只替换特殊字符
        fileName = fileName.replace(/[^\u4e00-\u9fa5a-zA-Z0-9_-]/g, '_');
        console.log('Processed icon name:', fileName);
        // 确保图标名称不为空
        if (!fileName) {
          fileName = `icon-${index + 1}`;
          console.log('Using default icon name:', fileName);
        }
      }
      
      svgNameList.push(fileName)
      if (svgNameList.includes(fileName)) {
        const count = svgNameList.filter(svgName => svgName === fileName).length
        fileName += count
      }
      fileName += '.svg'
      console.log('File name:', fileName);
      // 添加到 zip
      zip.file(fileName, svgContent);
      addedCount++;
      console.log('Added icon:', fileName);
    } else {
      console.log('No SVG found for item:', index + 1);
    }
  });
  
  console.log('Added icons count:', addedCount);
  
  if (addedCount === 0) {
    alert('没有找到可下载的图标');
    return;
  }
  
  // 生成 zip 文件并下载
  zip.generateAsync({ type: 'blob' }).then(function(blob) {
    console.log('Generated zip blob:', blob);
    // 创建下载链接
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `iconfont-${Date.now()}.zip`;
    console.log('Download link:', link);
    link.click();
  }).catch(function(error) {
    console.error('Error generating zip:', error);
  }).finally(function () {
    console.log('svgNameList:', svgNameList)
    svgNameList = []
  })
}

// 定期检查新的图标项，添加选择框
setInterval(addCheckboxes, 1000);