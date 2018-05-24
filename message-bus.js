/**
 * 消息处理器
 * Created by sunyuan on 2018-05-24 10:41:02
 */

class MessageBus{
  constructor() {
    this.eventHandler = {};
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.cmd && typeof this.eventHandler[request.cmd] === 'function')
        this.eventHandler[request.cmd](request.data, sendResponse);
    });
  }

  onMessage(type, callback) {
    this.eventHandler[type] = callback;
  }

  sendMessage(type, data) {
    return new Promise(resolve => {
      chrome.runtime.sendMessage({cmd: type, data: data}, function (response) {
        resolve(response);
      });
    });
  }
}
module.exports = new MessageBus();
