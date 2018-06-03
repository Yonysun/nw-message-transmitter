/**
 * 消息处理器
 * Created by shenchuochuo on 2018-05-24 10:41:02
 */

const sendResponse = (port, cmd, data) => {
  port.postMessage({cmd: cmd, data: data, isResponse: 1});
}

class MessageTransmitter {
  constructor(options) {
    this.msgHandler = {};
    this.portPool = {};
    if (!options) {
      throw new Error('MessageTransmitter need options');
    }

    this.enableLog = options.enableLog === true;

    if (options.initHandler) {
      if (typeof options.initHandler === 'function') {
        this._initHandler = options.initHandler;
      } else {
        throw new Error('initHandler must be a function');
      }
    } else {
      this._initHandler = null;
    }
    this._inited = options.inited === true;
    this._needAuth = options.needAuth === true;

    const $this = this;
    /* 添加连接监听 */
    chrome.runtime.onConnect.addListener(port => {
      $this.enableLog && console.log('onConnect port', port);
      /* 添加消息总监听 */
      port.onMessage.addListener(function (request) {
        $this.enableLog && console.log('port %s onMessage：', port.name, request);
        /* 判断消息类型并进行处理 */
        console.log(request.cmd, $this.msgHandler[port.name], typeof $this.msgHandler[port.name][request.cmd] === 'function')
        if (request.cmd && $this.msgHandler[port.name] && typeof $this.msgHandler[port.name][request.cmd] === 'function') {
          /* 判断消息是否合法 */
          if ($this._needAuth && !$this._inited && request.isResponse === 0) {
            sendResponse(port, request.cmd, {res: 0, message: 'store未初始化，无法处理业务'});
            return;
          }
          $this.msgHandler[port.name][request.cmd](request.data, function (data) {
            if (request.isResponse === 0) sendResponse(port, request.cmd, data);
          });
        } else {
          if (request.isResponse === 0) {
            sendResponse(port, request.cmd, {res: 0, message: 'unknown message type'});
          }
        }
        return true;
      });
      this.portPool[port.name] = port;
    });
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
      $this.enableLog && console.log('onMessage data', request);
      if (request.initInfo && $this._initHandler) {
        $this.enableLog = !!request.initInfo.debug;
        /* 初始化消息服务 */
        $this._initHandler(request.initInfo).then(res => {
          $this._inited = res;
          sendResponse('后台脚本初始化成功');
        }).catch(e => {
          sendResponse('后台脚本初始化失败: ' + e.message)
          throw e;
        });
      } else {
        sendResponse('数据格式不正确，后台脚本初始化失败：' + typeof request === 'object' ? JSON.stringify(request) : request)
      }
      return true;
    });
  }

  addMsgListener(portName, type, callback) {
    if (!this.msgHandler[portName]) this.msgHandler[portName] = {};
    this.msgHandler[portName][type] = callback;
  }

  removeMsgListener(portName, type) {
    this.portPool[portName] && delete this.portPool[portName][type];
  }

  sendMsg(portName, type, data) {
    if (this.enableLog) console.log('sendMessage data = {portName: s%, type: s%,data:s%}', portName, type, data);
    return new Promise(resolve => {
      this.portPool[portName].sendMessage({cmd: type, data: data, isResponse: 0}, function (response) {
        resolve(response);
      });
    });
  }

  //
  // async init(data) {
  //   const initResult = await new Promise(resolve => {
  //     chrome.runtime.sendMessage({initInfo: data}, function (response) {
  //       resolve(response);
  //     });
  //   });
  //   this._inited = initResult;
  //   return initResult;
  // }

  set initHandler(value) {
    this._initHandler = value;
  }

}

module.exports = MessageTransmitter;
