let DysonPureLink = require('dyson-purelink')

class AssistantDyson {

  constructor(configuration, plugins) {
    this._plugins = plugins;
    this._client = new DysonPureLink(configuration.username, configuration.password, configuration.country);
  }

  action(args) {
    let [cmd, arg, device] = args.split(" ")

    switch(cmd) {
      case "power":
        return this._doOnDevices(d => d.setFan(arg === "on"), device)

      case "setauto":
        let auto = arg === "on"
        return this._doOnDevices(d => d.setAuto(auto), device)

      case "setfan":
        if (arg === "auto") {
          return this._doOnDevices(d => {
            d.turnOn()
            d.setAuto(true)
          }, device)
        } else if (arg === "off") {
          return this._doOnDevices(d => d.turnOff(), device)
        } else {
          let value = parseInt(arg) * 10
          return this._doOnDevices(d => {
            d.turnOn()
            d.setAuto(false)
            d.setFanSpeed(value)
          }, device)
        }
        
      default:
        console.log("[assistant-dyson] Commande inconnue: ", args)
        return Promise.resolve()
    }
  }

  _doOnDevices(fun, name) {
    let devices = this._devices.filter(d => name == null
      || (this._getDeviceName(d).toUpperCase() === name.toUpperCase()))

    let answer = Promise.resolve()
    devices.forEach(d => {
      answer = answer.then(r => fun(d))
    })
    return answer
  }

  _getDeviceName(device) {
    return device._deviceInfo ? device._deviceInfo.Name : device.name
  }

  _initDevices() {
    return this._client.getDevices().then(devices => {
      devices.forEach(d => console.log("[assistant-dyson] Device: " + this._getDeviceName(d)));
      this._devices = devices;

      return this;
    })
  }
}

exports.init = function(configuration, plugins) {
  return new AssistantDyson(configuration, plugins)._initDevices().then(p => {
    console.log("[assistant-dyson] Plugin chargé");
    return p
  })
}
