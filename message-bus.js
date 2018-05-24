/**
 * 消息处理器
 * Created by shenchuochuo on 2018-05-24 10:41:02
 */
function MessageBus() {
  this.eventHandler = {};
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.cmd && typeof this.eventHandler[request.cmd] === 'function')
      this.eventHandler[request.cmd](request.data, sendResponse);
  });
  return {
    onMessage: function(type, callback) {
      this.eventHandler[type] = callback;
    },
    sendMessage: function(type, data) {
      return new Promise(resolve => {
        chrome.runtime.sendMessage({cmd: type, data: data}, function (response) {
          resolve(response);
        });
      });
    }
  }
}
module.exports = new MessageBus();
