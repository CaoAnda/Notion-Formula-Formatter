// content.js

console.log("Content script loaded");

window.addEventListener("message", (event) => {
  if (event.data && event.data.action === "convert-formulas") {
    console.log("Message received from background:", event.data);
    convertSelectedFormulas();
  }
});

function convertToNotionFormat(text) {
  // 正则匹配 \( ... \) 或 \(...\)，支持跨行匹配
  const regex = /\\\((.*?)\\\)/gs;

  // 替换为 Notion 识别的 $$ ... $$ 格式，同时去除 p1 前后的空格
  return text.replace(regex, (match, p1) => `$$${p1.trim()}$$`);
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

  // 从最后一个公式开始处理
  for (let i = formulas.length - 1; i >= 0; i--) {
    const formula = formulas[i];

    // 创建一个新的 Range，选中当前公式
    const formulaRange = document.createRange();

    try {
      // 确保 startContainer 是文本节点
      let startNode = range.startContainer;
      let startOffset = range.startOffset;

      if (startNode.nodeType !== Node.TEXT_NODE) {
        startNode = startNode.childNodes[startOffset] || startNode.firstChild;
        startOffset = 0;
      }

      // 设置 Range 的起始和结束位置
      formulaRange.setStart(startNode, startOffset + formula.start);
      formulaRange.setEnd(startNode, startOffset + formula.end);

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
        await new Promise(resolve => setTimeout(resolve, 50)); // 延迟 200ms（可以根据需要调整）
      }
    } catch (error) {
      console.error("Failed to set Range start or end:", error);
      continue;
    }
  }
}

function selectAllInCurrentParagraph() {
  const selection = window.getSelection();
  if (selection.rangeCount === 0) {
    console.warn("无法选择文本：当前没有选中的文本");
    return;
  }

  const currentRange = selection.getRangeAt(0);
  const startContainer = currentRange.startContainer;
  const startOffset = currentRange.startOffset;

  // 查找当前光标所在的段落
  let paragraph = startContainer;
  while (paragraph && !['P', 'DIV', 'SPAN'].includes(paragraph.tagName)) {
    paragraph = paragraph.parentElement;
  }

  if (!paragraph) {
    console.warn("无法找到段落：当前焦点不在段落内");
    return;
  }

  // 创建一个新的 Range 并选择整个段落
  const range = document.createRange();
  range.selectNodeContents(paragraph);

  // 设置新的选区
  selection.removeAllRanges();
  selection.addRange(range);
}


function convertSelectedFormulas() {
  console.log("Starting to convert selected formulas");

  // 全选当前光标所在段落的文本
  selectAllInCurrentParagraph();
  const selection = window.getSelection();

  if (selection && selection.rangeCount > 0) {
    const selectedText = selection.toString();
    const range = selection.getRangeAt(0);

    if (selectedText) {
      // 处理选中的文本
      replaceAndRenderFormulas(selectedText, range).then(() => {
        console.log("公式转换完成");
      }).catch(error => {
        console.error("公式转换失败:", error);
      });
    } else {
      alert("未找到任何文本！");
  } 
  }
  else {
    alert("未找到任何选区！");
  }
}
