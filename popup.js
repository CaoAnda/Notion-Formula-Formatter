document.getElementById("convert-btn").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: async () => {
          function convertToNotionFormat(text) {
            // 正则匹配 \( ... \) 或 \(...\)，支持跨行匹配
            const regex = /\\\((.*?)\\\)/gs;
  
            // 替换为 Notion 识别的 $$ ... $$ 格式，同时去除 p1 前后的空格
            return text.replace(regex, (match, p1) => `$$${p1.trim()}$$`);
          }
  
          function simulateSpaceKey() {
            const spaceEvent = new KeyboardEvent("keydown", {
              key: " ",
              bubbles: true,
            });
            document.activeElement.dispatchEvent(spaceEvent);
          }
  
          function delay(ms) {
            return new Promise((resolve) => setTimeout(resolve, ms));
          }
  
          async function replaceAndRenderFormulas(selectedText, range) {
            const regex = /\\\((.*?)\\\)/gs;
            let match;
            const formulas = [];
  
            // 找到所有公式的位置
            while ((match = regex.exec(selectedText)) !== null) {
              formulas.push({
                start: match.index,
                end: match.index + match[0].length,
                content: match[1].trim(),
              });
            }
  
            // 如果没有公式，直接返回
            if (formulas.length === 0) {
              alert("未找到任何公式！");
              return;
            }
            // 打印所有公式的位置
            console.log(formulas);
  
            // 从最后一个公式开始处理
            for (let i = formulas.length - 1; i >= 0; i--) {
              const formula = formulas[i];
  
              // 创建一个新的 Range，选中当前公式
              const formulaRange = document.createRange();
              formulaRange.setStart(range.startContainer, range.startOffset + formula.start);
              formulaRange.setEnd(range.startContainer, range.startOffset + formula.end);
  
              // 选中公式
              const selection = window.getSelection();
              selection.removeAllRanges();
              selection.addRange(formulaRange);
  
              // 替换公式
              const convertedFormula = ` $$${formula.content}$$`;
              formulaRange.deleteContents();
              const textNode = document.createTextNode(convertedFormula);
              formulaRange.insertNode(textNode);
  
              // 添加异步延迟，确保 Notion 有足够的时间处理内容变化
              if (i > 0) {
                await delay(200); // 延迟 200ms（可以根据需要调整）
              }

              break;
            }
          }
  
          const selection = window.getSelection();
  
          if (selection && selection.rangeCount > 0) {
            const selectedText = selection.toString();
            const range = selection.getRangeAt(0);
  
            if (selectedText) {
              // 处理选中的文本
              await replaceAndRenderFormulas(selectedText, range);
            } else {
              alert("未选中任何文本！");
            }
          } else {
            alert("未选中任何文本！");
          }
        },
      });
    });
  });
  