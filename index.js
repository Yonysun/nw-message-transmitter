/**
 * 消息处理器
 * Created by shenchuochuo on 2018-05-24 10:41:02
 */

class MessageTransmitter {
  constructor(options) {
    this._eventHandler = {};
    if (options && options.initHandler) {
      if (typeof options.initHandler === 'function') {
        this._initHandler = options.initHandler;
      } else {
        throw new Error('initHandler must be a function');
      }
    }else{
      this._initHandler = null;
    }
    this._inited = options && !!options.inited;
    this._needAuth = options && !!options.needAuth;
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.initInfo && this._initHandler) {
        this._initHandler(request.initInfo, sendResponse);
      } else if (request.cmd && typeof this._eventHandler[request.cmd] === 'function') {
        if (this._needAuth && !this._inited) {
          sendResponse('store未初始化，无法处理业务');
          return;
        }
        this._eventHandler[request.cmd](request.data, sendResponse);
      } else {
        sendResponse('未知的消息类型');
      }
    });
  }

  onMessage(type, callback) {
    this._eventHandler[type] = callback;
  }

  sendMessage(type, data) {
    return new Promise(resolve => {
      chrome.runtime.sendMessage({cmd: type, data: data}, function (response) {
        resolve(response);
      });
    });
  }

  init(data) {
    return new Promise(resolve => {
      chrome.runtime.sendMessage({initInfo: data}, function (response) {
        resolve(response);
      });
    });
  }

  get eventHandler() {
    return this._eventHandler;
  }

  set eventHandler(value) {
    this._eventHandler = value;
  }

  set initHandler(value) {
    this._initHandler = value;
  }

  set inited(value) {
    this._inited = value;
  }
}

module.exports = MessageTransmitter;
