const xml = require('@nodert-win10/windows.data.xml.dom')
const notifications = require('@nodert-win10/windows.ui.notifications')
const EventEmitter = require('events')
const util = require('util')
const xmlEscape = require('xml-escape')

const { getAppId } = require('./utils')

let d = require('debug-electron')('electron-windows-notifications:notification')

/**
 * A notification similar to the native Windows ToastNotification.
 *
 * @class Notification
 * @extends {EventEmitter}
 */
class Notification extends EventEmitter {
  /**
   * Creates an instance of Notification.
   *
   * @param {object} options
   * @param {string} options.template
   * @param {string[]} options.strings
   * @param {Date} options.expirationTime
   * @param {string} options.group
   * @param {string} options.tag
   * @param {string} [options.appId]
   *
   * @memberOf Notification
   */
  constructor (options = {}) {
    super(...arguments)

    options.template = options.template || '' // todo: add default template
    options.strings = options.strings || []
    options.appId = options.appId || getAppId()

    let strings = options.strings.map(v => xmlEscape(v))

    this.formattedXml = util.format(options.template, ...strings)
    let xmlDocument = new xml.XmlDocument()
    xmlDocument.loadXml(this.formattedXml)

    d(`Creating new notification`)
    d(this.formattedXml)

    this.toast = new notifications.ToastNotification(xmlDocument)
    this.toast.on('activated', (t, e) => this.emit('activated', t, new notifications.ToastActivatedEventArgs(e)))
    this.toast.on('dismissed', (..._args) => this.emit('dismissed', ..._args))
    this.toast.on('failed', (..._args) => this.emit('failed', ..._args))

    if (options.expirationTime) this.toast.expirationTime = options.expirationTime
    if (options.group) this.toast.group = options.group
    if (options.tag) this.toast.tag = options.tag

    // Not present: surpressPopup. Why? From Microsoft:
    // Note Do not set this property to true in a toast sent to a Windows 8.x device.
    // Doing so will cause a compiler error or a dropped notification.

    this.notifier = notifications.ToastNotificationManager.createToastNotifier(options.appId)
  }

  /**
   * Shows the toast notification
   *
   * @memberOf Notification
   */
  show () {
    if (this.toast && this.notifier) this.notifier.show(this.toast)
  }

  /**
   * Hides the toast notification
   *
   * @memberOf Notification
   */
  hide () {
    if (this.toast && this.notifier) this.notifier.hide(this.toast)
  }

  /**
   * Overrides the logger for all instances of Notification
   *
   * @static
   * @param {function} Replacement for `console.log`
   *
   * @memberOf Notification
   */
  static setLogger (fn) {
    d = fn
  }
}

module.exports = Notification
